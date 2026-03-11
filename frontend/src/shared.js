/* ══════════════════════════════════════════════
   SHARED CONSTANTS & UTILITIES
   ══════════════════════════════════════════════ */

export const AGENTS = {
  research:   { label: 'Research',    name: 'Research Agent',    icon: '\ud83d\udd2c', color: '#60a5fa', desc: 'Scan AI tools, trends, and research summaries' },
  case_study: { label: 'Case Study',  name: 'Case Study Agent',  icon: '\ud83d\udcca', color: '#a78bfa', desc: 'Generate real-world AI business case studies' },
  content:    { label: 'Content',     name: 'Content Agent',     icon: '\u270d\ufe0f', color: '#fbbf24', desc: 'YouTube scripts, newsletters, social posts, blogs' },
  course_dev: { label: 'Course',      name: 'Course Dev Agent',  icon: '\ud83c\udf93', color: '#2dd4bf', desc: 'Guides, playbooks, and course outlines' },
  marketing:  { label: 'Marketing',   name: 'Marketing Agent',   icon: '\ud83c\udfaf', color: '#fb7185', desc: 'Lead magnets, landing pages, email sequences' },
  video:      { label: 'Video',       name: 'Video Agent',       icon: '\ud83c\udfac', color: '#22d3ee', desc: 'AI-powered videos via Remotion' },
}

export const REVIEW_STATUSES = ['pending', 'approved', 'exported', 'rejected']

export const REVIEW_COLORS = {
  pending:  'bg-gold/10 text-gold border-gold/25',
  approved: 'bg-neon-green/10 text-neon-green border-neon-green/25',
  exported: 'bg-signal-blue/10 text-signal-blue border-signal-blue/25',
  rejected: 'bg-rose/10 text-rose border-rose/25',
}

export const REVIEW_ICONS = {
  pending: '\u25cb', approved: '\u2713', exported: '\u2197', rejected: '\u2717',
}

export function formatAgentType(type) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function timeAgo(dateStr) {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function getRunTitle(run) {
  try {
    const p = JSON.parse(run.input_params)
    return p.topic || p.product_name || p.industry || formatAgentType(run.agent_type)
  } catch {
    return formatAgentType(run.agent_type)
  }
}

export function getContentType(run) {
  try {
    const p = JSON.parse(run.input_params)
    return p.content_type || p.product_type || p.asset_type || p.focus || run.agent_type
  } catch {
    return run.agent_type
  }
}

export function statusColor(status) {
  if (status === 'completed') return 'text-neon-green'
  if (status === 'running') return 'text-gold'
  return 'text-rose'
}

export function statusDot(status) {
  if (status === 'completed') return 'bg-neon-green'
  if (status === 'running') return 'bg-gold animate-pulse'
  return 'bg-rose'
}
