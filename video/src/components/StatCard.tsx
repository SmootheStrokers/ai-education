import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

interface Props {
  stat: string;
  label: string;
  source?: string;
  delay?: number;
}

export const StatCard: React.FC<Props> = ({
  stat,
  label,
  source,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const adjustedFrame = frame - delay;

  const scale = spring({
    fps,
    frame: adjustedFrame,
    config: { damping: 80, stiffness: 180 },
  });

  const labelOpacity = interpolate(adjustedFrame, [15, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const sourceOpacity = interpolate(adjustedFrame, [25, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Animate stat number if it's a percentage or number
  const numericPart = stat.replace(/[^0-9.]/g, "");
  const prefix = stat.match(/^[^0-9]*/)?.[0] || "";
  const suffix = stat.match(/[^0-9.]*$/)?.[0] || "";
  const targetNum = parseFloat(numericPart);
  const isNumeric = !isNaN(targetNum);

  const currentNum = isNumeric
    ? interpolate(adjustedFrame, [0, 30], [0, targetNum], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  const displayStat = isNumeric
    ? `${prefix}${Math.round(currentNum)}${suffix}`
    : stat;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${scale})`,
        padding: 40,
      }}
    >
      <div
        style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: 120,
          color: "#e8a832",
          lineHeight: 1,
        }}
      >
        {displayStat}
      </div>
      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 32,
          color: "#b8bdd4",
          opacity: labelOpacity,
          marginTop: 20,
          textAlign: "center",
          maxWidth: 700,
          lineHeight: 1.3,
        }}
      >
        {label}
      </div>
      {source && (
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 18,
            color: "#6b7194",
            opacity: sourceOpacity,
            marginTop: 12,
          }}
        >
          Source: {source}
        </div>
      )}
    </div>
  );
};
