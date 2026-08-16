import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { DigitalTwinPage } from './pages/DigitalTwinPage'
import { MedicalTimelinePage } from './pages/MedicalTimelinePage'
import { MedicationsPage, AllergiesConditionsPage } from './pages/MedicationsPage'
import { LabTrendsPage } from './pages/LabTrendsPage'
import { AIInsightsPage } from './pages/AIInsightsPage'
import { HealthRecordsPage } from './pages/HealthRecordsPage'
import { ConsentPage } from './pages/ConsentPage'
import { AuditLogPage } from './pages/AuditLogPage'
import { EmergencyProfilePage } from './pages/EmergencyProfilePage'
import { SettingsPage, ProfilePage } from './pages/SettingsPage'
import { DoctorDashboardPage } from './pages/DoctorDashboardPage'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { getAuthToken, getUserRole } from './lib/api'

function RequireAuth({ allowedRole }: { allowedRole?: string }) {
  const token = getAuthToken()
  const role = getUserRole()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (allowedRole && role !== allowedRole) {
    return <Navigate to={role === 'DOCTOR' ? '/doctor' : '/app/dashboard'} replace />
  }

  return <Outlet />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Doctor Routes */}
        <Route element={<RequireAuth allowedRole="DOCTOR" />}>
          <Route path="/doctor" element={<DoctorDashboardPage />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<RequireAuth allowedRole="ADMIN" />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Route>

        {/* Patient Routes */}
        <Route element={<RequireAuth allowedRole="PATIENT" />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="twin" element={<DigitalTwinPage />} />
            <Route path="timeline" element={<MedicalTimelinePage />} />
            <Route path="medications" element={<MedicationsPage />} />
            <Route path="allergies" element={<AllergiesConditionsPage />} />
            <Route path="lab-trends" element={<LabTrendsPage />} />
            <Route path="records" element={<HealthRecordsPage />} />
            <Route path="ai-insights" element={<AIInsightsPage />} />
            <Route path="consent" element={<ConsentPage />} />
            <Route path="audit" element={<AuditLogPage />} />
            <Route path="emergency" element={<EmergencyProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
