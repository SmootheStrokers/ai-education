import { useState, useEffect, useMemo } from 'react'
import { AGENTS, formatAgentType, timeAgo, getRunTitle, getContentType } from '../shared'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'agent',  label: 'By Agent Type' },
]

export default function LibraryPage({ onNavigate }) {
  const [runs, setRuns] = useState([])
  const [tags, setTags] = useState([])
  const [activeTag, setActiveTag] = useState('')
  const [agentFilter, setAgentFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    fetch('/api/tags').then((r) => r.json()).then(setTags)
  }, [])

  useEffect(() => {
    setLoading(true)
    let url = '/api/runs?limit=100'
    if (activeTag) url = `/api/runs?tag=${activeTag}&limit=100`
    else if (agentFilter) url = `/api/runs?agent_type=${agentFilter}&limit=100`
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setRuns(data)
        setLoading(false)
      })
  }, [activeTag, agentFilter])

  const filteredRuns = useMemo(() => {
    let result = runs.filter((r) => r.status === 'completed')

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((r) => {
        const title = getRunTitle(r).toLowerCase()
        const type = formatAgentType(r.agent_type).toLowerCase()
        const content = getContentType(r).toLowerCase()
        return title.includes(q) || type.includes(q) || content.includes(q)
      })
    }

    if (sortBy === 'oldest') {
      result = [...result].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    } else if (sortBy === 'agent') {
      result = [...result].sort((a, b) => a.agent_type.localeCompare(b.agent_type))
    } else {
      result = [...result].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }

    return result
  }, [runs, search, sortBy])

  const agentTypes = Object.keys(AGENTS)

  const clearFilters = () => {
    setActiveTag('')
    setAgentFilter('')
  }

  return (
    <div className="animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-electric/10 border border-electric/20 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <line x1="9" y1="7" x2="16" y2="7" />
              <line x1="9" y1="11" x2="14" y2="11" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-display text-white mb-0.5">Content Library</h2>
            <p className="text-void-400 text-sm">
              {loading ? 'Loading...' : `${filteredRuns.length} completed asset${filteredRuns.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-void-500">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search by title, agent type, or content type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-void-900 border border-void-700 rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder-void-500 focus:border-electric/50 focus:outline-none focus:ring-1 focus:ring-electric/25 transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-void-500 hover:text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Filter Bar ── */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-void-500 uppercase tracking-wider font-medium font-mono shrink-0">Filters</span>
            <button
              onClick={clearFilters}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                !activeTag && !agentFilter
                  ? 'bg-electric/15 text-electric border-electric/30'
                  : 'bg-void-800 border-void-700 text-void-400 hover:text-white hover:border-void-500'
              }`}
            >
              All
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => { setActiveTag(tag); setAgentFilter('') }}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                  activeTag === tag
                    ? 'bg-cyan/15 text-cyan border-cyan/30'
                    : 'bg-void-800 border-void-700 text-void-400 hover:text-white hover:border-void-500'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>

          {/* Separator */}
          {tags.length > 0 && <div className="w-px h-5 bg-void-700 hidden sm:block" />}

          {/* Agent types */}
          <div className="flex items-center gap-2 flex-wrap">
            {agentTypes.map((type) => {
              const agent = AGENTS[type]
              return (
                <button
                  key={type}
                  onClick={() => { setAgentFilter(type); setActiveTag('') }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border flex items-center gap-1.5 ${
                    agentFilter === type
                      ? 'border-transparent text-white'
                      : 'bg-void-800 border-void-700 text-void-400 hover:text-white hover:border-void-500'
                  }`}
                  style={agentFilter === type ? { background: `${agent.color}20`, borderColor: `${agent.color}50`, color: agent.color } : {}}
                >
                  <span className="text-xs">{agent.icon}</span>
                  {agent.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Toolbar: Sort + View Toggle ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-void-900 border border-void-700 rounded-lg px-3 py-1.5 text-void-300 text-xs font-mono focus:border-electric/50 focus:outline-none transition-colors cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center bg-void-900 border border-void-700 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-all ${
              viewMode === 'grid'
                ? 'bg-electric/15 text-electric'
                : 'text-void-500 hover:text-white'
            }`}
            title="Grid view"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-all ${
              viewMode === 'list'
                ? 'bg-electric/15 text-electric'
                : 'text-void-500 hover:text-white'
            }`}
            title="List view"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-xl" />
          ))}
        </div>
      ) : filteredRuns.length === 0 ? (
        /* ── Empty State ── */
        <div className="card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-void-800 border border-void-700 flex items-center justify-center mx-auto mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <h3 className="text-lg font-display text-white mb-2">
            {search || activeTag || agentFilter ? 'No matching content' : 'Your library is empty'}
          </h3>
          <p className="text-void-400 text-sm mb-6 max-w-sm mx-auto">
            {search || activeTag || agentFilter
              ? 'Try adjusting your filters or search query to find what you\'re looking for.'
              : 'Run some agents to generate content and it will appear here.'}
          </p>
          {!search && !activeTag && !agentFilter && (
            <button
              onClick={() => onNavigate('agents')}
              className="btn-primary px-6 py-2.5 text-sm"
            >
              Run Your First Agent
            </button>
          )}
          {(search || activeTag || agentFilter) && (
            <button
              onClick={() => { setSearch(''); clearFilters() }}
              className="btn-secondary px-5 py-2 text-sm"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ── Grid View ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {filteredRuns.map((run) => {
            const agent = AGENTS[run.agent_type] || { icon: '\uD83D\uDCC4', color: '#818cf8', label: run.agent_type }
            const title = getRunTitle(run)
            const contentType = getContentType(run)

            return (
              <button
                key={run.id}
                onClick={() => onNavigate('output', run.id)}
                className="text-left card group animate-fade-in overflow-hidden hover:border-void-500 transition-all duration-200"
              >
                {/* Color accent strip */}
                <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${agent.color}, ${agent.color}66)` }} />

                <div className="p-5">
                  {/* Top row: icon + agent label */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                        style={{ background: `${agent.color}15`, border: `1px solid ${agent.color}25` }}
                      >
                        {agent.icon}
                      </div>
                      <span
                        className="text-xs font-medium font-mono uppercase tracking-wide"
                        style={{ color: agent.color }}
                      >
                        {agent.label}
                      </span>
                    </div>
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="text-void-600 group-hover:text-void-300 transition-colors shrink-0"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-medium text-white mb-2 line-clamp-2 leading-snug">{title}</h3>

                  {/* Content type badge */}
                  <div className="mb-3">
                    <span className="badge text-[10px] capitalize">{formatAgentType(contentType)}</span>
                  </div>

                  {/* Bottom row: asset badges + date */}
                  <div className="flex items-center justify-between pt-3 border-t border-void-800">
                    <div className="flex items-center gap-1.5">
                      {run.html_output_path && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-neon-green/10 text-neon-green border-neon-green/20">
                          HTML
                        </span>
                      )}
                      {run.video_path && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-cyan/10 text-cyan border-cyan/20">
                          MP4
                        </span>
                      )}
                    </div>
                    <span className="text-void-500 text-[11px] font-mono">{timeAgo(run.created_at)}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        /* ── List View ── */
        <div className="space-y-1.5 stagger">
          {filteredRuns.map((run) => {
            const agent = AGENTS[run.agent_type] || { icon: '\uD83D\uDCC4', color: '#818cf8', label: run.agent_type }
            const title = getRunTitle(run)
            const contentType = getContentType(run)

            return (
              <button
                key={run.id}
                onClick={() => onNavigate('output', run.id)}
                className="w-full text-left card px-4 py-3.5 flex items-center gap-4 animate-fade-in group hover:border-void-500 transition-all"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                  style={{ background: `${agent.color}15`, border: `1px solid ${agent.color}25` }}
                >
                  {agent.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-white truncate">{title}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-[10px] font-mono uppercase tracking-wide"
                      style={{ color: agent.color }}
                    >
                      {agent.label}
                    </span>
                    <span className="text-void-700">|</span>
                    <span className="text-void-500 text-[10px] capitalize">{formatAgentType(contentType)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {run.html_output_path && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-neon-green/10 text-neon-green border-neon-green/20">
                      HTML
                    </span>
                  )}
                  {run.video_path && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-cyan/10 text-cyan border-cyan/20">
                      MP4
                    </span>
                  )}
                </div>

                <span className="text-void-500 text-xs font-mono shrink-0">{timeAgo(run.created_at)}</span>

                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="text-void-600 group-hover:text-void-300 transition-colors shrink-0"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
