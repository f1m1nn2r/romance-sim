import { characterType } from "./character-type";
import { chapterType } from "./chapter-type";
import { dialogueNodeType } from "./dialogue-node-type";
import { postType } from "./post-type";

export const schemaTypes = [postType, characterType, chapterType, dialogueNodeType];

export const schema = {
  types: schemaTypes,
};
