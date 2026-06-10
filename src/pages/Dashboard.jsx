import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Users, CalendarCheck, BookOpen, MessageSquare } from 'lucide-react'
import { supabase } from '../lib/supabase'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value ?? '—'}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { schoolId } = useOutletContext()
  const [stats, setStats] = useState({})

  useEffect(() => {
    async function load() {
      let q = supabase.from('students').select('id', { count: 'exact', head: true })
      if (schoolId) q = q.eq('school_id', schoolId)
      const { count: students } = await q

      let q2 = supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('status', 'absent')
      // join via student if filtered — simplified for now
      const { count: absences } = await q2

      setStats({ students, absences })
    }
    load()
  }, [schoolId])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tableau de bord</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users}         label="Élèves"    value={stats.students}  color="bg-blue-500" />
        <StatCard icon={CalendarCheck} label="Absences"  value={stats.absences}  color="bg-amber-500" />
        <StatCard icon={BookOpen}      label="Matières"  value={null}            color="bg-green-500" />
        <StatCard icon={MessageSquare} label="Appréciations" value={null}        color="bg-purple-500" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Dernières activités</h2>
        <p className="text-sm text-gray-400 italic">Aucune activité récente.</p>
      </div>
    </div>
  )
}
