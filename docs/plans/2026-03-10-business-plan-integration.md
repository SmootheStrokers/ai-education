# Business Plan Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate the "AI for Everyday Americans" business plan into the existing agent infrastructure by adding industry presets, content pipeline chaining, and content tagging/library features.

**Architecture:** Add a presets module with pre-configured agent params for target industries (contractors, realtors, service pros). Add pipeline tables to SQLite so agents can chain outputs. Add tags to organize the growing content library. Enhance the React dashboard with new Pipelines and Library pages.

**Tech Stack:** Python 3.13, FastAPI, anthropic SDK, aiosqlite, React 19, Vite, TailwindCSS v4

---

### Task 1: Backend Test Infrastructure

**Files:**
- Modify: `backend/requirements.txt`
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_health.py`

**Step 1: Add test dependencies to requirements.txt**

Add these lines to `backend/requirements.txt`:
```
pytest==8.3.0
pytest-asyncio==0.24.0
httpx==0.28.0
```

**Step 2: Install dependencies**

```bash
cd /c/Ai-Education/backend
source .venv/Scripts/activate
pip install -r requirements.txt
```

**Step 3: Create test directory and conftest**

Create `backend/tests/__init__.py` (empty file).

Create `backend/tests/conftest.py`:
```python
import pytest
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
```

**Step 4: Write health check test**

Create `backend/tests/test_health.py`:
```python
import pytest


@pytest.mark.anyio
async def test_health(client):
    resp = await client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
```

**Step 5: Run test to verify it passes**

```bash
cd /c/Ai-Education/backend
source .venv/Scripts/activate
python -m pytest tests/test_health.py -v
```
Expected: PASS

**Step 6: Commit**

```bash
git add backend/requirements.txt backend/tests/
git commit -m "feat: add pytest test infrastructure with health check test"
```

---

### Task 2: BaseAgent Source Material Support

**Files:**
- Modify: `backend/agents/base.py`
- Create: `backend/tests/test_base_agent.py`

**Step 1: Write failing test**

Create `backend/tests/test_base_agent.py`:
```python
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
```

**Step 2: Run test to verify it fails**

```bash
cd /c/Ai-Education/backend
python -m pytest tests/test_base_agent.py -v
```
Expected: FAIL — `_build_full_prompt` does not exist yet.

**Step 3: Implement _build_full_prompt in BaseAgent**

Modify `backend/agents/base.py` — add the method and update `run()` to use it:

```python
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
```

**Step 4: Run test to verify it passes**

```bash
cd /c/Ai-Education/backend
python -m pytest tests/test_base_agent.py -v
```
Expected: PASS

**Step 5: Commit**

```bash
git add backend/agents/base.py backend/tests/test_base_agent.py
git commit -m "feat: add source material chaining support to BaseAgent"
```

---

### Task 3: Industry Presets — Backend

**Files:**
- Create: `backend/presets.py`
- Modify: `backend/routes.py`
- Create: `backend/tests/test_presets.py`

**Step 1: Write failing test**

Create `backend/tests/test_presets.py`:
```python
import pytest


@pytest.mark.anyio
async def test_get_presets(client):
    resp = await client.get("/api/presets")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 3
    # Each preset has required fields
    for preset in data:
        assert "id" in preset
        assert "label" in preset
        assert "description" in preset
        assert "quick_runs" in preset
        assert isinstance(preset["quick_runs"], list)
        assert len(preset["quick_runs"]) >= 3
        for run in preset["quick_runs"]:
            assert "label" in run
            assert "agent_type" in run
            assert "params" in run


@pytest.mark.anyio
async def test_get_preset_by_id(client):
    resp = await client.get("/api/presets/contractor")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == "contractor"


@pytest.mark.anyio
async def test_get_preset_not_found(client):
    resp = await client.get("/api/presets/nonexistent")
    assert resp.status_code == 404
