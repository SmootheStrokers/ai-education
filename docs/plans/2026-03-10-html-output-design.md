# Production-Grade HTML Output Generation Design

## Overview

When an agent run completes, the system automatically converts the markdown output into a beautiful, standalone HTML file via Claude API. Files are saved to disk, stored in the database, and viewable/downloadable from the dashboard.

## Flow

1. Agent completes, markdown output saved to DB
2. Markdown sent to Claude with specialized HTML generation prompt
3. Claude returns standalone HTML with embedded CSS, Chart.js charts, tables, icons
4. HTML saved to `outputs/<agent_type>/<timestamp>-<slug>.html`
5. `html_output_path` stored in `agent_runs` table
6. Dashboard shows "View HTML" and "Download HTML" buttons

## HTML Quality Requirements

- Standalone (all CSS embedded, CDN libs only for Chart.js)
- Modern, professional typography and color palette
- Chart.js charts where statistics/data are present
- Styled tables for comparisons, pricing, tool lists
- Visual callouts, stat cards, highlight boxes
- Responsive layout
- Print-friendly

## Database Change

Add `html_output_path TEXT` column to `agent_runs` table.

## New API Endpoints

- `GET /api/runs/{id}/html` — Serve the generated HTML
- `GET /api/runs/{id}/download` — Download as attachment

## New Files

- `backend/html_generator.py` — HTML generation via Claude
- `outputs/` directory tree per agent type

## Dashboard Changes

OutputPage.jsx: Add "View HTML" and "Download HTML" buttons when run is completed.
