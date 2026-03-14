import { notFound } from "next/navigation";
import { liveClient } from "@/src/sanity/lib/client";
import SimulationCharacterOverviewClient, {
  type SimulationCharacterItem,
} from "./components/simulation-character-overview-client";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 0;

const QUERY = `*[_type == "character" && slug.current == $slug][0]{
  _id,
  name,
  slug,
  mainImage,
  "mainVideoUrl": mainVideo.asset->url,
  backgroundImage,
  "chapters": *[
    _type == "chapter" && 
    isPublished == true &&
    (
      character._ref == ^._id || 
      character._ref == string::split(^._id, "drafts.")[1] ||
      character._ref == "drafts." + ^._id
    )
  ] | order(displayOrder asc) {
    _id,
    title,
    chapterKey,
    displayOrder
  }
}`;

export default async function SimulationCharacterPage({ params }: PageProps) {
  const { slug } = await params;
  const character = await liveClient.fetch<SimulationCharacterItem | null>(
    QUERY,
    { slug },
    {
      cache: "no-store",
      next: { revalidate: 0 },
    },
  );

  if (!character) {
    notFound();
  }

  return <SimulationCharacterOverviewClient character={character} />;
}
