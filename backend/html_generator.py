import os
import re
import anthropic
from datetime import datetime

OUTPUTS_DIR = os.path.join(os.path.dirname(__file__), "..", "outputs")

SYSTEM_PROMPT = """You are an elite HTML/CSS designer who converts markdown content into stunning, production-grade standalone HTML documents.

You produce HTML that looks like it came from a top-tier design agency. Every document you create should look like a premium paid product — something people would happily pay $50+ for.

## Design Requirements

### Visual Design
- Use a sophisticated, modern color palette. Primary: deep navy (#0f172a), accent: vibrant blue (#3b82f6), success green (#10b981), warm amber (#f59e0b)
- Clean white/light gray (#f8fafc) content backgrounds with subtle shadows
- Professional typography using system font stack: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- Generous whitespace and padding — let the content breathe
- Subtle gradients for headers and hero sections
- Rounded corners (8-12px) on cards and containers
- Soft box shadows for depth (0 1px 3px rgba(0,0,0,0.1))

### Layout & Structure
- Full-width hero/header section with gradient background, title, subtitle, and date
- Table of contents with smooth scroll links for longer documents
- Content organized in card-based sections with clear visual hierarchy
- Responsive design that looks great from mobile to desktop
- Max content width of 900px, centered

### Visual Elements — USE THESE LIBERALLY
- **Stat cards**: Large numbers with labels in colored card grids (e.g., "20+ Hours Saved", "$500 Monthly Savings")
- **Comparison tables**: Styled tables with alternating row colors, hover effects, header highlighting
- **Callout boxes**: Colored left-border boxes for tips, warnings, key takeaways (blue for info, green for tips, amber for important, red for warnings)
- **Icon badges**: Use Unicode symbols as visual markers (✓ ✗ ⚡ 💡 📊 🎯 🔧 💰 ⏰ 📈 🏆 ⭐)
- **Progress/feature cards**: Grid of cards showing tools, features, or steps with icons
- **Charts via Chart.js**: Include <script src="https://cdn.jsdelivr.net/npm/chart.js"></script> and create REAL Chart.js charts wherever data supports it — bar charts for comparisons, pie charts for breakdowns, line charts for trends
- **Pricing tables**: Professional pricing comparison layouts when pricing data exists
- **Step-by-step sections**: Numbered steps with connecting visual lines
- **Quote/testimonial blocks**: Styled blockquotes with attribution
- **Badge/tag pills**: Small colored pills for categories, difficulty levels, pricing tiers
- **Key metrics banner**: A horizontal strip of 3-4 key stats near the top

### Technical Requirements
- COMPLETELY standalone HTML file — ALL CSS must be in a <style> tag in <head>
- Only external resource allowed: Chart.js CDN for charts
- All Chart.js code in a <script> tag at the bottom, using window.onload
- Must render perfectly when opened as a local file in any browser
- Include a print stylesheet (@media print) that removes backgrounds and optimizes for paper
- Add subtle CSS animations for page load (fade-in on sections)
- Responsive: mobile-friendly with appropriate breakpoints

### Content Approach
- Preserve ALL information from the source markdown — do not cut or summarize
- Enhance the structure: break walls of text into scannable sections
- Convert bullet lists into visual card grids where appropriate
- Convert comparison data into styled tables
- Pull out key statistics into prominent stat cards
- Add a professional footer with generation date
- If the content mentions specific numbers or data points, create Chart.js visualizations for them

OUTPUT ONLY THE COMPLETE HTML. No explanation, no markdown fences, no commentary. Just the raw HTML starting with <!DOCTYPE html>."""


def generate_html(markdown_content: str, agent_type: str, params: dict) -> str:
    """Convert markdown agent output into production-grade HTML via Claude."""
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    agent_labels = {
        "research": "Research Report",
        "case_study": "Case Study",
        "content": "Content Asset",
        "course_dev": "Course Material",
        "marketing": "Marketing Asset",
    }

    label = agent_labels.get(agent_type, "AI Report")
    param_summary = ", ".join(f"{k}: {v}" for k, v in params.items() if v)

    user_prompt = f"""Convert this {label} into a stunning, production-grade HTML document.

Document type: {label}
Parameters: {param_summary}

---

{markdown_content}"""

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=32000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )

    html = response.content[0].text

    # Clean up in case Claude wrapped it in markdown fences
    if html.startswith("```"):
        html = re.sub(r"^```html?\n?", "", html)
        html = re.sub(r"\n?```$", "", html)

    return html


def save_html(html_content: str, agent_type: str, params: dict) -> str:
    """Save HTML to outputs directory and return the file path."""
    agent_dir = os.path.join(OUTPUTS_DIR, agent_type)
    os.makedirs(agent_dir, exist_ok=True)

    # Generate filename from params and timestamp
    timestamp = datetime.utcnow().strftime("%Y-%m-%d-%H%M%S")
    slug_parts = []
    for key in ["topic", "industry", "business_type", "content_type", "product_type", "asset_type"]:
        if params.get(key):
            slug_parts.append(params[key])
    slug = "-".join(slug_parts)[:60] if slug_parts else "output"
    slug = re.sub(r"[^a-zA-Z0-9-]", "-", slug).strip("-").lower()
    slug = re.sub(r"-+", "-", slug)

    filename = f"{timestamp}-{slug}.html"
    filepath = os.path.join(agent_dir, filename)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(html_content)

    return filepath
