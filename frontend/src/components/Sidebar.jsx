import { useState, useEffect } from 'react'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>
  )},
  { id: 'agents', label: 'Run Agent', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
  )},
  { id: 'pipelines', label: 'Pipelines', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M15 6a9 9 0 0 0-9 9"/></svg>
  )},
  { id: 'outputs', label: 'Outputs', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
  )},
  { id: 'library', label: 'Library', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
  )},
  { id: 'history', label: 'History', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  )},
  { id: 'analytics', label: 'Analytics', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  )},
]

export default function Sidebar({ currentPage, onNavigate }) {
  const [runningCount, setRunningCount] = useState(0)

  useEffect(() => {
    const check = () => {
      fetch('/api/runs?limit=20')
        .then(r => r.json())
        .then(data => setRunningCount(data.filter(r => r.status === 'running').length))
        .catch(() => {})
    }
    check()
    const i = setInterval(check, 5000)
    return () => clearInterval(i)
  }, [])

  return (
    <div className="w-[240px] flex flex-col border-r border-void-700/40 bg-void-950/80 backdrop-blur-xl relative z-20 noise-bg">
      {/* Brand */}
      <div className="px-6 pt-7 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-electric-deep to-electric flex items-center justify-center shadow-[0_0_24px_-4px_rgba(99,102,241,0.4)] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
            <span className="text-white font-extrabold text-xs font-display tracking-tight relative">AI</span>
          </div>
          <div>
            <h1 className="text-[14px] font-extrabold text-white tracking-[-0.02em] font-display">AI Education</h1>
            <p className="text-[10px] text-void-500 tracking-[0.12em] uppercase font-semibold mt-0.5">Content Hub</p>
          </div>
        </div>
      </div>

      <div className="mx-6 mb-5 h-px bg-gradient-to-r from-void-700/60 via-void-600/40 to-transparent" />

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = currentPage === item.id
          const showBadge = item.id === 'dashboard' && runningCount > 0
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full text-left px-4 py-2.5 rounded-[12px] flex items-center gap-3 transition-all duration-250 text-[13px] group relative ${
                isActive
                  ? 'text-white'
                  : 'text-void-400 hover:text-void-100 hover:bg-void-800/40'
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 rounded-[12px] bg-gradient-to-r from-electric/15 to-electric/5 border border-electric/20" />
              )}

              <span className={`flex-shrink-0 relative z-10 transition-colors duration-250 ${isActive ? 'text-electric-bright' : 'text-void-500 group-hover:text-void-300'}`}>
                {item.icon}
              </span>
              <span className="font-semibold relative z-10 tracking-[-0.01em]">{item.label}</span>

              {/* Running badge */}
              {showBadge && (
                <span className="relative z-10 ml-auto bg-gold/20 text-gold text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md border border-gold/30 tabular-nums animate-pulse">
                  {runningCount}
                </span>
              )}

              {isActive && !showBadge && (
                <div className="ml-auto relative z-10 w-1.5 h-1.5 rounded-full bg-electric shadow-[0_0_8px_rgba(129,140,248,0.6)]" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-5 border-t border-void-700/30">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-2 h-2 rounded-full bg-neon-green shadow-[0_0_8px_rgba(52,211,153,0.5)]" style={{ animation: 'pulse-glow 3s ease-in-out infinite' }} />
          <span className="text-[11px] text-void-400 font-semibold">All systems online</span>
        </div>
        <div className="text-[10px] text-void-600 font-mono tracking-wider">v2.0.0</div>
      </div>
    </div>
  )
}
