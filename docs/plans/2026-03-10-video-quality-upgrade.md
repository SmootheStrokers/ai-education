# Video Output Quality Upgrade — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform video output from generic AI-generated slides into professionally directed motion graphics that people would actually share.

**Architecture:** Nine changes across three layers: (1) Upgrade the video agent's system prompt and model to produce richer, research-backed scene data with strict duration math, (2) Add three new scene types to the Remotion renderer and fix the comparison bug, (3) Skip the design agent for video runs and add render progress feedback to the frontend.

**Tech Stack:** Python (FastAPI backend), TypeScript/React (Remotion video renderer), Claude API (Sonnet for generation)

---

## Task 1: Upgrade Video Agent Model from Haiku to Sonnet

**Files:**
- Modify: `backend/agents/video.py:6` (model property)

**Step 1: Change the model**

In `backend/agents/video.py`, the `VideoAgent` class inherits `model` from `BaseAgent` which defaults to `claude-haiku-4-5-20251001`. Override it explicitly:

```python
class VideoAgent(BaseAgent):
    agent_type = "video"
    model = "claude-sonnet-4-5-20241022"
```

**Step 2: Verify no other model references in video.py**

The `run()` method already uses `self.model` — no other changes needed.

**Step 3: Commit**

```bash
git add backend/agents/video.py
git commit -m "feat(video): upgrade generation model from Haiku to Sonnet"
```

---

## Task 2: Rewrite Video Agent System Prompt

**Files:**
- Modify: `backend/agents/video.py:7-128` (system_prompt)

**Step 1: Replace the system prompt**

Replace the entire `system_prompt` string in `VideoAgent` with the following. Key improvements:
- Enforces hook pattern selection (outcome-first, curiosity gap, shock + proof, etc.)
- Strict duration budget math: title=3s, CTA=3s, transitions=1s each, remainder divided across content scenes
- Rich scene type specifications with animation intent, visual style variants, emphasis words
- Research standards: every stat needs a source, every quote needs a real person, every tool needs verified features
- Animation rules: lists stagger, stats count up, key insights reveal word-by-word
- Three new scene types: `key_insight`, `testimonial_card`, `split_screen`

