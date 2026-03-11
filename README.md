# AI Education Content Platform

An agentic content production platform that automates AI education content creation for non-technical Americans. Built with a FastAPI backend, React frontend, and Claude-powered AI agents.

## Overview

This platform powers an AI literacy brand targeting small business owners, contractors, realtors, and service professionals. It uses specialized AI agents to research, write, and produce educational content at scale — enabling a small team to produce the output of a much larger organization.

## Architecture

```
├── backend/          # FastAPI + Python backend
│   ├── agents/       # AI agent modules
│   ├── design_prompts/  # Design-specific prompt templates
│   ├── database.py   # SQLite via aiosqlite
│   ├── routes.py     # REST API endpoints
│   ├── pipeline_executor.py  # Multi-step pipeline runner
│   ├── html_generator.py     # HTML output rendering
│   ├── design_agent.py       # Design output agent
│   └── video_renderer.py     # Remotion video rendering
├── frontend/         # React + Vite + Tailwind CSS
│   └── src/
│       ├── components/  # Layout, Sidebar
│       └── pages/       # Dashboard, Agents, Pipelines, Library, etc.
├── video/            # Remotion video compositions
└── outputs/          # Generated HTML content
```

## AI Agents

| Agent | Description |
|-------|-------------|
| **Research** | Scans AI tools, tracks trends, generates research summaries |
| **Case Study** | Creates real-world AI adoption case studies for specific industries |
| **Content** | Produces newsletters, blog posts, social media, and guides |
| **Course Dev** | Builds course outlines, lesson plans, and curriculum materials |
| **Marketing** | Generates landing pages, email sequences, and lead magnets |
| **Video** | Creates video scripts and renders via Remotion |
| **Design** | Produces styled HTML outputs for all content types |

## Features

- **Dashboard** — Production metrics, recent runs, and quick actions
- **Agent Runner** — Configure and execute individual agents
- **Pipelines** — Chain multiple agents into automated workflows with preset templates
- **Content Library** — Browse, tag, filter, and review generated content
- **Agent Outputs** — View styled HTML outputs from the design agent
- **Analytics** — Track content production and agent performance
- **Tagging System** — Organize content with custom tags
- **Review Workflow** — Mark content as draft, approved, or published

## Tech Stack

**Backend:**
- Python 3.11+
- FastAPI + Uvicorn
- Anthropic Claude API (claude-sonnet-4-20250514)
- SQLite via aiosqlite
- Pydantic for validation

**Frontend:**
- React 19
- Vite 7
- Tailwind CSS 4

**Video:**
- Remotion (React-based video rendering)
- TypeScript

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### Backend Setup

```bash
cd backend
pip install -r requirements.txt

# Create .env file
echo "ANTHROPIC_API_KEY=your-key-here" > .env

# Start the server
uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies API requests to the backend on port 8000.

### Video Rendering (Optional)

```bash
cd video
npm install
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | List available agents and schemas |
| POST | `/api/run` | Execute a single agent |
| GET | `/api/runs` | List all runs with optional filters |
| GET | `/api/run/{id}` | Get a specific run result |
| POST | `/api/pipeline` | Execute a multi-step pipeline |
| GET | `/api/pipelines` | List pipeline runs |
| POST | `/api/run/{id}/tags` | Add a tag to a run |
| DELETE | `/api/run/{id}/tags/{tag}` | Remove a tag |
| PUT | `/api/run/{id}/review` | Update review status |
| GET | `/api/presets` | List pipeline preset templates |
| GET | `/api/design/{id}` | Get styled HTML output |
| POST | `/api/video/render` | Render a video from agent output |

## License

Private — All rights reserved.
