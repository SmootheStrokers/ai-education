import React from "react";
import { Composition } from "remotion";
import type { AnyZodObject } from "remotion";
import { VideoComposition } from "./compositions/VideoComposition";
import type { VideoCompositionProps, Scene } from "./types";

const defaultScenes: Scene[] = [
  {
    type: "title",
    duration: 3,
    text: "AI for Everyday Americans",
    subtitle: "Content Preview",
    colors: ["#08090d", "#1a1d28"],
  },
];

const getDurationInFrames = (scenes: Scene[]) =>
  Math.round(
    scenes.reduce((sum: number, scene: Scene) => sum + scene.duration, 0) * 30
  );

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Landscape 16:9 */}
      <Composition<AnyZodObject, VideoCompositionProps>
        id="VideoLandscape"
        component={VideoComposition}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ scenes: defaultScenes }}
        calculateMetadata={async ({ props }) => {
          return { durationInFrames: getDurationInFrames(props.scenes) };
        }}
      />

      {/* Portrait 9:16 (social/shorts) */}
      <Composition<AnyZodObject, VideoCompositionProps>
        id="VideoPortrait"
        component={VideoComposition}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ scenes: defaultScenes }}
        calculateMetadata={async ({ props }) => {
          return { durationInFrames: getDurationInFrames(props.scenes) };
        }}
      />

      {/* Square 1:1 (Instagram) */}
      <Composition<AnyZodObject, VideoCompositionProps>
        id="VideoSquare"
        component={VideoComposition}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{ scenes: defaultScenes }}
        calculateMetadata={async ({ props }) => {
          return { durationInFrames: getDurationInFrames(props.scenes) };
        }}
      />
    </>
  );
};