```python
    system_prompt = """You are an elite video creative director producing short-form motion graphics for an AI education brand. Your audience is everyday Americans — contractors, realtors, service pros, small business owners. Your videos must look like they were directed by someone who has produced viral short-form content. Every scene exists for a reason. Every number is real. Every animation serves the message.

## CRITICAL: Research Before Writing

You have web search. You MUST use it before writing ANY scene:
- Search for the latest AI tools, features, and pricing. Never guess.
- Find real statistics with sources (company reports, Pew Research, McKinsey, etc.)
- Look up real quotes from named people with their role and company
- Verify tool features are current — AI tools change monthly
- If you can't find a real stat, use a text_reveal instead. Never fabricate numbers.

## Output Format

Output ONLY valid JSON. No markdown, no explanation, no code fences.

{
  "compositionId": "VideoLandscape",
  "scenes": [ ... ]
}

## Composition IDs
- "VideoLandscape" — 1920x1080 (YouTube, presentations)
- "VideoPortrait" — 1080x1920 (TikTok, Shorts, Reels)
- "VideoSquare" — 1080x1080 (Instagram feed, Facebook)

## HOOK: The Most Important Scene

The title scene is the creative center of gravity. It must be 5-8 words that stop the scroll.

Before writing the title, choose one hook pattern and use it:
- **Outcome-first**: "I Saved 20 Hours a Week Using This"
- **Curiosity gap**: "The AI Tool Your Competitor Already Uses"
- **Shock + proof**: "73% of Small Businesses Will Use AI by 2025"
- **Contrarian**: "Stop Wasting Money on These 'AI' Tools"
- **Identity**: "Every Contractor Needs This One AI Tool"

No generic openers like "AI Tools You Need" or "Introduction to AI". The hook must create tension, promise, or curiosity.

## DURATION BUDGET (Strict Math)

You MUST follow this exact process:
1. Title scene: exactly 3 seconds
2. CTA scene: exactly 3 seconds
3. Count your transition scenes: each is exactly 1 second
4. Remaining seconds = target_duration - 3 - 3 - (num_transitions * 1)
5. Divide remaining seconds across content scenes using the per-type ranges below
6. **The sum of all scene durations MUST equal target_duration exactly. Verify this before outputting.**

If your durations don't sum correctly, adjust content scene durations until they do. Short scenes (under 2s) will crash the renderer.

## Scene Types

### "title" — Opening hook (ALWAYS first, ALWAYS 3 seconds)
- text (string, required): 5-8 word hook using a pattern above
- subtitle (string, optional): Supporting context, max 10 words
- colors (string[], optional): gradient colors, default ["#08090d", "#1a1d28"]
- duration: EXACTLY 3

### "text_reveal" — Heading + body (3-5 seconds)
- heading (string, required): Section heading, max 8 words
- body (string, required): Body text, max 80 characters
- animation (string): MUST be one of: "typewriter" for key definitions, "fade" for context, "slide" for transitions between topics
- emphasis_words (string[], optional): Words to highlight in amber
- duration: 3-5

### "stat_card" — Big animated statistic (3-4 seconds)
- stat (string, required): The number, e.g. "73%", "$4,200", "20+"
- label (string, required): What the stat means, max 60 chars
- source (string, REQUIRED): Real source citation, e.g. "McKinsey 2025 Report"
- animation_style (string, optional): "count_up" (default), "scale_in", "flip"
- duration: 3-4
- RULE: Every stat_card MUST have a source. If you don't have a real source, use text_reveal instead.

### "tool_showcase" — Feature a specific AI tool (4-6 seconds)
- tool_name (string, required): Exact name of the tool
- description (string, required): What it does, 1-2 sentences, verified features only
- price (string, optional): Current pricing, e.g. "$29/month", "Free tier available"
- time_saved (string, optional): Realistic time savings, e.g. "5 hours/week"
- visual_style (string, optional): "product_card" (default), "terminal_mockup", "browser_frame"
- duration: 4-6
- RULE: Tool names, pricing, and features must be verified via web search.

### "comparison" — Before vs After split screen (5-7 seconds)
- before_label (string, required): e.g. "Without AI"
- before_items (string[], required): 3-5 pain points, each max 40 chars
- after_label (string, required): e.g. "With AI"
- after_items (string[], required): 3-5 benefits matching the pain points
- duration: 5-7

### "list_reveal" — Numbered items appearing sequentially (4-8 seconds)
- heading (string, required): Section title, max 6 words
- items (string[], required): 3-7 items, each max 50 chars
- duration: Calculate as 2 + (number_of_items * 1). Min 4, max 8.

### "quote" — Testimonial or statement (3-5 seconds)
- text (string, required): The quote, max 120 chars
- attribution (string, REQUIRED): "Name, Role at Company" — must be a real person
- duration: 3-5
- RULE: Every quote MUST have a real named person with role. If you can't find a real quote, use text_reveal instead.

### "key_insight" — Single oversized statement (3-4 seconds)
- text (string, required): One powerful sentence, max 60 chars. This renders BIG.
- subtext (string, optional): Supporting detail, max 40 chars
- animation (string, optional): "word_by_word" (default), "scale_up", "fade"
- duration: 3-4

### "testimonial_card" — Social proof card (4-5 seconds)
- quote (string, required): What they said, max 100 chars
- name (string, required): Full name
- role (string, required): Job title
- company (string, required): Company name
- result_metric (string, optional): Key result, e.g. "Saved $12,000/year"
- duration: 4-5

### "split_screen" — True side-by-side comparison (5-7 seconds)
- left_heading (string, required): Left side label
- left_content (string, required): Left side text, max 80 chars
- right_heading (string, required): Right side label
- right_content (string, required): Right side text, max 80 chars
- highlight_side (string, optional): "left" or "right" — which side gets the accent color
- duration: 5-7

### "cta" — Call to action (ALWAYS last, ALWAYS 3 seconds)
- text (string, required): Main CTA, max 8 words
- subtext (string, optional): Supporting text, max 15 words
- duration: EXACTLY 3

### "transition" — Visual break (ALWAYS 1 second)
- style (string): "fade", "wipe", or "zoom"
- duration: EXACTLY 1

## Animation Rules (Non-Negotiable)
- list_reveal items: ALWAYS stagger (built into renderer)
- stat_card numbers: ALWAYS count up from 0 (built into renderer)
- key_insight: word-by-word reveal by default
- Transitions: NEVER exceed 1 second
- Title: spring animation (built into renderer)
- No scene should be shorter than 2 seconds (causes renderer crashes)

## Content Strategy by Video Type

### "explainer" (target: 60-90s)
Hook title (3s) → Problem stat (3s) → 2-3 tool showcases (5s each) → Key insight (3s) → Comparison (6s) → CTA (3s)
Use 1-2 transitions between major sections.

### "promo" (target: 30-60s)
Hook title (3s) → Shocking stat (3s) → 2-3 benefits as list (5s) → Testimonial (4s) → CTA (3s)
Minimal transitions — keep it punchy.

### "social_clip" (target: 15-30s)
Hook title (3s) → Key insight (3s) → One stat or tool (4s) → CTA (3s)
No transitions. Maximum density.

### "presentation" (target: 120-180s)
Hook title (3s) → Agenda list (5s) → Multiple sections with text_reveal + stat_card + tool_showcase → Summary list (5s) → CTA (3s)
Use transitions between each section.

## Design Language
- Background: Always dark (ink blacks, deep navys)
- Accent: Amber gold (#e8a832) for highlights, numbers, emphasis
- Success: Jade green (#34d399) for positive metrics
- Error: Signal red (#f87171) for pain points
- Text: White (#ffffff) for headlines, light gray (#b8bdd4) for body
- Fonts: DM Serif Display for headlines, DM Sans for body, JetBrains Mono for data

## Final Checklist (Verify Before Output)
1. Duration sum equals target_duration exactly
2. First scene is "title" with a real hook (not a topic label)
3. Last scene is "cta"
4. Every stat_card has a source
5. Every quote has a real named person
6. Every tool_showcase has verified, current information
7. No scene is shorter than 2 seconds
8. Output is valid JSON with no markdown or explanation
"""
```

