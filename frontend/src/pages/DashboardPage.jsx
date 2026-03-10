import { useState, useEffect } from 'react'

export default function DashboardPage({ onNavigate }) {
  const [runs, setRuns] = useState([])
  const [pipelineRuns, setPipelineRuns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/runs?limit=50').then((r) => r.json()),
      fetch('/api/pipelines?limit=10').then((r) => r.json()),
    ]).then(([runsData, pipelinesData]) => {
      setRuns(runsData)
      setPipelineRuns(pipelinesData)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const statusColor = {
    running: 'text-yellow-400',
    completed: 'text-green-400',
    failed: 'text-red-400',
  }

  const completed = runs.filter((r) => r.status === 'completed')
  const running = runs.filter((r) => r.status === 'running')
  const withHtml = runs.filter((r) => r.html_output_path)

  // Count by agent type
  const byAgent = {}
  for (const run of completed) {
    byAgent[run.agent_type] = (byAgent[run.agent_type] || 0) + 1
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Dashboard</h2>
      <p className="text-gray-400 text-sm mb-6">AI for Everyday Americans — Content Production Hub</p>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="text-3xl font-bold">{runs.length}</div>
          <div className="text-gray-400 text-sm mt-1">Total Runs</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="text-3xl font-bold text-green-400">{completed.length}</div>
          <div className="text-gray-400 text-sm mt-1">Completed</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="text-3xl font-bold text-blue-400">{withHtml.length}</div>
          <div className="text-gray-400 text-sm mt-1">HTML Assets</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="text-3xl font-bold text-purple-400">{pipelineRuns.length}</div>
          <div className="text-gray-400 text-sm mt-1">Pipelines Run</div>
        </div>
      </div>

      {/* Content by agent type */}
      {Object.keys(byAgent).length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 mb-8">
          <h3 className="text-sm text-gray-400 mb-3">Content by Type</h3>
          <div className="grid grid-cols-5 gap-3">
            {Object.entries(byAgent).map(([type, count]) => (
              <div key={type} className="text-center">
                <div className="text-xl font-bold">{count}</div>
                <div className="text-xs text-gray-500 capitalize">{type.replace('_', ' ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => onNavigate('agents')}
          className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Run New Agent
        </button>
        <button
          onClick={() => onNavigate('pipelines')}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Run Pipeline
        </button>
        <button
          onClick={() => onNavigate('library')}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Content Library
        </button>
      </div>

      {/* Recent activity */}
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : runs.length === 0 ? (
        <div className="text-gray-500 bg-gray-900 rounded-xl p-8 text-center border border-gray-800">
          No runs yet. Click &quot;Run New Agent&quot; to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {runs.slice(0, 10).map((run) => (
            <button
              key={run.id}
              onClick={() => onNavigate('output', run.id)}
              className="w-full text-left bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium capitalize">{run.agent_type.replace('_', ' ')}</span>
                  <span className={`ml-3 text-sm ${statusColor[run.status]}`}>{run.status}</span>
                  {run.pipeline_run_id && <span className="ml-2 text-xs text-purple-400">pipeline</span>}
                </div>
                <span className="text-gray-500 text-sm">{new Date(run.created_at).toLocaleString()}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
