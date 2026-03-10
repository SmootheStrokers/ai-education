import { useState } from 'react'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import AgentsPage from './pages/AgentsPage'
import HistoryPage from './pages/HistoryPage'
import OutputPage from './pages/OutputPage'
import PipelinesPage from './pages/PipelinesPage'

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
      {currentPage === 'history' && <HistoryPage onNavigate={navigate} />}
      {currentPage === 'output' && <OutputPage runId={selectedRunId} onNavigate={navigate} />}
    </Layout>
  )
}

export default App
