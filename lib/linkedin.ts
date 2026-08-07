/**
 * There is no API for sending LinkedIn connection requests, and anything
 * automating one puts the user's own account at risk. So this does the honest
 * version: opens the search you would have typed yourself.
 */
export function linkedInSearchUrl(name: string, company?: string) {
  const keywords = [name.trim(), company?.trim()].filter(Boolean).join(" ");
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
    keywords,
  )}`;
}
