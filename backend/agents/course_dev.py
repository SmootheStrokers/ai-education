from .base import BaseAgent


class CourseDevAgent(BaseAgent):
    agent_type = "course_dev"
    system_prompt = """You are an instructional designer for an AI education company.

You create learning materials for people with ZERO technical background. Your students are small business owners, contractors, realtors, and everyday professionals.

Key principles:
1. Start from absolute zero - assume no prior AI knowledge
2. Use analogies from their industry (not tech analogies)
3. Every lesson must have a hands-on exercise they can complete in under 15 minutes
4. Build confidence progressively - start with easy wins
5. Focus on outcomes (save time, make money, reduce stress) not technology

Product types you create:
- Beginner AI Guides ($39-$79): 5-10 chapter ebooks
- Industry Playbooks ($99-$199): Step-by-step implementation guides for specific industries
- Training Programs ($499-$999): Multi-module courses with exercises and templates"""

    def build_prompt(self, params: dict) -> str:
        product_type = params.get("product_type", "guide")
        topic = params.get("topic", "AI for Small Businesses")
        target_audience = params.get("target_audience", "small business owners")
        depth = params.get("depth", "beginner")

        prompts = {
            "guide": f"""Create a complete outline for a Beginner AI Guide:

Title: "{topic}"
Target Audience: {target_audience}
Level: {depth}

Create:
1. Book title and subtitle
2. Table of contents (5-10 chapters)
3. For each chapter:
   - Chapter title
   - Learning objectives (2-3 per chapter)
   - Key concepts covered
   - Hands-on exercise description
   - Estimated reading time
4. Bonus materials list (templates, checklists, tool lists)""",

            "playbook": f"""Create a complete outline for an Industry AI Playbook:

Title: "AI for {target_audience}"
Level: {depth}

Create:
1. Playbook title and subtitle
2. Industry overview (key pain points AI can solve)
3. Full table of contents (8-15 sections)
4. For each section:
   - Section title
   - Problem it solves
   - Specific AI tools recommended (with pricing)
   - Step-by-step implementation guide outline
   - Expected time savings / ROI
   - Common mistakes to avoid
5. Quick-start checklist
6. Tool comparison chart outline""",

            "course": f"""Create a complete course outline for an AI Training Program:

Title: "{topic}"
Target Audience: {target_audience}
Level: {depth}

Create:
1. Course title and description
2. Prerequisites (should be minimal)
3. Module breakdown (6-10 modules)
4. For each module:
   - Module title
   - 3-5 lesson titles
   - Learning objectives
   - Hands-on project description
   - Assessment/quiz topics
5. Final capstone project description
6. Certificate of completion criteria""",
        }

        prompt = prompts.get(product_type, prompts["guide"])
        return prompt
