# Video Agent with Remotion — Design

## Problem
The platform generates text content (markdown → HTML) but has no video output capability. Video is the highest-engagement content format for the target audience (small business owners on YouTube, TikTok, Instagram).

## Solution
Add a Video Agent that generates structured JSON scene descriptions, rendered into real MP4 videos by a Remotion (React-based video framework) project.

## Architecture

### Pipeline
```
VideoAgent.run(params) → JSON scene description
  → video_renderer.render(json, output_path)
    → node video/dist/render.js --input scene.json --output video.mp4
      → Remotion bundle + selectComposition + renderMedia → MP4
```

### Video Types
| Type | Duration | Aspect | Use Case |
|---|---|---|---|
| explainer | 60-90s | 9:16 or 16:9 | YouTube Short / TikTok |
| promo | 30-60s | 16:9 | Product/course promo |
| social_clip | 15-30s | 9:16 | Instagram Reel, TikTok |
| presentation | 2-5min | 16:9 | Research/case study walkthrough |

### Scene Types
- `title` — Animated heading + subtitle + gradient background
- `text_reveal` — Heading + body with typewriter/fade animation
- `stat_card` — Counting number animation + label
- `tool_showcase` — Tool name, description, price, ROI
- `comparison` — Before/After split
- `list_reveal` — Items appearing one by one
- `quote` — Testimonial with decorative marks
- `cta` — Call to action with pulse effect

### File Structure
```
backend/agents/video.py          # VideoAgent (JSON scene output)
backend/video_renderer.py        # subprocess bridge to Node.js
video/                           # Remotion project
  package.json
  tsconfig.json
  src/index.ts                   # Root compositions
  src/render.ts                  # CLI render entry
  src/compositions/{Explainer,Promo,SocialClip,Presentation}.tsx
  src/components/{AnimatedText,SceneTransition,StatCard,BackgroundGradient}.tsx
outputs/video/                   # Rendered MP4s
```

### Database
- Add `video_output_path TEXT` column to agent_runs

### API
- `GET /api/runs/{id}/video` — stream MP4
- `GET /api/runs/{id}/video/download` — download MP4
- Video agent added to agent registry + route config

### Frontend
- Video agent in AgentsPage (topic, video_type, orientation, duration params)
- `<video>` preview in AgentOutputsPage for runs with video_output_path
- Video design prompt added to design_prompts/

### Error Handling
- Node.js render failure → run still completes with markdown, video_output_path = null
- 5-minute render timeout
- Graceful error if Remotion/ffmpeg not installed