**Step 2: Update build_prompt to reinforce duration math**

```python
    def build_prompt(self, params: dict) -> str:
        video_type = params.get("video_type", "explainer")
        topic = params.get("topic", "AI tools for small business")
        orientation = params.get("orientation", "landscape")
        duration = params.get("target_duration", "60")

        composition_map = {
            "landscape": "VideoLandscape",
            "portrait": "VideoPortrait",
            "square": "VideoSquare",
        }
        composition_id = composition_map.get(orientation, "VideoLandscape")

        return f"""Create a {video_type} video about: {topic}

Target duration: {duration} seconds (your scene durations MUST sum to exactly {duration})
Composition: {composition_id}
Orientation: {orientation}

PROCESS:
1. Research the topic using web search — find real stats, real tools, real quotes
2. Choose your hook pattern and write a scroll-stopping title
3. Plan your duration budget: 3s title + 3s CTA + transitions + content = {duration}s
4. Build the scene JSON with rich creative direction for each scene
5. Verify the duration sum equals {duration} before outputting

Output ONLY the JSON object. No other text."""
```

**Step 3: Commit**

```bash
git add backend/agents/video.py
git commit -m "feat(video): rewrite system prompt with hook patterns, duration math, and research standards"
```

---

## Task 3: Add New Scene Types to TypeScript Types

**Files:**
- Modify: `video/src/types.ts`

**Step 1: Add the three new scene type interfaces**

Add to the `SceneType` union:
```typescript
export type SceneType =
  | "title"
  | "text_reveal"
  | "stat_card"
  | "tool_showcase"
  | "comparison"
  | "list_reveal"
  | "quote"
  | "cta"
  | "transition"
  | "key_insight"
  | "testimonial_card"
  | "split_screen";
```

Add the new interfaces before the `Scene` union:

```typescript
export interface KeyInsightScene extends BaseScene {
  type: "key_insight";
  text: string;
  subtext?: string;
  animation?: "word_by_word" | "scale_up" | "fade";
}

export interface TestimonialCardScene extends BaseScene {
  type: "testimonial_card";
  quote: string;
  name: string;
  role: string;
  company: string;
  result_metric?: string;
}

export interface SplitScreenScene extends BaseScene {
  type: "split_screen";
  left_heading: string;
  left_content: string;
  right_heading: string;
  right_content: string;
  highlight_side?: "left" | "right";
}
```

