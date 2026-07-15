import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Users, CalendarX, BookOpen, MessageSquare, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#edeae3] flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: accent + '18' }}>
        <Icon size={18} style={{ color: accent }} />
      </div>
      <div>
        <p className="text-xs font-medium text-[#8c8070] uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-[#1a1814]">{value ?? '—'}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { schoolId, schools } = useOutletContext()
  const [stats, setStats] = useState({})
  const schoolName = schools.find(s => s.id === schoolId)?.name ?? 'toutes les écoles'

  useEffect(() => {
    async function load() {
      let q = supabase.from('students').select('id', { count: 'exact', head: true })
      if (schoolId) q = q.eq('school_id', schoolId)
      const { count: students } = await q
      const { count: absences } = await supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('status', 'absent')
      setStats({ students, absences })
    }
    load()
  }, [schoolId])

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-8">
        <p className="text-xs font-medium text-[#b8973a] uppercase tracking-widest mb-1 capitalize">{today}</p>
        <h1 className="text-2xl font-bold text-[#1a1814]">Tableau de bord</h1>
        <p className="text-sm text-[#8c8070] mt-1">Vue d'ensemble — {schoolName}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users}         label="Élèves"        value={stats.students}  accent="#1e3058" />
        <StatCard icon={CalendarX}     label="Absences"      value={stats.absences}  accent="#c0392b" />
        <StatCard icon={BookOpen}      label="Matières"      value={null}            accent="#b8973a" />
        <StatCard icon={MessageSquare} label="Appréciations" value={null}            accent="#27ae60" />
      </div>
      <div className="bg-white rounded-2xl border border-[#edeae3] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#edeae3] flex items-center gap-2">
          <TrendingUp size={16} className="text-[#b8973a]" />
          <h2 className="font-semibold text-[#1a1814] text-sm">Activité récente</h2>
        </div>
        <div className="px-6 py-12 text-center">
          <p className="text-[#b8b0a0] text-sm">Aucune activité récente.</p>
        </div>
      </div>
    </div>
  )
}
