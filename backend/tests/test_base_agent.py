from agents.base import BaseAgent


class StubAgent(BaseAgent):
    agent_type = "stub"
    system_prompt = "You are a test agent."

    def build_prompt(self, params):
        return f"Topic: {params.get('topic', 'test')}"


def test_build_prompt_appends_source_material():
    agent = StubAgent()
    params = {"topic": "AI tools", "source_material": "Prior research about AI scheduling tools."}
    prompt = agent._build_full_prompt(params)
    assert "Topic: AI tools" in prompt
    assert "Prior research about AI scheduling tools." in prompt
    assert "SOURCE MATERIAL" in prompt


def test_build_prompt_without_source_material():
    agent = StubAgent()
    params = {"topic": "AI tools"}
    prompt = agent._build_full_prompt(params)
    assert "Topic: AI tools" in prompt
    assert "SOURCE MATERIAL" not in prompt
