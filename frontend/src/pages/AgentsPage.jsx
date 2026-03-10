import { useState, useEffect } from 'react'

export default function AgentsPage({ onNavigate }) {
  const [agents, setAgents] = useState({})
  const [presets, setPresets] = useState([])
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [formValues, setFormValues] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [showPresets, setShowPresets] = useState(true)

  useEffect(() => {
    fetch('/api/agents').then((r) => r.json()).then(setAgents)
    fetch('/api/presets').then((r) => r.json()).then(setPresets)
  }, [])

  const selectAgent = (key) => {
    setSelectedAgent(key)
    setFormValues({})
    setShowPresets(false)
  }

  const applyPreset = (quickRun) => {
    setSelectedAgent(quickRun.agent_type)
    setFormValues(quickRun.params)
    setShowPresets(false)
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Run Agent</h2>
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          {showPresets ? 'Manual Setup' : 'Industry Quick Start'}
        </button>
      </div>

      {showPresets && presets.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Industry Quick Start</h3>
          <div className="space-y-6">
            {presets.map((preset) => (
              <div key={preset.id} className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <div className="mb-3">
                  <h4 className="font-semibold text-lg">{preset.label}</h4>
                  <p className="text-gray-400 text-sm">{preset.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {preset.quick_runs.map((qr, i) => (
                    <button
                      key={i}
                      onClick={() => applyPreset(qr)}
                      className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-blue-500 px-3 py-1.5 rounded-lg text-sm transition-colors"
                    >
                      {qr.label}
                    </button>
                  ))}
                  {preset.pipeline_template && (
                    <button
                      onClick={() => onNavigate('pipelines', preset.id)}
                      className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-blue-400 px-3 py-1.5 rounded-lg text-sm transition-colors"
                    >
                      Run Full Package
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!showPresets && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {Object.entries(agents).map(([key, agent]) => (
              <button
                key={key}
                onClick={() => selectAgent(key)}
                className={`text-left p-4 rounded-xl border transition-colors ${
                  selectedAgent === key
                    ? 'border-blue-500 bg-blue-600/10'
                    : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                }`}
              >
                <div className="font-semibold">{agent.name}</div>
                <div className="text-gray-400 text-sm mt-1">{agent.description}</div>
              </button>
            ))}
          </div>

          {agentConfig && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold mb-4">{agentConfig.name} Parameters</h3>

              <div className="space-y-4">
                {Object.entries(agentConfig.params).map(([key, param]) => (
                  <div key={key}>
                    <label className="block text-sm text-gray-400 mb-1">
                      {param.label} {param.required && <span className="text-red-400">*</span>}
                    </label>

                    {param.type === 'select' ? (
                      <select
                        value={formValues[key] || ''}
                        onChange={(e) => setFormValues({ ...formValues, [key]: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="">Select...</option>
                        {param.options.map((opt) => (
                          <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>
                        ))}
                      </select>
                    ) : param.type === 'textarea' ? (
                      <textarea
                        value={formValues[key] || ''}
                        onChange={(e) => setFormValues({ ...formValues, [key]: e.target.value })}
                        placeholder={param.placeholder}
                        rows={4}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500"
                      />
                    ) : (
                      <input
                        type="text"
                        value={formValues[key] || ''}
                        onChange={(e) => setFormValues({ ...formValues, [key]: e.target.value })}
                        placeholder={param.placeholder}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500"
                      />
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-6 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 px-6 py-2 rounded-lg transition-colors"
              >
                {submitting ? 'Starting...' : 'Run Agent'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
