import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { CalendarCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'

const STATUS_LABELS = {
  present: { label: 'Présent',  color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  absent:  { label: 'Absent',   color: 'bg-red-50 text-red-700 border border-red-200' },
  late:    { label: 'Retard',   color: 'bg-amber-50 text-amber-700 border border-amber-200' },
  excused: { label: 'Excusé',   color: 'bg-blue-50 text-blue-700 border border-blue-200' },
}

export default function Attendance() {
  const { schoolId } = useOutletContext()
  const [records, setRecords] = useState([])
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      let q = supabase.from('attendance').select('*, students(first_name, last_name, class, school_id)').eq('date', date)
      const { data } = await q
      const filtered = schoolId ? (data ?? []).filter(r => r.students?.school_id === schoolId) : (data ?? [])
      setRecords(filtered)
      setLoading(false)
    }
    load()
  }, [schoolId, date])

  const fmtDateLong = d => new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1814]">Présences</h1>
          <p className="text-sm text-[#8c8070] mt-0.5 capitalize">{fmtDateLong(date)}</p>
        </div>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="border border-[#edeae3] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3058]/30 focus:border-[#1e3058] transition-all" />
      </div>

      <div className="bg-white rounded-2xl border border-[#edeae3] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[#b8b0a0] text-sm">Chargement…</div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarCheck size={32} className="text-[#d8d3c8] mx-auto mb-3" />
            <p className="text-[#8c8070] text-sm">Aucun enregistrement pour cette date.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8f7f4] border-b border-[#edeae3]">
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#8c8070] uppercase tracking-wide">Élève</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#8c8070] uppercase tracking-wide">Classe</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#8c8070] uppercase tracking-wide">Statut</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#8c8070] uppercase tracking-wide">Motif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f8f7f4]">
              {records.map(r => {
                const s = STATUS_LABELS[r.status] ?? { label: r.status, color: 'bg-gray-100 text-gray-600' }
                return (
                  <tr key={r.id} className="hover:bg-[#f8f7f4] transition-colors">
                    <td className="px-6 py-4 font-medium text-[#1a1814]">{r.students?.last_name} {r.students?.first_name}</td>
                    <td className="px-6 py-4 text-[#6b5f50]">{r.students?.class ?? '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>
                    </td>
                    <td className="px-6 py-4 text-[#8c8070]">{r.reason ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
