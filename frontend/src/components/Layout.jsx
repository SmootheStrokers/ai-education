import Sidebar from './Sidebar'

export default function Layout({ currentPage, onNavigate, children }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
