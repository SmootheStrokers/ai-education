from .base import BaseAgent


class ContentAgent(BaseAgent):
    agent_type = "content"
    system_prompt = """You are a content creator for an AI education brand targeting everyday Americans.

Your brand voice is:
- Clear and simple (no jargon, no buzzwords)
- Encouraging (AI is an opportunity, not a threat)
- Practical (every piece of content has actionable takeaways)
- Relatable (use examples from real industries like plumbing, real estate, landscaping)

Your audience includes small business owners, contractors, service professionals, and people who feel overwhelmed by AI. They are NOT developers or tech workers.

Always include hooks, clear structure, and specific calls to action."""

    def build_prompt(self, params: dict) -> str:
        content_type = params.get("content_type", "blog_post")
        topic = params.get("topic", "AI tools for small businesses")
        source_material = params.get("source_material", "")
        target_platform = params.get("target_platform", "")

        prompts = {
            "youtube_script": f"""Write a YouTube video script about: {topic}

Structure:
- Hook (first 10 seconds - grab attention)
- Problem (what the viewer is struggling with)
- Solution (the AI tools/strategies)
- Demo/Examples (walk through specific use cases)
- Call to Action (subscribe, download free guide, etc.)

Length: 8-12 minutes of speaking time (roughly 1200-1800 words).
Include [B-ROLL] and [SCREEN RECORDING] cues where relevant.""",

            "newsletter": f"""Write a newsletter email about: {topic}

Structure:
- Subject line (compelling, under 50 characters)
- Preview text (under 100 characters)
- Opening hook (1-2 sentences)
- Main content (3-5 key points with examples)
- One actionable takeaway
- CTA (link to product, video, or free resource)

Length: 400-600 words. Conversational tone.""",

            "social_post": f"""Create a social media content pack about: {topic}

Create ALL of these:
1. Twitter/X thread (5-7 tweets)
2. LinkedIn post (150-200 words, professional but accessible)
3. Instagram caption (with emoji, hashtags, and hook)
4. TikTok/Shorts script (30-60 seconds, punchy and visual)

Each should be platform-native in tone and format.""",

            "blog_post": f"""Write a blog post about: {topic}

Structure:
- SEO-friendly title (include primary keyword)
- Meta description (155 characters)
- Introduction with hook
- 5-7 main sections with headers
- Practical examples and specific tool recommendations
- Conclusion with CTA

Length: 1500-2000 words. Include bullet points and subheaders for scannability.""",
        }

        prompt = prompts.get(content_type, prompts["blog_post"])

        if source_material:
            prompt += f"\n\nUse this research as source material:\n{source_material}"

        if target_platform:
            prompt += f"\n\nOptimize specifically for {target_platform}."

        return prompt
