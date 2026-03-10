# AI Education Agent Infrastructure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build 5 AI-powered agents (Research, Case Study, Content, Course Dev, Marketing) with a FastAPI backend, SQLite storage, and React dashboard for managing and viewing agent outputs.

**Architecture:** Python FastAPI backend hosts agent classes that call Claude API. Agents run async, store outputs in SQLite. React/Vite frontend provides dashboard UI to trigger agents and browse results.

**Tech Stack:** Python 3.13, FastAPI, anthropic SDK, aiosqlite, React 18, Vite, TailwindCSS

---

### Task 1: Initialize Project and Git

**Files:**
- Create: `.gitignore`
- Create: `backend/requirements.txt`
- Create: `frontend/package.json` (via npm init)

**Step 1: Initialize git repo**

```bash
cd /c/Ai-Education
git init
```

**Step 2: Create .gitignore**

```
# Python
__pycache__/
*.pyc
*.egg-info/
venv/
.venv/

# Node
node_modules/
dist/

# Environment
.env

# Database
*.db

# IDE
.vscode/
.idea/
```

**Step 3: Create .env template**

Create `.env.example`:
```
ANTHROPIC_API_KEY=your-api-key-here
```

Create `.env`:
```
ANTHROPIC_API_KEY=<actual key>
```

**Step 4: Commit**

```bash
git add .gitignore .env.example docs/
git commit -m "chore: initialize project with gitignore and design docs"
```

---

### Task 2: Backend Project Setup

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/main.py`
- Create: `backend/database.py`

**Step 1: Create requirements.txt**

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
anthropic==0.40.0
aiosqlite==0.20.0
python-dotenv==1.0.1
pydantic==2.9.0
```

**Step 2: Set up Python virtual environment**

```bash
cd /c/Ai-Education
python -m venv backend/.venv
source backend/.venv/Scripts/activate
pip install -r backend/requirements.txt
```

**Step 3: Create database.py**

```python
import aiosqlite
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "agent_outputs.db")


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS agent_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_type TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'running',
                input_params TEXT NOT NULL,
                output TEXT,
                error TEXT,
                created_at TEXT NOT NULL,
                completed_at TEXT
            )
        """)
        await db.commit()


async def create_run(agent_type: str, input_params: str) -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO agent_runs (agent_type, status, input_params, created_at) VALUES (?, ?, ?, ?)",
            (agent_type, "running", input_params, datetime.utcnow().isoformat()),
        )
        await db.commit()
        return cursor.lastrowid


async def complete_run(run_id: int, output: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE agent_runs SET status = ?, output = ?, completed_at = ? WHERE id = ?",
            ("completed", output, datetime.utcnow().isoformat(), run_id),
        )
        await db.commit()


async def fail_run(run_id: int, error: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE agent_runs SET status = ?, error = ?, completed_at = ? WHERE id = ?",
            ("failed", error, datetime.utcnow().isoformat(), run_id),
        )
        await db.commit()


async def get_run(run_id: int) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM agent_runs WHERE id = ?", (run_id,))
        row = await cursor.fetchone()
        return dict(row) if row else None


async def list_runs(agent_type: str | None = None, limit: int = 50) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        if agent_type:
            cursor = await db.execute(
                "SELECT * FROM agent_runs WHERE agent_type = ? ORDER BY created_at DESC LIMIT ?",
                (agent_type, limit),
            )
        else:
            cursor = await db.execute(
                "SELECT * FROM agent_runs ORDER BY created_at DESC LIMIT ?", (limit,)
            )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
```

**Step 4: Create main.py**

```python
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

from database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="AI Education Agents", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
```

**Step 5: Test that it runs**

```bash
cd /c/Ai-Education/backend
source .venv/Scripts/activate
python -m uvicorn main:app --reload --port 8000
# In another terminal: curl http://localhost:8000/api/health
# Expected: {"status":"ok"}
```

**Step 6: Commit**

```bash
git add backend/
git commit -m "feat: add backend project setup with FastAPI and SQLite database"
```

---

### Task 3: Base Agent Class

**Files:**
- Create: `backend/agents/__init__.py`
- Create: `backend/agents/base.py`

**Step 1: Create base agent**

```python
# backend/agents/__init__.py
from .base import BaseAgent
from .research import ResearchAgent
from .case_study import CaseStudyAgent
from .content import ContentAgent
from .course_dev import CourseDevAgent
from .marketing import MarketingAgent

AGENT_REGISTRY = {
    "research": ResearchAgent,
    "case_study": CaseStudyAgent,
    "content": ContentAgent,
    "course_dev": CourseDevAgent,
    "marketing": MarketingAgent,
}
```

