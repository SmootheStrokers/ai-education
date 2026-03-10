import { useState } from 'react'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import AgentsPage from './pages/AgentsPage'
import HistoryPage from './pages/HistoryPage'
import OutputPage from './pages/OutputPage'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [selectedRunId, setSelectedRunId] = useState(null)

  const navigate = (page, runId = null) => {
    setCurrentPage(page)
    if (runId) setSelectedRunId(runId)
  }

  return (
    <Layout currentPage={currentPage} onNavigate={navigate}>
      {currentPage === 'dashboard' && <DashboardPage onNavigate={navigate} />}
      {currentPage === 'agents' && <AgentsPage onNavigate={navigate} />}
      {currentPage === 'history' && <HistoryPage onNavigate={navigate} />}
      {currentPage === 'output' && <OutputPage runId={selectedRunId} onNavigate={navigate} />}
    </Layout>
  )
}

export default App
