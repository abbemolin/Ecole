import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Grades from './pages/Grades'
import Attendance from './pages/Attendance'
import Comments from './pages/Comments'
import Parents from './pages/Parents'
import Exports from './pages/Exports'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="eleves" element={<Students />} />
          <Route path="notes" element={<Grades />} />
          <Route path="presences" element={<Attendance />} />
          <Route path="appreciations" element={<Comments />} />
          <Route path="parents" element={<Parents />} />
          <Route path="exports" element={<Exports />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
