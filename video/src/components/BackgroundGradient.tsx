import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

interface Props {
  colors?: string[];
  children: React.ReactNode;
}

export const BackgroundGradient: React.FC<Props> = ({
  colors = ["#08090d", "#1a1d28"],
  children,
}) => {
  const frame = useCurrentFrame();
  const angle = interpolate(frame, [0, 300], [135, 180]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${angle}deg, ${colors.join(", ")})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
