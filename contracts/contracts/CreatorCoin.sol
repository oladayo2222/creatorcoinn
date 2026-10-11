// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title CreatorCoin
/// @notice Every creator gets their own coin, priced in USDT on a linear bonding curve.
///         Holding enough of a creator's coin unlocks their posts and lets you write in
///         their holder room. All state is kept in storage and exposed through views,
///         because the BOT Chain public RPC does not serve eth_getLogs.
contract CreatorCoin is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ---------------------------------------------------------------------
    // Economics (USDT has 6 decimals on BOT Chain)
    // ---------------------------------------------------------------------

    /// @dev Price of coin #k (0-indexed by supply before mint) = BASE_PRICE + PRICE_STEP * k.
    uint256 public constant BASE_PRICE = 100_000; // 0.10 USDT
    uint256 public constant PRICE_STEP = 50_000; // +0.05 USDT per coin in circulation
    uint256 public constant CREATOR_FEE_BPS = 500; // 5% to the creator on every trade
    uint256 public constant PROTOCOL_FEE_BPS = 200; // 2% to the treasury on every trade
    uint256 public constant MAX_TRADE = 50; // coins per transaction

    uint256 public constant MAX_POST_TITLE = 120;
    uint256 public constant MAX_POST_BODY = 2_000;
    uint256 public constant MAX_MESSAGE = 280;

    IERC20 public immutable usdt;
    address public treasury;

    // ---------------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------------

    struct Creator {
        address account;
        string name;
        string handle;
        string bio;
        string avatarUrl;
        uint64 joinedAt;
        uint32 unlockAt; // coins a fan must hold to unlock posts + room
        uint32 supply;
        uint32 holders;
        uint32 postCount;
        uint32 messageCount;
        uint256 volume; // gross USDT traded through the curve
        uint256 feesEarned; // USDT paid to the creator
    }

    struct Post {
        string title; // public teaser
        string body; // shown to holders in the app
        uint64 createdAt;
    }

    struct Message {
        address from;
        uint64 sentAt;
        string body;
    }

    struct Trade {
        address trader;
        address creator;
        bool isBuy;
        uint32 amount;
        uint32 supplyAfter;
        uint64 at;
        uint256 value; // USDT paid (buy, incl. fees) or received (sell, after fees)
    }

    mapping(address => Creator) private _creators;
    mapping(bytes32 => address) public handleOwner;
    address[] private _creatorList;

    mapping(address => mapping(address => uint256)) public balanceOf; // creator => fan => coins

    mapping(address => address[]) private _holderList; // creator => fans
    mapping(address => mapping(address => uint256)) private _holderIndex; // 1-based

    mapping(address => address[]) private _portfolio; // fan => creators held
    mapping(address => mapping(address => uint256)) private _portfolioIndex; // 1-based

    mapping(address => Post[]) private _posts;
    mapping(address => Message[]) private _messages;

    Trade[] private _trades;
    mapping(address => uint256[]) private _creatorTrades;

    uint256 public totalVolume;

    // ---------------------------------------------------------------------
    // Events & errors
    // ---------------------------------------------------------------------

    event CreatorRegistered(address indexed creator, string handle);
    event ProfileUpdated(address indexed creator);
    event Traded(
        address indexed trader,
        address indexed creator,
        bool isBuy,
        uint256 amount,
        uint256 value,
        uint256 creatorFee,
        uint256 protocolFee,
        uint256 supplyAfter
    );
    event PostPublished(address indexed creator, uint256 indexed postId);
    event MessageSent(address indexed creator, address indexed from, uint256 indexed messageId);
    event TreasuryChanged(address treasury);

    error AlreadyCreator();
    error NotCreator();
    error InvalidHandle();
    error HandleTaken();
    error InvalidName();
    error InvalidAmount();
    error InvalidUnlock();
    error SlippageExceeded();
    error InsufficientCoins();
    error LastCoinLocked();
    error TooLong();
    error Empty();
    error Locked();
    error ZeroAddress();

    constructor(IERC20 usdt_, address treasury_) Ownable(msg.sender) {
        if (address(usdt_) == address(0) || treasury_ == address(0)) revert ZeroAddress();
        usdt = usdt_;
        treasury = treasury_;
    }

    // ---------------------------------------------------------------------
    // Creators
    // ---------------------------------------------------------------------

    /// @notice Launch your coin. You receive coin #0 for free; it can never be sold, so the
    ///         curve always has a floor and the reserve always covers every other coin.
    function register(
        string calldata name,
        string calldata handle,
        string calldata bio,
        string calldata avatarUrl,
        uint32 unlockAt
    ) external {
        if (_creators[msg.sender].account != address(0)) revert AlreadyCreator();
        uint256 nameLen = bytes(name).length;
        if (nameLen == 0 || nameLen > 40) revert InvalidName();
        if (!_validHandle(handle)) revert InvalidHandle();
        bytes32 key = keccak256(bytes(handle));
        if (handleOwner[key] != address(0)) revert HandleTaken();
        if (bytes(bio).length > 280 || bytes(avatarUrl).length > 300) revert TooLong();
        if (unlockAt == 0 || unlockAt > 100) revert InvalidUnlock();

        handleOwner[key] = msg.sender;
        _creatorList.push(msg.sender);

        Creator storage c = _creators[msg.sender];
        c.account = msg.sender;
        c.name = name;
        c.handle = handle;
        c.bio = bio;
        c.avatarUrl = avatarUrl;
        c.joinedAt = uint64(block.timestamp);
        c.unlockAt = unlockAt;

        _credit(msg.sender, msg.sender, 1);
        c.supply = 1;

        emit CreatorRegistered(msg.sender, handle);
    }

    function updateProfile(string calldata bio, string calldata avatarUrl, uint32 unlockAt) external {
        Creator storage c = _creators[msg.sender];
        if (c.account == address(0)) revert NotCreator();
        if (bytes(bio).length > 280 || bytes(avatarUrl).length > 300) revert TooLong();
        if (unlockAt == 0 || unlockAt > 100) revert InvalidUnlock();
        c.bio = bio;
        c.avatarUrl = avatarUrl;
        c.unlockAt = unlockAt;
        emit ProfileUpdated(msg.sender);
    }

    // ---------------------------------------------------------------------
    // Trading
    // ---------------------------------------------------------------------

    function buy(address creator, uint256 amount, uint256 maxTotal) external nonReentrant {
        Creator storage c = _creators[creator];
        if (c.account == address(0)) revert NotCreator();
        if (amount == 0 || amount > MAX_TRADE) revert InvalidAmount();

        uint256 cost = curveCost(c.supply, amount);
        (uint256 creatorFee, uint256 protocolFee) = _fees(cost);
        uint256 total = cost + creatorFee + protocolFee;
        if (total > maxTotal) revert SlippageExceeded();

        c.supply += uint32(amount);
        c.volume += cost;
        c.feesEarned += creatorFee;
        totalVolume += cost;
        _credit(creator, msg.sender, amount);

        usdt.safeTransferFrom(msg.sender, address(this), cost);
        usdt.safeTransferFrom(msg.sender, creator, creatorFee);
        usdt.safeTransferFrom(msg.sender, treasury, protocolFee);

        _recordTrade(creator, true, amount, total, c.supply);
        emit Traded(msg.sender, creator, true, amount, total, creatorFee, protocolFee, c.supply);
    }

    function sell(address creator, uint256 amount, uint256 minReceived) external nonReentrant {
        Creator storage c = _creators[creator];
        if (c.account == address(0)) revert NotCreator();
        if (amount == 0 || amount > MAX_TRADE) revert InvalidAmount();
        if (balanceOf[creator][msg.sender] < amount) revert InsufficientCoins();
        if (c.supply - amount < 1) revert LastCoinLocked();

        uint256 proceeds = curveCost(c.supply - amount, amount);
        (uint256 creatorFee, uint256 protocolFee) = _fees(proceeds);
        uint256 payout = proceeds - creatorFee - protocolFee;
        if (payout < minReceived) revert SlippageExceeded();

        c.supply -= uint32(amount);
        c.volume += proceeds;
        c.feesEarned += creatorFee;
        totalVolume += proceeds;
        _debit(creator, msg.sender, amount);

        usdt.safeTransfer(msg.sender, payout);
        usdt.safeTransfer(creator, creatorFee);
        usdt.safeTransfer(treasury, protocolFee);

        _recordTrade(creator, false, amount, payout, c.supply);
        emit Traded(msg.sender, creator, false, amount, payout, creatorFee, protocolFee, c.supply);
    }

    // ---------------------------------------------------------------------
    // Content
    // ---------------------------------------------------------------------

    function publish(string calldata title, string calldata body) external {
        Creator storage c = _creators[msg.sender];
        if (c.account == address(0)) revert NotCreator();
        if (bytes(title).length == 0 || bytes(body).length == 0) revert Empty();
        if (bytes(title).length > MAX_POST_TITLE || bytes(body).length > MAX_POST_BODY) revert TooLong();

        _posts[msg.sender].push(Post({title: title, body: body, createdAt: uint64(block.timestamp)}));
        c.postCount += 1;
        emit PostPublished(msg.sender, c.postCount - 1);
    }

    /// @notice Write in a creator's holder room. Only the creator and fans holding at least
    ///         `unlockAt` coins can post here; this is enforced on-chain.
    function sendMessage(address creator, string calldata body) external {
        Creator storage c = _creators[creator];
        if (c.account == address(0)) revert NotCreator();
        if (!hasAccess(creator, msg.sender)) revert Locked();
        if (bytes(body).length == 0) revert Empty();
        if (bytes(body).length > MAX_MESSAGE) revert TooLong();

        _messages[creator].push(Message({from: msg.sender, sentAt: uint64(block.timestamp), body: body}));
        c.messageCount += 1;
        emit MessageSent(creator, msg.sender, c.messageCount - 1);
    }

    // ---------------------------------------------------------------------
    // Admin
    // ---------------------------------------------------------------------

    function setTreasury(address treasury_) external onlyOwner {
        if (treasury_ == address(0)) revert ZeroAddress();
        treasury = treasury_;
        emit TreasuryChanged(treasury_);
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    /// @notice Sum of prices for `amount` coins starting at `supply`.
    function curveCost(uint256 supply, uint256 amount) public pure returns (uint256) {
        return amount * BASE_PRICE + PRICE_STEP * (amount * supply + (amount * (amount - 1)) / 2);
    }

    function priceOf(address creator) external view returns (uint256) {
        return BASE_PRICE + PRICE_STEP * _creators[creator].supply;
    }

    function buyQuote(address creator, uint256 amount)
        external
        view
        returns (uint256 cost, uint256 creatorFee, uint256 protocolFee, uint256 total)
    {
        cost = curveCost(_creators[creator].supply, amount);
        (creatorFee, protocolFee) = _fees(cost);
        total = cost + creatorFee + protocolFee;
    }

    function sellQuote(address creator, uint256 amount)
        external
        view
        returns (uint256 proceeds, uint256 creatorFee, uint256 protocolFee, uint256 payout)
    {
        uint256 supply = _creators[creator].supply;
        if (amount == 0 || amount >= supply) return (0, 0, 0, 0);
        proceeds = curveCost(supply - amount, amount);
        (creatorFee, protocolFee) = _fees(proceeds);
        payout = proceeds - creatorFee - protocolFee;
    }

    function hasAccess(address creator, address fan) public view returns (bool) {
        Creator storage c = _creators[creator];
        if (c.account == address(0)) return false;
        return fan == creator || balanceOf[creator][fan] >= c.unlockAt;
    }

    function isCreator(address account) external view returns (bool) {
        return _creators[account].account != address(0);
    }

    function creatorCount() external view returns (uint256) {
        return _creatorList.length;
    }

    function tradeCount() external view returns (uint256) {
        return _trades.length;
    }

    function getCreator(address creator) external view returns (Creator memory) {
        return _creators[creator];
    }

    function creatorByHandle(string calldata handle) external view returns (Creator memory) {
        return _creators[handleOwner[keccak256(bytes(handle))]];
    }

    /// @notice Newest first.
    function getCreators(uint256 offset, uint256 limit) external view returns (Creator[] memory out) {
        uint256 n = _creatorList.length;
        uint256 count = _pageSize(n, offset, limit);
        out = new Creator[](count);
        for (uint256 i; i < count; ++i) {
            out[i] = _creators[_creatorList[n - 1 - offset - i]];
        }
    }

    /// @notice Newest first.
    function getPosts(address creator, uint256 offset, uint256 limit) external view returns (Post[] memory out) {
        Post[] storage all = _posts[creator];
        uint256 count = _pageSize(all.length, offset, limit);
        out = new Post[](count);
        for (uint256 i; i < count; ++i) {
            out[i] = all[all.length - 1 - offset - i];
        }
    }

    /// @notice Newest first.
    function getMessages(address creator, uint256 offset, uint256 limit)
        external
        view
        returns (Message[] memory out)
    {
        Message[] storage all = _messages[creator];
        uint256 count = _pageSize(all.length, offset, limit);
        out = new Message[](count);
        for (uint256 i; i < count; ++i) {
            out[i] = all[all.length - 1 - offset - i];
        }
    }

    function getHolders(address creator, uint256 offset, uint256 limit)
        external
        view
        returns (address[] memory fans, uint256[] memory balances)
    {
        address[] storage all = _holderList[creator];
        uint256 count = _pageSize(all.length, offset, limit);
        fans = new address[](count);
        balances = new uint256[](count);
        for (uint256 i; i < count; ++i) {
            fans[i] = all[offset + i];
            balances[i] = balanceOf[creator][fans[i]];
        }
    }

    function getPortfolio(address fan)
        external
        view
        returns (Creator[] memory creators, uint256[] memory balances)
    {
        address[] storage held = _portfolio[fan];
        creators = new Creator[](held.length);
        balances = new uint256[](held.length);
        for (uint256 i; i < held.length; ++i) {
            creators[i] = _creators[held[i]];
            balances[i] = balanceOf[held[i]][fan];
        }
    }

    /// @notice Newest first, across all creators.
    function getRecentTrades(uint256 limit) external view returns (Trade[] memory out) {
        uint256 count = _pageSize(_trades.length, 0, limit);
        out = new Trade[](count);
        for (uint256 i; i < count; ++i) {
            out[i] = _trades[_trades.length - 1 - i];
        }
    }

    /// @notice Newest first, for one creator.
    function getCreatorTrades(address creator, uint256 limit) external view returns (Trade[] memory out) {
        uint256[] storage ids = _creatorTrades[creator];
        uint256 count = _pageSize(ids.length, 0, limit);
        out = new Trade[](count);
        for (uint256 i; i < count; ++i) {
            out[i] = _trades[ids[ids.length - 1 - i]];
        }
    }

    // ---------------------------------------------------------------------
    // Internal
    // ---------------------------------------------------------------------

    function _fees(uint256 amount) private pure returns (uint256 creatorFee, uint256 protocolFee) {
        creatorFee = (amount * CREATOR_FEE_BPS) / 10_000;
        protocolFee = (amount * PROTOCOL_FEE_BPS) / 10_000;
    }

    function _credit(address creator, address fan, uint256 amount) private {
        if (balanceOf[creator][fan] == 0) {
            _holderList[creator].push(fan);
            _holderIndex[creator][fan] = _holderList[creator].length;
            _portfolio[fan].push(creator);
            _portfolioIndex[fan][creator] = _portfolio[fan].length;
            _creators[creator].holders += 1;
        }
        balanceOf[creator][fan] += amount;
    }

    function _debit(address creator, address fan, uint256 amount) private {
        balanceOf[creator][fan] -= amount;
        if (balanceOf[creator][fan] == 0) {
            _swapPop(_holderList[creator], _holderIndex[creator], fan);
            _swapPop(_portfolio[fan], _portfolioIndex[fan], creator);
            _creators[creator].holders -= 1;
        }
    }

    function _swapPop(address[] storage list, mapping(address => uint256) storage index, address item) private {
        uint256 i = index[item] - 1;
        address last = list[list.length - 1];
        list[i] = last;
        index[last] = i + 1;
        list.pop();
        delete index[item];
    }

    function _recordTrade(address creator, bool isBuy, uint256 amount, uint256 value, uint32 supplyAfter) private {
        _creatorTrades[creator].push(_trades.length);
        _trades.push(
            Trade({
                trader: msg.sender,
                creator: creator,
                isBuy: isBuy,
                amount: uint32(amount),
                supplyAfter: supplyAfter,
                at: uint64(block.timestamp),
                value: value
            })
        );
    }

    function _pageSize(uint256 total, uint256 offset, uint256 limit) private pure returns (uint256) {
        if (offset >= total) return 0;
        uint256 remaining = total - offset;
        return remaining < limit ? remaining : limit;
    }

    /// @dev 3–20 chars of a–z, 0–9 or underscore.
    function _validHandle(string calldata handle) private pure returns (bool) {
        bytes calldata b = bytes(handle);
        if (b.length < 3 || b.length > 20) return false;
        for (uint256 i; i < b.length; ++i) {
            bytes1 ch = b[i];
            bool ok = (ch >= 0x61 && ch <= 0x7a) || (ch >= 0x30 && ch <= 0x39) || ch == 0x5f;
            if (!ok) return false;
        }
        return true;
    }
}
