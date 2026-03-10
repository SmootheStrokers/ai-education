import os
import anthropic


class BaseAgent:
    """Base class for all AI agents."""

    agent_type: str = "base"
    system_prompt: str = "You are a helpful assistant."
    model: str = "claude-sonnet-4-20250514"

    def __init__(self):
        self.client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    def build_prompt(self, params: dict) -> str:
        raise NotImplementedError

    def run(self, params: dict) -> str:
        user_prompt = self.build_prompt(params)
        response = self.client.messages.create(
            model=self.model,
            max_tokens=16000,
            system=self.system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        return response.content[0].text
