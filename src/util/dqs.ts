export const dqs = (query: string): HTMLElement => {
  return document.querySelector(query) as HTMLElement;
}