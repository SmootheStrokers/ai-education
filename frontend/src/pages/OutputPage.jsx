import { useState, useEffect } from 'react'

const SUGGESTED_TAGS = ['contractor', 'realtor', 'service-pro', 'small-business', 'newsletter', 'youtube', 'social', 'playbook', 'guide', 'course', 'lead-magnet', 'case-study', 'draft', 'published']

export default function OutputPage({ runId, onNavigate }) {
  const [run, setRun] = useState(null)
  const [polling, setPolling] = useState(true)
  const [tags, setTags] = useState([])
  const [newTag, setNewTag] = useState('')

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
    fetch(`/api/runs/${runId}/tags`).then((r) => r.json()).then(setTags)

    if (!polling) return
    const interval = setInterval(fetchRun, 2000)
    return () => clearInterval(interval)
  }, [runId, polling])

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

      {/* Tags */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 items-center mb-2">
          {tags.map((tag) => (
            <span key={tag} className="bg-blue-600/20 text-blue-400 px-2.5 py-1 rounded-full text-xs flex items-center gap-1.5">
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-white">&times;</button>
            </span>
          ))}
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTag(newTag)}
              placeholder="Add tag..."
              className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs w-24 text-white placeholder-gray-500"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).slice(0, 8).map((tag) => (
            <button
              key={tag}
              onClick={() => addTag(tag)}
              className="text-xs text-gray-500 hover:text-gray-300 bg-gray-800/50 px-2 py-0.5 rounded"
            >
              +{tag}
            </button>
          ))}
        </div>
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

      {run.status === 'completed' && run.html_output_path && (
        <div className="flex gap-3 mb-6">
          <a
            href={`/api/runs/${runId}/html`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
          >
            <span>&#x2197;</span> View HTML
          </a>
          <a
            href={`/api/runs/${runId}/download`}
            className="bg-gray-700 hover:bg-gray-600 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
          >
            <span>&#x2913;</span> Download HTML
          </a>
        </div>
      )}

      {run.status === 'completed' && run.output && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-sm text-gray-400 mb-4">Markdown Output</h3>
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
