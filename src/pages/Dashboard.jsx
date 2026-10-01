import { useEffect, useState } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { Users, CalendarX, Star, BookOpen, Search, Cross } from 'lucide-react'
import { supabase } from '../lib/supabase'

function StatCard({ icon: Icon, label, value, color, onClick }) {
  return (
    <div onClick={onClick} className={`bg-white rounded-2xl p-5 border border-black/5 shadow-sm flex items-center gap-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '15' }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="text-[11px] font-medium text-[#9a9080] uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-[#1a1814] leading-none">
          {value != null ? value : <span className="text-[#c8c0b0]">—</span>}
        </p>
      </div>
    </div>
  )
}

function SacrementBar({ label, total, demande, en_preparation, recu }) {
  const pct = (n) => total ? Math.round((n / total) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-[#4a3f32]">{label}</span>
        <span className="text-[10px] text-[#9a9080]">{recu}/{total} reçu{recu > 1 ? 's' : ''}</span>
      </div>
      <div className="h-2 bg-[#f0ece4] rounded-full overflow-hidden flex">
        <div className="h-full bg-emerald-400 transition-all" style={{ width: pct(recu) + '%' }} />
        <div className="h-full bg-blue-300 transition-all" style={{ width: pct(en_preparation) + '%' }} />
        <div className="h-full bg-amber-300 transition-all" style={{ width: pct(demande) + '%' }} />
      </div>
      <div className="flex gap-3 mt-1.5">
        <span className="text-[10px] text-emerald-600">● Reçu ({recu})</span>
        <span className="text-[10px] text-blue-500">● Préparation ({en_preparation})</span>
        <span className="text-[10px] text-amber-500">● Demandé ({demande})</span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { schoolId, schools } = useOutletContext()
  const navigate = useNavigate()
  const [stats, setStats] = useState({})
  const [sacrements, setSacrements] = useState([])
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const schoolName = schools.find(s => s.id === schoolId)?.name ?? 'tous les établissements'

  useEffect(() => {
    async function load() {
      // Stats élèves
      let qStudents = supabase.from('students').select('id', { count: 'exact', head: true })
      if (schoolId) qStudents = qStudents.eq('school_id', schoolId)
      const { count: students } = await qStudents

      // Stats absences filtrées
      let qAbs = supabase.from('attendance').select('*, students!inner(school_id)', { count: 'exact', head: true }).eq('status', 'absent')
      if (schoolId) qAbs = qAbs.eq('students.school_id', schoolId)
      const { count: absences } = await qAbs

      // Stats bons points filtrés
      let qBP = supabase.from('bon_points').select('*, students!inner(school_id)', { count: 'exact', head: true })
      if (schoolId) qBP = qBP.eq('students.school_id', schoolId)
      const { count: bonPoints } = await qBP

      // Stats notes
      let qNotes = supabase.from('grades').select('*, students!inner(school_id)', { count: 'exact', head: true })
      if (schoolId) qNotes = qNotes.eq('students.school_id', schoolId)
      const { count: notes } = await qNotes

      setStats({ students, absences, bonPoints, notes })

      // Sacrements
      let qSac = supabase.from('sacrements').select('type, status, students!inner(school_id)')
      if (schoolId) qSac = qSac.eq('students.school_id', schoolId)
      const { data: sacData } = await qSac
      setSacrements(sacData ?? [])
    }
    load()
  }, [schoolId])

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return }
    setSearching(true)
    const timer = setTimeout(async () => {
      let q = supabase.from('students').select('id, first_name, last_name, class, schools(name)')
        .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
        .limit(6)
      if (schoolId) q = q.eq('school_id', schoolId)
      const { data } = await q
      setSearchResults(data ?? [])
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, schoolId])

  const SAC_TYPES = ['bapteme', 'communion', 'profession_de_foi']
  const SAC_LABELS = { bapteme: 'Baptême', communion: 'Communion', profession_de_foi: 'Profession de foi' }

  const sacStats = SAC_TYPES.map(type => {
    const subset = sacrements.filter(s => s.type === type)
    return {
      type, label: SAC_LABELS[type],
      total: subset.length,
      recu: subset.filter(s => s.status === 'recu').length,
      en_preparation: subset.filter(s => s.status === 'en_preparation').length,
      demande: subset.filter(s => s.status === 'demande').length,
    }
  }).filter(s => s.total > 0)

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* En-tête */}
      <div className="mb-6 pt-2">
        <p className="text-[11px] font-semibold text-[#c9a53a] uppercase tracking-widest mb-2 capitalize">{today}</p>
        <h1 className="text-2xl font-bold text-[#1a1814] tracking-tight">Bonjour 👋</h1>
        <p className="text-sm text-[#8c8070] mt-1">Vue d'ensemble — {schoolName}</p>
      </div>

      {/* Recherche globale */}
      <div className="relative mb-6">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b8b0a0]" />
        <input type="text" placeholder="Rechercher un élève…" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-black/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#192848]/20 focus:border-[#192848] transition-all shadow-sm" />
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-black/8 rounded-xl shadow-lg z-10 overflow-hidden">
            {searchResults.map(s => (
              <button key={s.id} onClick={() => { navigate(`/eleves/${s.id}`); setSearch('') }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f8f6f2] transition-colors text-left border-b border-[#f0ece4] last:border-0">
                <div className="w-7 h-7 rounded-full bg-[#192848]/8 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#192848] font-semibold text-[10px]">{s.first_name?.[0]}{s.last_name?.[0]}</span>
                </div>
                <div>
                  <p className="font-medium text-[#1a1814] text-sm">{s.last_name} {s.first_name}</p>
                  <p className="text-[10px] text-[#9a9080]">{s.schools?.name}{s.class ? ` · ${s.class}` : ''}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Users}    label="Élèves"      value={stats.students}  color="#192848" onClick={() => navigate(`/eleves${schoolId ? `?school=${schoolId}` : ''}`)} />
        <StatCard icon={CalendarX} label="Absences"   value={stats.absences}  color="#c0392b" onClick={() => navigate(`/presences${schoolId ? `?school=${schoolId}` : ''}`)} />
        <StatCard icon={BookOpen} label="Notes"       value={stats.notes}     color="#c9a53a" onClick={() => navigate(`/notes${schoolId ? `?school=${schoolId}` : ''}`)} />
        <StatCard icon={Star}     label="Bons points" value={stats.bonPoints} color="#27ae60" />
      </div>

      {/* Sacrements */}
      {sacStats.length > 0 && (
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
          <h2 className="font-semibold text-[#1a1814] text-sm mb-5">Suivi des sacrements</h2>
          <div className="space-y-5">
            {sacStats.map(s => <SacrementBar key={s.type} {...s} />)}
          </div>
        </div>
      )}
    </div>
  )
}
