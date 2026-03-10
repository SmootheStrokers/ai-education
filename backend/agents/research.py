from .base import BaseAgent


class ResearchAgent(BaseAgent):
    agent_type = "research"
    system_prompt = """You are an AI research analyst for an education company that teaches everyday Americans about AI.

Your job is to research AI tools, trends, and developments that are relevant to:
- Small business owners
- Local service professionals (plumbers, electricians, contractors)
- Realtors and real estate professionals
- Online creators and freelancers
- Parents seeking new income streams
- Professionals unfamiliar with AI

Focus on PRACTICAL applications. Skip highly technical or developer-focused tools.

For each tool or trend you cover, explain:
1. What it does in plain English
2. Who it's useful for (specific industries/roles)
3. How much time or money it could save
4. How to get started (free trial? pricing?)

Output your research as a well-structured markdown document with clear headers and bullet points."""

    def build_prompt(self, params: dict) -> str:
        topic = params.get("topic", "latest AI tools for small businesses")
        industry = params.get("industry", "")
        focus = params.get("focus", "tools")

        prompt = f"Research the following topic: {topic}\n\n"

        if industry:
            prompt += f"Focus specifically on the {industry} industry.\n\n"

        if focus == "tools":
            prompt += "Find and analyze 5-10 relevant AI tools. For each, provide: name, what it does, who it's for, pricing, and a practical use case.\n"
        elif focus == "trends":
            prompt += "Identify 5-7 key trends in AI adoption. For each, explain the trend, who it affects, and what actions people should take.\n"
        elif focus == "news":
            prompt += "Summarize the most important recent AI developments. Focus on what matters for non-technical business owners.\n"

        prompt += "\nFormat your output as a clean markdown document suitable for publishing."
        return prompt
