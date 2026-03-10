const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '~' },
  { id: 'agents', label: 'Run Agent', icon: '>' },
  { id: 'pipelines', label: 'Pipelines', icon: '|' },
  { id: 'library', label: 'Library', icon: '@' },
  { id: 'history', label: 'History', icon: '#' },
]

export default function Sidebar({ currentPage, onNavigate }) {
  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 p-4 flex flex-col">
      <h1 className="text-xl font-bold mb-8 px-3">AI Education</h1>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              currentPage === item.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="mr-3 font-mono">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
