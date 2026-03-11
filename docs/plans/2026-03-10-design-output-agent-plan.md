# Design Output Agent — Implementation Plan

## Task 1: Create shared design tokens (base.py)
- Create `backend/design_prompts/__init__.py`
- Create `backend/design_prompts/base.py` with shared CSS tokens, typography, color palette, footer template
- These are string constants imported by all type-specific prompts

## Task 2: Create type-specific prompts (14 files)
- `newsletter.py` — email newsletter layout
- `youtube_script.py` — screenplay/teleprompter format
- `social_media.py` — per-platform card layout
- `blog_post.py` — magazine article format
- `research_report.py` — data report with stats/charts
- `case_study.py` — three-act narrative
- `guide.py` — eBook with TOC/chapters
- `playbook.py` — 30-day roadmap format
- `course_outline.py` — course catalog with modules
- `lead_magnet.py` — PDF-style cover + sections
- `landing_page.py` — actual landing page HTML
- `email_sequence.py` — email flow cards
- `free_report.py` — white paper format
- Each exports a `SYSTEM_PROMPT` string

## Task 3: Create design_agent.py
- `resolve_design_key(agent_type, params)` — maps agent_type + content_type to design key
- `generate(markdown, agent_type, params)` — main entry point
- Falls back to html_generator.py on error
- Uses same Claude model as html_generator (haiku)

## Task 4: Integrate into routes.py and pipeline_executor.py
- Replace `generate_html()` calls with `design_agent.generate()`
- Keep `save_html()` from html_generator (file saving logic unchanged)
- Update imports

## Task 5: Verify build and test
- Verify backend imports cleanly
- Verify frontend builds
- Test that fallback works if design key is unknown
