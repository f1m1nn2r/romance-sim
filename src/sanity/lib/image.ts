import createImageUrlBuilder from '@sanity/image-url'
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

import { dataset, projectId } from '../env'

// https://www.sanity.io/docs/image-url
const builder = createImageUrlBuilder({ projectId, dataset })

export const urlFor = (source: SanityImageSource) => {
  return builder.image(source)
}

export const getCharacterImageUrl = (source: SanityImageSource) => {
  return urlFor(source).width(1200).url()
}

export const getDialogueImageUrl = (source: SanityImageSource) => {
  return urlFor(source).width(1400).url()
}

export const getBackgroundImageUrl = (source: SanityImageSource) => {
  return urlFor(source).width(1920).url()
}
