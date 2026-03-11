import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

interface Props {
  style?: "fade" | "wipe" | "zoom";
}

export const SceneTransition: React.FC<Props> = ({ style = "fade" }) => {
  const frame = useCurrentFrame();

  if (style === "fade") {
    const opacity = interpolate(frame, [0, 15], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return (
      <AbsoluteFill style={{ backgroundColor: "#08090d", opacity }} />
    );
  }

  if (style === "wipe") {
    const progress = interpolate(frame, [0, 20], [100, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#08090d",
          clipPath: `inset(0 0 0 ${100 - progress}%)`,
        }}
      />
    );
  }

  // zoom
  const scale = interpolate(frame, [0, 20], [1.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#08090d",
        transform: `scale(${scale})`,
        opacity: 1 - opacity,
      }}
    />
  );
};
