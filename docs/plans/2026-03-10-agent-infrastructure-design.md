# AI Education Agent Infrastructure Design

## Overview

Agent-first infrastructure for an AI education & media business targeting everyday Americans (small business owners, contractors, service professionals). Five specialized AI agents automate research, content creation, and product development, managed through a lightweight web dashboard.

## Architecture

- **Backend**: Python FastAPI server hosting 5 AI agents, REST API, SQLite storage
- **Frontend**: React (Vite) dashboard for triggering agents and viewing outputs
- **AI**: All agents powered by Claude API via Anthropic Python SDK

## Agents

| Agent | Input | Output |
|-------|-------|--------|
| Research | Topic/industry keyword | Tool summaries, trend reports, AI news digests |
| Case Study | Industry + business type | "How [Business Type] Uses AI" breakdowns |
| Content | Research output or topic | YouTube scripts, newsletters, social posts, blog posts |
| Course Dev | Topic + target audience | Lesson outlines, guide chapters, playbook sections |
| Marketing | Product/offer details | Lead magnets, landing page copy, email sequences |

Agents can chain: Research output feeds into Content, Case Study, or Course Dev agents.

## Dashboard

- Agent launcher: select agent, fill parameters, run
- Output browser: list all outputs, filter by agent type, search
- Output viewer: full markdown-rendered output
- Run history: status tracking (running/completed/failed)

## Project Structure

```
Ai-Education/
├── backend/
│   ├── main.py
│   ├── agents/
│   │   ├── base.py
│   │   ├── research.py
│   │   ├── case_study.py
│   │   ├── content.py
│   │   ├── course_dev.py
│   │   └── marketing.py
│   ├── database.py
│   ├── routes.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   └── pages/
│   ├── package.json
│   └── vite.config.js
└── .env
```

## Tech Stack

- Python 3.11+, FastAPI, anthropic SDK, aiosqlite
- React 18, Vite, TailwindCSS
- SQLite (agent_outputs.db)
- Async agent execution with polling for completion

## Decisions

- SQLite over PostgreSQL: zero setup, sufficient for current scale, migrate later
- Claude API for all agents: consistent quality, simple architecture
- Agent-first approach: build content pipeline before public-facing platform
- Dashboard over CLI: better visibility into agent outputs for daily use
