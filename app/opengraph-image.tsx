import { ImageResponse } from "next/og";

export const alt =
  "Cueful, a focused creator page for links, referral offers, and analytics";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          padding: "70px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          color: "#20221c",
          backgroundColor: "#faf9f1",
          backgroundImage:
            "linear-gradient(rgba(32,34,28,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(32,34,28,.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      >
        <div style={{ display: "flex", fontSize: 44, fontWeight: 800 }}>
          cueful<span style={{ color: "#b84420" }}>.</span>
        </div>
        <div
          style={{
            maxWidth: 980,
            display: "flex",
            flexDirection: "column",
            fontSize: 86,
            fontWeight: 800,
            letterSpacing: "-5px",
            lineHeight: 0.92,
          }}
        >
          Make every
          <br />
          click useful.
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 27,
            color: "#5f6458",
          }}
        >
          Links <span style={{ color: "#b84420" }}>·</span> referrals{" "}
          <span style={{ color: "#b84420" }}>·</span> analytics
        </div>
      </div>
    ),
    size,
  );
}