```python
# backend/agents/base.py
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
            max_tokens=4096,
            system=self.system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        return response.content[0].text
```

**Step 2: Commit**

```bash
git add backend/agents/
git commit -m "feat: add base agent class with Claude API integration"
```

---

### Task 4: Research Agent

**Files:**
- Create: `backend/agents/research.py`

**Step 1: Create research agent**

```python
# backend/agents/research.py
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
```

**Step 2: Commit**

```bash
git add backend/agents/research.py
git commit -m "feat: add research agent"
```

---

### Task 5: Case Study Agent

**Files:**
- Create: `backend/agents/case_study.py`

**Step 1: Create case study agent**

```python
# backend/agents/case_study.py
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
```

**Step 2: Commit**

```bash
git add backend/agents/case_study.py
git commit -m "feat: add case study agent"
```

---

### Task 6: Content Agent

**Files:**
- Create: `backend/agents/content.py`

**Step 1: Create content agent**

```python
# backend/agents/content.py
from .base import BaseAgent


class ContentAgent(BaseAgent):
    agent_type = "content"
    system_prompt = """You are a content creator for an AI education brand targeting everyday Americans.

Your brand voice is:
- Clear and simple (no jargon, no buzzwords)
- Encouraging (AI is an opportunity, not a threat)
- Practical (every piece of content has actionable takeaways)
- Relatable (use examples from real industries like plumbing, real estate, landscaping)

Your audience includes small business owners, contractors, service professionals, and people who feel overwhelmed by AI. They are NOT developers or tech workers.

Always include hooks, clear structure, and specific calls to action."""

    def build_prompt(self, params: dict) -> str:
        content_type = params.get("content_type", "blog_post")
        topic = params.get("topic", "AI tools for small businesses")
        source_material = params.get("source_material", "")
        target_platform = params.get("target_platform", "")

        prompts = {
            "youtube_script": f"""Write a YouTube video script about: {topic}

Structure:
- Hook (first 10 seconds - grab attention)
- Problem (what the viewer is struggling with)
- Solution (the AI tools/strategies)
- Demo/Examples (walk through specific use cases)
- Call to Action (subscribe, download free guide, etc.)

Length: 8-12 minutes of speaking time (roughly 1200-1800 words).
Include [B-ROLL] and [SCREEN RECORDING] cues where relevant.""",

            "newsletter": f"""Write a newsletter email about: {topic}

Structure:
- Subject line (compelling, under 50 characters)
- Preview text (under 100 characters)
- Opening hook (1-2 sentences)
- Main content (3-5 key points with examples)
- One actionable takeaway
- CTA (link to product, video, or free resource)

Length: 400-600 words. Conversational tone.""",

            "social_post": f"""Create a social media content pack about: {topic}

Create ALL of these:
1. Twitter/X thread (5-7 tweets)
2. LinkedIn post (150-200 words, professional but accessible)
3. Instagram caption (with emoji, hashtags, and hook)
4. TikTok/Shorts script (30-60 seconds, punchy and visual)

Each should be platform-native in tone and format.""",

            "blog_post": f"""Write a blog post about: {topic}

Structure:
- SEO-friendly title (include primary keyword)
- Meta description (155 characters)
- Introduction with hook
- 5-7 main sections with headers
- Practical examples and specific tool recommendations
- Conclusion with CTA

Length: 1500-2000 words. Include bullet points and subheaders for scannability.""",
        }

        prompt = prompts.get(content_type, prompts["blog_post"])

        if source_material:
            prompt += f"\n\nUse this research as source material:\n{source_material}"

        if target_platform:
            prompt += f"\n\nOptimize specifically for {target_platform}."

        return prompt
```

**Step 2: Commit**

```bash
git add backend/agents/content.py
git commit -m "feat: add content agent with multi-format support"
```

---

### Task 7: Course Development Agent

**Files:**
- Create: `backend/agents/course_dev.py`

**Step 1: Create course dev agent**

```python
# backend/agents/course_dev.py
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
```

**Step 2: Commit**

```bash
git add backend/agents/course_dev.py
git commit -m "feat: add course development agent"
```

---

### Task 8: Marketing Agent

**Files:**
- Create: `backend/agents/marketing.py`

**Step 1: Create marketing agent**

```python
# backend/agents/marketing.py
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
```

**Step 2: Commit**

```bash
git add backend/agents/marketing.py
git commit -m "feat: add marketing agent"
```

