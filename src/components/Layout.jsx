import { useState } from 'react'
import { Outlet, useSearchParams, useNavigate } from 'react-router-dom'
import { GraduationCap, Menu, X, Download } from 'lucide-react'

const SCHOOLS = [
  { id: 'af2d6b50-d5bd-4e03-86f6-804c608ca7c7', name: 'Herrade de Landsberg' },
  { id: 'e0064bce-2d0f-447c-87e7-e1ee3d3d32dd', name: 'Saints Louis et Zelie Martin' },
]

const VALID_IDS = new Set(SCHOOLS.map(s => s.id))

function Sidebar({ open, onClose, schoolId, setSchool, navigate }) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 h-full w-60 bg-white border-r border-gray-200 flex flex-col z-30 transform transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'} lg:static lg:translate-x-0`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <GraduationCap className="text-blue-600" size={20} />
            <span className="font-bold text-gray-800">Suivi Eleves</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400"><X size={18} /></button>
        </div>
        <div className="px-4 py-4 flex-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ecole</p>
          <button onClick={() => { setSchool(''); onClose() }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${!schoolId ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
            Toutes les ecoles
          </button>
          {SCHOOLS.map(s => (
            <button key={s.id} onClick={() => { setSchool(s.id); onClose() }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${schoolId === s.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
              {s.name}
            </button>
          ))}
        </div>
        <div className="px-4 py-4 border-t border-gray-100">
          <button onClick={() => { navigate('/exports'); onClose() }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Download size={15} className="text-gray-400" /> Export sacrements
          </button>
        </div>
      </aside>
    </>
  )
}

export default function Layout() {
  const [params, setParams] = useSearchParams()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const rawSchoolId = params.get('school') ?? ''
  const schoolId = VALID_IDS.has(rawSchoolId) ? rawSchoolId : ''

  function setSchool(id) {
    const next = new URLSearchParams(params)
    if (id) next.set('school', id); else next.delete('school')
    setParams(next)
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar open={open} onClose={() => setOpen(false)} schoolId={schoolId} setSchool={setSchool} navigate={navigate} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setOpen(true)} className="text-gray-500"><Menu size={22} /></button>
          <div className="flex items-center gap-2">
            <GraduationCap className="text-blue-600" size={18} />
            <span className="font-bold text-gray-800 text-sm">Suivi Eleves</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ schoolId, schools: SCHOOLS }} />
        </main>
      </div>
    </div>
  )
}
