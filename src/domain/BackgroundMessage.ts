import { MediumDefinition } from "./MediumDefinition";

export interface BackgroundMessage {
  type: string;
  medium: MediumDefinition;
  id: string;
}