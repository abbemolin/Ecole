import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Users, CalendarX, Star, BookOpen } from 'lucide-react'
import { supabase } from '../lib/supabase'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '15' }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="text-[11px] font-medium text-[#9a9080] uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-[#1a1814] leading-none">{value ?? <span className="text-[#c8c0b0]">—</span>}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { schoolId, schools } = useOutletContext()
  const [stats, setStats] = useState({})
  const schoolName = schools.find(s => s.id === schoolId)?.name ?? 'toutes les paroisses'

  useEffect(() => {
    async function load() {
      let q = supabase.from('students').select('id', { count: 'exact', head: true })
      if (schoolId) q = q.eq('school_id', schoolId)
      const { count: students } = await q
      const { count: absences } = await supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('status', 'absent')
      const { count: bonPoints } = await supabase.from('bon_points').select('id', { count: 'exact', head: true })
      setStats({ students, absences, bonPoints })
    }
    load()
  }, [schoolId])

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8 pt-2">
        <p className="text-[11px] font-semibold text-[#c9a53a] uppercase tracking-widest mb-2 capitalize">{today}</p>
        <h1 className="text-2xl font-bold text-[#1a1814] tracking-tight">Bonjour 👋</h1>
        <p className="text-sm text-[#8c8070] mt-1">Vue d'ensemble — {schoolName}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard icon={Users}    label="Élèves"      value={stats.students}  color="#192848" />
        <StatCard icon={CalendarX} label="Absences"   value={stats.absences}  color="#c0392b" />
        <StatCard icon={BookOpen} label="Notes"       value={null}            color="#c9a53a" />
        <StatCard icon={Star}     label="Bons points" value={stats.bonPoints} color="#27ae60" />
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#f0ece4] flex items-center justify-between">
          <h2 className="font-semibold text-[#1a1814] text-sm">Activité récente</h2>
        </div>
        <div className="px-6 py-14 text-center">
          <p className="text-[#c8c0b0] text-sm">Aucune activité récente.</p>
        </div>
      </div>
    </div>
  )
}
