import HomeClient, { type Character } from "./HomeClient";
import { client } from "@/src/sanity/lib/client";

const QUERY = `*[_type == "character"] | order(displayOrder asc){
  _id,
  name,
  slug,
  mainImage,
  "mainVideoUrl": mainVideo.asset->url,
  backgroundImage,
  introQuote,
  description,
  ctaLabel
}`;

export default async function HomePage() {
  const characters = await client.fetch<Character[]>(QUERY);

  return <HomeClient characters={characters} />;
}
