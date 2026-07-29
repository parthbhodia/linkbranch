import { SeoResourcePage, metadataForSeoPage } from "@/components/seo-resource-page";
import { seoPageByPath } from "@/lib/seo-pages";

const page = seoPageByPath.get("/templates/spotify-embed-link-in-bio")!;
export const metadata = metadataForSeoPage(page);
export default function Page() {
  return <SeoResourcePage page={page} />;
}
