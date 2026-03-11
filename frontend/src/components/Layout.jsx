import Sidebar from './Sidebar'

export default function Layout({ currentPage, onNavigate, children }) {
  return (
    <div className="h-screen bg-void-950 text-void-200 flex overflow-hidden mesh-bg">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="p-10 max-w-[1440px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