---

### Task 9: API Routes

**Files:**
- Create: `backend/routes.py`
- Modify: `backend/main.py`

**Step 1: Create routes.py**

```python
# backend/routes.py
import asyncio
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import create_run, complete_run, fail_run, get_run, list_runs
from agents import AGENT_REGISTRY

router = APIRouter(prefix="/api")


class AgentRunRequest(BaseModel):
    agent_type: str
    params: dict


@router.get("/agents")
async def get_agents():
    """List available agents and their parameter schemas."""
    agents = {
        "research": {
            "name": "Research Agent",
            "description": "Scan AI tools, track trends, and generate research summaries",
            "params": {
                "topic": {"type": "text", "label": "Topic", "required": True, "placeholder": "e.g., AI tools for plumbers"},
                "industry": {"type": "text", "label": "Industry (optional)", "required": False, "placeholder": "e.g., construction"},
                "focus": {"type": "select", "label": "Focus", "required": True, "options": ["tools", "trends", "news"]},
            },
        },
        "case_study": {
            "name": "Case Study Agent",
            "description": "Generate real-world AI business case studies",
            "params": {
                "industry": {"type": "text", "label": "Industry", "required": True, "placeholder": "e.g., real estate"},
                "business_type": {"type": "text", "label": "Business Type", "required": True, "placeholder": "e.g., residential realtor"},
                "pain_points": {"type": "textarea", "label": "Pain Points (optional)", "required": False, "placeholder": "e.g., lead generation, scheduling, follow-ups"},
            },
        },
        "content": {
            "name": "Content Agent",
            "description": "Create YouTube scripts, newsletters, social posts, and blog articles",
            "params": {
                "content_type": {"type": "select", "label": "Content Type", "required": True, "options": ["youtube_script", "newsletter", "social_post", "blog_post"]},
                "topic": {"type": "text", "label": "Topic", "required": True, "placeholder": "e.g., 5 AI Tools Every Small Business Should Know"},
                "source_material": {"type": "textarea", "label": "Source Material (optional)", "required": False, "placeholder": "Paste research or notes here"},
                "target_platform": {"type": "text", "label": "Platform (optional)", "required": False, "placeholder": "e.g., YouTube, LinkedIn"},
            },
        },
        "course_dev": {
            "name": "Course Development Agent",
            "description": "Create guides, playbooks, and course outlines",
            "params": {
                "product_type": {"type": "select", "label": "Product Type", "required": True, "options": ["guide", "playbook", "course"]},
                "topic": {"type": "text", "label": "Topic", "required": True, "placeholder": "e.g., AI for Beginners"},
                "target_audience": {"type": "text", "label": "Target Audience", "required": True, "placeholder": "e.g., small business owners"},
                "depth": {"type": "select", "label": "Depth", "required": True, "options": ["beginner", "intermediate", "advanced"]},
            },
        },
        "marketing": {
            "name": "Marketing Agent",
            "description": "Generate lead magnets, landing pages, email sequences, and reports",
            "params": {
                "asset_type": {"type": "select", "label": "Asset Type", "required": True, "options": ["lead_magnet", "landing_page", "email_sequence", "free_report"]},
                "product_name": {"type": "text", "label": "Product Name (if applicable)", "required": False, "placeholder": "e.g., AI Starter Guide"},
                "product_price": {"type": "text", "label": "Price (if applicable)", "required": False, "placeholder": "e.g., $49"},
                "target_audience": {"type": "text", "label": "Target Audience", "required": True, "placeholder": "e.g., contractors"},
                "key_benefit": {"type": "text", "label": "Key Benefit", "required": True, "placeholder": "e.g., save 20 hours per month with AI"},
            },
        },
    }
    return agents


@router.post("/agents/run")
async def run_agent(request: AgentRunRequest):
    """Trigger an agent run. Returns immediately with a run ID."""
    if request.agent_type not in AGENT_REGISTRY:
        raise HTTPException(status_code=400, detail=f"Unknown agent type: {request.agent_type}")

    run_id = await create_run(request.agent_type, json.dumps(request.params))

    # Run agent in background
    asyncio.create_task(_execute_agent(run_id, request.agent_type, request.params))

    return {"run_id": run_id, "status": "running"}


async def _execute_agent(run_id: int, agent_type: str, params: dict):
    """Execute an agent and update the database with results."""
    try:
        agent_class = AGENT_REGISTRY[agent_type]
        agent = agent_class()
        # Run synchronous Claude API call in thread pool
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, agent.run, params)
        await complete_run(run_id, result)
    except Exception as e:
        await fail_run(run_id, str(e))


@router.get("/runs")
async def get_runs(agent_type: str | None = None, limit: int = 50):
    """List agent runs, optionally filtered by type."""
    runs = await list_runs(agent_type=agent_type, limit=limit)
    return runs


@router.get("/runs/{run_id}")
async def get_run_detail(run_id: int):
    """Get details of a specific run."""
    run = await get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run
```

