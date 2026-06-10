import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const STATUS_LABELS = {
  present:  { label: 'Présent',  color: 'bg-green-100 text-green-700' },
  absent:   { label: 'Absent',   color: 'bg-red-100 text-red-700' },
  late:     { label: 'Retard',   color: 'bg-amber-100 text-amber-700' },
  excused:  { label: 'Excusé',   color: 'bg-blue-100 text-blue-700' },
}

export default function Attendance() {
  const { schoolId } = useOutletContext()
  const [records, setRecords] = useState([])
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      let q = supabase
        .from('attendance')
        .select('*, students(first_name, last_name, class, school_id)')
        .eq('date', date)
        .order('students(last_name)')
      const { data } = await q
      const filtered = schoolId
        ? (data ?? []).filter(r => r.students?.school_id === schoolId)
        : (data ?? [])
      setRecords(filtered)
      setLoading(false)
    }
    load()
  }, [schoolId, date])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Présences</h1>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-400 py-12 text-sm">Chargement…</p>
        ) : records.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">Aucun enregistrement pour cette date.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Élève</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Classe</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Statut</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Motif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map(r => {
                const s = STATUS_LABELS[r.status] ?? { label: r.status, color: 'bg-gray-100 text-gray-600' }
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {r.students?.last_name} {r.students?.first_name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{r.students?.class ?? '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.color}`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{r.reason ?? '—'}</td>
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
