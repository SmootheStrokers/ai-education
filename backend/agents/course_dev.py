from .base import BaseAgent


class CourseDevAgent(BaseAgent):
    agent_type = "course_dev"
    system_prompt = """You are an elite instructional designer who creates learning experiences that genuinely transform people's lives and businesses.

You don't create boring courses. You create JOURNEYS. Every module is a story. Every lesson is a revelation. Every exercise creates a breakthrough moment where the learner thinks "I can't believe I didn't know this before."

## Your Design Philosophy

**1. Story-Driven Learning**
Every concept is introduced through a real-world story. Before you explain WHAT something is, you show WHY it matters through a person's experience. "Before we talk about AI scheduling tools, let me tell you about Rosa. Rosa owns a hair salon in Austin. She was losing $2,800 a month to no-shows..."

**2. The Confidence Ladder**
Start with a win so easy it's almost embarrassing. Lesson 1 should give the learner a result in under 5 minutes. "Copy this exact prompt, paste it into ChatGPT, and watch it write your entire week's social media posts in 30 seconds." Then build complexity gradually. By the end, they're building multi-tool automation workflows — but they never feel overwhelmed because each step felt natural.

**3. Before/After Architecture**
Every lesson follows this pattern:
- "Here's how you're probably doing it now" (the painful old way)
- "Here's what that's costing you" (make the pain specific: hours, dollars, stress)
- "Here's the AI way" (the transformation)
- "Here's exactly how to do it" (step-by-step, screenshot-level detail)
- "Here's what to expect" (realistic results timeline)

**4. The "Holy Crap" Moment**
Every module must contain at least one moment where the learner's jaw drops. A demonstration so powerful, a time savings so dramatic, a result so immediate that they feel compelled to tell someone about it. Design for this moment deliberately.

**5. Industry-Specific Language**
Never use tech jargon. Use language from THEIR industry. For a contractor: "Think of AI like your best apprentice — one who never forgets a step, works 24/7, and doesn't charge overtime." For a realtor: "AI is like having a marketing assistant who creates 50 perfect listing descriptions while you're at an open house."

**6. Results-First Curriculum**
Don't organize by "what AI is" → "how AI works" → "AI tools." Instead organize by outcomes: "Get 10 hours back this week" → "Cut your admin costs by 40%" → "Generate leads while you sleep" → "Build a business that runs without you." Each module name should be a result, not a topic.

## Content Depth Requirements

Every outline you create must be detailed enough that a course creator could build the ENTIRE product from your outline alone. That means:
- Complete lesson descriptions (not just titles)
- Specific exercises with exact prompts and tools to use
- Expected outcomes and success criteria for each lesson
- Talking points and story examples for each concept
- Recommended tool configurations and templates
- Assessment questions that test real-world application, not memorization

Product quality tiers:
- Beginner AI Guides ($39-$79): 5-10 chapters, each 2,000-4,000 words when fully written. Total ~20,000-40,000 words of value.
- Industry Playbooks ($99-$199): 8-15 sections with step-by-step implementation. Total ~30,000-50,000 words of value.
- Training Programs ($499-$999): 6-10 modules, each with 3-5 lessons, exercises, assessments, and community activities. 40+ hours of learning material."""

    def build_prompt(self, params: dict) -> str:
        product_type = params.get("product_type", "guide")
        topic = params.get("topic", "AI for Small Businesses")
        target_audience = params.get("target_audience", "small business owners")
        depth = params.get("depth", "beginner")

        prompts = {
            "guide": f"""Create a comprehensive, premium outline for a Beginner AI Guide that would justify a $49-$79 price tag:

Title: "{topic}"
Target Audience: {target_audience}
Level: {depth}

Create a DETAILED outline including:

1. **Book Title and Subtitle** — The title should promise a specific transformation. Not "AI for Beginners" but "The AI Shortcut: How to Save 20 Hours a Week Starting Today (Even If You Can't Program Your TV Remote)"

2. **The Promise** (one paragraph) — What transformation will the reader experience? Be specific with numbers and outcomes.

3. **Ideal Reader Profile** — Describe the exact person this is for. Age, industry, tech comfort level, current frustrations, secret hopes about AI.

4. **Table of Contents** (8-12 chapters, results-oriented titles)

5. **For EACH Chapter, provide:**
   - Chapter title (should be a result/outcome, not a topic)
   - Opening story concept (a specific character and scenario that illustrates why this chapter matters)
   - 3-4 learning objectives (framed as capabilities: "By the end of this chapter, you'll be able to...")
   - Key concepts covered (explained in plain English)
   - Detailed exercise descriptions — not "try using ChatGPT" but "Open ChatGPT, paste this exact prompt: [provide prompt], then modify it for your business by changing X to Y"
   - "Holy Crap" moment — the one thing in this chapter that will blow the reader's mind
   - Common mistakes section — what most beginners get wrong and how to avoid it
   - Results checkpoint — "After completing this chapter, you should be able to [specific measurable outcome]"
   - Estimated reading + exercise time

6. **Bonus Materials** — Templates, checklists, prompt libraries, tool comparison charts, ROI calculators. Describe each one in detail.

7. **The Transformation Summary** — "Before this guide, you were [struggling with X]. After this guide, you can [specific capabilities]. Expected impact: [hours saved, dollars saved, new capabilities]."

This outline should be 2,500-4,000 words. Someone should be able to read this outline and feel like they've already gotten $20 worth of value.""",

            "playbook": f"""Create a comprehensive, premium outline for an Industry AI Playbook worth $149-$199:

Title: "The Complete AI Playbook for {target_audience}"
Level: {depth}

This is a STEP-BY-STEP implementation guide. The reader should be able to follow it like a recipe book and have a fully AI-enhanced business within 30 days.

Create a DETAILED outline including:

1. **Title and Power Subtitle** — e.g., "The AI Playbook for Contractors: How to Bid More Jobs, Win More Clients, and Work Fewer Hours Using Tools That Cost Less Than Your Morning Coffee"

2. **The Industry Snapshot** (detailed outline)
   - Current state of AI adoption in this industry (specific percentages and trends)
   - The 5 biggest time/money drains this industry faces
   - The AI opportunity: what's possible now that wasn't 12 months ago
   - Real success stories from the industry (outline 3 mini-case studies)
   - The competitive landscape: what early adopters are doing

3. **The 30-Day Implementation Roadmap** (overview)
   - Week 1: Foundation tools (the essentials)
   - Week 2: Automation layer (connecting tools)
   - Week 3: Growth tools (revenue generation)
   - Week 4: Optimization (fine-tuning and scaling)

4. **Full Table of Contents** (10-15 sections)

5. **For EACH Section, provide:**
   - Section title (action-oriented)
   - The Problem (vivid description of the pain point in this industry)
   - The Story (outline of a character who solved this problem with AI)
   - Recommended tools (2-3 options per problem, with exact pricing)
   - Step-by-step implementation guide outline (10-20 steps per tool)
   - Expected ROI calculation (time saved × value per hour + revenue generated)
   - Common pitfalls and how to avoid them
   - "Quick Win" — one thing they can do in 15 minutes for immediate results
   - Advanced moves — for readers who want to go deeper

6. **Tool Stack Summary** — Complete recommended technology stack with:
   - Tool name, what it replaces, monthly cost, time saved, ROI
   - "Good/Better/Best" budget tiers
   - Total monthly investment vs. total monthly value created

7. **Templates and Resources** (describe 10-15 specific templates)

8. **The 90-Day Checkup** — What results they should expect at 30/60/90 days

This outline should be 3,000-5,000 words. It should demonstrate such deep industry knowledge that the reader thinks "this person really understands MY business."\n""",

            "course": f"""Create a comprehensive, premium outline for an AI Training Program worth $499-$999:

Title: "{topic}"
Target Audience: {target_audience}
Level: {depth}

This is a PREMIUM training program. It should feel like hiring a $200/hour consultant to personally guide you through AI implementation. The production value in the outline should be immediately apparent.

Create a DETAILED outline including:

1. **Course Title and Tagline** — Promise a specific, measurable transformation.

2. **Course Overview** (500+ words)
   - The transformation promise
   - Who this is for (specific audience profile with pain points)
   - Who this is NOT for (builds trust)
   - What makes this different from free YouTube tutorials
   - Expected outcomes with specific metrics
   - Time commitment and what to expect

3. **Prerequisites** — Keep minimal but be specific about what they need (computer, internet, these free accounts...)

4. **Module Breakdown** (8-12 modules)

5. **For EACH Module, provide:**
   - Module title (results-oriented)
   - Module overview (the story/transformation arc of this module)
   - 4-6 detailed lesson outlines, each including:
     * Lesson title
     * Opening story/scenario concept
     * Core concepts (explained in plain English)
     * Live demonstration outline (what you'd show on screen)
     * Hands-on exercise with SPECIFIC prompts, tools, and expected outcomes
     * Common questions/issues and solutions
     * "Checkpoint" — how to verify you did it right
   - Module project (a real-world application that builds on all lessons)
   - Module assessment (practical test, not multiple choice trivia)
   - "By the end of this module..." statement with specific capabilities

6. **Capstone Project** — A comprehensive final project where they build a complete AI system for their business. Describe in detail what they'll create and the expected impact.

7. **Bonus Modules** — 2-3 advanced bonus modules for overachievers.

8. **Community Elements** — Weekly Q&A calls, peer review assignments, accountability partners, success story sharing.

9. **Certificate and Outcomes** — What the certificate means, what they can do now, expected ROI within 90 days of completion.

10. **Course Roadmap Visual** — Describe the journey from "overwhelmed by AI" to "AI-powered business owner" as a visual progression.

This outline should be 4,000-6,000 words. A potential student reading this outline should feel that the course is EASILY worth 10x the price.""",
        }

        prompt = prompts.get(product_type, prompts["guide"])
        prompt += "\n\nThis outline is for a PREMIUM paid product. The depth and quality of this outline should itself demonstrate the value of the final product. Write at least 3,000 words."
        return prompt
