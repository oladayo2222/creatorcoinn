---
name: CreatorCoin
description: Editorial, warm-paper design system for a creator-coin app on BOT Chain. Oversized display type, one plum accent, pill controls, flat bordered surfaces. Adapted from the steez.space direction, with its own palette and app components.
colors:
  paper: "#f8f7f3"        # page background
  card: "#ffffff"         # raised surfaces
  ink: "#161613"          # text, primary buttons
  ink-soft: "#3a3833"     # long-form body text
  muted: "#6b6862"        # secondary text (5.3:1 on paper)
  line: "#e4e1d9"         # borders, dividers
  line-strong: "#cfcbc0"  # input borders
  wash: "#efede7"         # skeletons, hover fills
  plum: "#6d5fd8"         # the one accent: links, emphasis, approve step
  plum-deep: "#5546c2"
  plum-soft: "#ecebfa"
  coral: "#f7804f"        # "next coin" marker, sell tag. Background only, never text
  coral-soft: "#fde8dd"
  sun: "#f9d86a"          # creator badge, selection, hero atmosphere
  sun-soft: "#fdf4d3"
  up: "#1f8a4c"
  down: "#c4291d"
typography:
  display: "Unbounded 500–700, tracking -0.02em, line-height 1.02, often UPPERCASE"
  body: "Urbanist 500, 16px / 1.6"
  label: "Urbanist 700, 12px, tracking 0.08em, UPPERCASE (.eyebrow)"
  numbers: "always tabular (.tnum)"
radius:
  pill: 999px             # every button and segmented control
  card: 20px
  field: 14px
  avatar: 12px (≥40px), 24px (≥80px)
shadow:
  lift: "0 1px 2px rgb(22 22 19 / .05), 0 8px 24px rgb(22 22 19 / .06)"   # menus, preview card
  glow: "0 24px 60px -12px rgb(247 128 79 / .45)"                        # hero coin card ONLY
---

## Principles

1. **Paper, ink, one accent.** Surfaces are warm off-white and white; text is near-black. Plum is the only
   accent colour in any given section. Coral and sun are supporting tones that never carry text.
2. **Type does the branding.** Headlines are oversized Unbounded, stacked line by line. Everything else is calm Urbanist.
3. **Flat, bordered, quiet.** Hierarchy comes from borders and contrast, not shadows. The orange glow shows up once, on the hero card.
4. **Real numbers, no filler.** Every stat on screen comes from the contract. No stock "Web3" phrasing, no emoji icons, no placeholder metrics.
5. **Asymmetric layouts.** Hero copy on the left and the product on the right. Content on the left and the sticky trade panel on the right.

## Components

| Component | Spec |
|---|---|
| Primary button | `.pill .pill-ink`, 44px min height, bold 14px label |
| Accent button | `.pill .pill-plum`, used only for "Approve USDT" and "Switch network" |
| Secondary button | `.pill .pill-line`, transparent with a 1px line-strong border |
| Segmented control | Wash track, the selected item is a white pill with `shadow-lift` |
| Card | White, 1px `line` border, 20px radius, no shadow |
| Table row | Inside one card with `divide-y`; hovering a row fills it with paper |
| Price bars | One bar per coin on the curve: ink = held, coral = next coin, line = future |
| Locked notice | Dashed border, ink circle holding a sun-coloured lock |
| Locked post | Public title, body replaced by three wash bars. The real body is never put in the DOM |
| Avatar fallback | Initials in Unbounded on a tile picked from the palette by address hash |
| Badges | Creator = sun, You = plum-soft, Buy = plum-soft, Sell = coral-soft |

## Do / Don't

- Do keep hero headlines on 2–3 lines with no orphaned last word.
- Do show USDT amounts with 2–3 decimals and the `USDT` unit, in tabular numerals.
- Do put the BOT Chain block (`https://botchain.ai`, `https://scan.botchain.ai`) in the footer of every page.
- Don't add gradients outside the hero, or glassmorphism anywhere.
- Don't use coral or sun for text on paper; they fail contrast.
- Don't add a second accent colour or a dark theme without updating this file.
