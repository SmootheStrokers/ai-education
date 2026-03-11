import { useState, useEffect, useMemo } from 'react'

/* ── Agent Config ────────────────────────────── */

const AGENTS = {
  research:   { label: 'Research',    icon: '\ud83d\udd2c', gradient: 'from-blue-500/20 to-cyan-500/10', color: '#60a5fa', ring: '#3b82f6' },
  case_study: { label: 'Case Study',  icon: '\ud83d\udcca', gradient: 'from-purple-500/20 to-pink-500/10', color: '#a78bfa', ring: '#8b5cf6' },
  content:    { label: 'Content',     icon: '\u270d\ufe0f', gradient: 'from-amber-500/20 to-orange-500/10', color: '#fbbf24', ring: '#f59e0b' },
  course_dev: { label: 'Course',      icon: '\ud83c\udf93', gradient: 'from-teal-500/20 to-emerald-500/10', color: '#2dd4bf', ring: '#14b8a6' },
  marketing:  { label: 'Marketing',   icon: '\ud83c\udfaf', gradient: 'from-rose-500/20 to-red-500/10', color: '#fb7185', ring: '#f43f5e' },
  video:      { label: 'Video',       icon: '\ud83c\udfac', gradient: 'from-cyan-500/20 to-blue-500/10', color: '#22d3ee', ring: '#06b6d4' },
}

/* ── Helpers ─────────────────────────────────── */

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

/* ── Mini Sparkline (CSS bars) ───────────────── */

function Sparkline({ data, color, height = 28 }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-px" style={{ height }}>
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm min-w-[3px]"
          style={{
            height: `${Math.max(12, (v / max) * 100)}%`,
            background: color,
            opacity: 0.25 + (i / data.length) * 0.75,
            transformOrigin: 'bottom',
            animation: `bar-rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 50}ms both`,
          }}
        />
      ))}
    </div>
  )
}

/* ── Ring Chart ──────────────────────────────── */

function RingChart({ percentage, color, size = 52, stroke = 4 }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (percentage / 100) * circ
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(30,41,59,0.5)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
      />
    </svg>
  )
}

/* ══════════════════════════════════════════════
   DASHBOARD
   ══════════════════════════════════════════════ */

