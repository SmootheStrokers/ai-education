import { useState, useEffect } from 'react'
import { AGENTS, formatAgentType, timeAgo, statusDot, statusColor } from '../shared'

const GRADIENT_ACCENTS = [
  'from-electric to-electric-deep',
  'from-neon-green to-cyan',
  'from-flame to-rose',
  'from-gold to-flame',
  'from-cyan to-electric',
  'from-rose to-electric-bright',
]

function agentIcon(agentType) {
  return AGENTS[agentType]?.icon || '\u2699\ufe0f'
}

function agentColor(agentType) {
  return AGENTS[agentType]?.color || '#818cf8'
}

function estimateTime(steps) {
  const perStep = 15
  const total = (steps?.length || 0) * perStep
  if (total < 60) return `~${total}s`
  return `~${Math.ceil(total / 60)}m`
}

export default function PipelinesPage({ onNavigate, presetId }) {
  const [presets, setPresets] = useState([])
  const [pipelineRuns, setPipelineRuns] = useState([])
  const [running, setRunning] = useState(false)
  const [activePipelineId, setActivePipelineId] = useState(null)
  const [activePipeline, setActivePipeline] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/presets').then((r) => r.json()),
      fetch('/api/pipelines').then((r) => r.json()),
    ]).then(([presetData, pipelineData]) => {
      setPresets(presetData)
      setPipelineRuns(pipelineData)
      if (presetId) {
        const match = presetData.find((p) => p.id === presetId)
        if (match) setActivePipeline(null)
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [presetId])

  useEffect(() => {
    if (!activePipelineId) return
    const poll = setInterval(() => {
      fetch(`/api/pipelines/${activePipelineId}`)
        .then((r) => r.json())
        .then((data) => {
          setActivePipeline(data)
          if (data.pipeline_run.status !== 'running') {
            clearInterval(poll)
            setRunning(false)
            fetch('/api/pipelines').then((r) => r.json()).then(setPipelineRuns)
          }
        })
    }, 3000)
    return () => clearInterval(poll)
  }, [activePipelineId])

  const runPipeline = async (preset) => {
    setRunning(true)
    const template = preset.pipeline_template
    const res = await fetch('/api/pipelines/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: template.name, steps: template.steps }),
    })
    const data = await res.json()
    setActivePipelineId(data.pipeline_run_id)
  }

  /* ---------- helpers for active pipeline ---------- */
  const getAllSteps = () => {
    if (!activePipeline) return []
    const completedRuns = activePipeline.agent_runs || []
    let pendingSteps = []
    if (activePipeline.pipeline_run.status === 'running') {
      try {
        const allSteps = JSON.parse(activePipeline.pipeline_run.steps)
        pendingSteps = allSteps.slice(completedRuns.length).map((s, i) => ({
          id: `pending-${i}`,
          agent_type: s.agent_type,
          status: 'pending',
        }))
      } catch { /* ignore */ }
    }
    return [...completedRuns, ...pendingSteps]
  }

  const pipelineTemplates = presets.filter((p) => p.pipeline_template)

  /* ---------- loading state ---------- */
  if (loading) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-32">
        <div className="w-10 h-10 border-2 border-electric/30 border-t-electric rounded-full animate-spin mb-4" />
        <p className="text-void-400 text-sm font-mono">Loading pipelines...</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-8">

      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric to-electric-deep flex items-center justify-center text-lg shadow-lg shadow-electric/20">
            {'\u26a1'}
          </div>
          <div>
            <h2 className="text-3xl font-display text-gradient">Content Pipelines</h2>
          </div>
        </div>
        <p className="text-void-400 text-sm ml-[52px]">
          Multi-step agent workflows that chain outputs together
        </p>
      </div>

      {/* ── Active Pipeline (card-glow) ── */}
      {activePipeline && (
        <div className="card-glow animate-scale-in">
          <div className="card-glow-inner p-6">
            {/* Header row */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
                  <span className="text-base">{activePipeline.pipeline_run.status === 'running' ? '\u23f3' : activePipeline.pipeline_run.status === 'completed' ? '\u2705' : '\u274c'}</span>
                </div>
                <div>
                  <h3 className="font-display text-lg text-white">{activePipeline.pipeline_run.name}</h3>
                  <span className="text-void-500 text-xs font-mono">Pipeline #{activePipelineId}</span>
                </div>
              </div>
              <span
                className="badge text-xs font-mono"
                style={{
                  background: activePipeline.pipeline_run.status === 'completed' ? 'rgba(52,211,153,0.1)'
                    : activePipeline.pipeline_run.status === 'running' ? 'rgba(251,191,36,0.1)'
                    : 'rgba(251,113,133,0.1)',
                  color: activePipeline.pipeline_run.status === 'completed' ? '#34d399'
                    : activePipeline.pipeline_run.status === 'running' ? '#fbbf24'
                    : '#fb7185',
                  border: `1px solid ${
                    activePipeline.pipeline_run.status === 'completed' ? 'rgba(52,211,153,0.25)'
                    : activePipeline.pipeline_run.status === 'running' ? 'rgba(251,191,36,0.25)'
                    : 'rgba(251,113,133,0.25)'
                  }`,
                }}
              >
                {activePipeline.pipeline_run.status}
              </span>
            </div>

            {/* Progress bar */}
            {activePipeline.pipeline_run.status === 'running' && (
              <div className="progress-flow h-1 rounded-full mb-6" />
            )}

            {/* Horizontal stepper */}
            <div className="flex items-start justify-center gap-0 overflow-x-auto pb-2">
              {getAllSteps().map((step, i, arr) => {
                const isCompleted = step.status === 'completed'
                const isRunning = step.status === 'running'
                const isFailed = step.status === 'failed'
                const isPending = step.status === 'pending'
                const color = isCompleted ? '#34d399' : isRunning ? '#fbbf24' : isFailed ? '#fb7185' : 'rgba(255,255,255,0.15)'
                const iconBg = isCompleted ? 'rgba(52,211,153,0.15)' : isRunning ? 'rgba(251,191,36,0.15)' : isFailed ? 'rgba(251,113,133,0.15)' : 'rgba(255,255,255,0.05)'

                return (
                  <div key={step.id} className="flex items-start">
                    {/* Step node */}
                    <div className="flex flex-col items-center" style={{ minWidth: 80 }}>
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-base border-2 transition-all duration-300 ${isRunning ? 'animate-pulse' : ''}`}
                        style={{ borderColor: color, background: iconBg }}
                      >
                        {isCompleted ? (
                          <span style={{ color: '#34d399' }}>{'\u2713'}</span>
                        ) : (
                          <span>{agentIcon(step.agent_type)}</span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-void-300 mt-2 text-center leading-tight">
                        {formatAgentType(step.agent_type)}
                      </span>
                      <span className="text-[10px] mt-0.5" style={{ color }}>
                        {step.status}
                      </span>
                      {isCompleted && step.id && !String(step.id).startsWith('pending') && (
                        <button
                          onClick={() => onNavigate('output', step.id)}
                          className="text-[10px] text-electric-bright hover:text-white font-medium mt-1 transition-colors"
                        >
                          View Output
                        </button>
                      )}
                    </div>
                    {/* Connector line */}
                    {i < arr.length - 1 && (
                      <div className="flex items-center pt-4 px-1">
                        <div
                          className="h-0.5 w-8 rounded-full transition-all duration-500"
                          style={{
                            background: isCompleted ? '#34d399' : 'rgba(255,255,255,0.1)',
                          }}
                        />
                        <span className="text-void-600 text-xs">{'\u203a'}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Pipeline Templates ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-void-500 text-sm">{'\ud83d\udcdd'}</span>
          <h3 className="text-xs text-void-400 uppercase tracking-widest font-medium">Pipeline Templates</h3>
          <span className="badge text-[10px] font-mono ml-1" style={{ background: 'rgba(129,140,248,0.1)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.2)' }}>
            {pipelineTemplates.length}
          </span>
        </div>

        {pipelineTemplates.length === 0 ? (
          <div className="card p-12 text-center animate-fade-in">
            <div className="text-4xl mb-3 opacity-30">{'\u26a1'}</div>
            <p className="text-void-400 text-sm">No pipeline templates available.</p>
            <p className="text-void-600 text-xs mt-1">Create presets with pipeline templates to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger">
            {pipelineTemplates.map((preset, idx) => {
              const template = preset.pipeline_template
              const gradientClass = GRADIENT_ACCENTS[idx % GRADIENT_ACCENTS.length]
              return (
                <div key={preset.id} className="card group hover:border-void-700 transition-all duration-300 overflow-hidden animate-slide-up">
                  {/* Gradient accent strip */}
                  <div className={`h-1 bg-gradient-to-r ${gradientClass}`} />

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-display text-lg text-white mb-1 group-hover:text-gradient transition-all">
                          {template.name}
                        </h4>
                        <p className="text-void-400 text-sm leading-relaxed line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                    </div>

                    {/* Step count + estimated time */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[11px] font-mono text-void-500 flex items-center gap-1">
                        <span className="text-electric">{template.steps.length}</span> steps
                      </span>
                      <span className="text-void-700">{'\u00b7'}</span>
                      <span className="text-[11px] font-mono text-void-500 flex items-center gap-1">
                        {'\u23f1'} {estimateTime(template.steps)}
                      </span>
                    </div>

                    {/* Horizontal step chain with agent icons and arrows */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-5">
                      {template.steps.map((step, i) => (
                        <span key={i} className="flex items-center">
                          {i > 0 && <span className="text-void-600 mx-1 text-xs">{'\u2192'}</span>}
                          <span
                            className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg font-mono border transition-colors"
                            style={{
                              background: `${agentColor(step.agent_type)}08`,
                              borderColor: `${agentColor(step.agent_type)}25`,
                              color: agentColor(step.agent_type),
                            }}
                          >
                            <span className="text-xs">{agentIcon(step.agent_type)}</span>
                            {formatAgentType(step.agent_type)}
                          </span>
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => runPipeline(preset)}
                      disabled={running}
                      className={`btn-primary text-xs w-full ${running ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {running ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Running...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <span>{'\u25b6'}</span>
                          Run Pipeline
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Pipeline History ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-void-500 text-sm">{'\ud83d\udcdc'}</span>
          <h3 className="text-xs text-void-400 uppercase tracking-widest font-medium">Pipeline History</h3>
          {pipelineRuns.length > 0 && (
            <span className="badge text-[10px] font-mono ml-1" style={{ background: 'rgba(129,140,248,0.1)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.2)' }}>
              {pipelineRuns.length}
            </span>
          )}
        </div>

        {pipelineRuns.length === 0 ? (
          <div className="card p-12 text-center animate-fade-in">
            <div className="text-4xl mb-3 opacity-30">{'\ud83d\udcdc'}</div>
            <p className="text-void-400 text-sm">No pipeline runs yet.</p>
            <p className="text-void-600 text-xs mt-1">Run a pipeline template above to see results here.</p>
          </div>
        ) : (
          <div className="card overflow-hidden animate-fade-in">
            {/* Table header */}
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-void-800 bg-void-900/50">
              <span className="text-[10px] text-void-500 uppercase tracking-wider font-medium w-6">{'  '}</span>
              <span className="text-[10px] text-void-500 uppercase tracking-wider font-medium">Name</span>
              <span className="text-[10px] text-void-500 uppercase tracking-wider font-medium">Status</span>
              <span className="text-[10px] text-void-500 uppercase tracking-wider font-medium">Steps</span>
              <span className="text-[10px] text-void-500 uppercase tracking-wider font-medium">Date</span>
            </div>

            {/* Table rows */}
            <div className="stagger">
              {pipelineRuns.map((run) => {
                let stepCount = 0
                try {
                  stepCount = JSON.parse(run.steps).length
                } catch { /* ignore */ }

                return (
                  <button
                    key={run.id}
                    onClick={() => {
                      setActivePipelineId(run.id)
                      fetch(`/api/pipelines/${run.id}`).then((r) => r.json()).then(setActivePipeline)
                    }}
                    className="w-full text-left grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-3.5 items-center border-b border-void-800/50 hover:bg-void-800/30 transition-colors group animate-fade-in"
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot(run.status)}`} />
                    <span className="font-medium text-sm text-white truncate group-hover:text-electric-bright transition-colors">
                      {run.name}
                    </span>
                    <span
                      className="badge text-[10px] font-mono"
                      style={{
                        background: run.status === 'completed' ? 'rgba(52,211,153,0.1)'
                          : run.status === 'running' ? 'rgba(251,191,36,0.1)'
                          : 'rgba(251,113,133,0.1)',
                        color: run.status === 'completed' ? '#34d399'
                          : run.status === 'running' ? '#fbbf24'
                          : '#fb7185',
                        border: `1px solid ${
                          run.status === 'completed' ? 'rgba(52,211,153,0.2)'
                          : run.status === 'running' ? 'rgba(251,191,36,0.2)'
                          : 'rgba(251,113,133,0.2)'
                        }`,
                      }}
                    >
                      {run.status}
                    </span>
                    <span className="text-void-400 text-xs font-mono">
                      {stepCount > 0 ? `${stepCount} steps` : '\u2014'}
                    </span>
                    <span className="text-void-500 text-xs font-mono">
                      {timeAgo(run.created_at)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
