import { Outlet, NavLink, useSearchParams } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarCheck,
  MessageSquare,
  Phone,
  Download,
  GraduationCap,
} from 'lucide-react'

const SCHOOLS = [
  { id: '1', name: 'Herrade de Landsberg' },
  { id: '2', name: 'Saints Louis et Zélie Martin' },
]

const NAV = [
  { to: '/',              label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/eleves',        label: 'Élèves',          icon: Users },
  { to: '/notes',         label: 'Notes',           icon: BookOpen },
  { to: '/presences',     label: 'Présences',       icon: CalendarCheck },
  { to: '/appreciations', label: 'Appréciations',   icon: MessageSquare },
  { to: '/parents',       label: 'Parents',         icon: Phone },
  { to: '/exports',       label: 'Exports',         icon: Download },
]

export default function Layout() {
  const [params, setParams] = useSearchParams()
  const schoolId = params.get('school') ?? ''

  function setSchool(id) {
    const next = new URLSearchParams(params)
    if (id) next.set('school', id)
    else next.delete('school')
    setParams(next)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-100">
          <GraduationCap className="text-blue-600" size={24} />
          <span className="font-bold text-gray-800 text-lg">Suivi Élèves</span>
        </div>

        {/* Filtre école */}
        <div className="px-4 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">École</p>
          <button
            onClick={() => setSchool('')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors
              ${!schoolId ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Toutes les écoles
          </button>
          {SCHOOLS.map(s => (
            <button
              key={s.id}
              onClick={() => setSchool(s.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors
                ${schoolId === s.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={{ pathname: to, search: params.toString() ? `?${params.toString()}` : '' }}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                 ${isActive
                   ? 'bg-blue-600 text-white'
                   : 'text-gray-600 hover:bg-gray-100'}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet context={{ schoolId, schools: SCHOOLS }} />
      </main>
    </div>
  )
}
