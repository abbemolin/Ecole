import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { CalendarCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'

const STATUS_LABELS = {
  present: { label: 'Présent',  color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  absent:  { label: 'Absent',   color: 'bg-red-50 text-red-600 border border-red-200' },
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

  const fmtDateLong = d => new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const counts = records.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1814] tracking-tight">Présences</h1>
          <p className="text-sm text-[#8c8070] mt-0.5 capitalize">{fmtDateLong(date)}</p>
        </div>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="border border-black/8 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#192848]/20 focus:border-[#192848] transition-all shadow-sm" />
      </div>

      {/* Résumé rapide */}
      {records.length > 0 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          {Object.entries(STATUS_LABELS).map(([k, { label, color }]) =>
            counts[k] ? (
              <span key={k} className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>
                {counts[k]} {label.toLowerCase()}{counts[k] > 1 ? 's' : ''}
              </span>
            ) : null
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[#c8c0b0] text-sm">Chargement…</div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarCheck size={28} className="text-[#d8d3c8] mx-auto mb-3" />
            <p className="text-[#8c8070] text-sm">Aucun enregistrement pour cette date.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f0ece4]">
                <th className="text-left px-6 py-3 text-[10px] font-semibold text-[#9a9080] uppercase tracking-wider">Élève</th>
                <th className="text-left px-6 py-3 text-[10px] font-semibold text-[#9a9080] uppercase tracking-wider">Classe</th>
                <th className="text-left px-6 py-3 text-[10px] font-semibold text-[#9a9080] uppercase tracking-wider">Statut</th>
                <th className="text-left px-6 py-3 text-[10px] font-semibold text-[#9a9080] uppercase tracking-wider">Motif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f8f6f2]">
              {records.map(r => {
                const s = STATUS_LABELS[r.status] ?? { label: r.status, color: 'bg-gray-100 text-gray-600' }
                return (
                  <tr key={r.id} className="hover:bg-[#faf9f6] transition-colors">
                    <td className="px-6 py-3.5 font-medium text-[#1a1814]">{r.students?.last_name} {r.students?.first_name}</td>
                    <td className="px-6 py-3.5 text-[#6b5f50]">{r.students?.class ?? '—'}</td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>
                    </td>
                    <td className="px-6 py-3.5 text-[#9a9080]">{r.reason ?? '—'}</td>
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
