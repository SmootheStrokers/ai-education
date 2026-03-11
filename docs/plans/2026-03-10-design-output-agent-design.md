# Design Output Agent — Type-Specific HTML Rendering

## Problem

The current `html_generator.py` uses one generic system prompt for all content types. A YouTube script with `[B-ROLL]` cues gets the same card-and-stat treatment as a research report. A newsletter with 5 subject line variants gets flattened into a generic pretty page. Content types are highly specialized at the agent level but completely genericized at the output level.

## Solution

Replace the one-size-fits-all HTML generator with a **Design Output Agent** — a module that selects type-specific system prompts to generate HTML that matches the content format.

## Architecture

### Design Template Map

| Agent Type | Content Type | Design Key | Output Style |
|---|---|---|---|
| content | newsletter | `newsletter` | Email newsletter layout (subject lines, CTA, footer) |
| content | youtube_script | `youtube_script` | Screenplay format (scene cues, timing, two-column) |
| content | social_post | `social_media` | Per-platform cards (Twitter, LinkedIn, Instagram, TikTok) |
| content | blog_post | `blog_post` | Magazine article (hero, pull quotes, author box) |
| research | * | `research_report` | Data report (stat cards, tables, charts, citations) |
| case_study | * | `case_study` | Narrative (three-act, before/after, timeline) |
| course_dev | guide | `guide` | eBook (TOC, chapters, exercises, tip boxes) |
| course_dev | playbook | `playbook` | Playbook (30-day roadmap, steps, tool cards) |
| course_dev | course | `course_outline` | Course catalog (modules, lessons, time estimates) |
| marketing | lead_magnet | `lead_magnet` | PDF-style (cover page, sections, CTA) |
| marketing | landing_page | `landing_page` | Landing page (hero, benefits, pricing, CTA) |
| marketing | email_sequence | `email_sequence` | Email flow (numbered emails, subject lines, timing) |
| marketing | free_report | `free_report` | White paper (executive summary, data sections) |

### Data Flow

```
Agent.run(params) → markdown
  → design_agent.generate(markdown, agent_type, params)
    → resolve_design_key(agent_type, params) → "newsletter"
    → load type-specific prompt
    → Claude API → type-aware HTML
    → save_html() → file path
```

### File Structure

```
backend/
  design_agent.py           # Main module: resolves type, calls Claude
  design_prompts/           # Type-specific prompt modules
    __init__.py
    base.py                 # Shared design tokens
    newsletter.py
    youtube_script.py
    social_media.py
    blog_post.py
    research_report.py
    case_study.py
    guide.py
    playbook.py
    course_outline.py
    lead_magnet.py
    landing_page.py
    email_sequence.py
    free_report.py
  html_generator.py         # Kept as fallback
```

### Shared Design Tokens (base.py)

All prompts inherit:
- Color palette matching frontend (amber/ink editorial system)
- Typography: DM Serif Display, DM Sans, JetBrains Mono via Google Fonts
- Standalone HTML (all CSS in `<style>`, no external deps except fonts/Chart.js)
- Print stylesheet, responsive breakpoints
- Footer with generation timestamp

### Integration

- `routes.py` `_execute_agent()` — swap `generate_html()` for `design_agent.generate()`
- `pipeline_executor.py` — same swap
- `html_generator.py` — becomes fallback for unknown types
- No frontend changes needed

### Error Handling

- Type-specific prompt fails → fall back to generic `html_generator.py`
- Unrecognized design key → use `research_report` as default
- HTML failure doesn't fail the agent run (existing behavior)
