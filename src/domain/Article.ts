import { Title } from "./Title";

export interface Article {
  _id: string;
  org: string;
  articleID: string;
  feedtitle: string;
  sourcefeed: string;
  lang: string;
  link: string;
  guid: string;
  titles: Title[];
  first_seen: string;
  pub_date: string;
}
