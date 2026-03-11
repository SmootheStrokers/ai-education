import { useState, useEffect } from 'react'
import { AGENTS, REVIEW_STATUSES, REVIEW_COLORS, REVIEW_ICONS, formatAgentType, getRunTitle, getContentType, timeAgo, statusColor } from '../shared'

// --- Preview Renderers ---

function NewsletterPreview({ output }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="border-b-2 border-electric/40 pb-4 mb-6">
        <div className="text-[10px] text-electric-bright uppercase tracking-[0.2em] mb-2 font-mono">Newsletter</div>
        <h1 className="text-2xl font-display text-white leading-tight">
          {output.split('\n')[0]?.replace(/^#+\s/, '') || 'Newsletter Preview'}
        </h1>
      </div>
      <div className="text-void-200 leading-relaxed text-sm whitespace-pre-wrap">{output}</div>
    </div>
  )
}

function YoutubeScriptPreview({ output }) {
  const lines = output.split('\n')
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-rose/5 border border-rose/20 rounded-lg p-4 mb-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-rose/20 rounded-full flex items-center justify-center">
          <span className="text-rose text-sm">{'\u25b6'}</span>
        </div>
        <div>
          <div className="text-[10px] text-rose uppercase tracking-[0.2em] font-mono">YouTube Script</div>
        </div>
      </div>
      <div className="space-y-0.5 font-mono text-sm">
        {lines.map((line, i) => {
          const isHeading = line.startsWith('#')
          const isBracket = line.match(/^\[.*\]/)
          return (
            <div
              key={i}
              className={
                isHeading ? 'text-electric-bright font-display text-base mt-5 mb-1 not-italic'
                : isBracket ? 'text-electric-deep/80 italic text-xs'
                : 'text-void-200'
              }
              style={isHeading ? { fontFamily: 'var(--font-display)' } : undefined}
            >
              {line || '\u00a0'}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PlaybookPreview({ output }) {
  const sections = output.split(/\n(?=#{1,2}\s)/)
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gradient-to-r from-electric-deep/10 to-cyan/10 border border-electric-deep/20 rounded-xl p-5 mb-6">
        <div className="text-[10px] text-electric uppercase tracking-[0.2em] mb-1 font-mono">Playbook / Guide</div>
        <h1 className="text-xl font-display text-white">
          {sections[0]?.split('\n')[0]?.replace(/^#+\s/, '') || 'Playbook Preview'}
        </h1>
      </div>
      {sections.map((section, i) => (
        <div key={i} className="mb-3 bg-void-800/30 rounded-lg p-4 border border-void-700/50">
          <div className="text-void-200 text-sm whitespace-pre-wrap leading-relaxed">{section}</div>
        </div>
      ))}
    </div>
  )
}

function SocialMediaPreview({ output }) {
  const posts = output.split(/\n---\n|\n\n(?=#{1,3}\s)/).filter(Boolean)
  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="text-[10px] text-rose uppercase tracking-[0.2em] mb-2 font-mono">Social Media Posts</div>
      {posts.map((post, i) => (
        <div key={i} className="bg-void-800/60 rounded-xl p-4 border border-void-700/50">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-electric to-electric-deep flex items-center justify-center text-[10px] font-bold text-void-950">
              AI
            </div>
            <div>
              <div className="text-xs font-medium text-white">AI Education</div>
              <div className="text-[10px] text-void-500 font-mono">just now</div>
            </div>
          </div>
          <div className="text-sm text-void-200 whitespace-pre-wrap leading-relaxed">{post.trim()}</div>
          <div className="flex gap-6 mt-3 pt-3 border-t border-void-700/50 text-void-500 text-[10px] font-mono">
            <span>{'\u2764'} Like</span>
            <span>{'\ud83d\udcac'} Reply</span>
            <span>{'\u2197'} Share</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function VideoPreview({ run }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <video
        controls
        className="max-w-full max-h-[70vh] rounded-lg shadow-2xl bg-black"
        src={`/api/runs/${run.id}/video`}
      >
        Your browser does not support the video tag.
      </video>
      <div className="mt-4 flex gap-3">
        <a
          href={`/api/runs/${run.id}/video/download`}
          className="btn-secondary text-xs flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download MP4
        </a>
      </div>
    </div>
  )
}

function VideoScenePreview({ output }) {
  let scenes = []
  try {
    const parsed = JSON.parse(output)
    scenes = parsed.scenes || []
  } catch {
    return (
      <div className="p-6 text-void-200 text-sm whitespace-pre-wrap leading-relaxed max-w-2xl mx-auto">
        {output}
      </div>
    )
  }
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-3">
      <div className="text-[10px] text-electric uppercase tracking-[0.2em] mb-4 font-mono">Scene Breakdown</div>
      {scenes.map((scene, i) => (
        <div key={i} className="bg-void-800/40 border border-void-700/40 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-electric/10 text-electric text-[10px] font-mono px-2 py-0.5 rounded-full border border-electric/20">
              {scene.type}
            </span>
            <span className="text-[10px] text-void-500 font-mono">{scene.duration}s</span>
          </div>
          <div className="text-sm text-white font-medium">
            {scene.text || scene.heading || scene.stat || scene.tool_name || scene.before_label || ''}
          </div>
          {(scene.subtitle || scene.body || scene.label || scene.description) && (
            <div className="text-xs text-void-400 mt-1">
              {scene.subtitle || scene.body || scene.label || scene.description}
            </div>
          )}
          {scene.items && (
            <ul className="mt-2 space-y-0.5">
              {scene.items.map((item, j) => (
                <li key={j} className="text-xs text-void-300 pl-3 relative before:content-[''] before:absolute before:left-0 before:top-[7px] before:w-1.5 before:h-1.5 before:rounded-full before:bg-electric/40">
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}

function PreviewRenderer({ run }) {
  if (!run) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-void-500 gap-2">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-void-600">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
        <span className="text-sm">Select an output to preview</span>
      </div>
    )
  }

  if (run.status === 'running') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-8 h-8 border-2 border-electric border-t-transparent rounded-full animate-spin" />
        <span className="text-electric text-sm font-mono">Agent running...</span>
      </div>
    )
  }

  if (run.status === 'failed') {
    return (
      <div className="p-6">
        <div className="bg-rose/5 border border-rose/20 rounded-lg p-4">
          <div className="text-rose font-medium text-sm mb-2">Run Failed</div>
          <pre className="text-rose/70 text-xs whitespace-pre-wrap font-mono">{run.error}</pre>
        </div>
      </div>
    )
  }

  // Video output takes priority for video agent
  if (run.video_output_path) {
    return <VideoPreview run={run} />
  }

  // Real HTML in sandboxed iframe when available
  if (run.html_output_path) {
    return (
      <iframe
        src={`/api/runs/${run.id}/html`}
        title="HTML Preview"
        className="w-full h-full border-0 bg-white rounded-b-lg"
        sandbox="allow-scripts allow-same-origin"
      />
    )
  }

  // Fallback: type-specific renderers
  const contentType = getContentType(run)
  const output = run.output || ''

  if (contentType === 'newsletter' || contentType === 'email_sequence') {
    return <div className="p-6 overflow-auto h-full"><NewsletterPreview output={output} /></div>
  }
  if (contentType === 'youtube_script') {
    return <div className="p-6 overflow-auto h-full"><YoutubeScriptPreview output={output} /></div>
  }
  if (contentType === 'playbook' || contentType === 'guide' || contentType === 'course') {
    return <div className="p-6 overflow-auto h-full"><PlaybookPreview output={output} /></div>
  }
  if (contentType === 'social_post' || contentType === 'social_media') {
    return <div className="p-6 overflow-auto h-full"><SocialMediaPreview output={output} /></div>
  }
  if (run.agent_type === 'video') {
    return <div className="overflow-auto h-full"><VideoScenePreview output={output} /></div>
  }

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="max-w-2xl mx-auto text-void-200 text-sm whitespace-pre-wrap leading-relaxed">
        {output}
      </div>
    </div>
  )
}

// --- Toast ---

function Toast({ message, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div className="fixed bottom-6 right-6 bg-void-800 border border-void-600 text-white px-4 py-3 rounded-lg shadow-xl text-sm animate-fade-in z-50 flex items-center gap-2">
      <span className="text-neon-green">{'\u2713'}</span>
      {message}
    </div>
  )
}

// --- Main Page ---

export default function AgentOutputsPage({ onNavigate }) {
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRunId, setSelectedRunId] = useState(null)
  const [selectedRun, setSelectedRun] = useState(null)
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState(null)
  const [tags, setTags] = useState([])

  useEffect(() => {
    fetch('/api/runs?limit=200')
      .then((r) => r.json())
      .then((data) => { setRuns(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedRunId) { setSelectedRun(null); setTags([]); return }
    fetch(`/api/runs/${selectedRunId}`).then((r) => r.json()).then(setSelectedRun)
    fetch(`/api/runs/${selectedRunId}/tags`).then((r) => r.json()).then(setTags)
  }, [selectedRunId])

  useEffect(() => {
    if (!selectedRun || selectedRun.status !== 'running') return
    const interval = setInterval(() => {
      fetch(`/api/runs/${selectedRunId}`).then((r) => r.json()).then((data) => {
        setSelectedRun(data)
        if (data.status !== 'running') {
          setRuns((prev) => prev.map((r) => (r.id === data.id ? data : r)))
        }
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [selectedRun, selectedRunId])

  const updateReviewStatus = async (runId, status) => {
    await fetch(`/api/runs/${runId}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_status: status }),
    })
    setRuns((prev) => prev.map((r) => (r.id === runId ? { ...r, review_status: status } : r)))
    if (selectedRun?.id === runId) setSelectedRun((prev) => ({ ...prev, review_status: status }))
    setToast(`Marked as ${status}`)
  }

  const agentTypes = [...new Set(runs.map((r) => r.agent_type))].sort()

  const filteredRuns = runs.filter((r) => {
    if (filterType !== 'all' && r.agent_type !== filterType) return false
    if (filterStatus !== 'all' && (r.review_status || 'pending') !== filterStatus) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!getRunTitle(r).toLowerCase().includes(q) && !r.agent_type.toLowerCase().includes(q)) return false
    }
    return true
  })

  const groupedRuns = {}
  for (const run of filteredRuns) {
    if (!groupedRuns[run.agent_type]) groupedRuns[run.agent_type] = []
    groupedRuns[run.agent_type].push(run)
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] -m-10 overflow-hidden">
      {/* Panel 1: File Tree */}
      <div className="w-72 flex-shrink-0 border-r border-void-700/50 flex flex-col bg-void-950">
        {/* Search & Filters */}
        <div className="p-3 border-b border-void-700/50">
          <div className="relative">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-void-500">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search outputs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-void-800 border border-void-600 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder-void-500 focus:border-electric/40 focus:outline-none transition-colors"
            />
          </div>
          <div className="flex gap-1.5 mt-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="flex-1 bg-void-800 border border-void-600 rounded text-[11px] text-void-300 px-2 py-1 focus:border-electric/40 focus:outline-none"
            >
              <option value="all">All types</option>
              {agentTypes.map((t) => (
                <option key={t} value={t}>{formatAgentType(t)}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 bg-void-800 border border-void-600 rounded text-[11px] text-void-300 px-2 py-1 focus:border-electric/40 focus:outline-none"
            >
              <option value="all">All status</option>
              {REVIEW_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tree */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-3 space-y-2">
              {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
            </div>
          ) : Object.keys(groupedRuns).length === 0 ? (
            <div className="p-4 text-void-500 text-sm text-center mt-8">No outputs found</div>
          ) : (
            Object.entries(groupedRuns).map(([type, typeRuns]) => (
              <div key={type}>
                <div className="px-3 py-2 text-[10px] text-void-500 uppercase tracking-[0.15em] font-medium bg-void-900/60 border-b border-void-700/30 flex items-center gap-1.5">
                  <span>{AGENTS[type]?.icon || '\ud83d\udcc4'}</span>
                  {formatAgentType(type)}
                  <span className="ml-auto text-void-600 font-mono">{typeRuns.length}</span>
                </div>
                {typeRuns.map((run) => {
                  const reviewStatus = run.review_status || 'pending'
                  const isSelected = selectedRunId === run.id
                  return (
                    <button
                      key={run.id}
                      onClick={() => setSelectedRunId(run.id)}
                      className={`w-full text-left px-3 py-2.5 text-sm border-b border-void-800/30 transition-all ${
                        isSelected
                          ? 'bg-electric/5 border-l-2 border-l-electric'
                          : 'hover:bg-void-800/40 border-l-2 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className={`truncate flex-1 text-xs ${isSelected ? 'text-white' : 'text-void-200'}`}>
                          {getRunTitle(run)}
                        </span>
                        <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[9px] border font-mono ${REVIEW_COLORS[reviewStatus]}`}>
                          {REVIEW_ICONS[reviewStatus]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-void-500 font-mono">{getContentType(run)}</span>
                        <span className="text-[10px] text-void-600 font-mono">
                          {new Date(run.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        {run.html_output_path && (
                          <span className="text-[9px] text-neon-green font-mono">HTML</span>
                        )}
                        {run.video_output_path && (
                          <span className="text-[9px] text-cyan font-mono">MP4</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div className="p-2 border-t border-void-700/50 text-[10px] text-void-500 text-center font-mono">
          {filteredRuns.length} output{filteredRuns.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Panel 2: Output Detail */}
      <div className="w-80 flex-shrink-0 border-r border-void-700/50 flex flex-col bg-void-900/30 overflow-y-auto">
        {!selectedRun ? (
          <div className="flex flex-col items-center justify-center h-full text-void-500 text-sm p-6 text-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-void-600">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            Select an output to view details
          </div>
        ) : (
          <div className="p-4 space-y-5 animate-slide-left">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{AGENTS[selectedRun.agent_type]?.icon || '\ud83d\udcc4'}</span>
                <h3 className="text-lg font-display text-white truncate">{getRunTitle(selectedRun)}</h3>
              </div>
              <div className="text-[10px] text-void-500 font-mono uppercase tracking-wider">
                {formatAgentType(selectedRun.agent_type)} {'\u00b7'} {getContentType(selectedRun)}
              </div>
            </div>

            {/* Review Status */}
            <div>
              <div className="text-[10px] text-void-400 mb-2 uppercase tracking-wider font-medium">Review Status</div>
              <div className="flex flex-wrap gap-1.5">
                {REVIEW_STATUSES.map((status) => (
                  <button
                    key={status}
                    onClick={() => updateReviewStatus(selectedRun.id, status)}
                    className={`px-2.5 py-1 rounded-full text-[11px] border transition-all font-medium ${
                      (selectedRun.review_status || 'pending') === status
                        ? REVIEW_COLORS[status]
                        : 'border-void-700 text-void-500 hover:border-void-500 hover:text-void-300'
                    }`}
                  >
                    {REVIEW_ICONS[status]} {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="divider" />

            {/* Metadata */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-void-500">Status</span>
                <span className={`font-mono ${statusColor(selectedRun.status)}`}>{selectedRun.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-void-500">Created</span>
                <span className="text-void-300 font-mono text-[11px]">{new Date(selectedRun.created_at).toLocaleString()}</span>
              </div>
              {selectedRun.completed_at && (
                <div className="flex justify-between">
                  <span className="text-void-500">Completed</span>
                  <span className="text-void-300 font-mono text-[11px]">{new Date(selectedRun.completed_at).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-void-500">HTML</span>
                <span className={selectedRun.html_output_path ? 'text-neon-green' : 'text-void-600'}>{selectedRun.html_output_path ? 'Available' : 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-void-500">Video</span>
                <span className={selectedRun.video_output_path ? 'text-cyan' : 'text-void-600'}>{selectedRun.video_output_path ? 'Available' : 'None'}</span>
              </div>
              {selectedRun.pipeline_run_id && (
                <div className="flex justify-between">
                  <span className="text-void-500">Pipeline</span>
                  <span className="text-electric font-mono">#{selectedRun.pipeline_run_id}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <div className="text-[10px] text-void-400 mb-1.5 uppercase tracking-wider font-medium">Tags</div>
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span key={tag} className="bg-electric/10 text-electric-bright px-2 py-0.5 rounded-full text-[10px] border border-electric/20">
                    {tag}
                  </span>
                ))}
                {tags.length === 0 && <span className="text-void-600 text-[10px] font-mono">no tags</span>}
              </div>
            </div>

            {/* Params */}
            <div>
              <div className="text-[10px] text-void-400 mb-1.5 uppercase tracking-wider font-medium">Parameters</div>
              <pre className="text-[11px] text-void-400 bg-void-800/40 rounded-lg p-3 overflow-x-auto font-mono leading-relaxed border border-void-700/30">
                {(() => {
                  try { return JSON.stringify(JSON.parse(selectedRun.input_params), null, 2) }
                  catch { return selectedRun.input_params }
                })()}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {selectedRun.video_output_path && (
                <a
                  href={`/api/runs/${selectedRun.id}/video/download`}
                  className="btn-primary text-center text-xs flex items-center justify-center gap-1.5"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download Video
                </a>
              )}
              {selectedRun.html_output_path && (
                <>
                  <a
                    href={`/api/runs/${selectedRun.id}/html`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-center text-xs"
                  >
                    Open HTML in New Tab
                  </a>
                  <a href={`/api/runs/${selectedRun.id}/download`} className="btn-secondary text-center text-xs">
                    Download HTML
                  </a>
                </>
              )}
              <button
                onClick={() => onNavigate('output', selectedRun.id)}
                className="btn-secondary text-xs text-center"
              >
                Full Detail View
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Panel 3: Live Preview */}
      <div className="flex-1 flex flex-col bg-void-950 min-w-0">
        <div className="flex items-center justify-between px-4 py-2 border-b border-void-700/50 bg-void-900/30">
          <span className="text-[10px] text-void-400 uppercase tracking-wider font-mono">
            {selectedRun
              ? selectedRun.video_output_path ? 'Video Preview'
              : selectedRun.html_output_path ? 'HTML Preview'
              : `${getContentType(selectedRun)} Preview`
              : 'Preview'}
          </span>
          {selectedRun?.html_output_path && (
            <a
              href={`/api/runs/${selectedRun.id}/html`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-electric hover:text-electric-bright font-mono transition-colors"
            >
              Open in new tab {'\u2197'}
            </a>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <PreviewRenderer run={selectedRun} />
        </div>
      </div>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
