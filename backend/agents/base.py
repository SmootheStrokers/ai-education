import os
import anthropic


class BaseAgent:
    """Base class for all AI agents. Uses Claude with web search for real-time data."""

    agent_type: str = "base"
    system_prompt: str = "You are a helpful assistant."
    model: str = "claude-sonnet-4-20250514"
    use_web_search: bool = True

    def __init__(self):
        self.client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    def build_prompt(self, params: dict) -> str:
        raise NotImplementedError

    def _build_full_prompt(self, params: dict) -> str:
        """Build the user prompt, appending source material if present."""
        user_prompt = self.build_prompt(params)
        source_material = params.get("source_material", "")
        if source_material:
            user_prompt += f"\n\n## SOURCE MATERIAL FROM PRIOR RESEARCH\nUse this as context and foundation. Extract key data points, insights, and examples to enhance your output:\n\n{source_material}"
        return user_prompt

    def run(self, params: dict) -> str:
        user_prompt = self._build_full_prompt(params)

        kwargs = dict(
            model=self.model,
            max_tokens=16000,
            system=self.system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )

        if self.use_web_search:
            kwargs["tools"] = [
                {"name": "web_search", "type": "web_search_20250305"}
            ]

        response = self.client.messages.create(**kwargs)

        # Extract all text blocks from the response (web search returns mixed content)
        text_parts = []
        sources_used = 0
        for block in response.content:
            if block.type == "text":
                text_parts.append(block.text)
            elif block.type == "web_search_tool_result":
                sources_used += len(block.content) if hasattr(block, "content") else 0

        result = "\n\n".join(text_parts)

        if sources_used > 0:
            result += f"\n\n---\n*Research compiled from {sources_used} web sources with real-time data.*"

        return result
