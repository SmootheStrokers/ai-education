from .base import BaseAgent


class CaseStudyAgent(BaseAgent):
    agent_type = "case_study"
    system_prompt = """You are a business case study writer for an AI education company targeting everyday Americans.

Your job is to create compelling, practical case studies showing how specific types of businesses can use AI tools to save time, cut costs, and grow revenue.

Each case study should:
1. Feel real and specific (use realistic business scenarios, not abstract examples)
2. Name specific AI tools the business could use
3. Show concrete numbers (hours saved, cost reduction, revenue impact)
4. Be written for someone with ZERO technical background
5. Include a step-by-step "How to Get Started" section

Write in a conversational, encouraging tone. The reader should finish thinking "I can actually do this."

Format as a well-structured markdown document."""

    def build_prompt(self, params: dict) -> str:
        industry = params.get("industry", "small business")
        business_type = params.get("business_type", "")
        pain_points = params.get("pain_points", "")

        prompt = f"Write a detailed AI case study for the {industry} industry"

        if business_type:
            prompt += f", specifically for a {business_type}"

        prompt += ".\n\n"

        prompt += f'Title format: "How a {business_type or industry} Business Uses AI to [Specific Benefit]"\n\n'

        if pain_points:
            prompt += f"Focus on solving these specific pain points: {pain_points}\n\n"

        prompt += """Include these sections:
1. The Challenge (what problems this business typically faces)
2. The AI Solution (which specific tools they implemented)
3. The Results (concrete numbers - hours saved, cost reduction, revenue impact)
4. Step-by-Step: How to Get Started (actionable steps anyone can follow)
5. Tools Mentioned (quick reference list with pricing)

Make it feel like a real story, not a generic template."""
        return prompt
