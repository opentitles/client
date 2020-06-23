import { MediumDefinition } from "./MediumDefinition";

/** The media.json file has a top-level key called 'feeds', which is represented by this interface */
export interface FeedList {
  [key: string]: MediumDefinition[];
}