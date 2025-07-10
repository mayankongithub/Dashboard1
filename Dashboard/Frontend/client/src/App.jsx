
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar'
import OptimizedManualAutomate from './components/OptimizedManualAutomate'
import ManualAutomate from './components/manual_automate'
import MonthlyTestCases from './components/MonthlyTestCases'
import Tickets from './components/Tickets'
import BugStats from './components/BugStats'
import BugAreas from './components/BugAreas'

function App() {
  return (
    <Router>
      <div className="App bg-white min-h-screen">
        <Navbar />
        <div className="content">
          <Routes>
            <Route path="/" element={<OptimizedManualAutomate />} />
            <Route path="/analysis/manual-automate" element={<OptimizedManualAutomate />} />
            <Route path="/analysis/manual-automate-old" element={<ManualAutomate />} />
            <Route path="/monthly" element={<MonthlyTestCases />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/bug-stats" element={<BugStats />} />
            <Route path="/bug-areas" element={<BugAreas />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

// 404 Page
const NotFound = () => {
  return (
    <div className="not-found">
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
    </div>
  )
}

export default App


