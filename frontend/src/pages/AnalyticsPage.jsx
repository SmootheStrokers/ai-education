import { useState, useEffect, useMemo } from 'react'
import { AGENTS, formatAgentType, timeAgo } from '../shared'

/* ── Mini Chart ──────────────────────────────── */

function BarChart({ data, color, height = 80, labels }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-sm min-h-[2px]"
            style={{
              height: `${Math.max(3, (v / max) * 100)}%`,
              background: `linear-gradient(to top, ${color}66, ${color})`,
              transformOrigin: 'bottom',
              animation: `bar-rise 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 60}ms both`,
            }}
          />
          {labels && (
            <span className="text-[8px] text-void-600 font-mono">{labels[i]}</span>
          )}
        </div>
      ))}
    </div>
  )
}

/* ── Donut Chart ─────────────────────────────── */

function DonutChart({ segments, size = 120 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return null
  const strokeWidth = 14
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  let offset = 0

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(30,41,59,0.5)" strokeWidth={strokeWidth} />
      {segments.filter(s => s.value > 0).map((seg, i) => {
        const pct = seg.value / total
        const dashLen = pct * circ
        const el = (
          <circle
            key={i}
            cx={size/2} cy={size/2} r={r}
            fill="none" stroke={seg.color} strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${dashLen} ${circ - dashLen}`}
            strokeDashoffset={-offset}
            style={{ transition: 'all 1s cubic-bezier(0.16,1,0.3,1)' }}
          />
        )
        offset += dashLen
        return el
      })}
    </svg>
  )
}

/* ══════════════════════════════════════════════
   ANALYTICS PAGE
   ══════════════════════════════════════════════ */

export default function AnalyticsPage() {
  const [runs, setRuns] = useState([])
  const [pipelineRuns, setPipelineRuns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/runs?limit=500').then(r => r.json()),
      fetch('/api/pipelines?limit=100').then(r => r.json()),
    ]).then(([r, p]) => {
      setRuns(r)
      setPipelineRuns(p)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const completed = runs.filter(r => r.status === 'completed')
  const failed = runs.filter(r => r.status === 'failed')
  const running = runs.filter(r => r.status === 'running')
  const htmlAssets = runs.filter(r => r.html_output_path)
  const videoAssets = runs.filter(r => r.video_output_path)
  const successRate = runs.length ? Math.round((completed.length / runs.length) * 100) : 0

  /* Agent breakdown */
  const agentBreakdown = useMemo(() => {
    const m = {}
    runs.forEach(r => { m[r.agent_type] = (m[r.agent_type] || 0) + 1 })
    return Object.entries(m).sort(([,a],[,b]) => b - a)
  }, [runs])

  /* Daily activity (last 14 days) */
  const dailyActivity = useMemo(() => {
    const days = Array(14).fill(0)
    const labels = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
    }
    runs.forEach(r => {
      const age = Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000)
      if (age < 14) days[13 - age]++
    })
    return { data: days, labels }
  }, [runs])

  /* Content type breakdown */
  const contentTypes = useMemo(() => {
    const m = {}
    completed.forEach(r => {
      try {
        const p = JSON.parse(r.input_params)
        const type = p.content_type || p.product_type || p.asset_type || p.focus || r.agent_type
        m[type] = (m[type] || 0) + 1
      } catch {
        m[r.agent_type] = (m[r.agent_type] || 0) + 1
      }
    })
    return Object.entries(m).sort(([,a],[,b]) => b - a)
  }, [completed])

  /* Review status breakdown */
  const reviewBreakdown = useMemo(() => {
    const m = { pending: 0, approved: 0, exported: 0, rejected: 0 }
    runs.forEach(r => { m[r.review_status || 'pending']++ })
    return m
  }, [runs])

  /* Avg completion time */
  const avgTime = useMemo(() => {
    const times = completed
      .filter(r => r.completed_at)
      .map(r => new Date(r.completed_at).getTime() - new Date(r.created_at).getTime())
    if (times.length === 0) return 0
    return Math.round(times.reduce((a, b) => a + b, 0) / times.length / 1000)
  }, [completed])

  /* Donut segments */
  const donutSegments = agentBreakdown.map(([type, count]) => ({
    value: count,
    color: AGENTS[type]?.color || '#475569',
    label: AGENTS[type]?.label || type,
  }))

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="skeleton h-12 w-64 rounded-2xl" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => <div key={i} className="skeleton h-64 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <header className="mb-10">
        <p className="text-[11px] text-void-500 font-mono tracking-[0.15em] uppercase mb-2">Performance</p>
        <h1 className="text-[32px] font-display font-extrabold tracking-[-0.03em] text-gradient leading-tight">
          Analytics
        </h1>
        <p className="text-void-400 text-[14px] mt-1.5">Production metrics and content insights</p>
      </header>

      {/* ── KPI Row ──────────────────────── */}
      <div className="grid grid-cols-6 gap-4 mb-8">
        {[
          { value: runs.length, label: 'Total Runs', color: '#818cf8' },
          { value: completed.length, label: 'Completed', color: '#34d399' },
          { value: failed.length, label: 'Failed', color: '#fb7185' },
          { value: `${successRate}%`, label: 'Success Rate', color: successRate >= 80 ? '#34d399' : '#fbbf24' },
          { value: htmlAssets.length + videoAssets.length, label: 'Assets', color: '#22d3ee' },
          { value: `${avgTime}s`, label: 'Avg Time', color: '#a78bfa' },
        ].map((kpi, i) => (
          <div key={i} className="card-elevated p-4 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="text-[24px] font-display font-extrabold text-white tracking-tight animate-number"
              style={{ animationDelay: `${150 + i * 50}ms` }}>
              {kpi.value}
            </div>
            <div className="text-[10px] text-void-400 font-semibold uppercase tracking-wider mt-0.5">{kpi.label}</div>
            <div className="w-full h-0.5 rounded-full mt-2" style={{ background: `${kpi.color}30` }}>
              <div className="h-full rounded-full" style={{ background: kpi.color, width: '100%' }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Grid ────────────────────── */}
      <div className="grid grid-cols-2 gap-5 mb-8">

        {/* Activity Chart */}
        <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <h2 className="text-[14px] font-display font-bold text-white mb-1">Activity (14 days)</h2>
          <p className="text-[11px] text-void-500 mb-5">Runs per day</p>
          <BarChart
            data={dailyActivity.data}
            color="#818cf8"
            height={120}
          />
          <div className="flex justify-between mt-2">
            <span className="text-[9px] text-void-600 font-mono">{dailyActivity.labels[0]}</span>
            <span className="text-[9px] text-void-600 font-mono">{dailyActivity.labels[13]}</span>
          </div>
        </div>

        {/* Agent Distribution */}
        <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
          <h2 className="text-[14px] font-display font-bold text-white mb-1">Agent Distribution</h2>
          <p className="text-[11px] text-void-500 mb-5">Runs by agent type</p>
          <div className="flex items-center gap-6">
            <DonutChart segments={donutSegments} size={110} />
            <div className="flex-1 space-y-2">
              {agentBreakdown.map(([type, count]) => {
                const cfg = AGENTS[type] || { label: type, icon: '\ud83d\udcc4', color: '#475569' }
                const pct = runs.length ? Math.round((count / runs.length) * 100) : 0
                return (
                  <div key={type} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                    <span className="text-[11px] text-void-200 flex-1">{cfg.label}</span>
                    <span className="text-[11px] font-mono font-semibold text-void-300 tabular-nums">{count}</span>
                    <span className="text-[10px] font-mono text-void-600 w-8 text-right">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Grid ──────────────────── */}
      <div className="grid grid-cols-3 gap-5">

        {/* Content Types */}
        <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '500ms' }}>
          <h2 className="text-[13px] font-display font-bold text-white mb-4">Content Types</h2>
          {contentTypes.length === 0 ? (
            <div className="text-void-500 text-sm text-center py-6">No data</div>
          ) : (
            <div className="space-y-2.5">
              {contentTypes.slice(0, 8).map(([type, count]) => {
                const pct = completed.length ? Math.round((count / completed.length) * 100) : 0
                return (
                  <div key={type}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[11px] text-void-200 capitalize">{type.replace(/_/g, ' ')}</span>
                      <span className="text-[11px] font-mono text-void-400 tabular-nums">{count}</span>
                    </div>
                    <div className="w-full h-1 bg-void-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-electric/60" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Review Status */}
        <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '600ms' }}>
          <h2 className="text-[13px] font-display font-bold text-white mb-4">Review Status</h2>
          <div className="space-y-3">
            {Object.entries(reviewBreakdown).map(([status, count]) => {
              const colors = {
                pending: '#fbbf24', approved: '#34d399', exported: '#60a5fa', rejected: '#fb7185',
              }
              const pct = runs.length ? Math.round((count / runs.length) * 100) : 0
              return (
                <div key={status}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] text-void-200 capitalize">{status}</span>
                    <div className="flex gap-2">
                      <span className="text-[11px] font-mono tabular-nums" style={{ color: colors[status] }}>{count}</span>
                      <span className="text-[10px] font-mono text-void-600">{pct}%</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-void-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colors[status] }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pipeline Stats */}
        <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '700ms' }}>
          <h2 className="text-[13px] font-display font-bold text-white mb-4">Pipeline Stats</h2>
          <div className="space-y-4">
            <div>
              <div className="text-[28px] font-display font-extrabold text-white">{pipelineRuns.length}</div>
              <div className="text-[10px] text-void-400 uppercase tracking-wider font-semibold">Total Pipelines</div>
            </div>
            <div className="h-px bg-void-700/40" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[18px] font-display font-bold text-neon-green">
                  {pipelineRuns.filter(p => p.status === 'completed').length}
                </div>
                <div className="text-[9px] text-void-500 uppercase tracking-wider">Completed</div>
              </div>
              <div>
                <div className="text-[18px] font-display font-bold text-rose">
                  {pipelineRuns.filter(p => p.status === 'failed').length}
                </div>
                <div className="text-[9px] text-void-500 uppercase tracking-wider">Failed</div>
              </div>
            </div>
            <div className="h-px bg-void-700/40" />
            <div>
              <div className="text-[18px] font-display font-bold text-electric">
                {htmlAssets.length}
              </div>
              <div className="text-[9px] text-void-500 uppercase tracking-wider">HTML Assets</div>
            </div>
            <div>
              <div className="text-[18px] font-display font-bold text-cyan">
                {videoAssets.length}
              </div>
              <div className="text-[9px] text-void-500 uppercase tracking-wider">Video Assets</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
