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
