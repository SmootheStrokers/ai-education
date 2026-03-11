"""Shared design tokens for all type-specific HTML prompts."""

DESIGN_TOKENS = """
## Shared Design System

### Fonts (load via Google Fonts in <head>)
```html
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300..700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```
- Display headings: 'DM Serif Display', Georgia, serif
- Body text: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif
- Monospace/code/metadata: 'JetBrains Mono', monospace

### Color Palette
- Ink 950 (deepest bg): #08090d
- Ink 900 (card bg): #0f1118
- Ink 800 (elevated surface): #1a1d28
- Ink 700 (borders): #252838
- Ink 600 (subtle borders): #363a4d
- Ink 400 (secondary text): #6b7194
- Ink 200 (body text): #b8bdd4
- Ink 100 (primary text): #e0e3ef
- White: #ffffff
- Amber Glow (primary accent): #e8a832
- Amber Warm: #d49a2a
- Amber Deep: #b07d1a
- Jade (success/positive): #34d399
- Signal Red (error/warning): #f87171
- Signal Blue (info/links): #60a5fa
- Signal Purple (special): #a78bfa

### Technical Requirements
- FULLY standalone HTML — all CSS in <style> in <head>
- Only external resources: Google Fonts link and optionally Chart.js CDN
- Must render perfectly when opened as a local file
- Include @media print stylesheet (remove dark bg, optimize for paper)
- Responsive: works from 360px to 1200px+
- Use CSS variables for the color palette for consistency
- Subtle fade-in animation on page load

### Footer
- Include a professional footer with: generation date, "AI for Everyday Americans" branding
- Use DM Sans at 12px, ink-400 color, centered, with a thin top border

OUTPUT ONLY THE COMPLETE HTML. No explanation, no markdown fences, no commentary. Just raw HTML starting with <!DOCTYPE html>.
"""
