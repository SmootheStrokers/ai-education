import asyncio
import json
import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse, FileResponse
from pydantic import BaseModel
from database import (
    create_run, complete_run, fail_run, get_run, list_runs,
    create_pipeline_run, get_pipeline_run, list_pipeline_runs, get_pipeline_agent_runs,
    add_tag_to_run, remove_tag_from_run, get_run_tags, list_all_tags, list_runs_by_tag,
    update_review_status,
)
from pipeline_executor import execute_pipeline
from agents import AGENT_REGISTRY
from html_generator import save_html
import design_agent
from presets import get_all_presets, get_preset_by_id
from video_renderer import render_video, is_remotion_available, get_render_progress

router = APIRouter(prefix="/api")


class AgentRunRequest(BaseModel):
    agent_type: str
    params: dict


class PipelineRunRequest(BaseModel):
    name: str
    steps: list[dict]


class TagRequest(BaseModel):
    tag: str


class ReviewStatusRequest(BaseModel):
    review_status: str


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
        "video": {
            "name": "Video Agent",
            "description": "Generate AI-powered videos using Remotion (explainer, promo, social clip, presentation)",
            "params": {
                "video_type": {"type": "select", "label": "Video Type", "required": True, "options": ["explainer", "promo", "social_clip", "presentation"]},
                "topic": {"type": "text", "label": "Topic", "required": True, "placeholder": "e.g., 5 AI Tools That Save 20+ Hours Per Week"},
                "orientation": {"type": "select", "label": "Orientation", "required": True, "options": ["landscape", "portrait", "square"]},
                "target_duration": {"type": "select", "label": "Target Duration", "required": True, "options": ["30", "60", "90", "120", "180"]},
                "source_material": {"type": "textarea", "label": "Source Material (optional)", "required": False, "placeholder": "Paste research or notes here"},
            },
        },
    }
    return agents


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
    """Execute an agent, generate HTML output, and update the database."""
    try:
        agent_class = AGENT_REGISTRY[agent_type]
        agent = agent_class()
        loop = asyncio.get_event_loop()

        # Step 1: Run the agent to get markdown output
        result = await loop.run_in_executor(None, agent.run, params)

        # Step 2: Generate type-specific HTML from the markdown
        # Skip HTML generation for video agent — its output is JSON, not markdown.
        html_path = None
        if agent_type != "video":
            try:
                html_content = await loop.run_in_executor(
                    None, design_agent.generate, result, agent_type, params
                )
                html_path = await loop.run_in_executor(
                    None, save_html, html_content, agent_type, params
                )
            except Exception as html_err:
                # HTML generation failure shouldn't fail the whole run
                print(f"HTML generation failed for run {run_id}: {html_err}")

        # Step 3: For video agent, render MP4 via Remotion
        video_path = None
        if agent_type == "video":
            try:
                video_path = await loop.run_in_executor(
                    None, render_video, result, params, run_id
                )
            except Exception as vid_err:
                print(f"Video rendering failed for run {run_id}: {vid_err}")

        await complete_run(run_id, result, html_output_path=html_path, video_output_path=video_path)
    except Exception as e:
        await fail_run(run_id, str(e))


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


@router.get("/tags")
async def get_tags():
    """List all tags."""
    return await list_all_tags()


@router.get("/runs")
async def get_runs(agent_type: str | None = None, tag: str | None = None, limit: int = 50):
    """List agent runs, optionally filtered by type or tag."""
    if tag:
        return await list_runs_by_tag(tag, limit=limit)
    return await list_runs(agent_type=agent_type, limit=limit)


@router.get("/runs/{run_id}")
async def get_run_detail(run_id: int):
    """Get details of a specific run."""
    run = await get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.get("/runs/{run_id}/html")
async def get_run_html(run_id: int):
    """Serve the generated HTML file for a run."""
    run = await get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    if not run.get("html_output_path"):
        raise HTTPException(status_code=404, detail="No HTML output available")
    if not os.path.exists(run["html_output_path"]):
        raise HTTPException(status_code=404, detail="HTML file not found on disk")

    with open(run["html_output_path"], "r", encoding="utf-8") as f:
        html_content = f.read()
    return HTMLResponse(content=html_content)


@router.get("/runs/{run_id}/download")
async def download_run_html(run_id: int):
    """Download the generated HTML file for a run."""
    run = await get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    if not run.get("html_output_path"):
        raise HTTPException(status_code=404, detail="No HTML output available")
    if not os.path.exists(run["html_output_path"]):
        raise HTTPException(status_code=404, detail="HTML file not found on disk")

    filename = os.path.basename(run["html_output_path"])
    return FileResponse(
        run["html_output_path"],
        media_type="text/html",
        filename=filename,
    )


@router.get("/runs/{run_id}/video")
async def get_run_video(run_id: int):
    """Serve the rendered video file for a run."""
    run = await get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    if not run.get("video_output_path"):
        raise HTTPException(status_code=404, detail="No video output available")
    if not os.path.exists(run["video_output_path"]):
        raise HTTPException(status_code=404, detail="Video file not found on disk")

    return FileResponse(
        run["video_output_path"],
        media_type="video/mp4",
    )


@router.get("/runs/{run_id}/video/progress")
async def get_video_progress(run_id: int):
    """Get video render progress for a run."""
    progress = get_render_progress(run_id)
    if progress is None:
        run = await get_run(run_id)
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")
        if run.get("video_output_path"):
            return {"progress": 100, "stage": "Complete"}
        if run.get("status") == "failed":
            return {"progress": 0, "stage": "Failed"}
        return {"progress": 0, "stage": "Queued"}
    return progress


@router.get("/runs/{run_id}/video/download")
async def download_run_video(run_id: int):
    """Download the rendered video file for a run."""
    run = await get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    if not run.get("video_output_path"):
        raise HTTPException(status_code=404, detail="No video output available")
    if not os.path.exists(run["video_output_path"]):
        raise HTTPException(status_code=404, detail="Video file not found on disk")

    filename = os.path.basename(run["video_output_path"])
    return FileResponse(
        run["video_output_path"],
        media_type="video/mp4",
        filename=filename,
    )


@router.patch("/runs/{run_id}/review")
async def set_review_status(run_id: int, request: ReviewStatusRequest):
    """Update the review status of a run."""
    valid = {"pending", "approved", "exported", "rejected"}
    if request.review_status not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid}")
    run = await get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    await update_review_status(run_id, request.review_status)
    return {"status": "ok", "review_status": request.review_status}


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