**Step 2: Update main.py to include routes**

Add to `main.py` after the app setup:

```python
from routes import router
app.include_router(router)
```

**Step 3: Test the API**

```bash
cd /c/Ai-Education/backend
source .venv/Scripts/activate
python -m uvicorn main:app --reload --port 8000
# curl http://localhost:8000/api/agents
# Should return JSON with all 5 agent configs
```

**Step 4: Commit**

```bash
git add backend/routes.py backend/main.py
git commit -m "feat: add API routes for agent execution and run management"
```

---

### Task 10: Frontend Setup

**Files:**
- Create: `frontend/` (via Vite scaffolding)

**Step 1: Scaffold React project**

```bash
cd /c/Ai-Education
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install -D tailwindcss @tailwindcss/vite
```

**Step 2: Configure Tailwind with Vite**

Update `frontend/vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
```

Replace `frontend/src/index.css` with:

```css
@import "tailwindcss";
```

**Step 3: Clean up default files**

Remove `frontend/src/App.css` and the default Vite content. Replace `frontend/src/App.jsx` with a placeholder:

```jsx
function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <h1 className="text-2xl p-8">AI Education Dashboard</h1>
    </div>
  )
}

export default App
```

**Step 4: Test it runs**

```bash
cd /c/Ai-Education/frontend
npm run dev
# Should open at http://localhost:5173
```

**Step 5: Commit**

```bash
git add frontend/
git commit -m "feat: scaffold frontend with React, Vite, and TailwindCSS"
```

---

### Task 11: Dashboard Layout and Navigation

**Files:**
- Create: `frontend/src/components/Layout.jsx`
- Create: `frontend/src/components/Sidebar.jsx`
- Modify: `frontend/src/App.jsx`

**Step 1: Create Layout.jsx**

```jsx
// frontend/src/components/Layout.jsx
import Sidebar from './Sidebar'

export default function Layout({ currentPage, onNavigate, children }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
```

**Step 2: Create Sidebar.jsx**

```jsx
// frontend/src/components/Sidebar.jsx
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '~' },
  { id: 'agents', label: 'Run Agent', icon: '>' },
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

**Step 3: Update App.jsx**

```jsx
// frontend/src/App.jsx
import { useState } from 'react'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import AgentsPage from './pages/AgentsPage'
import HistoryPage from './pages/HistoryPage'
import OutputPage from './pages/OutputPage'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [selectedRunId, setSelectedRunId] = useState(null)

  const navigate = (page, runId = null) => {
    setCurrentPage(page)
    if (runId) setSelectedRunId(runId)
  }

  return (
    <Layout currentPage={currentPage} onNavigate={navigate}>
      {currentPage === 'dashboard' && <DashboardPage onNavigate={navigate} />}
      {currentPage === 'agents' && <AgentsPage onNavigate={navigate} />}
      {currentPage === 'history' && <HistoryPage onNavigate={navigate} />}
      {currentPage === 'output' && <OutputPage runId={selectedRunId} onNavigate={navigate} />}
    </Layout>
  )
}

export default App
```

**Step 4: Commit**

```bash
git add frontend/src/
git commit -m "feat: add dashboard layout with sidebar navigation"
```

---

### Task 12: Dashboard Page

**Files:**
- Create: `frontend/src/pages/DashboardPage.jsx`

**Step 1: Create DashboardPage**

```jsx
// frontend/src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react'

