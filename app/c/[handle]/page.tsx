import { CreatorView } from "./CreatorView";

export default async function CreatorPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  return <CreatorView handle={decodeURIComponent(handle).toLowerCase()} />;
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  return { title: `@${handle} on CreatorCoin` };
}