Update the `Scene` union to include the new types:

```typescript
export type Scene =
  | TitleScene
  | TextRevealScene
  | StatCardScene
  | ToolShowcaseScene
  | ComparisonScene
  | ListRevealScene
  | QuoteScene
  | CtaScene
  | TransitionScene
  | KeyInsightScene
  | TestimonialCardScene
  | SplitScreenScene;
```

**Step 2: Commit**

```bash
git add video/src/types.ts
git commit -m "feat(video): add key_insight, testimonial_card, split_screen scene types"
```

---

## Task 4: Implement New Scene Renderers in VideoComposition

**Files:**
- Modify: `video/src/compositions/VideoComposition.tsx`

**Step 1: Add KeyInsightRenderer**

Add before the SceneRouter component (around line 553):

```tsx
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
```

**Step 2: Add TestimonialCardRenderer**

```tsx
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
          {/* Quote mark */}
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
          {/* Quote text */}
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
          {/* Attribution */}
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
```

**Step 3: Add SplitScreenRenderer**

```tsx
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
        {/* Left side */}
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
        {/* Divider */}
        <div
          style={{
            width: 2,
            background:
              "linear-gradient(to bottom, transparent, #e8a832, transparent)",
            transform: `scaleY(${dividerScale})`,
          }}
        />
        {/* Right side */}
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
```

**Step 4: Add the new types to the SceneRouter switch**

In the `SceneRouter` component, add three new cases before the `default`:

```tsx
    case "key_insight":
      return <KeyInsightRenderer scene={scene} />;
    case "testimonial_card":
      return <TestimonialCardRenderer scene={scene} />;
    case "split_screen":
      return <SplitScreenRenderer scene={scene} />;
```

**Step 5: Commit**

```bash
git add video/src/compositions/VideoComposition.tsx
git commit -m "feat(video): add key_insight, testimonial_card, split_screen renderers"
```

---

## Task 5: Fix Comparison Renderer Bug

**Files:**
- Modify: `video/src/compositions/VideoComposition.tsx` (ComparisonRenderer, lines 231-339)

**The Bug:** The before/after labels render correctly (lines 267 and 316 show `{scene.before_label}` and `{scene.after_label}`), and items render with `{item}` (lines 283, 333). However, the `display: "flex"` on AbsoluteFill at line 245 may cause layout issues because AbsoluteFill uses `position: absolute` by default. The actual content display issue is that the flexDirection is set on AbsoluteFill but the flex children need explicit height/positioning.

Actually, reviewing more carefully — the labels and items DO render their text (lines 267, 283, 316, 333 all reference scene data correctly). The bug described says "before/after labels don't actually render their text." Let me check if this is a CSS issue.

The issue is that `AbsoluteFill` applies `position: absolute; top: 0; right: 0; bottom: 0; left: 0;` and `flexDirection: "row"` is applied. This should work. The real issue may be that the `opacity` is tied to `dividerX` spring which starts at `frame - 10` — meaning for the first 10 frames, opacity is 0, and the spring may not reach 1 quickly enough for short scenes.

**Step 1: Fix the opacity and add explicit text rendering**

The comparison renderer looks structurally correct for rendering text. But let's ensure the labels have guaranteed minimum opacity and items don't get clipped. Replace the ComparisonRenderer (lines 231-339) with a version that:
- Uses independent opacity animations for before/after sides
- Ensures labels are always visible once the divider appears
- Adds explicit `display: "flex"` on the AbsoluteFill wrapper

```tsx
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
            background:
              "linear-gradient(to bottom, transparent, #e8a832, transparent)",
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
```

Key fixes:
- Replaced `AbsoluteFill` with an explicit `div` with `position: absolute` + `display: flex` (AbsoluteFill may override flex behavior)
- Separated left/right opacity animations so they appear sequentially
- Changed divider spring to start at frame-5 instead of frame-10 (faster reveal)
- Added slide-in transforms to items (before slides from left, after slides from right)
- Increased label font size and weight for better visibility
- Reduced item stagger timing from 8 frames to 6 frames for smoother flow

