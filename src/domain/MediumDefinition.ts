export interface MediumDefinition {
  name: string;
  lang?: string;
  prefix: string;
  suffix: string;
  feeds: string[];
  id_container: string;
  id_mask: string;
  page_id_location: string;
  page_id_query: string;
  match_domains: string[];
  title_query: string[];
}