```

**Step 2: Run test to verify it fails**

```bash
cd /c/Ai-Education/backend
python -m pytest tests/test_presets.py -v
```
Expected: FAIL — endpoints don't exist.

**Step 3: Create presets.py**

Create `backend/presets.py`:
```python
INDUSTRY_PRESETS = [
    {
        "id": "contractor",
        "label": "Contractors & Trades",
        "description": "Plumbers, electricians, HVAC techs, general contractors, and tradespeople",
        "quick_runs": [
            {
                "label": "AI Tools for Contractors",
                "agent_type": "research",
                "params": {
                    "topic": "AI tools for contractors and tradespeople in 2026",
                    "industry": "construction and trades",
                    "focus": "tools",
                },
            },
            {
                "label": "Contractor AI Trends",
                "agent_type": "research",
                "params": {
                    "topic": "AI adoption trends in the construction and trades industry",
                    "industry": "construction and trades",
                    "focus": "trends",
                },
            },
            {
                "label": "Contractor Case Study",
                "agent_type": "case_study",
                "params": {
                    "industry": "construction",
                    "business_type": "general contractor",
                    "pain_points": "estimating and bidding, scheduling crews, client communication, invoicing and payments",
                },
            },
            {
                "label": "Contractor Newsletter",
                "agent_type": "content",
                "params": {
                    "content_type": "newsletter",
                    "topic": "How Contractors Are Using AI to Win More Bids and Save 20+ Hours Per Week",
                },
            },
            {
                "label": "Contractor YouTube Script",
                "agent_type": "content",
                "params": {
                    "content_type": "youtube_script",
                    "topic": "5 AI Tools Every Contractor Needs in 2026 (That Cost Less Than Your Morning Coffee)",
                },
            },
            {
                "label": "Contractor AI Playbook",
                "agent_type": "course_dev",
                "params": {
                    "product_type": "playbook",
                    "topic": "The Contractor's AI Playbook",
                    "target_audience": "contractors and tradespeople",
                    "depth": "beginner",
                },
            },
            {
                "label": "Contractor Lead Magnet",
                "agent_type": "marketing",
                "params": {
                    "asset_type": "lead_magnet",
                    "target_audience": "contractors and tradespeople",
                    "key_benefit": "save 20 hours per week on estimating, scheduling, and client communication with AI",
                },
            },
        ],
        "pipeline_template": {
            "name": "Contractor Content Package",
            "description": "Research → Case Study → Newsletter → Social Posts",
            "steps": [
                {
                    "agent_type": "research",
                    "params": {
                        "topic": "AI tools for contractors and tradespeople in 2026",
                        "industry": "construction and trades",
                        "focus": "tools",
                    },
                },
                {
                    "agent_type": "case_study",
                    "params": {
                        "industry": "construction",
                        "business_type": "general contractor",
                        "pain_points": "estimating, scheduling, client communication",
                    },
                },
                {
                    "agent_type": "content",
                    "params": {
                        "content_type": "newsletter",
                        "topic": "How Contractors Are Using AI to Win More Bids",
                    },
                },
                {
                    "agent_type": "content",
                    "params": {
                        "content_type": "social_post",
                        "topic": "AI tools every contractor needs in 2026",
                    },
                },
            ],
        },
    },
    {
        "id": "realtor",
        "label": "Real Estate Agents",
        "description": "Realtors, brokers, property managers, and real estate professionals",
        "quick_runs": [
            {
                "label": "AI Tools for Realtors",
                "agent_type": "research",
                "params": {
                    "topic": "AI tools for real estate agents and brokers in 2026",
                    "industry": "real estate",
                    "focus": "tools",
                },
            },
            {
                "label": "Real Estate AI Trends",
                "agent_type": "research",
                "params": {
                    "topic": "AI adoption trends in residential real estate",
                    "industry": "real estate",
                    "focus": "trends",
                },
            },
            {
                "label": "Realtor Case Study",
                "agent_type": "case_study",
                "params": {
                    "industry": "real estate",
                    "business_type": "residential realtor",
                    "pain_points": "lead generation, listing descriptions, client follow-up, market analysis, scheduling showings",
                },
            },
            {
                "label": "Realtor Newsletter",
                "agent_type": "content",
                "params": {
                    "content_type": "newsletter",
                    "topic": "How Top Realtors Are Using AI to Close More Deals in Half the Time",
                },
            },
            {
                "label": "Realtor YouTube Script",
                "agent_type": "content",
                "params": {
                    "content_type": "youtube_script",
                    "topic": "AI for Real Estate: How I Write Perfect Listing Descriptions in 30 Seconds",
                },
            },
            {
                "label": "Realtor AI Playbook",
                "agent_type": "course_dev",
                "params": {
                    "product_type": "playbook",
                    "topic": "The Realtor's AI Playbook",
                    "target_audience": "real estate agents and brokers",
                    "depth": "beginner",
                },
            },
            {
                "label": "Realtor Lead Magnet",
                "agent_type": "marketing",
                "params": {
                    "asset_type": "lead_magnet",
                    "target_audience": "real estate agents",
                    "key_benefit": "write listing descriptions, follow up with leads, and analyze markets 10x faster with AI",
                },
            },
        ],
        "pipeline_template": {
            "name": "Realtor Content Package",
            "description": "Research → Case Study → Newsletter → Social Posts",
            "steps": [
                {
                    "agent_type": "research",
                    "params": {
                        "topic": "AI tools for real estate agents in 2026",
                        "industry": "real estate",
                        "focus": "tools",
                    },
                },
                {
                    "agent_type": "case_study",
                    "params": {
                        "industry": "real estate",
                        "business_type": "residential realtor",
                        "pain_points": "lead generation, listing descriptions, client follow-up",
                    },
                },
                {
                    "agent_type": "content",
                    "params": {
                        "content_type": "newsletter",
                        "topic": "How Top Realtors Are Using AI to Close More Deals",
                    },
                },
                {
                    "agent_type": "content",
                    "params": {
                        "content_type": "social_post",
                        "topic": "AI tools every realtor needs in 2026",
                    },
                },
            ],
        },
    },
    {
        "id": "service_pro",
        "label": "Service Professionals",
        "description": "Insurance agents, financial advisors, consultants, coaches, and freelancers",
        "quick_runs": [
            {
                "label": "AI Tools for Service Pros",
                "agent_type": "research",
                "params": {
                    "topic": "AI tools for service professionals, consultants, and advisors in 2026",
                    "industry": "professional services",
                    "focus": "tools",
                },
            },
            {
                "label": "Service Pro AI Trends",
                "agent_type": "research",
                "params": {
                    "topic": "AI adoption trends in professional services and consulting",
                    "industry": "professional services",
                    "focus": "trends",
                },
            },
            {
                "label": "Service Pro Case Study",
                "agent_type": "case_study",
                "params": {
                    "industry": "professional services",
                    "business_type": "independent consultant",
                    "pain_points": "client acquisition, proposal writing, scheduling, invoicing, content creation",
                },
            },
            {
                "label": "Service Pro Newsletter",
                "agent_type": "content",
                "params": {
                    "content_type": "newsletter",
                    "topic": "How Service Professionals Are Using AI to Double Their Client Base Without Working More Hours",
                },
            },
            {
                "label": "Service Pro YouTube Script",
                "agent_type": "content",
                "params": {
                    "content_type": "youtube_script",
                    "topic": "AI for Consultants: Automate Your Admin Work and Focus on What You Do Best",
                },
            },
            {
                "label": "Service Business AI Playbook",
                "agent_type": "course_dev",
                "params": {
                    "product_type": "playbook",
                    "topic": "The Service Business AI Playbook",
                    "target_audience": "insurance agents, financial advisors, consultants, and coaches",
                    "depth": "beginner",
                },
            },
            {
                "label": "Service Pro Lead Magnet",
                "agent_type": "marketing",
                "params": {
                    "asset_type": "lead_magnet",
                    "target_audience": "service professionals and consultants",
                    "key_benefit": "automate client follow-ups, proposals, and scheduling to reclaim 15+ hours per week",
                },
            },
        ],
        "pipeline_template": {
            "name": "Service Pro Content Package",
            "description": "Research → Case Study → Newsletter → Social Posts",
            "steps": [
                {
                    "agent_type": "research",
                    "params": {
                        "topic": "AI tools for service professionals and consultants in 2026",
                        "industry": "professional services",
                        "focus": "tools",
                    },
                },
                {
                    "agent_type": "case_study",
                    "params": {
                        "industry": "professional services",
                        "business_type": "independent consultant",
                        "pain_points": "client acquisition, proposal writing, scheduling",
                    },
                },
                {
                    "agent_type": "content",
                    "params": {
                        "content_type": "newsletter",
                        "topic": "How Service Professionals Are Using AI to Work Smarter",
                    },
                },
                {
                    "agent_type": "content",
                    "params": {
                        "content_type": "social_post",
                        "topic": "AI tools every consultant and advisor needs in 2026",
                    },
                },
            ],
        },
    },
    {
        "id": "small_biz",
        "label": "Small Business Owners",
        "description": "General small business owners across all industries",
        "quick_runs": [
            {
                "label": "AI Tools for Small Business",
                "agent_type": "research",
                "params": {
                    "topic": "Best AI tools for small business owners in 2026",
                    "industry": "small business",
                    "focus": "tools",
                },
            },
            {
                "label": "Small Business AI Trends",
                "agent_type": "research",
                "params": {
                    "topic": "AI adoption trends among small businesses in America",
                    "industry": "small business",
                    "focus": "trends",
                },
            },
            {
                "label": "Small Business Case Study",
                "agent_type": "case_study",
                "params": {
                    "industry": "small business",
                    "business_type": "small business owner",
                    "pain_points": "marketing, customer service, bookkeeping, hiring, time management",
                },
            },
            {
                "label": "Small Business Newsletter",
                "agent_type": "content",
                "params": {
                    "content_type": "newsletter",
                    "topic": "5 AI Tools That Save Small Business Owners 20+ Hours Per Month",
                },
            },
            {
                "label": "AI Starter Kit Guide",
                "agent_type": "course_dev",
                "params": {
                    "product_type": "guide",
                    "topic": "The AI Starter Kit for Small Business Owners",
                    "target_audience": "small business owners with no technical background",
                    "depth": "beginner",
                },
            },
            {
                "label": "Small Business Lead Magnet",
                "agent_type": "marketing",
                "params": {
                    "asset_type": "lead_magnet",
                    "target_audience": "small business owners",
                    "key_benefit": "save 20+ hours per month with 5 free AI tools you can set up in 15 minutes",
                },
            },
        ],
        "pipeline_template": {
            "name": "Small Business Content Package",
            "description": "Research → Case Study → Newsletter → Lead Magnet",
            "steps": [
                {
                    "agent_type": "research",
                    "params": {
                        "topic": "Best AI tools for small business owners in 2026",
                        "industry": "small business",
                        "focus": "tools",
                    },
                },
                {
                    "agent_type": "case_study",
                    "params": {
                        "industry": "small business",
                        "business_type": "small business owner",
                        "pain_points": "marketing, customer service, bookkeeping, time management",
                    },
                },
                {
                    "agent_type": "content",
                    "params": {
                        "content_type": "newsletter",
                        "topic": "5 AI Tools That Save Small Business Owners 20+ Hours Per Month",
                    },
                },
                {
                    "agent_type": "marketing",
                    "params": {
                        "asset_type": "lead_magnet",
                        "target_audience": "small business owners",
                        "key_benefit": "save 20+ hours per month with free AI tools",
                    },
                },
            ],
        },
    },
]