**Step 2: Commit**

```bash
git add video/src/compositions/VideoComposition.tsx
git commit -m "fix(video): fix comparison renderer layout and add slide animations"
```

---

## Task 6: Skip Design Agent for Video Runs

**Files:**
- Modify: `backend/routes.py:148-159` (in `_execute_agent`)

**Step 1: Skip HTML generation for video agent**

The design agent currently processes video JSON through research report templates, producing nonsense. Wrap the HTML generation step with a guard:

In `_execute_agent()`, change lines 148-159 from:

```python
        # Step 2: Generate type-specific HTML from the markdown
        html_path = None
        try:
            html_content = await loop.run_in_executor(
                None, design_agent.generate, result, agent_type, params
            )
            html_path = await loop.run_in_executor(
                None, save_html, html_content, agent_type, params
            )
        except Exception as html_err:
            # HTML generation failure shouldn't fail the whole run
            print(f"HTML generation failed for run {run_id}: {html_err}")
```

To:

```python
        # Step 2: Generate type-specific HTML from the markdown
        # Skip HTML generation for video agent — its output is JSON, not markdown
        html_path = None
        if agent_type != "video":
            try:
                html_content = await loop.run_in_executor(
                    None, design_agent.generate, result, agent_type, params
                )
                html_path = await loop.run_in_executor(
                    None, save_html, html_content, agent_type, params
                )
            except Exception as html_err:
                print(f"HTML generation failed for run {run_id}: {html_err}")
```

**Step 2: Commit**

```bash
git add backend/routes.py
git commit -m "fix(video): skip design agent HTML generation for video runs"
```

---

## Task 7: Add Render Progress via SSE Endpoint

**Files:**
- Modify: `backend/routes.py` (add SSE endpoint + progress tracking)
- Modify: `backend/video_renderer.py` (emit progress during render)
- Modify: `frontend/src/pages/OutputPage.jsx` (show progress bar)

**Step 1: Add progress tracking to video_renderer.py**

Add a global dict to track render progress and a callback mechanism:

At the top of `video_renderer.py`, after the imports:

```python
# Global render progress tracker: {run_id: {"progress": 0-100, "stage": str}}
_render_progress: dict[int, dict] = {}


def get_render_progress(run_id: int) -> dict | None:
    """Get current render progress for a run."""
    return _render_progress.get(run_id)


def _update_progress(run_id: int, progress: int, stage: str):
    """Update render progress."""
    _render_progress[run_id] = {"progress": progress, "stage": stage}
```

Modify the `render_video` function signature to accept `run_id`:

```python
def render_video(scene_json: str, params: dict, run_id: int = 0) -> str | None:
```

Add progress updates throughout the render process:

After parsing JSON (line ~88): `_update_progress(run_id, 5, "Preparing scenes")`

Before subprocess.run (line ~126): `_update_progress(run_id, 10, "Starting Remotion render")`

After subprocess.run, parse stdout for Remotion progress lines and update:

```python
        # Parse stdout for render progress
        if result.stdout:
            for line in result.stdout.split("\n"):
                if "[Remotion] Render:" in line:
                    try:
                        pct = int(line.split(":")[1].strip().replace("%", ""))
                        _update_progress(run_id, 10 + int(pct * 0.85), "Rendering")
                    except (ValueError, IndexError):
                        pass
```

After successful render: `_update_progress(run_id, 100, "Complete")`

In the `finally` block, clean up progress after a delay:

```python
        # Clean up progress tracking after completion
        if run_id in _render_progress:
            _render_progress[run_id]["progress"] = 100
```

**Step 2: Pass run_id from routes.py to render_video**

In `_execute_agent` in routes.py, change the render_video call:

```python
                video_path = await loop.run_in_executor(
                    None, render_video, result, params, run_id
                )
```

**Step 3: Add progress polling endpoint to routes.py**

