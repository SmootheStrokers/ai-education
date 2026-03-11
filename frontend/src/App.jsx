import { useState } from 'react'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import AgentsPage from './pages/AgentsPage'
import HistoryPage from './pages/HistoryPage'
import OutputPage from './pages/OutputPage'
import PipelinesPage from './pages/PipelinesPage'
import LibraryPage from './pages/LibraryPage'
import AgentOutputsPage from './pages/AgentOutputsPage'
import AnalyticsPage from './pages/AnalyticsPage'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [selectedRunId, setSelectedRunId] = useState(null)
  const [selectedPresetId, setSelectedPresetId] = useState(null)

  const navigate = (page, id = null) => {
    setCurrentPage(page)
    if (page === 'output') setSelectedRunId(id)
    if (page === 'pipelines') setSelectedPresetId(id)
  }

  return (
    <Layout currentPage={currentPage} onNavigate={navigate}>
      {currentPage === 'dashboard' && <DashboardPage onNavigate={navigate} />}
      {currentPage === 'agents' && <AgentsPage onNavigate={navigate} />}
      {currentPage === 'pipelines' && <PipelinesPage onNavigate={navigate} presetId={selectedPresetId} />}
      {currentPage === 'library' && <LibraryPage onNavigate={navigate} />}
      {currentPage === 'outputs' && <AgentOutputsPage onNavigate={navigate} />}
      {currentPage === 'history' && <HistoryPage onNavigate={navigate} />}
      {currentPage === 'output' && <OutputPage runId={selectedRunId} onNavigate={navigate} />}
      {currentPage === 'analytics' && <AnalyticsPage />}
    </Layout>
  )
}

export default App
