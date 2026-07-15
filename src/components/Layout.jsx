import { useState, useEffect } from 'react'
import { Outlet, useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import {
  GraduationCap, Menu, X, Download, LayoutDashboard,
  Users, CalendarCheck, BookOpen, ChevronRight, Church
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const NAV = [
  { path: '/',          label: 'Tableau de bord', icon: LayoutDashboard },
  { path: '/eleves',    label: 'Élèves',          icon: Users },
  { path: '/presences', label: 'Présences',       icon: CalendarCheck },
  { path: '/notes',     label: 'Notes',           icon: BookOpen },
  { path: '/exports',   label: 'Exports',         icon: Download },
]

function NavLink({ item, active, onClick }) {
  const Icon = item.icon
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
        active
          ? 'bg-white/12 text-white font-semibold'
          : 'text-white/50 hover:bg-white/6 hover:text-white/80'
      }`}>
      <Icon size={15} className={active ? 'opacity-100' : 'opacity-50'} />
      {item.label}
      {active && <span className="ml-auto w-1 h-1 rounded-full bg-[#c9a53a]" />}
    </button>
  )
}

function SchoolPill({ school, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all leading-snug ${
        active ? 'bg-white/12 text-white font-medium' : 'text-white/45 hover:text-white/70'
      }`}>
      {school?.name ?? 'Toutes les écoles'}
    </button>
  )
}

function Sidebar({ open, onClose, schoolId, setSchool, navigate, location, schools }) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm" onClick={onClose} />}
      <aside
        className={`fixed top-0 left-0 h-full w-60 flex flex-col z-30 transform transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'} lg:static lg:translate-x-0`}
        style={{ background: 'linear-gradient(175deg, #192848 0%, #111c35 100%)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Logo */}
        <div className="flex items-center justify-between px-5 pt-6 pb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(201,165,58,0.18)' }}>
              <GraduationCap size={14} className="text-[#c9a53a]" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight tracking-tight">Catéchèse</p>
              <p className="text-white/30 text-[10px] tracking-wide uppercase">Suivi élèves</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/30 hover:text-white transition-colors"><X size={16} /></button>
        </div>

        {/* Sélecteur école */}
        <div className="px-3 mb-1">
          <p className="text-white/25 text-[10px] uppercase tracking-widest px-3 mb-1.5">Paroisse</p>
          <div className="space-y-0.5">
            <SchoolPill school={null} active={!schoolId} onClick={() => { setSchool(''); onClose() }} />
            {schools.map(s => (
              <SchoolPill key={s.id} school={s} active={schoolId === s.id} onClick={() => { setSchool(s.id); onClose() }} />
            ))}
          </div>
        </div>

        <div className="mx-4 my-3 h-px bg-white/8" />

        {/* Navigation */}
        <nav className="px-3 flex-1 space-y-0.5">
          {NAV.map(item => (
            <NavLink key={item.path} item={item}
              active={item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)}
              onClick={() => { navigate(`${item.path}${schoolId ? `?school=${schoolId}` : ''}`); onClose() }} />
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-5">
          <div className="flex items-center gap-2 px-3">
            <Church size={11} className="text-white/20" />
            <p className="text-white/20 text-[10px]">Année 2024 – 2025</p>
          </div>
        </div>
      </aside>
    </>
  )
}

export default function Layout() {
  const [params, setParams] = useSearchParams()
  const [open, setOpen] = useState(false)
  const [schools, setSchools] = useState([])
  const navigate = useNavigate()
  const location = useLocation()
  const rawSchoolId = params.get('school') ?? ''
  const validIds = new Set(schools.map(s => s.id))
  const schoolId = validIds.has(rawSchoolId) ? rawSchoolId : ''

  useEffect(() => {
    supabase.from('schools').select('*').order('name').then(({ data }) => setSchools(data ?? []))
  }, [])

  function setSchool(id) {
    const next = new URLSearchParams(params)
    if (id) next.set('school', id); else next.delete('school')
    setParams(next)
  }

  const currentSchool = schools.find(s => s.id === schoolId)
  const currentNav = NAV.find(n => n.path === '/' ? location.pathname === '/' : location.pathname.startsWith(n.path))

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f4f2ee' }}>
      <Sidebar open={open} onClose={() => setOpen(false)} schoolId={schoolId} setSchool={setSchool}
        navigate={navigate} location={location} schools={schools} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center gap-3 px-5 py-3 bg-white/80 backdrop-blur border-b border-black/5 flex-shrink-0">
          <button onClick={() => setOpen(true)} className="lg:hidden text-[#8c8070] hover:text-[#1a1814] transition-colors">
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[#8c8070] text-xs hidden lg:block">
              {currentSchool ? currentSchool.name : 'Toutes les paroisses'}
            </span>
            {currentNav && <>
              <ChevronRight size={11} className="text-[#c8c0b0] hidden lg:block flex-shrink-0" />
              <span className="text-[#1a1814] text-xs font-medium truncate">{currentNav.label}</span>
            </>}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <Outlet context={{ schoolId, schools }} />
        </main>
      </div>
    </div>
  )
}
