import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

interface Props {
  text: string;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  fontWeight?: number;
  delay?: number;
  animation?: "fade" | "slide" | "spring" | "typewriter";
  textAlign?: "left" | "center" | "right";
}

export const AnimatedText: React.FC<Props> = ({
  text,
  fontSize = 48,
  color = "#e0e3ef",
  fontFamily = "'DM Sans', sans-serif",
  fontWeight = 700,
  delay = 0,
  animation = "spring",
  textAlign = "center",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const adjustedFrame = frame - delay;

  if (animation === "typewriter") {
    const charsToShow = Math.floor(
      interpolate(adjustedFrame, [0, text.length * 2], [0, text.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    );
    return (
      <div
        style={{
          fontSize,
          color,
          fontFamily,
          fontWeight,
          textAlign,
          lineHeight: 1.3,
        }}
      >
        {text.slice(0, charsToShow)}
        {charsToShow < text.length && (
          <span style={{ opacity: frame % 15 < 8 ? 1 : 0 }}>|</span>
        )}
      </div>
    );
  }

  const opacity = interpolate(adjustedFrame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  let translateY = 0;
  let scale = 1;

  if (animation === "slide") {
    translateY = interpolate(adjustedFrame, [0, 20], [30, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  } else if (animation === "spring") {
    scale = spring({
      fps,
      frame: adjustedFrame,
      config: { damping: 80, stiffness: 200 },
    });
  }

  return (
    <div
      style={{
        fontSize,
        color,
        fontFamily,
        fontWeight,
        textAlign,
        lineHeight: 1.3,
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
      }}
    >
      {text}
    </div>
  );
};
