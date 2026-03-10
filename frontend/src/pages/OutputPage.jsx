import { useState, useEffect } from 'react'

export default function OutputPage({ runId, onNavigate }) {
  const [run, setRun] = useState(null)
  const [polling, setPolling] = useState(true)

  useEffect(() => {
    if (!runId) return

    const fetchRun = () => {
      fetch(`/api/runs/${runId}`)
        .then((r) => r.json())
        .then((data) => {
          setRun(data)
          if (data.status !== 'running') setPolling(false)
        })
    }

    fetchRun()
    if (!polling) return

    const interval = setInterval(fetchRun, 2000)
    return () => clearInterval(interval)
  }, [runId, polling])

  if (!run) return <div className="text-gray-400">Loading...</div>

  const statusColor = { running: 'text-yellow-400', completed: 'text-green-400', failed: 'text-red-400' }

  return (
    <div>
      <button onClick={() => onNavigate('history')} className="text-gray-400 hover:text-white mb-4 inline-block">
        &larr; Back to History
      </button>

      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold capitalize">{run.agent_type.replace('_', ' ')}</h2>
        <span className={`text-sm ${statusColor[run.status]}`}>{run.status}</span>
      </div>

      <div className="text-gray-400 text-sm mb-4">
        Started: {new Date(run.created_at).toLocaleString()}
        {run.completed_at && <span className="ml-4">Completed: {new Date(run.completed_at).toLocaleString()}</span>}
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-6">
        <h3 className="text-sm text-gray-400 mb-2">Input Parameters</h3>
        <pre className="text-sm text-gray-300 whitespace-pre-wrap">{JSON.stringify(JSON.parse(run.input_params), null, 2)}</pre>
      </div>

      {run.status === 'running' && (
        <div className="bg-gray-900 rounded-xl border border-yellow-800 p-8 text-center">
          <div className="text-yellow-400 text-lg mb-2">Agent is running...</div>
          <div className="text-gray-400 text-sm">This page will update automatically when complete.</div>
        </div>
      )}

      {run.status === 'completed' && run.output && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-sm text-gray-400 mb-4">Output</h3>
          <div className="prose prose-invert max-w-none whitespace-pre-wrap text-gray-200 leading-relaxed">
            {run.output}
          </div>
        </div>
      )}

      {run.status === 'failed' && (
        <div className="bg-gray-900 rounded-xl border border-red-800 p-6">
          <h3 className="text-sm text-red-400 mb-2">Error</h3>
          <pre className="text-sm text-red-300 whitespace-pre-wrap">{run.error}</pre>
        </div>
      )}
    </div>
  )
}
