from .base import BaseAgent


class MarketingAgent(BaseAgent):
    agent_type = "marketing"
    system_prompt = """You are a world-class direct response copywriter who specializes in education products for mainstream audiences.

## CRITICAL: Research-Backed Copy

You have web search. USE IT to fill your copy with irrefutable proof:
- Search for real statistics on AI adoption, ROI, and time savings to use as proof points
- Look up current AI tool pricing so your value comparisons are accurate
- Find real testimonials, reviews, and success stories from business owners using AI (G2, Capterra, Reddit, news articles)
- Research competitor products and their pricing to position your offer effectively
- Look up the target audience's real pain points from industry forums, surveys, and reports
- Find compelling data visualizations and statistics from McKinsey, Deloitte, Gartner, etc. to cite
- Search for the latest AI news to create timely urgency hooks
- Verify every claim — if you say "businesses save $500-$2,000/month," find the actual study that supports this

Your copy is built on a foundation of REAL DATA. Every statistic cited, every ROI claimed, every success story referenced must be traceable to an actual source. This is what separates premium marketing from amateur hype.

You write copy that CONVERTS — not through hype and manipulation, but through genuine empathy, specific proof, and irresistible value framing.

## Your Copywriting Philosophy

**1. Lead with the Person, Not the Product**
Never start with what you're selling. Start with WHO you're selling to and the PAIN they're experiencing right now. "You're working 65 hours a week. Your inbox has 47 unanswered messages. You missed your kid's soccer game last Tuesday. And somewhere in the back of your mind, you keep hearing that AI is going to change everything — but you have no idea where to start."

**2. Proof Beats Promises**
Every claim is backed by a specific story, number, or example. Don't say "save time." Say "Jennifer, a landscaper in Colorado, saved 22 hours in her first month. She used those hours to take on 3 new clients worth $4,800 in revenue." Stack proof until skepticism crumbles.

**3. Objection Judo**
Don't avoid objections — USE them. "You're probably thinking 'I'm not technical enough for AI.' Good news: the most successful student in our last cohort was a 62-year-old HVAC technician who still uses a flip phone. He set up his first AI tool in 11 minutes."

**4. Specific Numbers Create Belief**
"Save time" = vague, ignorable. "Save 4 hours and 23 minutes every single week" = specific, believable, compelling. Always use specific numbers, even if slightly unusual (they feel more real than round numbers).

**5. The Value Stack**
Show the total value of everything included. Then show the price. The gap should be so dramatic that NOT buying feels like leaving money on the table.

**6. Ethical Urgency**
Create urgency through truth, not tricks. "AI is evolving faster than any technology in history. The businesses that adopt it this quarter will have a 6-month head start on their competition. That gap doesn't close — it widens." Not "Only 3 spots left!" unless that's actually true.

**7. Write Like You Talk**
Short sentences. Punchy paragraphs. Questions that make the reader pause and think. Fragments for emphasis. Like this one. Your copy should feel like a conversation, not a brochure.

## Audience Understanding

Your readers are:
- Working 50-70 hours per week with thin margins
- Skeptical of technology (they've been promised "game changers" before)
- Proud of their expertise but secretly worried about being left behind
- More motivated by "not falling behind" than by "getting ahead"
- Decision-makers who need to justify every dollar spent
- People who Google "is AI worth it for small business" at 11 PM

Your copy must honor their intelligence while making AI feel accessible and non-threatening."""

    def build_prompt(self, params: dict) -> str:
        asset_type = params.get("asset_type", "lead_magnet")
        product_name = params.get("product_name", "")
        product_price = params.get("product_price", "")
        target_audience = params.get("target_audience", "small business owners")
        key_benefit = params.get("key_benefit", "save time and money with AI")

        prompts = {
            "lead_magnet": f"""Create a complete, premium lead magnet package:

Topic: {key_benefit}
Target Audience: {target_audience}

## 1. LEAD MAGNET CONTENT (the actual PDF guide)

Title: Create a title so specific and benefit-driven that people would feel stupid NOT downloading it. Not "AI Guide" but "The 15-Minute AI Setup That Saves Small Businesses 20+ Hours Per Month"

Create the FULL CONTENT for a 7-10 page PDF guide including:

**Page 1: Title page** with compelling subtitle and credibility statement

**Page 2: The Hook** — Open with a vivid story. A specific person in the target industry who transformed their business. Set up the problem and the promise.

**Pages 3-7: The Core Content** (5 main sections)
Each section should:
- Open with a specific before/after scenario
- Explain one key strategy or tool in plain English
- Provide step-by-step instructions anyone can follow
- Include specific numbers (time saved, money saved, results achieved)
- End with an "action item" the reader can complete in under 10 minutes

**Page 8: The Quick-Start Checklist** — A scannable, printable action plan

**Page 9: The Bridge** — Naturally lead to your paid product. Not a hard sell — a genuine "if you found this valuable, here's how to go deeper" transition.

**Page 10: About + Next Steps** — Brief credibility bio and clear CTA

## 2. LANDING PAGE COPY

Write complete opt-in page copy:
- Headline (specific benefit + timeframe)
- Subheadline (overcome the main objection)
- 5-7 bullet points (each with a specific benefit + proof point)
- Social proof section (testimonial frameworks with specific details)
- The CTA button (A/B test 3 options)
- Below-fold FAQ (3-4 common hesitations, addressed honestly)

## 3. THANK YOU PAGE COPY
- Confirmation + excitement building
- What to expect in their inbox
- Bonus: one immediate tip they can use RIGHT NOW (gives instant value)
- Soft introduction to paid offer

## 4. WELCOME EMAIL SEQUENCE (3 emails)

**Email 1 (Immediate):** Deliver the lead magnet + give one bonus insight not in the guide. Set expectations for what's coming.

**Email 2 (Day 2):** A deeper story expanding on the guide's content. One powerful insight that demonstrates your expertise. Build relationship.

**Email 3 (Day 4):** Bridge to paid offer. More value + natural transition to "if you want the complete system, here's what we built..."

For each email: subject line, preview text, full body, CTA.

Write everything. Full copy. Production-ready. 3,000-5,000 total words.""",

            "landing_page": f"""Write a complete, conversion-optimized landing page for:

Product: {product_name}
Price: {product_price}
Target Audience: {target_audience}
Key Benefit: {key_benefit}

Create a FULL landing page with every section written in complete, production-ready copy:

**SECTION 1: THE HERO**
- Headline: Specific benefit + outcome. Under 12 words. (Write 3 options)
- Subheadline: Address the main objection or expand the promise (Write 3 options)
- Hero supporting text: 2-3 sentences that make the reader think "this is for me"
- Primary CTA button text (3 options)
- Social proof snippet: "Join 500+ {target_audience} who've already..."

**SECTION 2: THE PROBLEM (500-600 words)**
Paint the pain with visceral specificity. Describe a day in the life of your target customer. The early mornings, the repetitive tasks, the money left on the table, the family time sacrificed. Use second person ("you") to make it personal. Build the tension until the reader is nodding and thinking "how do they know my life?"

**SECTION 3: THE AGITATION (300-400 words)**
Twist the knife (empathetically). Show what happens if they DON'T act. Their competitor adopts AI. Their margins keep shrinking. The overwhelm gets worse. Use specific scenarios and numbers.

**SECTION 4: THE SOLUTION (400-500 words)**
Introduce the product as the bridge from their current pain to their desired outcome. Tell the origin story — why this product was created, who it's helped, what makes it different.

**SECTION 5: WHAT'S INSIDE (the value stack)**
List every component with:
- Feature name
- What it does for them (benefit-first language)
- Standalone value ("worth $X on its own")
Detail each item in 50-100 words. Make the total value dramatically exceed the price.

**SECTION 6: THE TRANSFORMATION**
Before/After comparison. Two columns. Be vivid and specific about life BEFORE vs. AFTER.

**SECTION 7: SOCIAL PROOF (create 5 detailed testimonial frameworks)**
Write realistic testimonial templates with:
- Full name and business type
- Specific situation before the product
- Specific results after (numbers!)
- An emotional quote about how they feel now

**SECTION 8: THE OFFER**
- Price presentation with value anchoring
- What they get (summary stack)
- Bonuses with deadlines
- Guarantee (specific, bold, risk-reversing)
- CTA with urgency

**SECTION 9: FAQ (7-10 questions)**
Real objections, addressed honestly and completely. Not "Is this for me? Yes!" but genuine concerns with thoughtful 100-150 word responses.

**SECTION 10: FINAL CTA**
Emotional closing. Circle back to the transformation. One last powerful story or statement. Final button.

Write EVERYTHING. Full production-ready copy. 4,000-6,000 total words.""",

            "email_sequence": f"""Write a complete 7-email sales sequence for:

Product: {product_name}
Price: {product_price}
Target Audience: {target_audience}

Each email should be a complete, standalone piece of valuable content that also moves the reader closer to purchase. Nobody should feel "sold to" — they should feel HELPED.

**EMAIL 1: THE WELCOME (Day 0)**
Purpose: Deliver massive unexpected value. Set the tone.
- Subject line (3 options) + preview text
- Open with a story that establishes your credibility AND empathy
- Deliver one powerful insight or strategy they can use immediately
- Set expectations for what's coming
- NO selling. Pure value. Build trust.
- 500-700 words

**EMAIL 2: THE STORY (Day 1)**
Purpose: Emotional connection through a transformation story.
- Subject line (3 options) + preview text
- Tell a detailed story of someone in their industry who transformed their business with AI
- Be specific: names, numbers, timeline, emotions
- End with "the question is: what would YOUR version of this story look like?"
- Subtle mention of your product as what made it possible
- 600-800 words

**EMAIL 3: THE TEACHING (Day 3)**
Purpose: Demonstrate expertise by giving away your best stuff.
- Subject line (3 options) + preview text
- Teach a specific, actionable strategy with step-by-step instructions
- Make it so good they think "if the free stuff is THIS good, the paid product must be incredible"
- Include before/after results from people who used this strategy
- Soft CTA: "want the complete system? [link]"
- 700-900 words

**EMAIL 4: THE PROOF (Day 5)**
Purpose: Overwhelm objections with evidence.
- Subject line (3 options) + preview text
- Stack 3-4 mini case studies showing diverse results
- Address the top 3 objections directly and honestly
- Use the "but don't take my word for it" framework
- Stronger CTA with specific offer details
- 600-800 words

**EMAIL 5: THE VISION (Day 7)**
Purpose: Paint the picture of their future.
- Subject line (3 options) + preview text
- Describe their life 90 days from now if they take action today
- Be vivid and specific: their morning routine, their revenue, their stress level
- Contrast with where they'll be in 90 days if they do nothing
- Clear CTA with full offer details
- 500-700 words

**EMAIL 6: THE OBJECTION CRUSHER (Day 9)**
Purpose: Remove the last barriers.
- Subject line (3 options) + preview text
- FAQ-style addressing every remaining objection
- The guarantee story (why you offer it, what it means)
- "The real cost of waiting" section
- Urgency without manipulation
- 500-700 words

**EMAIL 7: THE CLOSE (Day 10)**
Purpose: Final call to action.
- Subject line (3 options) + preview text
- Brief, powerful, emotional
- Circle back to Email 1's story
- The "decision point" framing: you can go back to the old way, or...
- Final CTA with everything they need to know
- P.S. with one last compelling proof point
- 400-500 words

Total: 4,000-6,000 words of production-ready email copy.""",

            "free_report": f"""Write a complete, premium free report:

Topic: {key_benefit}
Target Audience: {target_audience}

This is a 12-15 page report that delivers SO much value that readers feel guilty it was free. It should position you as the definitive authority and make the paid products an obvious next step.

**PAGE 1: TITLE PAGE**
- Compelling title with specific benefit and number
- Powerful subtitle
- Author/brand credibility line
- "What You'll Learn" bullet list (5-7 items)

**PAGE 2: THE WAKE-UP CALL (500-600 words)**
Open with a vivid story that illustrates why this topic matters RIGHT NOW. Use specific data points about the industry shift. Create urgency without fear-mongering. End with: "This report will show you exactly what to do about it."

**PAGES 3-4: THE LANDSCAPE (600-800 words)**
- Current state of AI in this industry (specific adoption statistics)
- What early adopters are doing differently (3-4 specific examples)
- The cost of waiting: specific dollar amounts being lost per month by non-adopters
- A timeline showing how fast things are moving

**PAGES 5-10: THE FIVE STRATEGIES (800-1,000 words EACH)**
Five major strategies or tool categories. For each:
- Open with a before/after story
- Explain the strategy in plain English
- Recommend 2-3 specific tools with pricing
- Provide a step-by-step quickstart (10-15 steps with enough detail to actually follow)
- Expected results with specific numbers and timeline
- A "real talk" section about limitations and common mistakes
- An "advanced move" for readers who want to go further

**PAGE 11: THE COMPLETE ACTION PLAN (500-600 words)**
- Week-by-week implementation plan
- Priority order (what to do first)
- Expected investment (time and money)
- Expected ROI at 30, 60, 90 days
- Printable checklist format

**PAGE 12: THE BRIDGE (300-400 words)**
Natural transition to paid products:
- "This report covers the fundamentals. For the complete system..."
- Describe the paid product with specific additional value
- Social proof from customers
- Special offer for report readers
- Clear, specific CTA

**PAGE 13: RESOURCES**
- Every tool mentioned with links and pricing
- Additional recommended reading
- Community/support information

Total: 6,000-10,000 words of genuine, actionable value.""",
        }

        prompt = prompts.get(asset_type, prompts["lead_magnet"])
        prompt += "\n\nWrite COMPLETE, PRODUCTION-READY copy. Not outlines or summaries — the actual words that go on the page. Every piece should be so good that a marketing director would be comfortable running it tomorrow without changes."
        return prompt
