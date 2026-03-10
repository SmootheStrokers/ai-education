import { useState, useEffect } from 'react'

export default function PipelinesPage({ onNavigate, presetId }) {
  const [presets, setPresets] = useState([])
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [pipelineRuns, setPipelineRuns] = useState([])
  const [running, setRunning] = useState(false)
  const [activePipelineId, setActivePipelineId] = useState(null)
  const [activePipeline, setActivePipeline] = useState(null)

  useEffect(() => {
    fetch('/api/presets').then((r) => r.json()).then((data) => {
      setPresets(data)
      if (presetId) {
        const match = data.find((p) => p.id === presetId)
        if (match) setSelectedPreset(match)
      }
    })
    fetch('/api/pipelines').then((r) => r.json()).then(setPipelineRuns)
  }, [presetId])

  // Poll active pipeline
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

  const statusColor = {
    running: 'text-yellow-400',
    completed: 'text-green-400',
    failed: 'text-red-400',
  }

  const stepStatusIcon = (status) => {
    if (status === 'completed') return '\u2713'
    if (status === 'running') return '\u25CB'
    if (status === 'failed') return '\u2717'
    return '\u25CB'
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Content Pipelines</h2>

      {/* Active pipeline progress */}
      {activePipeline && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{activePipeline.pipeline_run.name}</h3>
            <span className={`text-sm ${statusColor[activePipeline.pipeline_run.status]}`}>
              {activePipeline.pipeline_run.status}
            </span>
          </div>
          <div className="space-y-3">
            {activePipeline.agent_runs.map((run, i) => (
              <div key={run.id} className="flex items-center gap-3">
                <span className={`text-lg ${statusColor[run.status]}`}>
                  {stepStatusIcon(run.status)}
                </span>
                <span className="capitalize text-sm">{run.agent_type.replace('_', ' ')}</span>
                <span className={`text-xs ${statusColor[run.status]}`}>{run.status}</span>
                {run.status === 'completed' && (
                  <button
                    onClick={() => onNavigate('output', run.id)}
                    className="text-xs text-blue-400 hover:text-blue-300 ml-auto"
                  >
                    View Output
                  </button>
                )}
              </div>
            ))}
            {/* Show pending steps not yet created as agent_runs */}
            {activePipeline.pipeline_run.status === 'running' && (() => {
              const steps = JSON.parse(activePipeline.pipeline_run.steps)
              const remaining = steps.slice(activePipeline.agent_runs.length)
              return remaining.map((step, i) => (
                <div key={`pending-${i}`} className="flex items-center gap-3 opacity-40">
                  <span className="text-lg">{'\u25CB'}</span>
                  <span className="capitalize text-sm">{step.agent_type.replace('_', ' ')}</span>
                  <span className="text-xs">pending</span>
                </div>
              ))
            })()}
          </div>
        </div>
      )}

      {/* Pipeline templates */}
      <h3 className="text-lg font-semibold mb-4">Pipeline Templates</h3>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {presets.filter((p) => p.pipeline_template).map((preset) => (
          <div
            key={preset.id}
            className="bg-gray-900 rounded-xl border border-gray-800 p-5"
          >
            <h4 className="font-semibold mb-1">{preset.pipeline_template.name}</h4>
            <p className="text-gray-400 text-sm mb-3">{preset.pipeline_template.description}</p>
            <div className="flex flex-wrap gap-1 mb-4">
              {preset.pipeline_template.steps.map((step, i) => (
                <span key={i} className="text-xs bg-gray-800 px-2 py-1 rounded capitalize">
                  {i > 0 && <span className="text-gray-500 mr-1">{'\u2192'}</span>}
                  {step.agent_type.replace('_', ' ')}
                </span>
              ))}
            </div>
            <button
              onClick={() => runPipeline(preset)}
              disabled={running}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {running ? 'Running...' : 'Run Pipeline'}
            </button>
          </div>
        ))}
      </div>

      {/* Pipeline history */}
      <h3 className="text-lg font-semibold mb-4">Pipeline History</h3>
      <div className="space-y-2">
        {pipelineRuns.map((run) => (
          <button
            key={run.id}
            onClick={() => {
              setActivePipelineId(run.id)
              fetch(`/api/pipelines/${run.id}`).then((r) => r.json()).then(setActivePipeline)
            }}
            className="w-full text-left bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">{run.name}</span>
                <span className={`ml-3 text-sm ${statusColor[run.status]}`}>{run.status}</span>
              </div>
              <span className="text-gray-500 text-sm">{new Date(run.created_at).toLocaleString()}</span>
            </div>
          </button>
        ))}
        {pipelineRuns.length === 0 && (
          <div className="text-gray-500 text-center py-8">No pipeline runs yet.</div>
        )}
      </div>
    </div>
  )
}
