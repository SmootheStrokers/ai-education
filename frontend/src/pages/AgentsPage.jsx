import { useState, useEffect } from 'react'
import { AGENTS, formatAgentType, timeAgo, getRunTitle } from '../shared'

const AGENT_COLORS = {
  research:   { bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.25)',  glow: 'rgba(96,165,250,0.15)',  text: '#60a5fa' },
  case_study: { bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.25)', glow: 'rgba(167,139,250,0.15)', text: '#a78bfa' },
  content:    { bg: 'rgba(251,191,36,0.08)',   border: 'rgba(251,191,36,0.25)',  glow: 'rgba(251,191,36,0.15)',  text: '#fbbf24' },
  course_dev: { bg: 'rgba(45,212,191,0.08)',   border: 'rgba(45,212,191,0.25)',  glow: 'rgba(45,212,191,0.15)', text: '#2dd4bf' },
  marketing:  { bg: 'rgba(251,113,133,0.08)',  border: 'rgba(251,113,133,0.25)', glow: 'rgba(251,113,133,0.15)', text: '#fb7185' },
  video:      { bg: 'rgba(34,211,238,0.08)',   border: 'rgba(34,211,238,0.25)',  glow: 'rgba(34,211,238,0.15)', text: '#22d3ee' },
}

export default function AgentsPage({ onNavigate }) {
  const [agents, setAgents] = useState({})
  const [presets, setPresets] = useState([])
  const [recentRuns, setRecentRuns] = useState([])
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [formValues, setFormValues] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('presets') // 'presets' | 'manual'

  useEffect(() => {
    fetch('/api/agents').then((r) => r.json()).then(setAgents)
    fetch('/api/presets').then((r) => r.json()).then(setPresets)
    fetch('/api/runs?limit=3').then((r) => r.json()).then((data) => {
      setRecentRuns(Array.isArray(data) ? data.slice(0, 3) : (data.runs || []).slice(0, 3))
    }).catch(() => {})
  }, [])

  const selectAgent = (key) => {
    setSelectedAgent(key)
    setFormValues({})
    setActiveTab('manual')
  }

  const applyPreset = (quickRun) => {
    setSelectedAgent(quickRun.agent_type)
    setFormValues(quickRun.params)
    setActiveTab('manual')
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_type: selectedAgent, params: formValues }),
      })
      const data = await res.json()
      onNavigate('output', data.run_id)
    } catch (err) {
      alert('Failed to start agent: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const agentConfig = selectedAgent ? agents[selectedAgent] : null

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(129,140,248,0.08))', border: '1px solid rgba(99,102,241,0.2)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-display text-gradient tracking-tight">Run Agent</h2>
            <p className="text-void-400 text-sm mt-0.5">Launch AI agents or start from industry templates</p>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 p-1 rounded-xl mb-8"
           style={{ background: 'var(--color-void-900)', border: '1px solid var(--color-void-700)', display: 'inline-flex' }}>
        <button
          onClick={() => setActiveTab('presets')}
          className="font-display text-sm font-semibold px-5 py-2.5 rounded-lg transition-all duration-300"
          style={activeTab === 'presets' ? {
            background: 'linear-gradient(135deg, var(--color-electric-deep), var(--color-electric))',
            color: 'white',
            boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
          } : {
            background: 'transparent',
            color: 'var(--color-void-400)',
          }}
        >
          <span className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            Industry Templates
          </span>
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className="font-display text-sm font-semibold px-5 py-2.5 rounded-lg transition-all duration-300"
          style={activeTab === 'manual' ? {
            background: 'linear-gradient(135deg, var(--color-electric-deep), var(--color-electric))',
            color: 'white',
            boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
          } : {
            background: 'transparent',
            color: 'var(--color-void-400)',
          }}
        >
          <span className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v18" /><path d="M3 12h18" />
            </svg>
            Manual Setup
          </span>
        </button>
      </div>

      {/* Recently Used */}
      {recentRuns.length > 0 && !selectedAgent && (
        <div className="mb-8 animate-fade-in">
          <h3 className="font-display text-xs uppercase tracking-widest text-void-500 mb-4 flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            Recently Used
          </h3>
          <div className="grid grid-cols-3 gap-3 stagger">
            {recentRuns.map((run) => {
              const agentInfo = AGENTS[run.agent_type] || {}
              const colors = AGENT_COLORS[run.agent_type] || AGENT_COLORS.research
              return (
                <button
                  key={run.id}
                  onClick={() => onNavigate('output', run.id)}
                  className="text-left p-4 rounded-xl transition-all duration-300 animate-fade-in group"
                  style={{
                    background: 'var(--color-void-900)',
                    border: `1px solid var(--color-void-700)`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = colors.border
                    e.currentTarget.style.boxShadow = `0 4px 24px -4px ${colors.glow}`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-void-700)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{agentInfo.icon || '⚙️'}</span>
                    <span className="badge" style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
                      {agentInfo.label || formatAgentType(run.agent_type)}
                    </span>
                  </div>
                  <p className="text-white text-sm font-medium truncate">{getRunTitle(run)}</p>
                  <p className="text-void-500 text-xs mt-1 font-mono">{timeAgo(run.created_at)}</p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Presets View */}
      {activeTab === 'presets' && (
        <div>
          {presets.length > 0 ? (
            <div className="space-y-4 stagger">
              {presets.map((preset) => (
                <div key={preset.id} className="relative rounded-2xl p-px animate-slide-up"
                     style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(52,211,153,0.1), rgba(99,102,241,0.05))' }}>
                  <div className="rounded-2xl p-6" style={{ background: 'var(--color-void-900)' }}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-display text-xl text-white tracking-tight">{preset.label}</h4>
                        <p className="text-void-400 text-sm mt-1 max-w-xl leading-relaxed">{preset.description}</p>
                      </div>
                      {preset.quick_runs && (
                        <span className="badge flex items-center gap-1.5"
                              style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                          </svg>
                          {preset.quick_runs.length} steps
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {preset.quick_runs.map((qr, i) => {
                        const agentInfo = AGENTS[qr.agent_type] || {}
                        const colors = AGENT_COLORS[qr.agent_type] || AGENT_COLORS.research
                        return (
                          <button
                            key={i}
                            onClick={() => applyPreset(qr)}
                            className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all duration-300"
                            style={{
                              background: colors.bg,
                              border: `1px solid ${colors.border}`,
                              color: colors.text,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow = `0 4px 20px -4px ${colors.glow}`
                              e.currentTarget.style.borderColor = colors.text
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow = 'none'
                              e.currentTarget.style.borderColor = colors.border
                            }}
                          >
                            <span>{agentInfo.icon || '⚙️'}</span>
                            {qr.label}
                          </button>
                        )
                      })}
                      {preset.pipeline_template && (
                        <button
                          onClick={() => onNavigate('pipelines', preset.id)}
                          className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all duration-300"
                          style={{
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(129,140,248,0.08))',
                            border: '1px solid rgba(99,102,241,0.3)',
                            color: '#818cf8',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 4px 20px -4px rgba(99,102,241,0.3)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = 'none'
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                          Run Full Pipeline
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-elevated p-12 text-center animate-scale-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                   style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                </svg>
              </div>
              <h3 className="font-display text-lg text-white mb-2">No Templates Yet</h3>
              <p className="text-void-400 text-sm max-w-sm mx-auto">Industry templates will appear here once configured. Switch to Manual Setup to run agents directly.</p>
            </div>
          )}
        </div>
      )}

      {/* Manual Agent Selection */}
      {activeTab === 'manual' && (
        <>
          {!selectedAgent && (
            <div>
              <h3 className="font-display text-xs uppercase tracking-widest text-void-500 mb-4 flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                </svg>
                Select an Agent
              </h3>
              <div className="grid grid-cols-3 gap-4 stagger">
                {Object.entries(agents).map(([key, agent]) => {
                  const agentInfo = AGENTS[key] || {}
                  const colors = AGENT_COLORS[key] || AGENT_COLORS.research
                  return (
                    <button
                      key={key}
                      onClick={() => selectAgent(key)}
                      className="text-left p-6 rounded-2xl transition-all duration-300 animate-fade-in group"
                      style={{
                        background: 'var(--color-void-900)',
                        border: '1px solid var(--color-void-700)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = colors.border
                        e.currentTarget.style.boxShadow = `0 8px 40px -8px ${colors.glow}, inset 0 1px 0 ${colors.border}`
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-void-700)'
                        e.currentTarget.style.boxShadow = 'none'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                             style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
                          {agentInfo.icon || '⚙️'}
                        </div>
                        <div className="w-2 h-2 rounded-full" style={{ background: colors.text, boxShadow: `0 0 8px ${colors.text}` }} />
                      </div>
                      <h4 className="font-display text-white text-base font-semibold mb-1.5">{agent.name}</h4>
                      <p className="text-void-400 text-sm leading-relaxed">{agentInfo.desc || agent.description}</p>
                    </button>
                  )
                })}
              </div>

              {Object.keys(agents).length === 0 && (
                <div className="card-elevated p-12 text-center animate-scale-in">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                       style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                    </svg>
                  </div>
                  <h3 className="font-display text-lg text-white mb-2">Loading Agents</h3>
                  <p className="text-void-400 text-sm">Connecting to the agent registry...</p>
                </div>
              )}
            </div>
          )}

          {/* Agent Configuration Form */}
          {agentConfig && (
            <div className="animate-slide-up">
              {/* Back to selection */}
              <button
                onClick={() => { setSelectedAgent(null); setFormValues({}) }}
                className="flex items-center gap-2 text-void-400 hover:text-white text-sm mb-6 transition-colors font-medium"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back to agents
              </button>

              <div className="card-elevated p-8 rounded-2xl">
                {/* Form Header */}
                <div className="flex items-center gap-4 mb-8">
                  {(() => {
                    const agentInfo = AGENTS[selectedAgent] || {}
                    const colors = AGENT_COLORS[selectedAgent] || AGENT_COLORS.research
                    return (
                      <>
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                             style={{ background: colors.bg, border: `1px solid ${colors.border}`, boxShadow: `0 4px 20px -4px ${colors.glow}` }}>
                          {agentInfo.icon || '⚙️'}
                        </div>
                        <div>
                          <h3 className="text-xl font-display text-white tracking-tight">{agentConfig.name}</h3>
                          <p className="text-void-400 text-sm mt-0.5">{agentInfo.desc || 'Configure parameters below'}</p>
                        </div>
                      </>
                    )
                  })()}
                </div>

                <div className="divider mb-8" />

                {/* Form Fields */}
                <div className="space-y-6">
                  {Object.entries(agentConfig.params).map(([key, param]) => (
                    <div key={key}>
                      <label className="block text-xs text-void-300 mb-2 uppercase tracking-widest font-display font-semibold">
                        {param.label} {param.required && <span className="text-rose">*</span>}
                      </label>

                      {param.type === 'select' ? (
                        <select
                          value={formValues[key] || ''}
                          onChange={(e) => setFormValues({ ...formValues, [key]: e.target.value })}
                          className="w-full rounded-xl px-4 py-3 text-white text-sm transition-all duration-300 outline-none"
                          style={{
                            background: 'var(--color-void-850)',
                            border: '1px solid var(--color-void-600)',
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-electric)'
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1), 0 0 20px -4px rgba(99,102,241,0.15)'
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-void-600)'
                            e.currentTarget.style.boxShadow = 'none'
                          }}
                        >
                          <option value="">Select...</option>
                          {param.options.map((opt) => (
                            <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                      ) : param.type === 'textarea' ? (
                        <textarea
                          value={formValues[key] || ''}
                          onChange={(e) => setFormValues({ ...formValues, [key]: e.target.value })}
                          placeholder={param.placeholder}
                          rows={4}
                          className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-void-500 transition-all duration-300 outline-none resize-none"
                          style={{
                            background: 'var(--color-void-850)',
                            border: '1px solid var(--color-void-600)',
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-electric)'
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1), 0 0 20px -4px rgba(99,102,241,0.15)'
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-void-600)'
                            e.currentTarget.style.boxShadow = 'none'
                          }}
                        />
                      ) : (
                        <input
                          type="text"
                          value={formValues[key] || ''}
                          onChange={(e) => setFormValues({ ...formValues, [key]: e.target.value })}
                          placeholder={param.placeholder}
                          className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-void-500 transition-all duration-300 outline-none"
                          style={{
                            background: 'var(--color-void-850)',
                            border: '1px solid var(--color-void-600)',
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-electric)'
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1), 0 0 20px -4px rgba(99,102,241,0.15)'
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-void-600)'
                            e.currentTarget.style.boxShadow = 'none'
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="divider my-8" />

                {/* Submit */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={`btn-primary px-8 py-3 text-sm flex items-center gap-2.5 ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Starting Agent...
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        Run Agent
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => { setSelectedAgent(null); setFormValues({}) }}
                    className="btn-secondary px-6 py-3 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
