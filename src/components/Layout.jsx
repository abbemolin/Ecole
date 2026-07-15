import { useState, useEffect } from 'react'
import { Outlet, useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { GraduationCap, Menu, X, Download, LayoutDashboard, Users, CalendarCheck, BookOpen, MessageSquare, ChevronRight } from 'lucide-react'
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
          ? 'bg-white text-[#1e3058] font-semibold shadow-sm'
          : 'text-[#6b7a99] hover:bg-white/60 hover:text-[#1e3058]'
      }`}>
      <Icon size={16} className={active ? 'text-[#b8973a]' : 'text-current opacity-60'} />
      {item.label}
    </button>
  )
}

function Sidebar({ open, onClose, schoolId, setSchool, navigate, location, schools }) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden backdrop-blur-sm" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 h-full w-64 flex flex-col z-30 transform transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'} lg:static lg:translate-x-0`}
        style={{ background: 'linear-gradient(160deg, #1e3058 0%, #162444 100%)' }}>
        
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <GraduationCap size={16} className="text-[#b8973a]" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Suivi Élèves</p>
              <p className="text-white/40 text-xs">Catéchèse</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/40 hover:text-white"><X size={18} /></button>
        </div>

        {/* Sélecteur école */}
        <div className="px-4 mb-2">
          <div className="bg-white/8 rounded-xl p-1">
            <button onClick={() => { setSchool(''); onClose() }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${!schoolId ? 'bg-white/15 text-white font-medium' : 'text-white/50 hover:text-white/80'}`}>
              Toutes les écoles
            </button>
            {schools.map(s => (
              <button key={s.id} onClick={() => { setSchool(s.id); onClose() }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all leading-snug ${schoolId === s.id ? 'bg-white/15 text-white font-medium' : 'text-white/50 hover:text-white/80'}`}>
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Séparateur */}
        <div className="mx-4 border-t border-white/10 my-3" />

        {/* Navigation */}
        <nav className="px-3 flex-1 space-y-0.5">
          {NAV.map(item => (
            <NavLink key={item.path} item={item}
              active={item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)}
              onClick={() => { navigate(`${item.path}${schoolId ? `?school=${schoolId}` : ''}`); onClose() }} />
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-white/25 text-xs text-center">Année 2024–2025</p>
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

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f8f7f4' }}>
      <Sidebar open={open} onClose={() => setOpen(false)} schoolId={schoolId} setSchool={setSchool}
        navigate={navigate} location={location} schools={schools} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar mobile + breadcrumb desktop */}
        <header className="flex items-center gap-3 px-5 py-3.5 bg-white border-b border-[#edeae3]">
          <button onClick={() => setOpen(true)} className="lg:hidden text-[#8c8070] hover:text-[#1a1814]">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 text-sm text-[#8c8070]">
            <GraduationCap size={15} className="text-[#b8973a] lg:hidden" />
            <span className="hidden lg:block font-medium text-[#1a1814]">
              {currentSchool ? currentSchool.name : 'Toutes les écoles'}
            </span>
            {currentSchool && <ChevronRight size={13} className="hidden lg:block opacity-40" />}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <Outlet context={{ schoolId, schools }} />
        </main>
      </div>
    </div>
  )
}
