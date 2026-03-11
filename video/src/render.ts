/**
 * CLI render script — called by the Python backend via subprocess.
 *
 * Usage: npx tsx src/render.ts --input scene.json --output out.mp4 [--composition VideoLandscape]
 */

import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs(): {
  input: string;
  output: string;
  compositionId: string;
} {
  const args = process.argv.slice(2);
  let input = "";
  let output = "";
  let compositionId = "VideoLandscape";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--input" && args[i + 1]) input = args[++i];
    else if (args[i] === "--output" && args[i + 1]) output = args[++i];
    else if (args[i] === "--composition" && args[i + 1])
      compositionId = args[++i];
  }

  if (!input || !output) {
    console.error(
      "Usage: npx tsx src/render.ts --input <scene.json> --output <video.mp4> [--composition VideoLandscape]"
    );
    process.exit(1);
  }

  return { input, output, compositionId };
}

async function main() {
  const { input, output, compositionId } = parseArgs();

  // Read scene JSON
  const sceneData = JSON.parse(readFileSync(resolve(input), "utf-8"));
  const inputProps = { scenes: sceneData.scenes || sceneData };

  console.log(
    `[Remotion] Rendering ${compositionId} with ${inputProps.scenes.length} scenes`
  );

  // Bundle the Remotion project
  console.log("[Remotion] Bundling...");
  const bundleLocation = await bundle({
    entryPoint: resolve(__dirname, "index.ts"),
    onProgress: (progress: number) => {
      if (Math.round(progress * 100) % 25 === 0) {
        console.log(`[Remotion] Bundle: ${Math.round(progress * 100)}%`);
      }
    },
  });

  // Select composition and calculate metadata
  console.log("[Remotion] Selecting composition...");
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: compositionId,
    inputProps,
  });

  // Render
  console.log(
    `[Remotion] Rendering ${composition.durationInFrames} frames at ${composition.fps}fps (${composition.width}x${composition.height})...`
  );

  await renderMedia({
    serveUrl: bundleLocation,
    codec: "h264",
    composition,
    outputLocation: resolve(output),
    inputProps,
    onProgress: ({ progress }: { progress: number }) => {
      if (Math.round(progress * 100) % 10 === 0) {
        console.log(`[Remotion] Render: ${Math.round(progress * 100)}%`);
      }
    },
  });

  console.log(`[Remotion] Done! Output: ${resolve(output)}`);
}

main().catch((err) => {
  console.error("[Remotion] Render failed:", err.message);
  process.exit(1);
});
