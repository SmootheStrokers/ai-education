"""Design Output Agent — Type-specific HTML rendering.

Replaces the generic html_generator with content-type-aware HTML generation.
Each content type gets a specialized system prompt that produces HTML matching
the format (newsletter looks like a newsletter, script looks like a screenplay, etc.)
"""

import os
import re
import anthropic
from datetime import datetime
from design_prompts import PROMPT_REGISTRY
from html_generator import generate_html as generic_generate_html, save_html


# Map (agent_type, content_type/product_type/asset_type) → design key
DESIGN_KEY_MAP = {
    # Content agent subtypes
    ("content", "newsletter"): "newsletter",
    ("content", "youtube_script"): "youtube_script",
    ("content", "social_post"): "social_media",
    ("content", "blog_post"): "blog_post",
    # Research agent (all focuses)
    ("research", "tools"): "research_report",
    ("research", "trends"): "research_report",
    ("research", "news"): "research_report",
    # Case study agent
    ("case_study", None): "case_study",
    # Course dev agent subtypes
    ("course_dev", "guide"): "guide",
    ("course_dev", "playbook"): "playbook",
    ("course_dev", "course"): "course_outline",
    # Marketing agent subtypes
    ("marketing", "lead_magnet"): "lead_magnet",
    ("marketing", "landing_page"): "landing_page",
    ("marketing", "email_sequence"): "email_sequence",
    ("marketing", "free_report"): "free_report",
}

# Fallback: agent_type alone → design key
AGENT_TYPE_FALLBACK = {
    "research": "research_report",
    "case_study": "case_study",
    "content": "blog_post",
    "course_dev": "guide",
    "marketing": "lead_magnet",
}


def resolve_design_key(agent_type: str, params: dict) -> str:
    """Resolve the design template key from agent_type and params."""
    # Extract the content subtype from params
    subtype = (
        params.get("content_type")
        or params.get("product_type")
        or params.get("asset_type")
        or params.get("focus")
    )

    # Try exact match first
    key = DESIGN_KEY_MAP.get((agent_type, subtype))
    if key:
        return key

    # Try with None subtype (for agents like case_study that don't have subtypes)
    key = DESIGN_KEY_MAP.get((agent_type, None))
    if key:
        return key

    # Try agent_type fallback
    key = AGENT_TYPE_FALLBACK.get(agent_type)
    if key:
        return key

    # Ultimate fallback
    return "research_report"


def generate(markdown_content: str, agent_type: str, params: dict) -> str:
    """Generate type-specific HTML from markdown content.

    This is the main entry point, replacing html_generator.generate_html().
    Falls back to the generic generator if anything goes wrong.
    """
    design_key = resolve_design_key(agent_type, params)
    system_prompt = PROMPT_REGISTRY.get(design_key)

    if not system_prompt:
        # Unknown design key — fall back to generic
        return generic_generate_html(markdown_content, agent_type, params)

    try:
        return _generate_typed_html(markdown_content, agent_type, params, design_key, system_prompt)
    except Exception as e:
        print(f"Design agent failed for {design_key} (run type={agent_type}): {e}")
        print("Falling back to generic HTML generator")
        return generic_generate_html(markdown_content, agent_type, params)


def _generate_typed_html(
    markdown_content: str,
    agent_type: str,
    params: dict,
    design_key: str,
    system_prompt: str,
) -> str:
    """Call Claude with a type-specific system prompt to generate HTML."""
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    design_labels = {
        "newsletter": "Email Newsletter",
        "youtube_script": "YouTube Script",
        "social_media": "Social Media Post Pack",
        "blog_post": "Blog Article",
        "research_report": "Research Report",
        "case_study": "Business Case Study",
        "guide": "Digital Guide / eBook",
        "playbook": "Industry Playbook",
        "course_outline": "Course Outline",
        "lead_magnet": "Lead Magnet Package",
        "landing_page": "Sales Landing Page",
        "email_sequence": "Email Marketing Sequence",
        "free_report": "Free Industry Report",
    }

    label = design_labels.get(design_key, "Content Document")
    param_summary = ", ".join(f"{k}: {v}" for k, v in params.items() if v and k != "source_material")

    user_prompt = f"""Convert this {label} into a stunning, production-grade HTML document that authentically represents a {label.lower()}.

Document type: {label}
Agent type: {agent_type}
Parameters: {param_summary}
Generated: {datetime.utcnow().strftime("%B %d, %Y")}

---

{markdown_content}"""

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=32000,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )

    html = response.content[0].text

    # Clean up markdown fences if present
    if html.startswith("```"):
        html = re.sub(r"^```html?\n?", "", html)
        html = re.sub(r"\n?```$", "", html)

    return html