def get_all_presets() -> list[dict]:
    return INDUSTRY_PRESETS


def get_preset_by_id(preset_id: str) -> dict | None:
    for preset in INDUSTRY_PRESETS:
        if preset["id"] == preset_id:
            return preset
    return None
```

**Step 4: Add preset endpoints to routes.py**

Add to `backend/routes.py` — add import at top and two new endpoints:

Add import:
```python
from presets import get_all_presets, get_preset_by_id
```

Add endpoints (after the existing `/api/agents` endpoint):
```python
@router.get("/presets")
async def list_presets():
    """List industry presets with pre-configured agent parameters."""
    return get_all_presets()


@router.get("/presets/{preset_id}")
async def get_preset(preset_id: str):
    """Get a specific industry preset."""
    preset = get_preset_by_id(preset_id)
    if not preset:
        raise HTTPException(status_code=404, detail=f"Preset not found: {preset_id}")
    return preset
```

**Step 5: Run tests**

```bash
cd /c/Ai-Education/backend
python -m pytest tests/test_presets.py -v
```
Expected: PASS

**Step 6: Commit**

```bash
git add backend/presets.py backend/routes.py backend/tests/test_presets.py
git commit -m "feat: add industry presets for contractors, realtors, service pros, small business"
```

---

### Task 4: Industry Presets — Frontend

**Files:**
- Modify: `frontend/src/pages/AgentsPage.jsx`

**Step 1: Update AgentsPage to fetch and display presets**

Replace entire `frontend/src/pages/AgentsPage.jsx`:
```jsx
import { useState, useEffect } from 'react'

