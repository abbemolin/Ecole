import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import StudentDetail from './pages/StudentDetail'
import Attendance from './pages/Attendance'
import Grades from './pages/Grades'
import Exports from './pages/Exports'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="eleves" element={<Students />} />
          <Route path="eleves/:id" element={<StudentDetail />} />
          <Route path="presences" element={<Attendance />} />
          <Route path="notes" element={<Grades />} />
          <Route path="exports" element={<Exports />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
