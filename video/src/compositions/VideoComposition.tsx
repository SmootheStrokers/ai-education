import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Scene, VideoCompositionProps } from "../types";
import { AnimatedText } from "../components/AnimatedText";
import { BackgroundGradient } from "../components/BackgroundGradient";
import { StatCard } from "../components/StatCard";
import { SceneTransition } from "../components/SceneTransition";

// --- Scene Renderers ---

const TitleSceneRenderer: React.FC<{ scene: Extract<Scene, { type: "title" }> }> = ({
  scene,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const accentWidth = spring({
    fps,
    frame: frame - 10,
    config: { damping: 100, stiffness: 150 },
  });

  return (
    <BackgroundGradient colors={scene.colors}>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: 60,
        }}
      >
        {/* Amber accent line */}
        <div
          style={{
            width: `${accentWidth * 120}px`,
            height: 4,
            background: "linear-gradient(90deg, #e8a832, #d49a2a)",
            borderRadius: 2,
            marginBottom: 30,
          }}
        />
        <AnimatedText
          text={scene.text}
          fontSize={64}
          fontFamily="'DM Serif Display', Georgia, serif"
          color="#ffffff"
          animation="spring"
        />
        {scene.subtitle && (
          <div style={{ marginTop: 20 }}>
            <AnimatedText
              text={scene.subtitle}
              fontSize={28}
              fontFamily="'DM Sans', sans-serif"
              fontWeight={400}
              color="#9096b3"
              delay={15}
              animation="fade"
            />
          </div>
        )}
      </AbsoluteFill>
    </BackgroundGradient>
  );
};

const TextRevealRenderer: React.FC<{
  scene: Extract<Scene, { type: "text_reveal" }>;
}> = ({ scene }) => {
  return (
    <BackgroundGradient colors={["#0f1118", "#08090d"]}>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          padding: 80,
        }}
      >
        <AnimatedText
          text={scene.heading}
          fontSize={48}
          fontFamily="'DM Serif Display', Georgia, serif"
          color="#e8a832"
          animation="slide"
          textAlign="left"
        />
        <div style={{ marginTop: 30 }}>
          <AnimatedText
            text={scene.body}
            fontSize={28}
            fontFamily="'DM Sans', sans-serif"
            fontWeight={400}
            color="#b8bdd4"
            delay={20}
            animation={scene.animation || "fade"}
            textAlign="left"
          />
        </div>
      </AbsoluteFill>
    </BackgroundGradient>
  );
};

const StatCardRenderer: React.FC<{
  scene: Extract<Scene, { type: "stat_card" }>;
}> = ({ scene }) => {
  return (
    <BackgroundGradient colors={["#0f1118", "#1a1d28"]}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <StatCard stat={scene.stat} label={scene.label} source={scene.source} />
      </AbsoluteFill>
    </BackgroundGradient>
  );
};

const ToolShowcaseRenderer: React.FC<{
  scene: Extract<Scene, { type: "tool_showcase" }>;
}> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardScale = spring({
    fps,
    frame,
    config: { damping: 80, stiffness: 200 },
  });

  const detailOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <BackgroundGradient colors={["#08090d", "#151720"]}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            transform: `scale(${cardScale})`,
            background: "linear-gradient(135deg, #1a1d28, #252838)",
            border: "1px solid #363a4d",
            borderRadius: 20,
            padding: 50,
            maxWidth: 700,
            width: "80%",
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 16,
              color: "#e8a832",
              textTransform: "uppercase",
              letterSpacing: 3,
              marginBottom: 12,
            }}
          >
            Tool Spotlight
          </div>
          <div
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 52,
              color: "#ffffff",
              marginBottom: 16,
            }}
          >
            {scene.tool_name}
          </div>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 24,
              color: "#9096b3",
              lineHeight: 1.5,
              opacity: detailOpacity,
            }}
          >
            {scene.description}
          </div>
          <div
            style={{
              display: "flex",
              gap: 20,
              marginTop: 30,
              opacity: detailOpacity,
            }}
          >
            {scene.price && (
              <div
                style={{
                  background: "rgba(232, 168, 50, 0.15)",
                  border: "1px solid rgba(232, 168, 50, 0.3)",
                  borderRadius: 10,
                  padding: "10px 20px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 18,
                  color: "#e8a832",
                }}
              >
                {scene.price}
              </div>
            )}
            {scene.time_saved && (
              <div
                style={{
                  background: "rgba(52, 211, 153, 0.15)",
                  border: "1px solid rgba(52, 211, 153, 0.3)",
                  borderRadius: 10,
                  padding: "10px 20px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 18,
                  color: "#34d399",
                }}
              >
                Saves {scene.time_saved}
              </div>
            )}
          </div>
        </div>
      </AbsoluteFill>
    </BackgroundGradient>
  );
};

