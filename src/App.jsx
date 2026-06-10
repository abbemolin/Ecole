import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Students from './pages/Students'
import StudentDetail from './pages/StudentDetail'
import ExportSacrements from './pages/ExportSacrements'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Students />} />
          <Route path="eleves/:id" element={<StudentDetail />} />
          <Route path="exports" element={<ExportSacrements />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
