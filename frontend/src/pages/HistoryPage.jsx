import { useState, useEffect } from 'react'

export default function HistoryPage({ onNavigate }) {
  const [runs, setRuns] = useState([])
  const [filter, setFilter] = useState('')

  useEffect(() => {
    const url = filter ? `/api/runs?agent_type=${filter}` : '/api/runs'
    fetch(url).then((r) => r.json()).then(setRuns)
  }, [filter])

  const agentTypes = ['research', 'case_study', 'content', 'course_dev', 'marketing']
  const statusColor = { running: 'text-yellow-400', completed: 'text-green-400', failed: 'text-red-400' }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Run History</h2>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('')}
          className={`px-3 py-1 rounded-lg text-sm ${!filter ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
        >
          All
        </button>
        {agentTypes.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1 rounded-lg text-sm ${filter === type ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
          >
            {type.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {runs.map((run) => (
          <button
            key={run.id}
            onClick={() => onNavigate('output', run.id)}
            className="w-full text-left bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium capitalize">{run.agent_type.replace('_', ' ')}</span>
                <span className={`ml-3 text-sm ${statusColor[run.status]}`}>{run.status}</span>
              </div>
              <span className="text-gray-500 text-sm">{new Date(run.created_at).toLocaleString()}</span>
            </div>
          </button>
        ))}
        {runs.length === 0 && (
          <div className="text-gray-500 text-center py-8">No runs found.</div>
        )}
      </div>
    </div>
  )
}