const ComparisonRenderer: React.FC<{
  scene: Extract<Scene, { type: "comparison" }>;
}> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const dividerScale = spring({
    fps,
    frame: frame - 5,
    config: { damping: 100, stiffness: 120 },
  });

  const leftOpacity = interpolate(frame, [5, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const rightOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <BackgroundGradient colors={["#0f1118", "#08090d"]}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "row",
        }}
      >
        {/* Before */}
        <div
          style={{
            flex: 1,
            padding: 50,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            opacity: leftOpacity,
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 18,
              color: "#f87171",
              textTransform: "uppercase",
              letterSpacing: 3,
              marginBottom: 24,
              fontWeight: 700,
            }}
          >
            {scene.before_label}
          </div>
          {scene.before_items.map((item, i) => (
            <div
              key={i}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 22,
                color: "#9096b3",
                marginBottom: 14,
                opacity: interpolate(frame, [15 + i * 6, 22 + i * 6], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
                transform: `translateX(${interpolate(
                  frame,
                  [15 + i * 6, 22 + i * 6],
                  [-20, 0],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                )}px)`,
              }}
            >
              {"\u2717"} {item}
            </div>
          ))}
        </div>
        {/* Divider */}
        <div
          style={{
            width: 2,
            background: "linear-gradient(to bottom, transparent, #e8a832, transparent)",
            transform: `scaleY(${dividerScale})`,
          }}
        />
        {/* After */}
        <div
          style={{
            flex: 1,
            padding: 50,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            opacity: rightOpacity,
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 18,
              color: "#34d399",
              textTransform: "uppercase",
              letterSpacing: 3,
              marginBottom: 24,
              fontWeight: 700,
            }}
          >
            {scene.after_label}
          </div>
          {scene.after_items.map((item, i) => (
            <div
              key={i}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 22,
                color: "#e0e3ef",
                marginBottom: 14,
                opacity: interpolate(frame, [20 + i * 6, 27 + i * 6], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
                transform: `translateX(${interpolate(
                  frame,
                  [20 + i * 6, 27 + i * 6],
                  [20, 0],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                )}px)`,
              }}
            >
              {"\u2713"} {item}
            </div>
          ))}
        </div>
      </div>
    </BackgroundGradient>
  );
};

const ListRevealRenderer: React.FC<{
  scene: Extract<Scene, { type: "list_reveal" }>;
}> = ({ scene }) => {
  const frame = useCurrentFrame();

  return (
    <BackgroundGradient colors={["#0f1118", "#08090d"]}>
      <AbsoluteFill style={{ justifyContent: "center", padding: 80 }}>
        <AnimatedText
          text={scene.heading}
          fontSize={44}
          fontFamily="'DM Serif Display', Georgia, serif"
          color="#e8a832"
          animation="slide"
          textAlign="left"
        />
        <div style={{ marginTop: 30 }}>
          {scene.items.map((item, i) => {
            const itemOpacity = interpolate(
              frame,
              [20 + i * 12, 30 + i * 12],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            const itemY = interpolate(
              frame,
              [20 + i * 12, 30 + i * 12],
              [15, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            return (
              <div
                key={i}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 26,
                  color: "#b8bdd4",
                  marginBottom: 16,
                  opacity: itemOpacity,
                  transform: `translateY(${itemY}px)`,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <span
                  style={{
                    fontFamily: "'DM Serif Display', Georgia, serif",
                    fontSize: 32,
                    color: "#e8a832",
                    minWidth: 40,
                  }}
                >
                  {i + 1}
                </span>
                {item}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </BackgroundGradient>
  );
};

const QuoteRenderer: React.FC<{
  scene: Extract<Scene, { type: "quote" }>;
}> = ({ scene }) => {
  const frame = useCurrentFrame();

  const quoteOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const attrOpacity = interpolate(frame, [25, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <BackgroundGradient colors={["#1a1d28", "#0f1118"]}>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: 80,
        }}
      >
        <div
          style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 80,
            color: "rgba(232, 168, 50, 0.3)",
            lineHeight: 1,
            marginBottom: -20,
          }}
        >
          {"\u201c"}
        </div>
        <div
          style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 36,
            color: "#e0e3ef",
            fontStyle: "italic",
            textAlign: "center",
            lineHeight: 1.5,
            maxWidth: 800,
            opacity: quoteOpacity,
          }}
        >
          {scene.text}
        </div>
        {scene.attribution && (
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 20,
              color: "#6b7194",
              marginTop: 24,
              opacity: attrOpacity,
            }}
          >
            {"\u2014"} {scene.attribution}
          </div>
        )}
      </AbsoluteFill>
    </BackgroundGradient>
  );
};

