import { useState, useEffect, useMemo } from 'react'
import { AGENTS, formatAgentType, timeAgo, formatDate, statusDot, statusColor, getRunTitle } from '../shared'

const AGENT_KEYS = Object.keys(AGENTS)

export default function HistoryPage({ onNavigate }) {
  const [runs, setRuns] = useState([])
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const url = filter ? `/api/runs?agent_type=${filter}` : '/api/runs'
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setRuns(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [filter])

  /* ── Derived data ─────────────────────────── */

  const filteredRuns = useMemo(() => {
    if (!search.trim()) return runs
    const q = search.toLowerCase()
    return runs.filter((run) => {
      const title = getRunTitle(run).toLowerCase()
      const type = formatAgentType(run.agent_type).toLowerCase()
      return title.includes(q) || type.includes(q)
    })
  }, [runs, search])

  const stats = useMemo(() => {
    const total = runs.length
    const completed = runs.filter((r) => r.status === 'completed').length
    const failed = runs.filter((r) => r.status === 'failed').length
    const running = runs.filter((r) => r.status === 'running').length
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, failed, running, rate }
  }, [runs])

  const countsByType = useMemo(() => {
    const counts = { '': runs.length }
    AGENT_KEYS.forEach((k) => {
      counts[k] = runs.filter((r) => r.agent_type === k).length
    })
    return counts
  }, [runs])

  /* ── Helpers ──────────────────────────────── */

  function hasAsset(run, ext) {
    try {
      if (run.output_html && ext === 'html') return true
      if (run.output_file && run.output_file.endsWith(`.${ext}`)) return true
    } catch { /* noop */ }
    return false
  }

  /* ── Render ───────────────────────────────── */

  return (
    <div className="animate-fade-in space-y-6">

      {/* ── Header ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-electric/10 border border-electric/20 flex items-center justify-center text-lg">
              🕘
            </div>
            <h2 className="text-3xl font-display font-bold text-gradient tracking-tight">Run History</h2>
          </div>
          <p className="text-void-400 text-sm ml-[52px]">Track every agent execution across your pipeline</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-void-500 text-sm pointer-events-none">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search runs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-void-900 border border-void-700 text-sm text-void-100 placeholder:text-void-500 focus:outline-none focus:border-electric/50 focus:ring-1 focus:ring-electric/25 transition-all"
          />
        </div>
      </div>

      {/* ── Stats bar ───────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger">
        {[
          { label: 'Total Runs', value: stats.total, color: 'text-void-100', bg: 'bg-void-800/50', border: 'border-void-700' },
          { label: 'Completed', value: stats.completed, color: 'text-neon-green', bg: 'bg-neon-green/5', border: 'border-neon-green/15' },
          { label: 'Failed', value: stats.failed, color: 'text-rose', bg: 'bg-rose/5', border: 'border-rose/15' },
          { label: 'Success Rate', value: `${stats.rate}%`, color: 'text-electric-bright', bg: 'bg-electric/5', border: 'border-electric/15' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} ${s.border} border rounded-xl px-4 py-3 animate-fade-in`}>
            <div className={`text-2xl font-display font-bold ${s.color} tracking-tight`}>{s.value}</div>
            <div className="text-void-400 text-xs font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filter chips ────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            !filter
              ? 'bg-electric/15 text-electric-bright border border-electric/30 shadow-sm shadow-electric/10'
              : 'bg-void-850 border border-void-700 text-void-300 hover:text-void-100 hover:border-void-600'
          }`}
        >
          All
          <span className={`font-mono text-[10px] ml-0.5 ${!filter ? 'text-electric/70' : 'text-void-500'}`}>
            {countsByType[''] || 0}
          </span>
        </button>
        {AGENT_KEYS.map((type) => {
          const agent = AGENTS[type]
          const active = filter === type
          return (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                active
                  ? 'bg-electric/15 text-electric-bright border border-electric/30 shadow-sm shadow-electric/10'
                  : 'bg-void-850 border border-void-700 text-void-300 hover:text-void-100 hover:border-void-600'
              }`}
            >
              <span className="text-sm">{agent.icon}</span>
              {agent.label}
              <span className={`font-mono text-[10px] ml-0.5 ${active ? 'text-electric/70' : 'text-void-500'}`}>
                {countsByType[type] || 0}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Data table ──────────────────────── */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      ) : filteredRuns.length === 0 ? (
        /* ── Empty state ─────────────────────── */
        <div className="card p-16 text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-void-850 border border-void-700 mb-4">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" className="text-void-500">
              <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                d="M12 8v4l2.5 1.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h3 className="text-lg font-display font-semibold text-void-200 mb-1">No runs found</h3>
          <p className="text-void-500 text-sm max-w-sm mx-auto">
            {search
              ? `No results matching "${search}". Try a different search term.`
              : 'Run an agent from the Agents page to see execution history here.'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[40px_1fr_minmax(120px,1.2fr)_100px_100px] gap-3 px-5 py-3 border-b border-void-700/60 text-[11px] font-mono font-semibold text-void-500 uppercase tracking-wider">
            <span>Status</span>
            <span>Agent</span>
            <span>Title</span>
            <span>Assets</span>
            <span className="text-right">Time</span>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-void-800/60 stagger">
            {filteredRuns.map((run) => {
              const agent = AGENTS[run.agent_type] || { icon: '📄', label: run.agent_type, color: '#94a3b8' }
              const title = getRunTitle(run)
              const statusLabel = run.status === 'completed' ? 'Done' : run.status === 'running' ? 'Running' : 'Failed'

              return (
                <button
                  key={run.id}
                  onClick={() => onNavigate('output', run.id)}
                  className="w-full text-left grid grid-cols-[40px_1fr_minmax(120px,1.2fr)_100px_100px] gap-3 px-5 py-3.5 items-center transition-colors hover:bg-void-850/60 group animate-fade-in"
                >
                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot(run.status)}`} />
                    <span className={`text-[11px] font-mono font-semibold ${statusColor(run.status)}`}>
                      {statusLabel}
                    </span>
                  </div>

                  {/* Agent */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                      style={{ backgroundColor: agent.color + '15', border: `1px solid ${agent.color}25` }}
                    >
                      {agent.icon}
                    </span>
                    <span className="text-sm font-medium text-void-200 group-hover:text-white transition-colors truncate">
                      {agent.label}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="min-w-0">
                    <span className="text-sm text-void-300 group-hover:text-void-100 transition-colors truncate block">
                      {title}
                    </span>
                  </div>

                  {/* Assets */}
                  <div className="flex items-center gap-1.5">
                    {hasAsset(run, 'html') && (
                      <span
                        className="badge"
                        style={{ backgroundColor: 'rgba(129,140,248,0.12)', color: '#a5b4fc', border: '1px solid rgba(129,140,248,0.2)' }}
                      >
                        HTML
                      </span>
                    )}
                    {hasAsset(run, 'mp4') && (
                      <span
                        className="badge"
                        style={{ backgroundColor: 'rgba(34,211,238,0.12)', color: '#67e8f9', border: '1px solid rgba(34,211,238,0.2)' }}
                      >
                        MP4
                      </span>
                    )}
                    {!hasAsset(run, 'html') && !hasAsset(run, 'mp4') && (
                      <span className="text-void-600 text-xs">--</span>
                    )}
                  </div>

                  {/* Time */}
                  <div className="text-right">
                    <span className="text-xs font-mono text-void-400 group-hover:text-void-300 transition-colors">
                      {timeAgo(run.created_at)}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Footer */}
          <div className="px-5 py-2.5 border-t border-void-700/60 flex items-center justify-between">
            <span className="text-[11px] font-mono text-void-500">
              {filteredRuns.length} {filteredRuns.length === 1 ? 'run' : 'runs'}
              {search && ` matching "${search}"`}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