export default function AgentsPage({ onNavigate }) {
  const [agents, setAgents] = useState({})
  const [presets, setPresets] = useState([])
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [formValues, setFormValues] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [showPresets, setShowPresets] = useState(true)

  useEffect(() => {
    fetch('/api/agents').then((r) => r.json()).then(setAgents)
    fetch('/api/presets').then((r) => r.json()).then(setPresets)
  }, [])

  const selectAgent = (key) => {
    setSelectedAgent(key)
    setFormValues({})
    setShowPresets(false)
  }

  const applyPreset = (quickRun) => {
    setSelectedAgent(quickRun.agent_type)
    setFormValues(quickRun.params)
    setShowPresets(false)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_type: selectedAgent, params: formValues }),
      })
      const data = await res.json()
      onNavigate('output', data.run_id)
    } catch (err) {
      alert('Failed to start agent: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const agentConfig = selectedAgent ? agents[selectedAgent] : null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Run Agent</h2>
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          {showPresets ? 'Manual Setup' : 'Industry Quick Start'}
        </button>
      </div>

      {showPresets && presets.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Industry Quick Start</h3>
          <div className="space-y-6">
            {presets.map((preset) => (
              <div key={preset.id} className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <div className="mb-3">
                  <h4 className="font-semibold text-lg">{preset.label}</h4>
                  <p className="text-gray-400 text-sm">{preset.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {preset.quick_runs.map((qr, i) => (
                    <button
                      key={i}
                      onClick={() => applyPreset(qr)}
                      className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-blue-500 px-3 py-1.5 rounded-lg text-sm transition-colors"
                    >
                      {qr.label}
                    </button>
                  ))}
                  {preset.pipeline_template && (
                    <button
                      onClick={() => onNavigate('pipelines', preset.id)}
                      className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-blue-400 px-3 py-1.5 rounded-lg text-sm transition-colors"
                    >
                      Run Full Package
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!showPresets && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {Object.entries(agents).map(([key, agent]) => (
              <button
                key={key}
                onClick={() => selectAgent(key)}
                className={`text-left p-4 rounded-xl border transition-colors ${
                  selectedAgent === key
                    ? 'border-blue-500 bg-blue-600/10'
                    : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                }`}
              >
                <div className="font-semibold">{agent.name}</div>
                <div className="text-gray-400 text-sm mt-1">{agent.description}</div>
              </button>
            ))}
          </div>

          {agentConfig && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold mb-4">{agentConfig.name} Parameters</h3>

              <div className="space-y-4">
                {Object.entries(agentConfig.params).map(([key, param]) => (
                  <div key={key}>
                    <label className="block text-sm text-gray-400 mb-1">
                      {param.label} {param.required && <span className="text-red-400">*</span>}
                    </label>

                    {param.type === 'select' ? (
                      <select
                        value={formValues[key] || ''}
                        onChange={(e) => setFormValues({ ...formValues, [key]: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="">Select...</option>
                        {param.options.map((opt) => (
                          <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>
                        ))}
                      </select>
                    ) : param.type === 'textarea' ? (
                      <textarea
                        value={formValues[key] || ''}
                        onChange={(e) => setFormValues({ ...formValues, [key]: e.target.value })}
                        placeholder={param.placeholder}
                        rows={4}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500"
                      />
                    ) : (
                      <input
                        type="text"
                        value={formValues[key] || ''}
                        onChange={(e) => setFormValues({ ...formValues, [key]: e.target.value })}
                        placeholder={param.placeholder}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500"
                      />
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-6 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 px-6 py-2 rounded-lg transition-colors"
              >
                {submitting ? 'Starting...' : 'Run Agent'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
```

**Step 2: Verify manually**

```bash
cd /c/Ai-Education/frontend
npm run dev
```
Open http://localhost:5173, navigate to "Run Agent". Should see industry preset cards with quick-run buttons. Clicking a button should switch to manual mode with form pre-filled.

**Step 3: Commit**

```bash
git add frontend/src/pages/AgentsPage.jsx
git commit -m "feat: add industry preset quick-start UI to agents page"
```

---

### Task 5: Pipeline Database Schema

**Files:**
- Modify: `backend/database.py`
- Create: `backend/tests/test_pipeline_db.py`

**Step 1: Write failing test**

Create `backend/tests/test_pipeline_db.py`:
```python
import pytest
from database import (
    init_db,
    create_pipeline_run,
    get_pipeline_run,
    list_pipeline_runs,
    complete_pipeline_run,
    fail_pipeline_run,
)


@pytest.fixture(autouse=True)
async def setup_db():
    await init_db()


@pytest.mark.anyio
async def test_create_and_get_pipeline_run():
    steps_json = '[{"agent_type": "research", "params": {}}]'
    run_id = await create_pipeline_run("Test Pipeline", steps_json)
    assert run_id > 0

    run = await get_pipeline_run(run_id)
    assert run is not None
    assert run["name"] == "Test Pipeline"
    assert run["status"] == "running"
    assert run["steps"] == steps_json


@pytest.mark.anyio
async def test_complete_pipeline_run():
    steps_json = '[{"agent_type": "research", "params": {}}]'
    run_id = await create_pipeline_run("Test", steps_json)
    await complete_pipeline_run(run_id)
    run = await get_pipeline_run(run_id)
    assert run["status"] == "completed"


@pytest.mark.anyio
async def test_fail_pipeline_run():
    steps_json = '[{"agent_type": "research", "params": {}}]'
    run_id = await create_pipeline_run("Test", steps_json)
    await fail_pipeline_run(run_id, "something broke")
    run = await get_pipeline_run(run_id)
    assert run["status"] == "failed"
    assert run["error"] == "something broke"


@pytest.mark.anyio
async def test_list_pipeline_runs():
    steps_json = '[{"agent_type": "research", "params": {}}]'
    await create_pipeline_run("Run A", steps_json)
    await create_pipeline_run("Run B", steps_json)
    runs = await list_pipeline_runs()
    assert len(runs) >= 2
```

**Step 2: Run test to verify it fails**

```bash
cd /c/Ai-Education/backend
python -m pytest tests/test_pipeline_db.py -v
```
Expected: FAIL — functions don't exist.

**Step 3: Add pipeline tables and functions to database.py**

Add to `backend/database.py` `init_db()` function — after the existing table creation:

```python
        await db.execute("""
            CREATE TABLE IF NOT EXISTS pipeline_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'running',
                steps TEXT NOT NULL,
                error TEXT,
                created_at TEXT NOT NULL,
                completed_at TEXT
            )
        """)
        # Add pipeline_run_id to agent_runs if not present
        try:
            await db.execute("ALTER TABLE agent_runs ADD COLUMN pipeline_run_id INTEGER")
        except Exception:
            pass
        try:
            await db.execute("ALTER TABLE agent_runs ADD COLUMN step_index INTEGER")
        except Exception:
            pass
```

Add new functions to `backend/database.py`:

```python
async def create_pipeline_run(name: str, steps: str) -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO pipeline_runs (name, status, steps, created_at) VALUES (?, ?, ?, ?)",
            (name, "running", steps, datetime.utcnow().isoformat()),
        )
        await db.commit()
        return cursor.lastrowid


async def get_pipeline_run(run_id: int) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM pipeline_runs WHERE id = ?", (run_id,))
        row = await cursor.fetchone()
        return dict(row) if row else None


async def list_pipeline_runs(limit: int = 50) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM pipeline_runs ORDER BY created_at DESC LIMIT ?", (limit,)
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


async def complete_pipeline_run(run_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE pipeline_runs SET status = ?, completed_at = ? WHERE id = ?",
            ("completed", datetime.utcnow().isoformat(), run_id),
        )
        await db.commit()


async def fail_pipeline_run(run_id: int, error: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE pipeline_runs SET status = ?, error = ?, completed_at = ? WHERE id = ?",
            ("failed", error, datetime.utcnow().isoformat(), run_id),
        )
        await db.commit()


async def get_pipeline_agent_runs(pipeline_run_id: int) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM agent_runs WHERE pipeline_run_id = ? ORDER BY step_index",
            (pipeline_run_id,),
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
```

Also update `create_run` signature to accept optional pipeline fields:

```python
async def create_run(agent_type: str, input_params: str, pipeline_run_id: int | None = None, step_index: int | None = None) -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO agent_runs (agent_type, status, input_params, pipeline_run_id, step_index, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (agent_type, "running", input_params, pipeline_run_id, step_index, datetime.utcnow().isoformat()),
        )
        await db.commit()
        return cursor.lastrowid
```

**Step 4: Run tests**

```bash
cd /c/Ai-Education/backend
python -m pytest tests/test_pipeline_db.py -v
```
Expected: PASS

**Step 5: Commit**

```bash
git add backend/database.py backend/tests/test_pipeline_db.py
git commit -m "feat: add pipeline_runs table and CRUD functions"
```

---

### Task 6: Pipeline Execution Engine

**Files:**
- Create: `backend/pipeline_executor.py`

**Step 1: Create pipeline executor**

Create `backend/pipeline_executor.py`:
```python
import asyncio
import json
from database import (
    create_run,
    complete_run,
    fail_run,
    get_run,
    complete_pipeline_run,
    fail_pipeline_run,
)
from agents import AGENT_REGISTRY
from html_generator import generate_html, save_html


async def execute_pipeline(pipeline_run_id: int, name: str, steps: list[dict]):
    """Execute a pipeline: run agents sequentially, chaining outputs."""
    prior_output = ""

    try:
        for i, step in enumerate(steps):
            agent_type = step["agent_type"]
            params = dict(step.get("params", {}))

            # Chain: inject prior output as source_material
            if prior_output:
                params["source_material"] = prior_output

            if agent_type not in AGENT_REGISTRY:
                raise ValueError(f"Unknown agent type in pipeline step {i}: {agent_type}")

            # Create agent run linked to pipeline
            run_id = await create_run(
                agent_type,
                json.dumps(params),
                pipeline_run_id=pipeline_run_id,
                step_index=i,
            )

            # Execute agent
            agent_class = AGENT_REGISTRY[agent_type]
            agent = agent_class()
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, agent.run, params)

            # Generate HTML
            html_path = None
            try:
                html_content = await loop.run_in_executor(
                    None, generate_html, result, agent_type, params
                )
                html_path = await loop.run_in_executor(
                    None, save_html, html_content, agent_type, params
                )
            except Exception as html_err:
                print(f"HTML generation failed for pipeline step {i}: {html_err}")

            await complete_run(run_id, result, html_output_path=html_path)

            # Pass output to next step
            prior_output = result

        await complete_pipeline_run(pipeline_run_id)

    except Exception as e:
        await fail_pipeline_run(pipeline_run_id, str(e))
```

**Step 2: Commit**

```bash
git add backend/pipeline_executor.py
git commit -m "feat: add pipeline execution engine with output chaining"
```

---

### Task 7: Pipeline Backend API

**Files:**
- Modify: `backend/routes.py`
- Create: `backend/tests/test_pipelines_api.py`

**Step 1: Write failing test**

Create `backend/tests/test_pipelines_api.py`:
```python
import pytest


@pytest.mark.anyio
async def test_run_pipeline(client):
    resp = await client.post("/api/pipelines/run", json={
        "name": "Test Pipeline",
        "steps": [
            {"agent_type": "research", "params": {"topic": "test", "focus": "tools"}},
        ],
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "pipeline_run_id" in data
    assert data["status"] == "running"


@pytest.mark.anyio
async def test_list_pipeline_runs(client):
    resp = await client.get("/api/pipelines")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.anyio
async def test_get_pipeline_run(client):
    # Create one first
    create_resp = await client.post("/api/pipelines/run", json={
        "name": "Test",
        "steps": [{"agent_type": "research", "params": {"topic": "test", "focus": "tools"}}],
    })
    run_id = create_resp.json()["pipeline_run_id"]

    resp = await client.get(f"/api/pipelines/{run_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["pipeline_run"]["id"] == run_id


@pytest.mark.anyio
async def test_get_pipeline_not_found(client):
    resp = await client.get("/api/pipelines/99999")
    assert resp.status_code == 404
```

**Step 2: Run test to verify it fails**

```bash
cd /c/Ai-Education/backend
python -m pytest tests/test_pipelines_api.py -v
```
Expected: FAIL — endpoints don't exist.

**Step 3: Add pipeline endpoints to routes.py**

Add to `backend/routes.py` — new imports at top:

```python
from database import (
    create_run, complete_run, fail_run, get_run, list_runs,
    create_pipeline_run, get_pipeline_run, list_pipeline_runs, get_pipeline_agent_runs,
)
from pipeline_executor import execute_pipeline
```

Add new Pydantic model:
```python
class PipelineRunRequest(BaseModel):
    name: str
    steps: list[dict]
```

Add new endpoints:
```python
@router.post("/pipelines/run")
async def run_pipeline(request: PipelineRunRequest):
    """Trigger a pipeline run. Returns immediately with a pipeline run ID."""
    pipeline_run_id = await create_pipeline_run(
        request.name, json.dumps(request.steps)
    )
    asyncio.create_task(
        execute_pipeline(pipeline_run_id, request.name, request.steps)
    )
    return {"pipeline_run_id": pipeline_run_id, "status": "running"}


@router.get("/pipelines")
async def get_pipelines(limit: int = 50):
    """List pipeline runs."""
    return await list_pipeline_runs(limit=limit)


@router.get("/pipelines/{pipeline_run_id}")
async def get_pipeline_detail(pipeline_run_id: int):
    """Get pipeline run details including all agent runs."""
    pipeline_run = await get_pipeline_run(pipeline_run_id)
    if not pipeline_run:
        raise HTTPException(status_code=404, detail="Pipeline run not found")
    agent_runs = await get_pipeline_agent_runs(pipeline_run_id)
    return {"pipeline_run": pipeline_run, "agent_runs": agent_runs}
```

**Step 4: Run tests**

```bash
cd /c/Ai-Education/backend
python -m pytest tests/test_pipelines_api.py -v
```
Expected: PASS

**Step 5: Commit**

```bash
git add backend/routes.py backend/tests/test_pipelines_api.py
git commit -m "feat: add pipeline API endpoints for run, list, and detail"
```

---

### Task 8: Pipeline Frontend Page

**Files:**
- Create: `frontend/src/pages/PipelinesPage.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/Sidebar.jsx`

**Step 1: Create PipelinesPage component**

Create `frontend/src/pages/PipelinesPage.jsx`:
```jsx
import { useState, useEffect } from 'react'

export default function PipelinesPage({ onNavigate, presetId }) {
  const [presets, setPresets] = useState([])
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [pipelineRuns, setPipelineRuns] = useState([])
  const [running, setRunning] = useState(false)
  const [activePipelineId, setActivePipelineId] = useState(null)
  const [activePipeline, setActivePipeline] = useState(null)

  useEffect(() => {
    fetch('/api/presets').then((r) => r.json()).then((data) => {
      setPresets(data)
      if (presetId) {
        const match = data.find((p) => p.id === presetId)
        if (match) setSelectedPreset(match)
      }
    })
    fetch('/api/pipelines').then((r) => r.json()).then(setPipelineRuns)
  }, [presetId])

  // Poll active pipeline
  useEffect(() => {
    if (!activePipelineId) return
    const poll = setInterval(() => {
      fetch(`/api/pipelines/${activePipelineId}`)
        .then((r) => r.json())
        .then((data) => {
          setActivePipeline(data)
          if (data.pipeline_run.status !== 'running') {
            clearInterval(poll)
            setRunning(false)
            fetch('/api/pipelines').then((r) => r.json()).then(setPipelineRuns)
          }
        })
    }, 3000)
    return () => clearInterval(poll)
  }, [activePipelineId])

  const runPipeline = async (preset) => {
    setRunning(true)
    const template = preset.pipeline_template
    const res = await fetch('/api/pipelines/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: template.name, steps: template.steps }),
    })
    const data = await res.json()
    setActivePipelineId(data.pipeline_run_id)
  }

  const statusColor = {
    running: 'text-yellow-400',
    completed: 'text-green-400',
    failed: 'text-red-400',
  }

  const stepStatusIcon = (status) => {
    if (status === 'completed') return '\u2713'
    if (status === 'running') return '\u25CB'
    if (status === 'failed') return '\u2717'
    return '\u25CB'
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Content Pipelines</h2>

      {/* Active pipeline progress */}
      {activePipeline && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{activePipeline.pipeline_run.name}</h3>
            <span className={`text-sm ${statusColor[activePipeline.pipeline_run.status]}`}>
              {activePipeline.pipeline_run.status}
            </span>
          </div>
          <div className="space-y-3">
            {activePipeline.agent_runs.map((run, i) => (
              <div key={run.id} className="flex items-center gap-3">
                <span className={`text-lg ${statusColor[run.status]}`}>
                  {stepStatusIcon(run.status)}
                </span>
                <span className="capitalize text-sm">{run.agent_type.replace('_', ' ')}</span>
                <span className={`text-xs ${statusColor[run.status]}`}>{run.status}</span>
                {run.status === 'completed' && (
                  <button
                    onClick={() => onNavigate('output', run.id)}
                    className="text-xs text-blue-400 hover:text-blue-300 ml-auto"
                  >
                    View Output
                  </button>
                )}
              </div>
            ))}
            {/* Show pending steps not yet created as agent_runs */}
            {activePipeline.pipeline_run.status === 'running' && (() => {
              const steps = JSON.parse(activePipeline.pipeline_run.steps)
              const remaining = steps.slice(activePipeline.agent_runs.length)
              return remaining.map((step, i) => (
                <div key={`pending-${i}`} className="flex items-center gap-3 opacity-40">
                  <span className="text-lg">{'\u25CB'}</span>
                  <span className="capitalize text-sm">{step.agent_type.replace('_', ' ')}</span>
                  <span className="text-xs">pending</span>
                </div>
              ))
            })()}
          </div>
        </div>
      )}

      {/* Pipeline templates */}
      <h3 className="text-lg font-semibold mb-4">Pipeline Templates</h3>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {presets.filter((p) => p.pipeline_template).map((preset) => (
          <div
            key={preset.id}
            className="bg-gray-900 rounded-xl border border-gray-800 p-5"
          >
            <h4 className="font-semibold mb-1">{preset.pipeline_template.name}</h4>
            <p className="text-gray-400 text-sm mb-3">{preset.pipeline_template.description}</p>
            <div className="flex flex-wrap gap-1 mb-4">
              {preset.pipeline_template.steps.map((step, i) => (
                <span key={i} className="text-xs bg-gray-800 px-2 py-1 rounded capitalize">
                  {i > 0 && <span className="text-gray-500 mr-1">{'\u2192'}</span>}
                  {step.agent_type.replace('_', ' ')}
                </span>
              ))}
            </div>
            <button
              onClick={() => runPipeline(preset)}
              disabled={running}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {running ? 'Running...' : 'Run Pipeline'}
            </button>
          </div>
        ))}
      </div>

      {/* Pipeline history */}
      <h3 className="text-lg font-semibold mb-4">Pipeline History</h3>
      <div className="space-y-2">
        {pipelineRuns.map((run) => (
          <button
            key={run.id}
            onClick={() => {
              setActivePipelineId(run.id)
              fetch(`/api/pipelines/${run.id}`).then((r) => r.json()).then(setActivePipeline)
            }}
            className="w-full text-left bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">{run.name}</span>
                <span className={`ml-3 text-sm ${statusColor[run.status]}`}>{run.status}</span>
              </div>
              <span className="text-gray-500 text-sm">{new Date(run.created_at).toLocaleString()}</span>
            </div>
          </button>
        ))}
        {pipelineRuns.length === 0 && (
          <div className="text-gray-500 text-center py-8">No pipeline runs yet.</div>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Update App.jsx to add pipelines route**

Replace `frontend/src/App.jsx`:
```jsx
import { useState } from 'react'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import AgentsPage from './pages/AgentsPage'
import HistoryPage from './pages/HistoryPage'
import OutputPage from './pages/OutputPage'
import PipelinesPage from './pages/PipelinesPage'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [selectedRunId, setSelectedRunId] = useState(null)
  const [selectedPresetId, setSelectedPresetId] = useState(null)

  const navigate = (page, id = null) => {
    setCurrentPage(page)
    if (page === 'output') setSelectedRunId(id)
    if (page === 'pipelines') setSelectedPresetId(id)
  }

  return (
    <Layout currentPage={currentPage} onNavigate={navigate}>
      {currentPage === 'dashboard' && <DashboardPage onNavigate={navigate} />}
      {currentPage === 'agents' && <AgentsPage onNavigate={navigate} />}
      {currentPage === 'pipelines' && <PipelinesPage onNavigate={navigate} presetId={selectedPresetId} />}
      {currentPage === 'history' && <HistoryPage onNavigate={navigate} />}
      {currentPage === 'output' && <OutputPage runId={selectedRunId} onNavigate={navigate} />}
    </Layout>
  )
}

export default App
```

**Step 3: Update Sidebar.jsx to add pipelines nav item**

Replace `frontend/src/components/Sidebar.jsx`:
```jsx
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '~' },
  { id: 'agents', label: 'Run Agent', icon: '>' },
  { id: 'pipelines', label: 'Pipelines', icon: '|' },
  { id: 'history', label: 'History', icon: '#' },
]

export default function Sidebar({ currentPage, onNavigate }) {
  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 p-4 flex flex-col">
      <h1 className="text-xl font-bold mb-8 px-3">AI Education</h1>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              currentPage === item.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="mr-3 font-mono">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
```

**Step 4: Verify manually**

Start both backend and frontend, navigate to Pipelines page. Should see 4 pipeline templates. Clicking "Run Pipeline" should start execution and show progress.

**Step 5: Commit**

```bash
git add frontend/src/pages/PipelinesPage.jsx frontend/src/App.jsx frontend/src/components/Sidebar.jsx
git commit -m "feat: add pipelines page with template execution and progress tracking"
```

---

### Task 9: Tags Database and Backend API

**Files:**
- Modify: `backend/database.py`
- Modify: `backend/routes.py`
- Create: `backend/tests/test_tags.py`

**Step 1: Write failing test**

Create `backend/tests/test_tags.py`:
```python
import pytest
from database import init_db


@pytest.fixture(autouse=True)
async def setup_db():
    await init_db()


@pytest.mark.anyio
async def test_add_tag_to_run(client):
    # Create a run first
    run_resp = await client.post("/api/agents/run", json={
        "agent_type": "research",
        "params": {"topic": "test", "focus": "tools"},
    })
    run_id = run_resp.json()["run_id"]

    # Add tag
    resp = await client.post(f"/api/runs/{run_id}/tags", json={"tag": "contractor"})
    assert resp.status_code == 200

    # Get tags
    resp = await client.get(f"/api/runs/{run_id}/tags")
    assert resp.status_code == 200
    assert "contractor" in resp.json()


@pytest.mark.anyio
async def test_remove_tag_from_run(client):
    run_resp = await client.post("/api/agents/run", json={
        "agent_type": "research",
        "params": {"topic": "test", "focus": "tools"},
    })
    run_id = run_resp.json()["run_id"]

    await client.post(f"/api/runs/{run_id}/tags", json={"tag": "realtor"})
    resp = await client.delete(f"/api/runs/{run_id}/tags/realtor")
    assert resp.status_code == 200

    tags_resp = await client.get(f"/api/runs/{run_id}/tags")
    assert "realtor" not in tags_resp.json()


@pytest.mark.anyio
async def test_list_all_tags(client):
    resp = await client.get("/api/tags")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.anyio
async def test_filter_runs_by_tag(client):
    resp = await client.get("/api/runs?tag=contractor")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
```

**Step 2: Run test to verify it fails**

```bash
cd /c/Ai-Education/backend
python -m pytest tests/test_tags.py -v
```
Expected: FAIL

**Step 3: Add tags tables to database.py init_db()**

Add to `init_db()` after pipeline tables:
```python
        await db.execute("""
            CREATE TABLE IF NOT EXISTS tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS run_tags (
                run_id INTEGER NOT NULL,
                tag_id INTEGER NOT NULL,
                PRIMARY KEY (run_id, tag_id)
            )
        """)
```

Add tag functions to `backend/database.py`:
```python
async def add_tag_to_run(run_id: int, tag_name: str):
    async with aiosqlite.connect(DB_PATH) as db:
        # Ensure tag exists
        await db.execute("INSERT OR IGNORE INTO tags (name) VALUES (?)", (tag_name,))
        cursor = await db.execute("SELECT id FROM tags WHERE name = ?", (tag_name,))
        tag_row = await cursor.fetchone()
        tag_id = tag_row[0]
        await db.execute("INSERT OR IGNORE INTO run_tags (run_id, tag_id) VALUES (?, ?)", (run_id, tag_id))
        await db.commit()


async def remove_tag_from_run(run_id: int, tag_name: str):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT id FROM tags WHERE name = ?", (tag_name,))
        tag_row = await cursor.fetchone()
        if tag_row:
            await db.execute("DELETE FROM run_tags WHERE run_id = ? AND tag_id = ?", (run_id, tag_row[0]))
            await db.commit()


async def get_run_tags(run_id: int) -> list[str]:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "SELECT t.name FROM tags t JOIN run_tags rt ON t.id = rt.tag_id WHERE rt.run_id = ?",
            (run_id,),
        )
        rows = await cursor.fetchall()
        return [row[0] for row in rows]


async def list_all_tags() -> list[str]:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT name FROM tags ORDER BY name")
        rows = await cursor.fetchall()
        return [row[0] for row in rows]


async def list_runs_by_tag(tag_name: str, limit: int = 50) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            """SELECT ar.* FROM agent_runs ar
               JOIN run_tags rt ON ar.id = rt.run_id
               JOIN tags t ON rt.tag_id = t.id
               WHERE t.name = ?
               ORDER BY ar.created_at DESC LIMIT ?""",
            (tag_name, limit),
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
```

**Step 4: Add tag endpoints to routes.py**

Add imports:
```python
from database import (
    create_run, complete_run, fail_run, get_run, list_runs,
    create_pipeline_run, get_pipeline_run, list_pipeline_runs, get_pipeline_agent_runs,
    add_tag_to_run, remove_tag_from_run, get_run_tags, list_all_tags, list_runs_by_tag,
)
```

Add Pydantic model:
```python
class TagRequest(BaseModel):
    tag: str
```

Add endpoints:
```python
@router.get("/tags")
async def get_tags():
    """List all tags."""
    return await list_all_tags()


@router.post("/runs/{run_id}/tags")
async def add_tag(run_id: int, request: TagRequest):
    """Add a tag to a run."""
    await add_tag_to_run(run_id, request.tag)
    return {"status": "ok"}


@router.get("/runs/{run_id}/tags")
async def get_tags_for_run(run_id: int):
    """Get all tags for a run."""
    return await get_run_tags(run_id)


@router.delete("/runs/{run_id}/tags/{tag_name}")
async def remove_tag(run_id: int, tag_name: str):
    """Remove a tag from a run."""
    await remove_tag_from_run(run_id, tag_name)
    return {"status": "ok"}
```

Update the existing `get_runs` endpoint to support tag filtering:
```python
@router.get("/runs")
async def get_runs(agent_type: str | None = None, tag: str | None = None, limit: int = 50):
    """List agent runs, optionally filtered by type or tag."""
    if tag:
        return await list_runs_by_tag(tag, limit=limit)
    return await list_runs(agent_type=agent_type, limit=limit)
```

**Step 5: Run tests**

```bash
cd /c/Ai-Education/backend
python -m pytest tests/test_tags.py -v
```
Expected: PASS

**Step 6: Commit**

```bash
git add backend/database.py backend/routes.py backend/tests/test_tags.py
git commit -m "feat: add content tagging system with CRUD endpoints and filtering"
```

---

### Task 10: Tags Frontend — OutputPage Integration

**Files:**
- Modify: `frontend/src/pages/OutputPage.jsx`

**Step 1: Update OutputPage to show and manage tags**

Replace `frontend/src/pages/OutputPage.jsx`:
```jsx
import { useState, useEffect } from 'react'

const SUGGESTED_TAGS = ['contractor', 'realtor', 'service-pro', 'small-business', 'newsletter', 'youtube', 'social', 'playbook', 'guide', 'course', 'lead-magnet', 'case-study', 'draft', 'published']

export default function OutputPage({ runId, onNavigate }) {
  const [run, setRun] = useState(null)
  const [polling, setPolling] = useState(true)
  const [tags, setTags] = useState([])
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    if (!runId) return

    const fetchRun = () => {
      fetch(`/api/runs/${runId}`)
        .then((r) => r.json())
        .then((data) => {
          setRun(data)
          if (data.status !== 'running') setPolling(false)
        })
    }

    fetchRun()
    fetch(`/api/runs/${runId}/tags`).then((r) => r.json()).then(setTags)

    if (!polling) return
    const interval = setInterval(fetchRun, 2000)
    return () => clearInterval(interval)
  }, [runId, polling])

  const addTag = async (tagName) => {
    const tag = tagName.trim().toLowerCase()
    if (!tag || tags.includes(tag)) return
    await fetch(`/api/runs/${runId}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag }),
    })
    setTags([...tags, tag])
    setNewTag('')
  }

  const removeTag = async (tag) => {
    await fetch(`/api/runs/${runId}/tags/${tag}`, { method: 'DELETE' })
    setTags(tags.filter((t) => t !== tag))
  }

  if (!run) return <div className="text-gray-400">Loading...</div>

  const statusColor = { running: 'text-yellow-400', completed: 'text-green-400', failed: 'text-red-400' }

  return (
    <div>
      <button onClick={() => onNavigate('history')} className="text-gray-400 hover:text-white mb-4 inline-block">
        &larr; Back to History
      </button>

      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold capitalize">{run.agent_type.replace('_', ' ')}</h2>
        <span className={`text-sm ${statusColor[run.status]}`}>{run.status}</span>
      </div>

      <div className="text-gray-400 text-sm mb-4">
        Started: {new Date(run.created_at).toLocaleString()}
        {run.completed_at && <span className="ml-4">Completed: {new Date(run.completed_at).toLocaleString()}</span>}
      </div>

      {/* Tags */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 items-center mb-2">
          {tags.map((tag) => (
            <span key={tag} className="bg-blue-600/20 text-blue-400 px-2.5 py-1 rounded-full text-xs flex items-center gap-1.5">
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-white">&times;</button>
            </span>
          ))}
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTag(newTag)}
              placeholder="Add tag..."
              className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs w-24 text-white placeholder-gray-500"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).slice(0, 8).map((tag) => (
            <button
              key={tag}
              onClick={() => addTag(tag)}
              className="text-xs text-gray-500 hover:text-gray-300 bg-gray-800/50 px-2 py-0.5 rounded"
            >
              +{tag}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-6">
        <h3 className="text-sm text-gray-400 mb-2">Input Parameters</h3>
        <pre className="text-sm text-gray-300 whitespace-pre-wrap">{JSON.stringify(JSON.parse(run.input_params), null, 2)}</pre>
      </div>

      {run.status === 'running' && (
        <div className="bg-gray-900 rounded-xl border border-yellow-800 p-8 text-center">
          <div className="text-yellow-400 text-lg mb-2">Agent is running...</div>
          <div className="text-gray-400 text-sm">This page will update automatically when complete.</div>
        </div>
      )}

      {run.status === 'completed' && run.html_output_path && (
        <div className="flex gap-3 mb-6">
          <a
            href={`/api/runs/${runId}/html`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
          >
            <span>&#x2197;</span> View HTML
          </a>
          <a
            href={`/api/runs/${runId}/download`}
            className="bg-gray-700 hover:bg-gray-600 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
          >
            <span>&#x2913;</span> Download HTML
          </a>
        </div>
      )}

      {run.status === 'completed' && run.output && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-sm text-gray-400 mb-4">Markdown Output</h3>
          <div className="prose prose-invert max-w-none whitespace-pre-wrap text-gray-200 leading-relaxed">
            {run.output}
          </div>
        </div>
      )}

      {run.status === 'failed' && (
        <div className="bg-gray-900 rounded-xl border border-red-800 p-6">
          <h3 className="text-sm text-red-400 mb-2">Error</h3>
          <pre className="text-sm text-red-300 whitespace-pre-wrap">{run.error}</pre>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Verify manually**

Open an existing run output page. Should see tag management with suggested tags and custom tag input.

**Step 3: Commit**

```bash
git add frontend/src/pages/OutputPage.jsx
git commit -m "feat: add tag management UI to output page"
```

---

### Task 11: Library Page with Tag Filtering

**Files:**
- Create: `frontend/src/pages/LibraryPage.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/Sidebar.jsx`

**Step 1: Create LibraryPage component**

Create `frontend/src/pages/LibraryPage.jsx`:
```jsx
import { useState, useEffect } from 'react'

export default function LibraryPage({ onNavigate }) {
  const [runs, setRuns] = useState([])
  const [tags, setTags] = useState([])
  const [activeTag, setActiveTag] = useState('')
  const [agentFilter, setAgentFilter] = useState('')

  useEffect(() => {
    fetch('/api/tags').then((r) => r.json()).then(setTags)
  }, [])

  useEffect(() => {
    let url = '/api/runs?limit=100'
    if (activeTag) url = `/api/runs?tag=${activeTag}&limit=100`
    else if (agentFilter) url = `/api/runs?agent_type=${agentFilter}&limit=100`
    fetch(url).then((r) => r.json()).then(setRuns)
  }, [activeTag, agentFilter])

  const statusColor = { running: 'text-yellow-400', completed: 'text-green-400', failed: 'text-red-400' }
  const agentTypes = ['research', 'case_study', 'content', 'course_dev', 'marketing']

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Content Library</h2>

      {/* Tag filters */}
      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-2">Filter by tag</div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setActiveTag(''); setAgentFilter('') }}
            className={`px-3 py-1 rounded-lg text-sm ${!activeTag && !agentFilter ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => { setActiveTag(tag); setAgentFilter('') }}
              className={`px-3 py-1 rounded-lg text-sm ${activeTag === tag ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Agent type filters */}
      <div className="mb-6">
        <div className="text-xs text-gray-500 mb-2">Filter by agent</div>
        <div className="flex flex-wrap gap-2">
          {agentTypes.map((type) => (
            <button
              key={type}
              onClick={() => { setAgentFilter(type); setActiveTag('') }}
              className={`px-3 py-1 rounded-lg text-sm capitalize ${agentFilter === type ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-2">
        {runs.filter((r) => r.status === 'completed').map((run) => (
          <button
            key={run.id}
            onClick={() => onNavigate('output', run.id)}
            className="w-full text-left bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium capitalize">{run.agent_type.replace('_', ' ')}</span>
                {run.html_output_path && <span className="ml-2 text-xs text-green-400">HTML</span>}
              </div>
              <span className="text-gray-500 text-sm">{new Date(run.created_at).toLocaleString()}</span>
            </div>
            {run.input_params && (
              <div className="text-gray-500 text-xs mt-1 truncate">
                {(() => {
                  try {
                    const p = JSON.parse(run.input_params)
                    return p.topic || p.industry || p.content_type || ''
                  } catch { return '' }
                })()}
              </div>
            )}
          </button>
        ))}
        {runs.filter((r) => r.status === 'completed').length === 0 && (
          <div className="text-gray-500 text-center py-8">No completed content found.</div>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Update App.jsx — add library route**

Add import:
```jsx
import LibraryPage from './pages/LibraryPage'
```

Add to render:
```jsx
{currentPage === 'library' && <LibraryPage onNavigate={navigate} />}
```

**Step 3: Update Sidebar.jsx — add library nav item**

Add to `navItems` array:
```jsx
{ id: 'library', label: 'Library', icon: '@' },
```

**Step 4: Verify manually**

Navigate to Library page. Should show all completed runs with tag and agent type filtering.

**Step 5: Commit**

```bash
git add frontend/src/pages/LibraryPage.jsx frontend/src/App.jsx frontend/src/components/Sidebar.jsx
git commit -m "feat: add content library page with tag and agent type filtering"
```

---

### Task 12: Enhanced Dashboard

**Files:**
- Modify: `frontend/src/pages/DashboardPage.jsx`

**Step 1: Update DashboardPage with richer metrics**

Replace `frontend/src/pages/DashboardPage.jsx`:
```jsx
import { useState, useEffect } from 'react'

export default function DashboardPage({ onNavigate }) {
  const [runs, setRuns] = useState([])
  const [pipelineRuns, setPipelineRuns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/runs?limit=50').then((r) => r.json()),
      fetch('/api/pipelines?limit=10').then((r) => r.json()),
    ]).then(([runsData, pipelinesData]) => {
      setRuns(runsData)
      setPipelineRuns(pipelinesData)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const statusColor = {
    running: 'text-yellow-400',
    completed: 'text-green-400',
    failed: 'text-red-400',
  }

  const completed = runs.filter((r) => r.status === 'completed')
  const running = runs.filter((r) => r.status === 'running')
  const withHtml = runs.filter((r) => r.html_output_path)

  // Count by agent type
  const byAgent = {}
  for (const run of completed) {
    byAgent[run.agent_type] = (byAgent[run.agent_type] || 0) + 1
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Dashboard</h2>
      <p className="text-gray-400 text-sm mb-6">AI for Everyday Americans — Content Production Hub</p>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="text-3xl font-bold">{runs.length}</div>
          <div className="text-gray-400 text-sm mt-1">Total Runs</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="text-3xl font-bold text-green-400">{completed.length}</div>
          <div className="text-gray-400 text-sm mt-1">Completed</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="text-3xl font-bold text-blue-400">{withHtml.length}</div>
          <div className="text-gray-400 text-sm mt-1">HTML Assets</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="text-3xl font-bold text-purple-400">{pipelineRuns.length}</div>
          <div className="text-gray-400 text-sm mt-1">Pipelines Run</div>
        </div>
      </div>

      {/* Content by agent type */}
      {Object.keys(byAgent).length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 mb-8">
          <h3 className="text-sm text-gray-400 mb-3">Content by Type</h3>
          <div className="grid grid-cols-5 gap-3">
            {Object.entries(byAgent).map(([type, count]) => (
              <div key={type} className="text-center">
                <div className="text-xl font-bold">{count}</div>
                <div className="text-xs text-gray-500 capitalize">{type.replace('_', ' ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => onNavigate('agents')}
          className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Run New Agent
        </button>
        <button
          onClick={() => onNavigate('pipelines')}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Run Pipeline
        </button>
        <button
          onClick={() => onNavigate('library')}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Content Library
        </button>
      </div>

      {/* Recent activity */}
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : runs.length === 0 ? (
        <div className="text-gray-500 bg-gray-900 rounded-xl p-8 text-center border border-gray-800">
          No runs yet. Click &quot;Run New Agent&quot; to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {runs.slice(0, 10).map((run) => (
            <button
              key={run.id}
              onClick={() => onNavigate('output', run.id)}
              className="w-full text-left bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium capitalize">{run.agent_type.replace('_', ' ')}</span>
                  <span className={`ml-3 text-sm ${statusColor[run.status]}`}>{run.status}</span>
                  {run.pipeline_run_id && <span className="ml-2 text-xs text-purple-400">pipeline</span>}
                </div>
                <span className="text-gray-500 text-sm">{new Date(run.created_at).toLocaleString()}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Verify manually**

Dashboard should show 4-column stats, content by type breakdown, quick action buttons, and recent activity with pipeline indicators.

**Step 3: Commit**

```bash
git add frontend/src/pages/DashboardPage.jsx
git commit -m "feat: enhance dashboard with production metrics and quick actions"
```

---

### Task 13: Final Integration Verification

**Step 1: Run all backend tests**

```bash
cd /c/Ai-Education/backend
source .venv/Scripts/activate
python -m pytest tests/ -v
```
Expected: All tests PASS.

**Step 2: Start backend and verify endpoints**

```bash
cd /c/Ai-Education/backend
python -m uvicorn main:app --reload --port 8000
```

In another terminal:
```bash
curl http://localhost:8000/api/health
# Expected: {"status":"ok"}

curl http://localhost:8000/api/presets
# Expected: JSON array with 4 industry presets

curl http://localhost:8000/api/tags
# Expected: JSON array (may be empty)

curl http://localhost:8000/api/pipelines
# Expected: JSON array (may be empty)
```

**Step 3: Start frontend and verify UI**

```bash
cd /c/Ai-Education/frontend
npm run dev
```

Manual verification checklist:
- [ ] Dashboard shows 4-column stats grid and quick action buttons
- [ ] "Run Agent" page shows Industry Quick Start with 4 preset cards
- [ ] Clicking a preset quick-run pre-fills the agent form
- [ ] "Pipelines" page shows 4 pipeline templates
- [ ] Running a pipeline shows step-by-step progress
- [ ] "Library" page shows all completed runs with tag/agent filters
- [ ] Output page shows tag management with suggested tags
- [ ] Sidebar has all 5 nav items: Dashboard, Run Agent, Pipelines, History, Library

**Step 4: Commit any fixes needed**

```bash
git add -A
git commit -m "fix: integration fixes from end-to-end testing"
```