const CtaRenderer: React.FC<{
  scene: Extract<Scene, { type: "cta" }>;
}> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const btnScale = spring({
    fps,
    frame: frame - 10,
    config: { damping: 60, stiffness: 200 },
  });

  // Pulse effect
  const pulse =
    1 + 0.03 * Math.sin(((frame - 30) / fps) * Math.PI * 2);

  return (
    <BackgroundGradient colors={["#08090d", "#1a1d28"]}>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: 60,
        }}
      >
        <AnimatedText
          text={scene.text}
          fontSize={52}
          fontFamily="'DM Serif Display', Georgia, serif"
          color="#ffffff"
          animation="spring"
        />
        {scene.subtext && (
          <div style={{ marginTop: 16 }}>
            <AnimatedText
              text={scene.subtext}
              fontSize={24}
              fontFamily="'DM Sans', sans-serif"
              fontWeight={400}
              color="#9096b3"
              delay={15}
              animation="fade"
            />
          </div>
        )}
        <div
          style={{
            marginTop: 40,
            transform: `scale(${btnScale * pulse})`,
            background: "linear-gradient(135deg, #e8a832, #d49a2a)",
            borderRadius: 14,
            padding: "18px 48px",
            boxShadow: "0 0 40px rgba(232, 168, 50, 0.3)",
          }}
        >
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 22,
              fontWeight: 700,
              color: "#08090d",
            }}
          >
            Get Started
          </div>
        </div>
      </AbsoluteFill>
    </BackgroundGradient>
  );
};

const TransitionRenderer: React.FC<{
  scene: Extract<Scene, { type: "transition" }>;
}> = ({ scene }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#08090d" }}>
      <SceneTransition style={scene.style} />
    </AbsoluteFill>
  );
};

const KeyInsightRenderer: React.FC<{
  scene: Extract<Scene, { type: "key_insight" }>;
}> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const animation = scene.animation || "word_by_word";

  const words = scene.text.split(" ");

  return (
    <BackgroundGradient colors={["#08090d", "#1a1d28"]}>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: 80,
        }}
      >
        <div
          style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 72,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.3,
            maxWidth: 1000,
          }}
        >
          {animation === "word_by_word"
            ? words.map((word, i) => {
                const wordOpacity = interpolate(
                  frame,
                  [5 + i * 4, 10 + i * 4],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                );
                return (
                  <span
                    key={i}
                    style={{
                      opacity: wordOpacity,
                      display: "inline-block",
                      marginRight: 16,
                    }}
                  >
                    {word}
                  </span>
                );
              })
            : (() => {
                const textScale =
                  animation === "scale_up"
                    ? spring({
                        fps,
                        frame,
                        config: { damping: 80, stiffness: 150 },
                        durationInFrames: 20,
                      })
                    : 1;
                const textOpacity = interpolate(frame, [0, 15], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
                return (
                  <span
                    style={{
                      opacity: textOpacity,
                      transform: `scale(${textScale})`,
                      display: "inline-block",
                    }}
                  >
                    {scene.text}
                  </span>
                );
              })()}
        </div>
        {scene.subtext && (
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 28,
              color: "#e8a832",
              marginTop: 24,
              opacity: interpolate(frame, [25, 40], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            {scene.subtext}
          </div>
        )}
      </AbsoluteFill>
    </BackgroundGradient>
  );
};