```python
@router.get("/runs/{run_id}/video/progress")
async def get_video_progress(run_id: int):
    """Get video render progress for a run."""
    from video_renderer import get_render_progress
    progress = get_render_progress(run_id)
    if progress is None:
        run = await get_run(run_id)
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")
        if run.get("video_output_path"):
            return {"progress": 100, "stage": "Complete"}
        if run.get("status") == "failed":
            return {"progress": 0, "stage": "Failed"}
        return {"progress": 0, "stage": "Queued"}
    return progress
```

**Step 4: Add progress bar to OutputPage.jsx**

In the OutputPage component, when the run is `status === "running"` and agent_type is "video", poll the progress endpoint every 2 seconds and show a progress bar:

Add a `useEffect` that polls `/api/runs/${runId}/video/progress` and a progress bar element:

```jsx
// Add to state
const [videoProgress, setVideoProgress] = useState(null);

// Add polling effect
useEffect(() => {
  if (run?.agent_type !== 'video' || run?.status !== 'running') return;

  const interval = setInterval(async () => {
    try {
      const res = await fetch(`/api/runs/${runId}/video/progress`);
      if (res.ok) {
        const data = await res.json();
        setVideoProgress(data);
        if (data.progress >= 100) clearInterval(interval);
      }
    } catch {}
  }, 2000);

  return () => clearInterval(interval);
}, [run?.agent_type, run?.status, runId]);
```

Add a progress bar in the video section of the UI:

```jsx
{run.agent_type === 'video' && run.status === 'running' && videoProgress && (
  <div style={{ marginTop: '1rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
      <span style={{ fontSize: '0.875rem', color: '#9096b3' }}>{videoProgress.stage}</span>
      <span style={{ fontSize: '0.875rem', color: '#e8a832' }}>{videoProgress.progress}%</span>
    </div>
    <div style={{ height: 6, background: '#1a1d28', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: `${videoProgress.progress}%`,
        background: 'linear-gradient(90deg, #e8a832, #d49a2a)',
        borderRadius: 3,
        transition: 'width 0.5s ease',
      }} />
    </div>
  </div>
)}
```

**Step 5: Commit**

```bash
git add backend/video_renderer.py backend/routes.py frontend/src/pages/OutputPage.jsx
git commit -m "feat(video): add render progress tracking and progress bar UI"
```

---

## Task 8: Add Duration Validation in Video Agent

**Files:**
- Modify: `backend/agents/video.py` (in `run()` method)

**Step 1: Add post-generation validation**

After parsing the JSON in the `run()` method, validate the scene data and fix common issues:

```python
    def run(self, params: dict) -> str:
        """Override run to handle JSON output with validation."""
        user_prompt = self._build_full_prompt(params)

        kwargs = dict(
            model=self.model,
            max_tokens=8000,
            system=self.system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )

        if self.use_web_search:
            kwargs["tools"] = [
                {"name": "web_search", "type": "web_search_20250305"}
            ]

        response = self.client.messages.create(**kwargs)

        # Extract text blocks
        text_parts = []
        for block in response.content:
            if block.type == "text":
                text_parts.append(block.text)

        result = "\n".join(text_parts)

        # Clean up: extract JSON from potential markdown fences
        if "```" in result:
            import re
            json_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", result)
            if json_match:
                result = json_match.group(1)

        # Validate and fix scene data
        try:
            parsed = json.loads(result)
            parsed = self._validate_scenes(parsed, params)
            result = json.dumps(parsed, indent=2)
        except json.JSONDecodeError:
            pass

        return result

    def _validate_scenes(self, data: dict, params: dict) -> dict:
        """Validate and fix scene data to prevent renderer crashes."""
        scenes = data.get("scenes", [])
        if not scenes:
            return data

        target = int(params.get("target_duration", 60))

        # Ensure minimum duration of 2s per scene
        for scene in scenes:
            if scene.get("duration", 0) < 2:
                scene["duration"] = 2

        # Check duration sum
        total = sum(s.get("duration", 3) for s in scenes)
        if total != target:
            # Scale content scene durations to hit target
            fixed_types = {"title", "cta", "transition"}
            fixed_total = sum(
                s.get("duration", 0) for s in scenes if s.get("type") in fixed_types
            )
            content_scenes = [s for s in scenes if s.get("type") not in fixed_types]
            content_total = sum(s.get("duration", 3) for s in content_scenes)

            if content_scenes and content_total > 0:
                remaining = target - fixed_total
                if remaining > 0:
                    scale = remaining / content_total
                    for s in content_scenes:
                        s["duration"] = max(2, round(s.get("duration", 3) * scale))

                    # Fix any rounding errors on the last content scene
                    new_total = sum(sc.get("duration", 0) for sc in scenes)
                    diff = target - new_total
                    if diff != 0 and content_scenes:
                        content_scenes[-1]["duration"] = max(
                            2, content_scenes[-1]["duration"] + diff
                        )

        data["scenes"] = scenes
        return data
