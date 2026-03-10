import { useState, useEffect } from 'react'

export default function LibraryPage({ onNavigate }) {
  const [runs, setRuns] = useState([])
  const [tags, setTags] = useState([])
  const [activeTag, setActiveTag] = useState('')
  const [agentFilter, setAgentFilter] = useState('')

  useEffect(() => {
    fetch('/api/tags').then((r) => r.json()).then(setTags)
  }, [])

  useEffect(() => {
    let url = '/api/runs?limit=100'
    if (activeTag) url = `/api/runs?tag=${activeTag}&limit=100`
    else if (agentFilter) url = `/api/runs?agent_type=${agentFilter}&limit=100`
    fetch(url).then((r) => r.json()).then(setRuns)
  }, [activeTag, agentFilter])

  const agentTypes = ['research', 'case_study', 'content', 'course_dev', 'marketing']

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Content Library</h2>

      {/* Tag filters */}
      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-2">Filter by tag</div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setActiveTag(''); setAgentFilter('') }}
            className={`px-3 py-1 rounded-lg text-sm ${!activeTag && !agentFilter ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => { setActiveTag(tag); setAgentFilter('') }}
              className={`px-3 py-1 rounded-lg text-sm ${activeTag === tag ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Agent type filters */}
      <div className="mb-6">
        <div className="text-xs text-gray-500 mb-2">Filter by agent</div>
        <div className="flex flex-wrap gap-2">
          {agentTypes.map((type) => (
            <button
              key={type}
              onClick={() => { setAgentFilter(type); setActiveTag('') }}
              className={`px-3 py-1 rounded-lg text-sm capitalize ${agentFilter === type ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-2">
        {runs.filter((r) => r.status === 'completed').map((run) => (
          <button
            key={run.id}
            onClick={() => onNavigate('output', run.id)}
            className="w-full text-left bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium capitalize">{run.agent_type.replace('_', ' ')}</span>
                {run.html_output_path && <span className="ml-2 text-xs text-green-400">HTML</span>}
              </div>
              <span className="text-gray-500 text-sm">{new Date(run.created_at).toLocaleString()}</span>
            </div>
            {run.input_params && (
              <div className="text-gray-500 text-xs mt-1 truncate">
                {(() => {
                  try {
                    const p = JSON.parse(run.input_params)
                    return p.topic || p.industry || p.content_type || ''
                  } catch { return '' }
                })()}
              </div>
            )}
          </button>
        ))}
        {runs.filter((r) => r.status === 'completed').length === 0 && (
          <div className="text-gray-500 text-center py-8">No completed content found.</div>
        )}
      </div>
    </div>
  )
}
