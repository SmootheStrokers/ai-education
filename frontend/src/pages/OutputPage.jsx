import { useState, useEffect, useRef } from 'react'
import { AGENTS, REVIEW_STATUSES, REVIEW_COLORS, REVIEW_ICONS, formatAgentType, getContentType, timeAgo } from '../shared'

const SUGGESTED_TAGS = ['contractor', 'realtor', 'service-pro', 'small-business', 'newsletter', 'youtube', 'social', 'playbook', 'guide', 'course', 'lead-magnet', 'case-study', 'draft', 'published']

export default function OutputPage({ runId, onNavigate }) {
  const [run, setRun] = useState(null)
  const [polling, setPolling] = useState(true)
  const [videoProgress, setVideoProgress] = useState(null)
  const [tags, setTags] = useState([])
  const [newTag, setNewTag] = useState('')
  const [paramsOpen, setParamsOpen] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const elapsedRef = useRef(null)

  // Polling for run data
  useEffect(() => {
    if (!runId) return
    const fetchRun = () => {
      fetch(`/api/runs/${runId}`)
        .then((r) => r.json())
        .then((data) => {
          setRun(data)
          if (data.status !== 'running') setPolling(false)
        })
        .catch(() => {})
    }
    fetchRun()
    fetch(`/api/runs/${runId}/tags`).then((r) => r.json()).then(setTags).catch(() => {})
    if (!polling) return
    const interval = setInterval(fetchRun, 2000)
    return () => clearInterval(interval)
  }, [runId, polling])

  // Elapsed time counter while running
  useEffect(() => {
    if (run?.status === 'running' && run?.created_at) {
      const start = new Date(run.created_at).getTime()
      const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
      tick()
      elapsedRef.current = setInterval(tick, 1000)
      return () => clearInterval(elapsedRef.current)
    } else {
      clearInterval(elapsedRef.current)
    }
  }, [run?.status, run?.created_at])

  useEffect(() => {
    if (run?.agent_type !== 'video' || run?.status !== 'running') {
      setVideoProgress(null)
      return
    }

    let cancelled = false

    const fetchProgress = async () => {
      try {
        const res = await fetch(`/api/runs/${runId}/video/progress`)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) {
          setVideoProgress(data)
        }
      } catch {
        // Best-effort polling; keep the generic running UI if this fails.
      }
    }

    fetchProgress()
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/runs/${runId}/video/progress`)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) {
          setVideoProgress(data)
        }
        if (data.progress >= 100) clearInterval(interval)
      } catch {}
    }, 2000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [run?.agent_type, run?.status, runId])

  const addTag = async (tagName) => {
    const tag = tagName.trim().toLowerCase()
    if (!tag || tags.includes(tag)) return
    await fetch(`/api/runs/${runId}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag }),
    })
    setTags([...tags, tag])
    setNewTag('')
  }

  const removeTag = async (tag) => {
    await fetch(`/api/runs/${runId}/tags/${tag}`, { method: 'DELETE' })
    setTags(tags.filter((t) => t !== tag))
  }

  const updateReviewStatus = async (status) => {
    await fetch(`/api/runs/${runId}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_status: status }),
    })
    setRun(prev => ({ ...prev, review_status: status }))
  }

  const formatElapsed = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`
  }

  const parsedParams = (() => {
    try { return JSON.parse(run?.input_params || '{}') } catch { return {} }
  })()

  const agent = run ? (AGENTS[run.agent_type] || { label: formatAgentType(run.agent_type || ''), icon: '\ud83d\udcc4', color: '#818cf8' }) : null

  // Loading skeleton
  if (!run) {
    return (
      <div className="animate-fade-in p-6 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-void-800 animate-pulse" />
          <div className="space-y-2">
            <div className="h-7 w-56 rounded-lg bg-void-800 animate-pulse" />
            <div className="h-4 w-36 rounded bg-void-800/60 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-6 space-y-3">
              <div className="h-4 w-full rounded bg-void-800 animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-void-800 animate-pulse" />
              <div className="h-4 w-4/6 rounded bg-void-800 animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-void-800 animate-pulse" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="card p-5 space-y-3">
              <div className="h-4 w-24 rounded bg-void-800 animate-pulse" />
              <div className="h-4 w-full rounded bg-void-800/60 animate-pulse" />
              <div className="h-4 w-full rounded bg-void-800/60 animate-pulse" />
            </div>
            <div className="card p-5 space-y-3">
              <div className="h-4 w-20 rounded bg-void-800 animate-pulse" />
              <div className="flex gap-2">
                <div className="h-6 w-16 rounded-full bg-void-800 animate-pulse" />
                <div className="h-6 w-16 rounded-full bg-void-800 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const statusConfig = {
    running:   { label: 'Running',   bg: 'bg-gold/10',       text: 'text-gold',       border: 'border-gold/25',       dot: 'bg-gold animate-pulse' },
    completed: { label: 'Completed', bg: 'bg-neon-green/10', text: 'text-neon-green', border: 'border-neon-green/25', dot: 'bg-neon-green' },
    failed:    { label: 'Failed',    bg: 'bg-rose/10',       text: 'text-rose',       border: 'border-rose/25',       dot: 'bg-rose' },
  }
  const st = statusConfig[run.status] || statusConfig.failed

  const contentType = getContentType(run)

  return (
    <div className="animate-fade-in p-2">
      {/* Back button */}
      <button
        onClick={() => onNavigate('history')}
        className="text-void-400 hover:text-electric mb-5 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back to History
      </button>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6 animate-slide-up">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ background: `${agent.color}15`, border: `1px solid ${agent.color}30` }}
        >
          {agent.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-display text-gradient-electric truncate">
              {formatAgentType(run.agent_type)}
            </h1>
            <span className={`badge ${st.bg} ${st.text} ${st.border} border text-xs font-mono px-2.5 py-1 rounded-full inline-flex items-center gap-1.5`}>
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
              {st.label}
            </span>
            {contentType && contentType !== run.agent_type && (
              <span className="text-xs text-void-400 font-mono bg-void-800/50 px-2 py-0.5 rounded">
                {contentType}
              </span>
            )}
          </div>
          <p className="text-void-400 text-xs font-mono mt-1">
            Run #{runId}
            {run.created_at && <span className="ml-2">{timeAgo(run.created_at)}</span>}
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left Column (2/3) ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Running state */}
          {run.status === 'running' && (
            <div className="card-elevated p-6 animate-slide-up" style={{ borderColor: `${agent.color}30` }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-2 border-void-700" />
                  <div className="absolute inset-0 rounded-full border-2 border-t-gold border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                  <div className="absolute inset-2 rounded-full border-2 border-t-transparent border-r-electric border-b-transparent border-l-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                </div>
                <div>
                  <h3 className="font-display text-lg text-white">Agent is running...</h3>
                  <p className="text-void-400 text-sm">This page updates automatically when complete.</p>
                </div>
                <div className="ml-auto text-right">
                  <span className="text-gold font-mono text-lg font-semibold">{formatElapsed(elapsed)}</span>
                  <p className="text-void-500 text-[10px] uppercase tracking-wider">Elapsed</p>
                </div>
              </div>
              <div className="progress-flow h-1.5 rounded-full" />
              {run.agent_type === 'video' && videoProgress && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-void-400 font-mono">{videoProgress.stage}</span>
                    <span className="text-xs text-gold font-mono font-semibold">{videoProgress.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-void-800 rounded-full overflow-hidden">
                    <div
                      style={{
                        height: '100%',
                        width: `${videoProgress.progress}%`,
                        background: 'linear-gradient(90deg, #e8a832, #d49a2a)',
                        borderRadius: 9999,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Completed: Action buttons */}
          {run.status === 'completed' && (
            <div className="flex flex-wrap gap-3 animate-slide-up">
              {run.html_output_path && (
                <>
                  <a
                    href={`/api/runs/${runId}/html`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    View HTML
                  </a>
                  <a
                    href={`/api/runs/${runId}/download`}
                    className="btn-secondary inline-flex items-center gap-2"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download HTML
                  </a>
                </>
              )}
              {run.video_output_path && (
                <a
                  href={`/api/runs/${runId}/video`}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  Download Video
                </a>
              )}
            </div>
          )}

          {/* Failed: Error card */}
          {run.status === 'failed' && (
            <div className="card p-6 animate-slide-up" style={{ borderColor: 'rgba(251,113,133,0.25)' }}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose/10 flex items-center justify-center text-rose flex-shrink-0 mt-0.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-rose font-display text-sm font-semibold mb-2">Execution Failed</h3>
                  <pre className="text-sm text-rose/70 whitespace-pre-wrap font-mono leading-relaxed break-words">{run.error || 'Unknown error occurred.'}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Markdown output */}
          {run.status === 'completed' && run.output && (
            <div className="card p-6 animate-slide-up stagger">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] text-void-400 uppercase tracking-wider font-semibold">Markdown Output</h3>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(run.output)
                  }}
                  className="text-void-500 hover:text-electric text-xs font-mono transition-colors inline-flex items-center gap-1"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <div className="whitespace-pre-wrap text-void-200 leading-relaxed text-sm font-mono bg-void-950/50 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                {run.output}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Sidebar (1/3) ── */}
        <div className="space-y-5">

          {/* Status & timestamps card */}
          <div className="glass p-5 animate-slide-up">
            <h3 className="text-[10px] text-void-400 uppercase tracking-wider font-semibold mb-4">Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-void-400 text-xs">Status</span>
                <span className={`${st.text} text-xs font-mono font-semibold`}>{st.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-void-400 text-xs">Agent</span>
                <span className="text-void-200 text-xs font-mono">{agent.label || formatAgentType(run.agent_type)}</span>
              </div>
              <div className="border-t border-void-700/50 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-void-500 text-[10px] uppercase tracking-wider">Started</span>
                  <span className="text-void-300 text-xs font-mono">
                    {run.created_at ? new Date(run.created_at).toLocaleString() : '--'}
                  </span>
                </div>
                {run.completed_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-void-500 text-[10px] uppercase tracking-wider">Completed</span>
                    <span className="text-void-300 text-xs font-mono">
                      {new Date(run.completed_at).toLocaleString()}
                    </span>
                  </div>
                )}
                {run.status === 'completed' && run.created_at && run.completed_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-void-500 text-[10px] uppercase tracking-wider">Duration</span>
                    <span className="text-void-300 text-xs font-mono">
                      {formatElapsed(Math.floor((new Date(run.completed_at) - new Date(run.created_at)) / 1000))}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Review status card */}
          <div className="glass p-5 animate-slide-up stagger">
            <h3 className="text-[10px] text-void-400 uppercase tracking-wider font-semibold mb-3">Review Status</h3>
            <div className="grid grid-cols-2 gap-2">
              {REVIEW_STATUSES.map((status) => {
                const isActive = run.review_status === status
                return (
                  <button
                    key={status}
                    onClick={() => updateReviewStatus(status)}
                    className={`text-xs font-mono px-3 py-2 rounded-lg border transition-all duration-200 flex items-center justify-center gap-1.5 ${
                      isActive
                        ? `${REVIEW_COLORS[status]} border font-semibold ring-1 ring-current/20`
                        : 'text-void-400 bg-void-800/40 border-void-700/50 hover:border-void-600 hover:text-void-200'
                    }`}
                  >
                    <span>{REVIEW_ICONS[status]}</span>
                    <span className="capitalize">{status}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tags card */}
          <div className="glass p-5 animate-slide-up stagger">
            <h3 className="text-[10px] text-void-400 uppercase tracking-wider font-semibold mb-3">Tags</h3>
            <div className="flex flex-wrap gap-1.5 items-center mb-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-electric/10 text-electric-bright px-2.5 py-1 rounded-full text-xs flex items-center gap-1.5 border border-electric/20"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-white text-electric/50 transition-colors leading-none"
                  >
                    &times;
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag(newTag)}
                placeholder="Add tag..."
                className="bg-void-800 border border-void-700 rounded-full px-3 py-1 text-xs w-24 text-white placeholder-void-500 focus:border-electric/40 focus:outline-none transition-colors"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).slice(0, 8).map((tag) => (
                <button
                  key={tag}
                  onClick={() => addTag(tag)}
                  className="text-[10px] text-void-500 hover:text-void-200 bg-void-800/50 hover:bg-void-700/50 px-2 py-0.5 rounded-full transition-colors border border-transparent hover:border-void-600"
                >
                  +{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Input parameters card (collapsible) */}
          <div className="glass animate-slide-up stagger overflow-hidden">
            <button
              onClick={() => setParamsOpen(!paramsOpen)}
              className="w-full flex items-center justify-between p-5 hover:bg-void-800/30 transition-colors"
            >
              <h3 className="text-[10px] text-void-400 uppercase tracking-wider font-semibold">Input Parameters</h3>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`text-void-500 transition-transform duration-200 ${paramsOpen ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {paramsOpen && (
              <div className="px-5 pb-5 pt-0">
                <pre className="text-xs text-void-300 whitespace-pre-wrap font-mono leading-relaxed bg-void-950/50 rounded-lg p-3 max-h-64 overflow-y-auto">
                  {JSON.stringify(parsedParams, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Asset availability indicators */}
          <div className="glass p-5 animate-slide-up stagger">
            <h3 className="text-[10px] text-void-400 uppercase tracking-wider font-semibold mb-3">Assets</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-void-400 text-xs flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                  HTML Output
                </span>
                {run.html_output_path ? (
                  <span className="text-neon-green text-[10px] font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-green" />
                    Available
                  </span>
                ) : (
                  <span className="text-void-600 text-[10px] font-mono">--</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-void-400 text-xs flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Video Output
                </span>
                {run.video_output_path ? (
                  <span className="text-neon-green text-[10px] font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-green" />
                    Available
                  </span>
                ) : (
                  <span className="text-void-600 text-[10px] font-mono">--</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-void-400 text-xs flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  Markdown
                </span>
                {run.output ? (
                  <span className="text-neon-green text-[10px] font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-green" />
                    Available
                  </span>
                ) : (
                  <span className="text-void-600 text-[10px] font-mono">--</span>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