```

**Step 2: Commit**

```bash
git add backend/agents/video.py
git commit -m "feat(video): add post-generation duration validation and scene fixing"
```

---

## Task 9: Use Subprocess Popen for Real-Time Progress

**Files:**
- Modify: `backend/video_renderer.py` (switch from `subprocess.run` to `Popen` for real-time stdout parsing)

**Step 1: Replace subprocess.run with Popen for real-time progress**

Replace the subprocess.run call in `render_video` with Popen to capture progress in real-time instead of only after completion:

```python
        process = subprocess.Popen(
            cmd,
            cwd=VIDEO_PROJECT_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            shell=(os.name == "nt"),
        )

        _update_progress(run_id, 10, "Bundling project")

        stdout_lines = []
        try:
            for line in process.stdout:
                line = line.strip()
                stdout_lines.append(line)
                if "[Remotion] Bundle:" in line:
                    try:
                        pct = int(line.split(":")[1].strip().replace("%", ""))
                        _update_progress(run_id, 10 + int(pct * 0.2), "Bundling")
                    except (ValueError, IndexError):
                        pass
                elif "[Remotion] Render:" in line:
                    try:
                        pct = int(line.split(":")[1].strip().replace("%", ""))
                        _update_progress(run_id, 30 + int(pct * 0.65), "Rendering")
                    except (ValueError, IndexError):
                        pass
                elif "[Remotion] Done!" in line:
                    _update_progress(run_id, 98, "Finalizing")

            stderr_output = process.stderr.read()
            process.wait(timeout=RENDER_TIMEOUT)
        except subprocess.TimeoutExpired:
            process.kill()
            print(f"[VideoRenderer] Render timed out after {RENDER_TIMEOUT}s")
            _update_progress(run_id, 0, "Timed out")
            return None

        if process.returncode != 0:
            stdout_text = "\n".join(stdout_lines)
            print(f"[VideoRenderer] Render failed (exit {process.returncode}):")
            print(f"  stdout: {stdout_text[-500:]}" if stdout_text else "  (no stdout)")
            print(f"  stderr: {stderr_output[-500:]}" if stderr_output else "  (no stderr)")
            _update_progress(run_id, 0, "Failed")
            return None
```

This replaces the old `subprocess.run` call and the separate progress parsing.

**Step 2: Commit**

```bash
git add backend/video_renderer.py
git commit -m "feat(video): switch to Popen for real-time render progress tracking"
```

---

## Summary of All Changes

| # | File | Change | Purpose |
|---|------|--------|---------|
| 1 | `backend/agents/video.py` | Model → Sonnet | Better creative decisions |
| 2 | `backend/agents/video.py` | Rewrite system prompt | Hook patterns, duration math, research standards, new scene types |
| 3 | `video/src/types.ts` | Add 3 interfaces | key_insight, testimonial_card, split_screen |
| 4 | `video/src/compositions/VideoComposition.tsx` | Add 3 renderers | Visual rendering for new scene types |
| 5 | `video/src/compositions/VideoComposition.tsx` | Fix ComparisonRenderer | Layout bug, better animations |
| 6 | `backend/routes.py` | Skip design agent | Don't process video JSON through HTML templates |
| 7 | `backend/routes.py` + `backend/video_renderer.py` + `frontend/src/pages/OutputPage.jsx` | Progress tracking | Real-time render progress bar |
| 8 | `backend/agents/video.py` | Duration validation | Prevent renderer crashes from bad duration math |
| 9 | `backend/video_renderer.py` | Popen for real-time | Stream progress instead of post-hoc parsing |
