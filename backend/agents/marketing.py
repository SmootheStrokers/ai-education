from .base import BaseAgent


class MarketingAgent(BaseAgent):
    agent_type = "marketing"
    system_prompt = """You are a direct response marketing specialist for an AI education company.

Your target audience is everyday Americans who are curious about AI but overwhelmed. They are NOT tech-savvy. They want practical results: save time, save money, grow their business.

Your copy style:
- Conversational and approachable (not salesy or hype-driven)
- Benefit-focused (what will this DO for them?)
- Specific (use numbers, examples, and concrete outcomes)
- Trust-building (acknowledge their concerns about AI)
- Clear CTAs (one action per piece)

You write: lead magnets, landing pages, email sequences, and promotional copy."""

    def build_prompt(self, params: dict) -> str:
        asset_type = params.get("asset_type", "lead_magnet")
        product_name = params.get("product_name", "")
        product_price = params.get("product_price", "")
        target_audience = params.get("target_audience", "small business owners")
        key_benefit = params.get("key_benefit", "save time and money with AI")

        prompts = {
            "lead_magnet": f"""Create a complete lead magnet:

Topic: {key_benefit}
Target Audience: {target_audience}

Create:
1. Lead magnet title (compelling, specific benefit)
2. Subtitle
3. Full content (a useful 5-7 page PDF guide)
4. Landing page headline + subheadline
5. 5 bullet points for the opt-in page
6. Thank you page copy
7. Follow-up email (delivered with the lead magnet)""",

            "landing_page": f"""Write complete landing page copy for:

Product: {product_name}
Price: {product_price}
Target Audience: {target_audience}
Key Benefit: {key_benefit}

Create:
1. Headline (benefit-driven, under 10 words)
2. Subheadline (expand on the promise)
3. Problem section (3-4 pain points)
4. Solution section (how this product solves them)
5. Features/benefits list (6-8 items, benefit-first)
6. Social proof section (testimonial templates)
7. FAQ section (5-7 common objections)
8. CTA section (button text + urgency)
9. Guarantee section""",

            "email_sequence": f"""Write a 5-email sales sequence for:

Product: {product_name}
Price: {product_price}
Target Audience: {target_audience}

Email 1: Welcome + deliver value (Day 0)
Email 2: Story + problem awareness (Day 1)
Email 3: Solution + social proof (Day 3)
Email 4: Objection handling + FAQ (Day 5)
Email 5: Final CTA + urgency (Day 7)

For each email provide:
- Subject line
- Preview text
- Full email body
- CTA button text""",

            "free_report": f"""Write a free report / downloadable PDF:

Topic: {key_benefit}
Target Audience: {target_audience}

Create a complete 8-10 page report including:
1. Title page copy
2. Introduction (why this matters NOW)
3. 5-7 main sections with actionable content
4. Specific tool recommendations with pricing
5. Action plan / next steps
6. CTA for paid product at the end

This should deliver real value while naturally leading to a paid offer.""",
        }

        prompt = prompts.get(asset_type, prompts["lead_magnet"])
        return prompt
