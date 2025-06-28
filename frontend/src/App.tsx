import { Routes, Route } from 'react-router-dom'
import UploadPage from './pages/UploadPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import DownloadPage from './pages/DownloadPage'


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<UploadPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/:shortCode" element={<DownloadPage />} />
    </Routes>
  )
}
