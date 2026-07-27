import Link from "next/link";
import { BRAND_NAME } from "@/lib/brand";

export function BrandMark({
  className = "brand",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link className={className} href="/" aria-label={`${BRAND_NAME} home`}>
      {compact ? (
        <>
          c<span>f</span><i>.</i>
        </>
      ) : (
        <>
          cue<span>ful</span><i>.</i>
        </>
      )}
    </Link>
  );
}