const TestimonialCardRenderer: React.FC<{
  scene: Extract<Scene, { type: "testimonial_card" }>;
}> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardScale = spring({
    fps,
    frame,
    config: { damping: 80, stiffness: 200 },
  });

  const detailOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <BackgroundGradient colors={["#0f1118", "#1a1d28"]}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            transform: `scale(${cardScale})`,
            background: "linear-gradient(135deg, #1a1d28, #252838)",
            border: "1px solid #363a4d",
            borderRadius: 24,
            padding: 60,
            maxWidth: 750,
            width: "80%",
          }}
        >
          <div
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 64,
              color: "rgba(232, 168, 50, 0.4)",
              lineHeight: 1,
              marginBottom: -10,
            }}
          >
            {"\u201c"}
          </div>
          <div
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 32,
              color: "#e0e3ef",
              fontStyle: "italic",
              lineHeight: 1.5,
              marginBottom: 30,
            }}
          >
            {scene.quote}
          </div>
          <div style={{ opacity: detailOpacity }}>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 22,
                color: "#ffffff",
                fontWeight: 700,
              }}
            >
              {scene.name}
            </div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 18,
                color: "#9096b3",
                marginTop: 4,
              }}
            >
              {scene.role} at {scene.company}
            </div>
            {scene.result_metric && (
              <div
                style={{
                  marginTop: 16,
                  background: "rgba(52, 211, 153, 0.15)",
                  border: "1px solid rgba(52, 211, 153, 0.3)",
                  borderRadius: 10,
                  padding: "8px 20px",
                  display: "inline-block",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 18,
                  color: "#34d399",
                }}
              >
                {scene.result_metric}
              </div>
            )}
          </div>
        </div>
      </AbsoluteFill>
    </BackgroundGradient>
  );
};

const SplitScreenRenderer: React.FC<{
  scene: Extract<Scene, { type: "split_screen" }>;
}> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const highlight = scene.highlight_side || "right";

  const dividerScale = spring({
    fps,
    frame: frame - 10,
    config: { damping: 100, stiffness: 120 },
  });

  const leftOpacity = interpolate(frame, [5, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rightOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <BackgroundGradient colors={["#0f1118", "#08090d"]}>
      <AbsoluteFill style={{ flexDirection: "row" }}>
        <div
          style={{
            flex: 1,
            padding: 60,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            opacity: leftOpacity,
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 16,
              color: highlight === "left" ? "#e8a832" : "#9096b3",
              textTransform: "uppercase",
              letterSpacing: 3,
              marginBottom: 20,
            }}
          >
            {scene.left_heading}
          </div>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 24,
              color: highlight === "left" ? "#ffffff" : "#b8bdd4",
              lineHeight: 1.6,
            }}
          >
            {scene.left_content}
          </div>
        </div>
        <div
          style={{
            width: 2,
            background:
              "linear-gradient(to bottom, transparent, #e8a832, transparent)",
            transform: `scaleY(${dividerScale})`,
          }}
        />
        <div
          style={{
            flex: 1,
            padding: 60,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            opacity: rightOpacity,
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 16,
              color: highlight === "right" ? "#e8a832" : "#9096b3",
              textTransform: "uppercase",
              letterSpacing: 3,
              marginBottom: 20,
            }}
          >
            {scene.right_heading}
          </div>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 24,
              color: highlight === "right" ? "#ffffff" : "#b8bdd4",
              lineHeight: 1.6,
            }}
          >
            {scene.right_content}
          </div>
        </div>
      </AbsoluteFill>
    </BackgroundGradient>
  );
};

// --- Scene Router ---

const SceneRouter: React.FC<{ scene: Scene }> = ({ scene }) => {
  switch (scene.type) {
    case "title":
      return <TitleSceneRenderer scene={scene} />;
    case "text_reveal":
      return <TextRevealRenderer scene={scene} />;
    case "stat_card":
      return <StatCardRenderer scene={scene} />;
    case "tool_showcase":
      return <ToolShowcaseRenderer scene={scene} />;
    case "comparison":
      return <ComparisonRenderer scene={scene} />;
    case "list_reveal":
      return <ListRevealRenderer scene={scene} />;
    case "quote":
      return <QuoteRenderer scene={scene} />;
    case "cta":
      return <CtaRenderer scene={scene} />;
    case "transition":
      return <TransitionRenderer scene={scene} />;
    case "key_insight":
      return <KeyInsightRenderer scene={scene} />;
    case "testimonial_card":
      return <TestimonialCardRenderer scene={scene} />;
    case "split_screen":
      return <SplitScreenRenderer scene={scene} />;
    default:
      return <AbsoluteFill style={{ backgroundColor: "#08090d" }} />;
  }
};

// --- Main Composition ---

export const VideoComposition: React.FC<VideoCompositionProps> = ({
  scenes,
}) => {
  const { fps } = useVideoConfig();

  let currentFrame = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#08090d" }}>
      {scenes.map((scene, i) => {
        const durationFrames = Math.round(scene.duration * fps);
        const fromFrame = currentFrame;
        currentFrame += durationFrames;

        return (
          <Sequence key={i} from={fromFrame} durationInFrames={durationFrames}>
            <SceneRouter scene={scene} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
