import json
import os
from .base import BaseAgent


class VideoAgent(BaseAgent):
    agent_type = "video"
    model = os.environ.get("VIDEO_AGENT_MODEL", BaseAgent.model)
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
- Outcome-first: "I Saved 20 Hours a Week Using This"
- Curiosity gap: "The AI Tool Your Competitor Already Uses"
- Shock + proof: "73% of Small Businesses Will Use AI by 2025"
- Contrarian: "Stop Wasting Money on These 'AI' Tools"
- Identity: "Every Contractor Needs This One AI Tool"

No generic openers like "AI Tools You Need" or "Introduction to AI". The hook must create tension, promise, or curiosity.

## DURATION BUDGET (Strict Math)

You MUST follow this exact process:
1. Title scene: exactly 3 seconds
2. CTA scene: exactly 3 seconds
3. Count your transition scenes: each is exactly 1 second
4. Remaining seconds = target_duration - 3 - 3 - (num_transitions * 1)
5. Divide remaining seconds across content scenes using the per-type ranges below
6. The sum of all scene durations MUST equal target_duration exactly. Verify this before outputting.

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

    def run(self, params: dict) -> str:
        """Override run to handle JSON output with validation."""
        user_prompt = self._build_full_prompt(params)
        preferred_model = self.model or BaseAgent.model

        kwargs = dict(
            model=preferred_model,
            max_tokens=8000,
            system=self.system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )

        if self.use_web_search:
            kwargs["tools"] = [
                {"name": "web_search", "type": "web_search_20250305"}
            ]

        try:
            response = self.client.messages.create(**kwargs)
        except Exception as exc:
            if (
                preferred_model != BaseAgent.model
                and self._is_missing_model_error(exc)
            ):
                kwargs["model"] = BaseAgent.model
                response = self.client.messages.create(**kwargs)
            else:
                raise

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

        # Validate and normalize scene data before handing it to Remotion.
        try:
            parsed = json.loads(result)
            parsed = self._validate_scenes(parsed, params)
            result = json.dumps(parsed, indent=2)
        except json.JSONDecodeError:
            pass

        return result

    def _validate_scenes(self, data: dict, params: dict) -> dict:
        """Validate and fix scene data to prevent renderer crashes."""
        if not isinstance(data, dict):
            return data

        scenes = data.get("scenes")
        if not isinstance(scenes, list) or not scenes:
            return data

        target = int(params.get("target_duration", 60))
        composition_map = {
            "landscape": "VideoLandscape",
            "portrait": "VideoPortrait",
            "square": "VideoSquare",
        }
        data["compositionId"] = composition_map.get(
            params.get("orientation", "landscape"),
            data.get("compositionId", "VideoLandscape"),
        )

        fixed_types = {"title", "cta", "transition"}

        for i, scene in enumerate(scenes):
            if not isinstance(scene, dict):
                continue

            scene_type = scene.get("type")
            duration = scene.get("duration", 3)

            try:
                duration = int(round(float(duration)))
            except (TypeError, ValueError):
                duration = 3

            if scene_type == "title":
                duration = 3
            elif scene_type == "cta":
                duration = 3
            elif scene_type == "transition":
                duration = 1
            else:
                duration = max(2, duration)

            scene["duration"] = duration

            # Keep list scenes within a sane duration budget based on item count.
            if scene_type == "list_reveal":
                items = scene.get("items")
                if isinstance(items, list) and items:
                    recommended = max(4, min(8, 2 + len(items)))
                    scene["duration"] = max(2, recommended)

            if i == 0 and scene_type != "title":
                scene["type"] = "title"
                scene["duration"] = 3
                scene.setdefault("text", scene.get("heading") or params.get("topic", "AI video"))

        if scenes and scenes[-1].get("type") != "cta":
            scenes.append(
                {
                    "type": "cta",
                    "duration": 3,
                    "text": "See The Full Breakdown",
                    "subtext": "Use these tools in your business this week",
                }
            )

        total = sum(
            scene.get("duration", 3)
            for scene in scenes
            if isinstance(scene, dict)
        )

        if total != target:
            fixed_total = sum(
                scene.get("duration", 0)
                for scene in scenes
                if isinstance(scene, dict) and scene.get("type") in fixed_types
            )
            content_scenes = [
                scene
                for scene in scenes
                if isinstance(scene, dict) and scene.get("type") not in fixed_types
            ]
            content_total = sum(scene.get("duration", 3) for scene in content_scenes)

            if content_scenes and content_total > 0:
                remaining = max(target - fixed_total, len(content_scenes) * 2)
                scale = remaining / content_total

                for scene in content_scenes:
                    scene["duration"] = max(2, round(scene.get("duration", 3) * scale))

                new_total = sum(scene.get("duration", 0) for scene in scenes if isinstance(scene, dict))
                diff = target - new_total
                if diff != 0:
                    adjustable = content_scenes[-1]
                    adjustable["duration"] = max(2, adjustable.get("duration", 3) + diff)

        data["scenes"] = scenes
        return data

    @staticmethod
    def _is_missing_model_error(exc: Exception) -> bool:
        """Detect Anthropic model-not-found errors without binding to SDK internals."""
        message = str(exc).lower()
        return "not_found_error" in message or "model:" in message
