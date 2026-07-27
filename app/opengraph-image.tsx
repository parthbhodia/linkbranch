import { ImageResponse } from "next/og";

export const alt =
  "Cueful — one useful page for links, referral offers, and analytics";
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
        <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
          <div
            style={{
              maxWidth: 980,
              display: "flex",
              flexDirection: "column",
              fontSize: 82,
              fontWeight: 800,
              letterSpacing: "-5px",
              lineHeight: 0.94,
            }}
          >
            One page.
            <br />
            Better clicks.
          </div>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "15px 24px",
              borderRadius: 999,
              background: "#c9ef69",
              border: "2px solid #20221c",
              fontSize: 24,
              fontWeight: 750,
            }}
          >
            Build yours free →
          </div>
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