export default function DashboardPage({ onNavigate }) {
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/runs?limit=10')
      .then((r) => r.json())
      .then((data) => { setRuns(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const statusColor = {
    running: 'text-yellow-400',
    completed: 'text-green-400',
    failed: 'text-red-400',
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="text-3xl font-bold">{runs.length}</div>
          <div className="text-gray-400 text-sm mt-1">Recent Runs</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="text-3xl font-bold text-green-400">
            {runs.filter((r) => r.status === 'completed').length}
          </div>
          <div className="text-gray-400 text-sm mt-1">Completed</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="text-3xl font-bold text-yellow-400">
            {runs.filter((r) => r.status === 'running').length}
          </div>
          <div className="text-gray-400 text-sm mt-1">Running</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <button
          onClick={() => onNavigate('agents')}
          className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Run New Agent
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : runs.length === 0 ? (
        <div className="text-gray-500 bg-gray-900 rounded-xl p-8 text-center border border-gray-800">
          No runs yet. Click "Run New Agent" to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {runs.map((run) => (
            <button
              key={run.id}
              onClick={() => onNavigate('output', run.id)}
              className="w-full text-left bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{run.agent_type.replace('_', ' ')}</span>
                  <span className={`ml-3 text-sm ${statusColor[run.status]}`}>{run.status}</span>
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

**Step 2: Commit**

```bash
git add frontend/src/pages/DashboardPage.jsx
git commit -m "feat: add dashboard page with stats and recent runs"
```

---

### Task 13: Agent Runner Page

**Files:**
- Create: `frontend/src/pages/AgentsPage.jsx`

**Step 1: Create AgentsPage**

```jsx
// frontend/src/pages/AgentsPage.jsx
import { useState, useEffect } from 'react'

export default function AgentsPage({ onNavigate }) {
  const [agents, setAgents] = useState({})
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [formValues, setFormValues] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/agents')
      .then((r) => r.json())
      .then(setAgents)
  }, [])

  const selectAgent = (key) => {
    setSelectedAgent(key)
    setFormValues({})
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
      <h2 className="text-2xl font-bold mb-6">Run Agent</h2>

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
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add frontend/src/pages/AgentsPage.jsx
git commit -m "feat: add agent runner page with dynamic forms"
```

---

### Task 14: History and Output Pages

**Files:**
- Create: `frontend/src/pages/HistoryPage.jsx`
- Create: `frontend/src/pages/OutputPage.jsx`

**Step 1: Create HistoryPage**

```jsx
// frontend/src/pages/HistoryPage.jsx
import { useState, useEffect } from 'react'

export default function HistoryPage({ onNavigate }) {
  const [runs, setRuns] = useState([])
  const [filter, setFilter] = useState('')

  useEffect(() => {
    const url = filter ? `/api/runs?agent_type=${filter}` : '/api/runs'
    fetch(url).then((r) => r.json()).then(setRuns)
  }, [filter])

  const agentTypes = ['research', 'case_study', 'content', 'course_dev', 'marketing']
  const statusColor = { running: 'text-yellow-400', completed: 'text-green-400', failed: 'text-red-400' }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Run History</h2>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('')}
          className={`px-3 py-1 rounded-lg text-sm ${!filter ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
        >
          All
        </button>
        {agentTypes.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1 rounded-lg text-sm ${filter === type ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
          >
            {type.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {runs.map((run) => (
          <button
            key={run.id}
            onClick={() => onNavigate('output', run.id)}
            className="w-full text-left bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium capitalize">{run.agent_type.replace('_', ' ')}</span>
                <span className={`ml-3 text-sm ${statusColor[run.status]}`}>{run.status}</span>
              </div>
              <span className="text-gray-500 text-sm">{new Date(run.created_at).toLocaleString()}</span>
            </div>
          </button>
        ))}
        {runs.length === 0 && (
          <div className="text-gray-500 text-center py-8">No runs found.</div>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Create OutputPage**

```jsx
// frontend/src/pages/OutputPage.jsx
import { useState, useEffect } from 'react'

export default function OutputPage({ runId, onNavigate }) {
  const [run, setRun] = useState(null)
  const [polling, setPolling] = useState(true)

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
    const interval = polling ? setInterval(fetchRun, 2000) : null
    return () => { if (interval) clearInterval(interval) }
  }, [runId, polling])

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

      {run.status === 'completed' && run.output && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-sm text-gray-400 mb-4">Output</h3>
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

**Step 3: Commit**

```bash
git add frontend/src/pages/
git commit -m "feat: add history and output viewer pages"
```

---

### Task 15: Final Integration Testing

**Step 1: Start backend**

```bash
cd /c/Ai-Education/backend
source .venv/Scripts/activate
python -m uvicorn main:app --reload --port 8000
```

**Step 2: Start frontend**

```bash
cd /c/Ai-Education/frontend
npm run dev
```

**Step 3: Test end-to-end**

1. Open http://localhost:5173
2. Click "Run Agent"
3. Select Research Agent
4. Enter topic: "AI tools for plumbers", focus: "tools"
5. Click Run Agent
6. Verify output page shows "running" then auto-updates to "completed"
7. Verify output displays markdown content

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete AI education agent infrastructure v1"
```
