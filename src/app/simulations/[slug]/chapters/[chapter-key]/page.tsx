import { notFound } from "next/navigation";
import { liveClient } from "@/src/sanity/lib/client";
import SimulationDialogueClient, {
  type SimulationChapterPageData,
} from "./components/simulation-dialogue-client";

type PageProps = {
  params: Promise<{ slug: string; "chapter-key": string }>;
};

export const revalidate = 0;

const QUERY = `*[
  _type == "chapter" &&
  chapterKey == $chapterKey &&
  isPublished == true &&
  character->slug.current == $slug
][0]{
  _id,
  title,
  chapterKey,
  description,
  "entryNodeId": coalesce(entryNode->nodeId, *[
    _type == "dialogueNode" &&
    references(^._id)
  ] | order(stepOrder asc)[0].nodeId),
  "character": character->{
    _id,
    name,
    "slug": slug.current,
    mainImage,
    "mainVideoUrl": mainVideo.asset->url,
    backgroundImage,
    "expressions": expressions[]{
      key,
      label,
      image,
      "videoUrl": video.asset->url
    }
  },
  "nodes": *[
    _type == "dialogueNode" &&
    references(^._id)
  ] | order(stepOrder asc){
    _id,
    nodeId,
    stepOrder,
    line,
    isEnding,
    expressionKey,
    "speaker": speaker->{
      _id,
      name,
      "slug": slug.current,
      mainImage,
      "mainVideoUrl": mainVideo.asset->url,
      backgroundImage,
      "expressions": expressions[]{
        key,
        label,
        image,
        "videoUrl": video.asset->url
      }
    },
    "mediaOverrideImage": mediaOverride.image,
    "mediaOverrideVideoUrl": mediaOverride.video.asset->url,
    "choices": choices[]{
      choiceId,
      label,
      isCorrect,
      resultLine,
      "nextNodeId": coalesce(nextNode->nodeId, nextNodeIdFallback)
    }
  }
}`;

export default async function SimulationChapterPage({ params }: PageProps) {
  const { slug, "chapter-key": chapterKey } = await params;
  const chapter = await liveClient.fetch<SimulationChapterPageData | null>(
    QUERY,
    { slug, chapterKey },
    {
      cache: "no-store",
      next: { revalidate: 0 },
    },
  );

  if (!chapter || !chapter.character || chapter.nodes.length === 0) {
    notFound();
  }

  return <SimulationDialogueClient chapter={chapter} />;
}
