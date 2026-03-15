import { notFound } from "next/navigation";
import { liveClient } from "@/src/sanity/lib/client";
import CharacterChapterOverviewClient, {
  type CharacterChapterOverviewItem,
} from "./components/character-chapter-overview-client";

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
  const character = await liveClient.fetch<CharacterChapterOverviewItem | null>(
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

  return <CharacterChapterOverviewClient character={character} />;
}
