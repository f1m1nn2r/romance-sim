import HomeClient, {
  type Character,
  type HomePreloadManifest,
} from "./components/home-client";
import { client } from "@/src/sanity/lib/client";
import {
  getBackgroundImageUrl,
  getCharacterImageUrl,
  getDialogueImageUrl,
} from "@/src/sanity/lib/image";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

type ExpressionAsset = {
  key?: string;
  image?: SanityImageSource;
  videoUrl?: string;
};

type PreloadCharacter = {
  mainImage: SanityImageSource;
  mainVideoUrl?: string;
  backgroundImage: SanityImageSource;
  expressions?: ExpressionAsset[];
};

type PreloadNode = {
  expressionKey?: string;
  mediaOverrideImage?: SanityImageSource;
  mediaOverrideVideoUrl?: string;
  speaker?: PreloadCharacter;
};

type HomePagePayload = {
  characters: Character[];
  preloadChapters: Array<{
    character?: PreloadCharacter;
    nodes?: PreloadNode[];
  }>;
};

function resolveNodeAssets(
  node: PreloadNode,
  fallbackCharacter: PreloadCharacter,
) {
  const speaker = node.speaker ?? fallbackCharacter;
  const expressionAsset = speaker.expressions?.find(
    (asset) => asset.key === node.expressionKey,
  );

  return {
    image:
      node.mediaOverrideImage ?? expressionAsset?.image ?? speaker.mainImage,
    background: speaker.backgroundImage ?? fallbackCharacter.backgroundImage,
    videoUrl:
      node.mediaOverrideVideoUrl ??
      expressionAsset?.videoUrl ??
      speaker.mainVideoUrl,
    speaker,
  };
}

function buildPreloadManifest(payload: HomePagePayload): HomePreloadManifest {
  const imageUrls = payload.characters.flatMap((character) => [
    getCharacterImageUrl(character.mainImage),
    getBackgroundImageUrl(character.backgroundImage),
  ]);
  const videoUrls = payload.characters.map((character) => character.mainVideoUrl);

  for (const chapter of payload.preloadChapters) {
    if (!chapter.character || !chapter.nodes) {
      continue;
    }

    for (const node of chapter.nodes) {
      const { image, background, videoUrl, speaker } = resolveNodeAssets(
        node,
        chapter.character,
      );

      imageUrls.push(
        getDialogueImageUrl(image),
        getBackgroundImageUrl(background),
        getDialogueImageUrl(speaker.mainImage),
      );

      videoUrls.push(videoUrl, speaker.mainVideoUrl);

      for (const expression of speaker.expressions ?? []) {
        if (expression.image) {
          imageUrls.push(getDialogueImageUrl(expression.image));
        }

        videoUrls.push(expression.videoUrl);
      }
    }
  }

  return { imageUrls, videoUrls: videoUrls.filter(Boolean) as string[] };
}

const QUERY = `{
  "characters": *[_type == "character"] | order(displayOrder asc){
    _id,
    name,
    slug,
    mainImage,
    "mainVideoUrl": mainVideo.asset->url,
    backgroundImage,
    introQuote,
    description,
    ctaLabel
  },
  "preloadChapters": *[_type == "chapter" && isPublished == true]{
    "character": character->{
      mainImage,
      "mainVideoUrl": mainVideo.asset->url,
      backgroundImage,
      "expressions": expressions[]{
        key,
        image,
        "videoUrl": video.asset->url
      }
    },
    "nodes": *[_type == "dialogueNode" && references(^._id)]{
      expressionKey,
      "speaker": speaker->{
        mainImage,
        "mainVideoUrl": mainVideo.asset->url,
        backgroundImage,
        "expressions": expressions[]{
          key,
          image,
          "videoUrl": video.asset->url
        }
      },
      "mediaOverrideImage": mediaOverride.image,
      "mediaOverrideVideoUrl": mediaOverride.video.asset->url
    }
  }
}`;

export default async function HomePage() {
  const payload = await client.fetch<HomePagePayload>(QUERY);
  const preloadManifest = buildPreloadManifest(payload);

  return (
    <HomeClient
      characters={payload.characters}
      preloadManifest={preloadManifest}
    />
  );
}
