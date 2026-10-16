import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadOutfit } from "@remotion/google-fonts/Outfit";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";

const { fontFamily: outfit } = loadOutfit("normal", {
  weights: ["500", "600", "700", "800"],
  subsets: ["latin"],
});
const { fontFamily: fraunces } = loadFraunces("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
});

const PAPER = "#faf9f1";
const INK = "#1b1c18";
const MUTED = "#5e6256";
const LIME = "#c9ef69";
const LINE = "#c5c8b9";
const SURFACE = "#f1f0e8";
const DOT = "#c64a16";

const LINKS = [
  { title: "Latest side-project", meta: "New drop" },
  { title: "Field notes", meta: "Read" },
  { title: "Studio wishlist", meta: "Shop" },
  { title: "Book a call", meta: "Open" },
];

export const CuefulReel: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER, fontFamily: outfit }}>
      <GridBg />
      <Sequence from={0} durationInFrames={70}>
        <HookScene />
      </Sequence>
      <Sequence from={55} durationInFrames={140}>
        <PhoneScene />
      </Sequence>
      <Sequence from={185} durationInFrames={50}>
        <BrandScene />
      </Sequence>
      <Sequence from={225} durationInFrames={75}>
        <CtaScene />
      </Sequence>
    </AbsoluteFill>
  );
};

const GridBg: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundImage: `
        linear-gradient(${LINE}33 1px, transparent 1px),
        linear-gradient(90deg, ${LINE}33 1px, transparent 1px)
      `,
      backgroundSize: "48px 48px",
      opacity: 0.7,
    }}
  />
);

const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const line1 = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 120 },
  });
  const line2 = spring({
    frame: frame - 18,
    fps,
    config: { damping: 18, stiffness: 120 },
  });
  const exit = interpolate(frame, [52, 70], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        padding: "0 72px",
        opacity: exit,
        transform: `translateY(${interpolate(exit, [0, 1], [-40, 0])}px)`,
      }}
    >
      <div
        style={{
          fontFamily: fraunces,
          fontSize: 92,
          lineHeight: 1.05,
          letterSpacing: "-0.04em",
          color: INK,
          fontWeight: 700,
          transform: `translateY(${(1 - line1) * 36}px)`,
          opacity: line1,
          marginBottom: 28,
        }}
      >
        Your bio has{" "}
        <span
          style={{
            background: LIME,
            padding: "0 14px",
            borderRadius: 12,
            boxDecorationBreak: "clone",
          }}
        >
          1 link.
        </span>
      </div>
      <div
        style={{
          fontFamily: fraunces,
          fontSize: 78,
          lineHeight: 1.08,
          letterSpacing: "-0.035em",
          color: INK,
          fontWeight: 600,
          transform: `translateY(${(1 - line2) * 36}px)`,
          opacity: Math.max(0, line2),
        }}
      >
        You have 6 things to share.
      </div>
      <div
        style={{
          marginTop: 48,
          fontSize: 28,
          fontWeight: 600,
          color: MUTED,
          opacity: Math.max(0, line2) * 0.9,
          letterSpacing: "0.02em",
        }}
      >
        Stop picking favorites.
      </div>
    </AbsoluteFill>
  );
};

const PhoneScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 90 },
  });
  const exit = interpolate(frame, [118, 140], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Tap each link in sequence
  const activeIndex = Math.min(
    LINKS.length - 1,
    Math.max(0, Math.floor((frame - 28) / 22)),
  );
  const tapPulse = spring({
    frame: (frame - 28) % 22,
    fps,
    config: { damping: 12, stiffness: 180 },
  });

  const cursorX = 540;
  const cursorY = 760 + activeIndex * 118 + interpolate(tapPulse, [0, 1], [18, 0]);

  return (
    <AbsoluteFill
      style={{
        opacity: enter * exit,
        transform: `translateY(${(1 - enter) * 80}px) scale(${0.92 + enter * 0.08})`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 72,
          right: 72,
          textAlign: "center",
          fontFamily: fraunces,
          fontSize: 44,
          fontWeight: 700,
          color: INK,
          letterSpacing: "-0.03em",
          opacity: interpolate(frame, [8, 24], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        One free page. Every link.
      </div>

      <div
        style={{
          width: 520,
          height: 980,
          borderRadius: 56,
          border: `10px solid ${INK}`,
          background: SURFACE,
          boxShadow: `0 40px 80px rgba(27,28,24,0.18)`,
          overflow: "hidden",
          position: "relative",
          marginTop: 40,
        }}
      >
        <div
          style={{
            height: 36,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            paddingBottom: 8,
          }}
        >
          <div
            style={{
              width: 120,
              height: 10,
              borderRadius: 999,
              background: INK,
              opacity: 0.85,
            }}
          />
        </div>

        <div style={{ padding: "28px 32px 40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: LIME,
                color: INK,
                fontWeight: 800,
                fontSize: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              A
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 28, color: INK }}>
                @avery.makes
              </div>
              <div style={{ fontSize: 18, color: MUTED, marginTop: 4 }}>
                Maker · notes · studio
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 28,
              padding: "18px 20px",
              borderRadius: 18,
              background: PAPER,
              border: `1px solid ${LINE}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 15, color: MUTED, fontWeight: 600 }}>
                Templates for your next idea
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: INK }}>
                AVE2N20
              </div>
            </div>
            <div
              style={{
                background: LIME,
                color: INK,
                fontWeight: 700,
                fontSize: 16,
                padding: "10px 16px",
                borderRadius: 999,
              }}
            >
              Copy
            </div>
          </div>

          <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            {LINKS.map((link, i) => {
              const active = i === activeIndex && frame > 28;
              const scale = active ? 1 + tapPulse * 0.03 : 1;
              return (
                <div
                  key={link.title}
                  style={{
                    background: active ? LIME : PAPER,
                    border: `1.5px solid ${active ? INK : LINE}`,
                    borderRadius: 20,
                    padding: "22px 24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transform: `scale(${scale})`,
                    boxShadow: active
                      ? "0 10px 24px rgba(27,28,24,0.12)"
                      : "none",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 24, color: INK }}>
                    {link.title}
                  </div>
                  <div style={{ fontSize: 16, color: MUTED, fontWeight: 600 }}>
                    {link.meta}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tap cursor */}
      {frame > 24 && (
        <div
          style={{
            position: "absolute",
            left: cursorX,
            top: cursorY,
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: `3px solid ${INK}`,
            background: `${LIME}99`,
            transform: `scale(${0.7 + tapPulse * 0.45})`,
            opacity: 0.85,
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
};

const BrandScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });
  const exit = interpolate(frame, [36, 50], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: enter * exit,
        transform: `scale(${0.9 + enter * 0.1})`,
      }}
    >
      <div
        style={{
          fontFamily: fraunces,
          fontSize: 120,
          fontWeight: 700,
          color: INK,
          letterSpacing: "-0.05em",
        }}
      >
        cueful
        <span style={{ color: DOT }}>.</span>
      </div>
      <div
        style={{
          marginTop: 28,
          background: LIME,
          color: INK,
          fontWeight: 800,
          fontSize: 34,
          padding: "18px 36px",
          borderRadius: 999,
        }}
      >
        Free forever
      </div>
      <div
        style={{
          marginTop: 32,
          fontSize: 30,
          color: MUTED,
          fontWeight: 600,
          maxWidth: 720,
          textAlign: "center",
          lineHeight: 1.3,
        }}
      >
        One free link for everything you create.
      </div>
    </AbsoluteFill>
  );
};

const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 110 },
  });
  const pulse = 1 + Math.sin(frame / 6) * 0.025;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 64,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 50}px)`,
      }}
    >
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: MUTED,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 24,
        }}
      >
        Want yours?
      </div>
      <div
        style={{
          fontFamily: fraunces,
          fontSize: 78,
          fontWeight: 700,
          color: INK,
          textAlign: "center",
          lineHeight: 1.1,
          letterSpacing: "-0.035em",
          maxWidth: 860,
        }}
      >
        Comment{" "}
        <span
          style={{
            background: LIME,
            padding: "4px 22px",
            borderRadius: 16,
            display: "inline-block",
            transform: `scale(${pulse})`,
          }}
        >
          LINK
        </span>
      </div>
      <div
        style={{
          marginTop: 28,
          fontSize: 32,
          color: MUTED,
          fontWeight: 600,
          textAlign: "center",
        }}
      >
        and I’ll send your free Cueful page.
      </div>
      <div
        style={{
          marginTop: 56,
          fontFamily: fraunces,
          fontSize: 40,
          fontWeight: 700,
          color: INK,
        }}
      >
        cueful
        <span style={{ color: DOT }}>.</span>
        bio
      </div>
    </AbsoluteFill>
  );
};
