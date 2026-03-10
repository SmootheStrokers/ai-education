import { useState, useEffect } from 'react'

export default function DashboardPage({ onNavigate }) {
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/runs?limit=10')
      .then((r) => r.json())
      .then((data) => { setRuns(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const statusColor = {
    running: 'text-yellow-400',
    completed: 'text-green-400',
    failed: 'text-red-400',
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="text-3xl font-bold">{runs.length}</div>
          <div className="text-gray-400 text-sm mt-1">Recent Runs</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="text-3xl font-bold text-green-400">
            {runs.filter((r) => r.status === 'completed').length}
          </div>
          <div className="text-gray-400 text-sm mt-1">Completed</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="text-3xl font-bold text-yellow-400">
            {runs.filter((r) => r.status === 'running').length}
          </div>
          <div className="text-gray-400 text-sm mt-1">Running</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <button
          onClick={() => onNavigate('agents')}
          className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Run New Agent
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : runs.length === 0 ? (
        <div className="text-gray-500 bg-gray-900 rounded-xl p-8 text-center border border-gray-800">
          No runs yet. Click &quot;Run New Agent&quot; to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {runs.map((run) => (
            <button
              key={run.id}
              onClick={() => onNavigate('output', run.id)}
              className="w-full text-left bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{run.agent_type.replace('_', ' ')}</span>
                  <span className={`ml-3 text-sm ${statusColor[run.status]}`}>{run.status}</span>
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
