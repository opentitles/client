import { MediumDefinition } from "../../../src/domain/MediumDefinition";

export const mediumWithIdInUrl: MediumDefinition = {
  name: "Testmedium",
  prefix: "https://feed.example.com",
  suffix: ".xml",
  feeds: [
    "news"
  ],
  id_container: "guid",
  id_mask: "[0-9]{7}",
  page_id_location: "url",
  page_id_query: "",
  match_domains: ["example.com"],
  title_query: ["h1#title"]
};

export const mediumWithIdInVar: MediumDefinition = {
  name: "Testmedium",
  prefix: "https://feed.example.com",
  suffix: ".xml",
  feeds: [
    "news"
  ],
  id_container: "guid",
  id_mask: "[0-9]{7}",
  page_id_location: "var",
  page_id_query: "analytics.meta.articleid",
  match_domains: ["example.com"],
  title_query: ["h1#title"]
};

export const mediumWithoutTitle: MediumDefinition = {
  name: "Testmedium",
  prefix: "https://feed.example.com",
  suffix: ".xml",
  feeds: [
    "news"
  ],
  id_container: "guid",
  id_mask: "[0-9]{7}",
  page_id_location: "url",
  page_id_query: "",
  match_domains: ["example.com"],
  title_query: ["h3.title"]
};

export const mediumWithInvalidTitleQuery: MediumDefinition = {
  name: "Testmedium",
  prefix: "https://feed.example.com",
  suffix: ".xml",
  feeds: [
    "news"
  ],
  id_container: "guid",
  id_mask: "[0-9]{7}",
  page_id_location: "url",
  page_id_query: "",
  match_domains: ["example.com"],
  title_query: ["[]"]
};