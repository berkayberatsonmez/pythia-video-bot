import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const FONT_FAMILY =
  "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

// Big title that fades in and pops with a spring.
const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.9 },
  });

  const scale = interpolate(entrance, [0, 1], [0.6, 1]);
  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <h1
      style={{
        fontFamily: FONT_FAMILY,
        fontSize: 140,
        fontWeight: 800,
        letterSpacing: -5,
        color: "white",
        margin: 0,
        opacity,
        transform: `scale(${scale})`,
        textShadow: "0 20px 60px rgba(0, 0, 0, 0.45)",
      }}
    >
      Hello World
    </h1>
  );
};

// Subtitle that fades in and slides up, delayed via the interpolate input range
// (kept in normal layout so the title never shifts when it appears).
const Subtitle: React.FC = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [22, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(frame, [22, 40], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <p
      style={{
        fontFamily: FONT_FAMILY,
        fontSize: 34,
        fontWeight: 500,
        letterSpacing: 8,
        textTransform: "uppercase",
        color: "rgba(255, 255, 255, 0.7)",
        margin: 0,
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      Made with Remotion
    </p>
  );
};

export const HelloWorld: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(135deg, #0f0c29 0%, #302b63 55%, #24243e 100%)",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 28,
      }}
    >
      <Title />
      <Subtitle />
    </AbsoluteFill>
  );
};
