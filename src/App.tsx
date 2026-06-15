import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import SilverbrookPage from './pages/SilverbrookPage'
import DevelopmentDetailPage from './pages/DevelopmentDetailPage'
import ImportPage from './pages/ImportPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      {/* Silverbrook has the bespoke master-plan page; everything else uses the template */}
      <Route path="/developments/silverbrook" element={<SilverbrookPage />} />
      <Route path="/developments/:slug" element={<DevelopmentDetailPage />} />
      <Route path="/cms/import" element={<ImportPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
