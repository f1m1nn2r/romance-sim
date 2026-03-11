import { characterType } from "./characterType";
import { postType } from "./postType";

export const schemaTypes = [postType, characterType];

export const schema = {
  types: schemaTypes,
};