export default function DashboardPage({ onNavigate }) {
  const [runs, setRuns] = useState([])
  const [pipelineRuns, setPipelineRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())

  const fetchData = () => {
    Promise.all([
      fetch('/api/runs?limit=50').then(r => r.json()),
      fetch('/api/pipelines?limit=10').then(r => r.json()),
    ]).then(([r, p]) => {
      setRuns(r)
      setPipelineRuns(p)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])
  useEffect(() => {
    if (!runs.some(r => r.status === 'running')) return
    const i = setInterval(() => { fetchData(); setNow(Date.now()) }, 3000)
    return () => clearInterval(i)
  }, [runs])

  const completed = runs.filter(r => r.status === 'completed')
  const running   = runs.filter(r => r.status === 'running')
  const failed    = runs.filter(r => r.status === 'failed')
  const assets    = runs.filter(r => r.html_output_path || r.video_output_path)
  const successRate = runs.length ? Math.round((completed.length / runs.length) * 100) : 0

  const byAgent = useMemo(() => {
    const m = {}
    completed.forEach(r => { m[r.agent_type] = (m[r.agent_type] || 0) + 1 })
    return m
  }, [completed])

  const sparkData = useMemo(() => {
    const b = Array(7).fill(0)
    runs.forEach(r => {
      const d = Math.min(6, Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000))
      b[6 - d]++
    })
    return b
  }, [runs])

  /* ── Loading ──────────────────────────── */

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="skeleton h-14 w-96 rounded-2xl" />
        <div className="skeleton h-4 w-64 rounded-lg" />
        <div className="grid grid-cols-4 gap-5 mt-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-5 gap-5">
          <div className="col-span-3 skeleton h-80 rounded-2xl" />
          <div className="col-span-2 skeleton h-80 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* ════════════════════════════════════
          HEADER
          ════════════════════════════════════ */}
      <header className="mb-10 animate-fade-in">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] text-void-500 font-mono tracking-[0.15em] uppercase mb-2">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-[40px] font-display font-extrabold tracking-[-0.03em] leading-none text-gradient">
              {greeting()}
            </h1>
            <p className="text-void-400 text-[14px] mt-2 font-medium tracking-[-0.01em]">
              AI for Everyday Americans — Content Production Hub
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('agents')}
              className="btn-primary flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Run
            </button>
            <button
              onClick={() => onNavigate('pipelines')}
              className="btn-secondary"
            >
              Pipelines
            </button>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════
          KPI ROW
          ════════════════════════════════════ */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        {[
          {
            value: runs.length, label: 'Total Runs', sub: 'All time',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            ),
            color: '#818cf8', bg: 'from-electric/10 to-transparent',
            spark: sparkData, sparkColor: '#818cf8',
          },
          {
            value: completed.length, label: 'Completed', sub: `${successRate}% success`,
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            ),
            color: '#34d399', bg: 'from-neon-green/10 to-transparent',
            ring: { pct: successRate, color: '#34d399' },
          },
          {
            value: assets.length, label: 'Assets', sub: 'HTML & Video',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            ),
            color: '#22d3ee', bg: 'from-cyan/10 to-transparent',
          },
          {
            value: failed.length, label: 'Failed', sub: failed.length === 0 ? 'All clear' : 'Needs attention',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            ),
            color: failed.length > 0 ? '#fb7185' : '#475569',
            bg: failed.length > 0 ? 'from-rose/10 to-transparent' : 'from-void-700/10 to-transparent',
          },
        ].map((kpi, i) => (
          <div
            key={i}
            className={`card-elevated p-6 animate-slide-up relative overflow-hidden group`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${kpi.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            <div className="relative z-10">
              {/* Icon + Sub */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-[12px] flex items-center justify-center"
                  style={{ background: `${kpi.color}15`, color: kpi.color }}>
                  {kpi.icon}
                </div>
                {kpi.ring && (
                  <RingChart percentage={kpi.ring.pct} color={kpi.ring.color} size={44} stroke={3} />
                )}
              </div>

              {/* Number */}
              <div className="text-[36px] font-display font-extrabold text-white tracking-[-0.04em] leading-none animate-number"
                style={{ animationDelay: `${200 + i * 80}ms` }}>
                {kpi.value}
              </div>
              <div className="text-[12px] text-void-300 font-semibold mt-1 tracking-[-0.01em]">{kpi.label}</div>
              <div className="text-[11px] text-void-500 mt-0.5 font-mono">{kpi.sub}</div>

              {/* Sparkline */}
              {kpi.spark && (
                <div className="mt-4 pt-3 border-t border-void-700/40">
                  <Sparkline data={kpi.spark} color={kpi.sparkColor} height={22} />
                  <div className="text-[9px] text-void-600 font-mono mt-1.5 tracking-wide">LAST 7 DAYS</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════
          LIVE RUNS
          ════════════════════════════════════ */}
      {running.length > 0 && (
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '350ms' }}>
          <div className="card-glow">
            <div className="card-glow-inner p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-2.5 h-2.5 rounded-full bg-gold shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                  style={{ animation: 'pulse-glow 2s ease-in-out infinite' }} />
                <h2 className="text-xs font-display font-bold text-white uppercase tracking-[0.1em]">
                  Live — {running.length} Active
                </h2>
              </div>
              <div className="space-y-3">
                {running.map(run => {
                  const elapsed = Math.floor((now - new Date(run.created_at).getTime()) / 1000)
                  const pct = Math.min(92, Math.floor((elapsed / 90) * 100))
                  const cfg = AGENTS[run.agent_type] || { label: run.agent_type, icon: '\u2699\ufe0f', color: '#fff' }
                  return (
                    <button
                      key={run.id}
                      onClick={() => onNavigate('output', run.id)}
                      className="w-full text-left rounded-[14px] p-4 bg-void-850/80 border border-void-700/50 hover:border-electric/30 transition-all duration-300 group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-sm"
                            style={{ background: `${cfg.color}15` }}>
                            {cfg.icon}
                          </div>
                          <div>
                            <span className="font-display font-bold text-[13px] text-white">{cfg.label}</span>
                            {run.pipeline_run_id && (
                              <span className="ml-2 badge text-electric-bright bg-electric/10 border border-electric/20">pipeline</span>
                            )}
                          </div>
                        </div>
                        <span className="text-gold text-xs font-mono font-semibold tabular-nums">{elapsed}s</span>
                      </div>
                      <div className="w-full h-1 bg-void-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full progress-flow transition-all duration-1000"
                          style={{ width: `${pct}%` }} />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════
          MAIN GRID
          ════════════════════════════════════ */}
      <div className="grid grid-cols-5 gap-5 mb-8">

        {/* ── Recent Activity (3 cols) ────── */}
        <div className="col-span-3 animate-slide-up" style={{ animationDelay: '400ms' }}>
          <div className="card-elevated overflow-hidden">
            <div className="px-6 pt-6 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-[14px] font-display font-bold text-white tracking-[-0.02em]">Recent Activity</h2>
                <p className="text-[11px] text-void-500 mt-0.5">Latest agent executions</p>
              </div>
              <button onClick={() => onNavigate('history')}
                className="text-[11px] text-void-400 hover:text-electric-bright transition-colors font-semibold tracking-wide">
                View all &rarr;
              </button>
            </div>

            {runs.length === 0 ? (
              <div className="px-6 pb-10 pt-6 text-center">
                <div className="w-20 h-20 rounded-[20px] bg-void-800/60 border border-void-700/50 flex items-center justify-center mx-auto mb-5"
                  style={{ animation: 'float 4s ease-in-out infinite' }}>
                  <span className="text-3xl">{'\ud83d\ude80'}</span>
                </div>
                <div className="text-void-200 font-display font-bold text-[15px] mb-1">No runs yet</div>
                <div className="text-void-500 text-[13px]">Launch your first agent to see activity here.</div>
                <button onClick={() => onNavigate('agents')} className="btn-primary mt-5 text-xs">
                  Launch Agent
                </button>
              </div>
            ) : (
              <div className="px-3 pb-3">
                <div className="stagger">
                  {runs.slice(0, 8).map(run => {
                    const cfg = AGENTS[run.agent_type] || { label: run.agent_type, icon: '\ud83d\udcc4', color: '#64748b' }
                    const isRunning = run.status === 'running'
                    const isFailed = run.status === 'failed'
                    return (
                      <button
                        key={run.id}
                        onClick={() => onNavigate('output', run.id)}
                        className="w-full text-left px-3 py-3 rounded-[12px] flex items-center gap-3.5 animate-fade-in group hover:bg-void-800/40 transition-all duration-200"
                      >
                        {/* Agent icon */}
                        <div className="relative flex-shrink-0">
                          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-sm border"
                            style={{ background: `${cfg.color}08`, borderColor: `${cfg.color}18` }}>
                            {cfg.icon}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-[2px] border-void-900 ${
                            isRunning ? 'bg-gold' : isFailed ? 'bg-rose' : 'bg-neon-green'
                          }`}
                            style={isRunning ? { animation: 'pulse-glow 2s ease-in-out infinite', color: '#fbbf24' } : {}}
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-display font-bold text-[13px] text-void-100 group-hover:text-white transition-colors">
                              {cfg.label}
                            </span>
                            {run.pipeline_run_id && (
                              <span className="badge text-electric bg-electric/10 border border-electric/15">pipe</span>
                            )}
                          </div>
                          <div className="text-[10px] text-void-600 font-mono mt-0.5">#{run.id}</div>
                        </div>

                        {/* Asset badges */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {run.html_output_path && (
                            <span className="badge text-neon-green bg-neon-green/10 border border-neon-green/15">HTML</span>
                          )}
                          {run.video_output_path && (
                            <span className="badge text-cyan bg-cyan/10 border border-cyan/15">MP4</span>
                          )}
                        </div>

                        {/* Time */}
                        <span className="text-void-500 text-[11px] font-mono flex-shrink-0 tabular-nums group-hover:text-void-300 transition-colors">
                          {timeAgo(run.created_at)}
                        </span>

                        {/* Arrow */}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                          className="text-void-700 group-hover:text-void-400 group-hover:translate-x-0.5 transition-all flex-shrink-0">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right column (2 cols) ─────── */}
        <div className="col-span-2 space-y-5">

          {/* ── Agent Breakdown ────────────── */}
          <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '500ms' }}>
            <h2 className="text-[13px] font-display font-bold text-white tracking-[-0.01em] mb-5">Agent Breakdown</h2>
            {Object.keys(byAgent).length === 0 ? (
              <div className="text-center py-8 text-void-500 text-sm">No data yet</div>
            ) : (
              <div className="space-y-3.5">
                {Object.entries(byAgent).sort(([,a],[,b]) => b - a).map(([type, count]) => {
                  const cfg = AGENTS[type] || { label: type, icon: '\ud83d\udcc4', color: '#64748b' }
                  const pct = completed.length ? Math.round((count / completed.length) * 100) : 0
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm">{cfg.icon}</span>
                          <span className="text-[12px] text-void-200 font-semibold">{cfg.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-mono font-bold tabular-nums" style={{ color: cfg.color }}>{count}</span>
                          <span className="text-[10px] text-void-600 font-mono w-8 text-right">{pct}%</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-void-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${cfg.color}66, ${cfg.color})`,
                            boxShadow: `0 0 8px ${cfg.color}33`,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Quick Actions ──────────────── */}
          <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '600ms' }}>
            <h2 className="text-[13px] font-display font-bold text-white tracking-[-0.01em] mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'New Agent', page: 'agents', icon: '\u26a1', color: '#818cf8' },
                { label: 'Pipeline', page: 'pipelines', icon: '\ud83d\udd17', color: '#a78bfa' },
                { label: 'Outputs', page: 'outputs', icon: '\ud83d\udcc2', color: '#22d3ee' },
                { label: 'Library', page: 'library', icon: '\ud83d\udcda', color: '#34d399' },
              ].map(a => (
                <button
                  key={a.page}
                  onClick={() => onNavigate(a.page)}
                  className="flex flex-col items-center gap-2.5 py-4 px-3 rounded-[14px] border border-void-700/50 bg-void-850/50 hover:bg-void-800/80 hover:border-void-600 transition-all duration-250 group"
                >
                  <div className="w-10 h-10 rounded-[12px] flex items-center justify-center text-lg transition-transform duration-250 group-hover:scale-110 group-hover:-translate-y-0.5"
                    style={{ background: `${a.color}12` }}>
                    {a.icon}
                  </div>
                  <span className="text-[11px] text-void-300 font-display font-bold group-hover:text-white transition-colors tracking-[-0.01em]">
                    {a.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Pipelines ─────────────────── */}
          {pipelineRuns.length > 0 && (
            <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '700ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[13px] font-display font-bold text-white tracking-[-0.01em]">Pipelines</h2>
                <button onClick={() => onNavigate('pipelines')}
                  className="text-[10px] text-void-400 hover:text-electric-bright transition-colors font-semibold">
                  All &rarr;
                </button>
              </div>
              <div className="space-y-2">
                {pipelineRuns.slice(0, 3).map(p => {
                  const done = p.status === 'completed'
                  const live = p.status === 'running'
                  return (
                    <button
                      key={p.id}
                      onClick={() => onNavigate('pipelines', p.id)}
                      className="w-full text-left p-3 rounded-[12px] bg-void-850/60 border border-void-700/40 hover:border-void-600 transition-all duration-200 group flex items-center gap-3"
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        done ? 'bg-neon-green' : live ? 'bg-gold' : 'bg-rose'
                      }`} style={live ? { animation: 'pulse-glow 2s ease-in-out infinite', color: '#fbbf24' } : {}} />
                      <span className="text-[12px] text-void-200 font-semibold truncate flex-1 group-hover:text-white transition-colors">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-void-600 font-mono tabular-nums flex-shrink-0">
                        {timeAgo(p.created_at)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════
          FOOTER STATUS BAR
          ════════════════════════════════════ */}
      <div className="animate-fade-in" style={{ animationDelay: '800ms' }}>
        <div className="flex items-center gap-8 py-4 px-1 border-t border-void-700/30">
          {[
            { label: 'Agents', value: `${Object.keys(AGENTS).length} types` },
            { label: 'Pipelines', value: `${pipelineRuns.length} total` },
            { label: 'Failed', value: String(failed.length), warn: failed.length > 0 },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[9px] text-void-500 uppercase tracking-[0.12em] font-bold">{s.label}</span>
              <span className={`text-[11px] font-mono font-semibold tabular-nums ${s.warn ? 'text-rose' : 'text-void-300'}`}>
                {s.value}
              </span>
            </div>
          ))}
          <div className="flex-1" />
          <span className="text-[10px] text-void-600 font-mono tracking-wide">
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  )
}
