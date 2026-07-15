import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { supabase } from '../lib/supabase'

const TERMS = ['Trimestre 1', 'Trimestre 2', 'Trimestre 3']

export default function Grades() {
  const { schoolId } = useOutletContext()
  const [grades, setGrades] = useState([])
  const [term, setTerm] = useState(TERMS[0])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      let q = supabase
        .from('grades')
        .select('*, students(first_name, last_name, school_id)')
        .eq('term', term)
        .order('date', { ascending: false })
      const { data } = await q
      const filtered = schoolId
        ? (data ?? []).filter(g => g.students?.school_id === schoolId)
        : (data ?? [])
      setGrades(filtered)
      setLoading(false)
    }
    load()
  }, [schoolId, term])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1a1814] tracking-tight">Notes</h1>
        <p className="text-sm text-[#8c8070] mt-0.5">{grades.length} note{grades.length > 1 ? 's' : ''} enregistrée{grades.length > 1 ? 's' : ''}</p>
      </div>

      {/* Trimestre tabs */}
      <div className="flex gap-1.5 mb-5 bg-white border border-black/5 rounded-xl p-1 w-fit shadow-sm">
        {TERMS.map(t => (
          <button key={t} onClick={() => setTerm(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              term === t ? 'bg-[#192848] text-white shadow-sm' : 'text-[#8c8070] hover:text-[#1a1814]'
            }`}>
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[#c8c0b0] text-sm">Chargement…</div>
        ) : grades.length === 0 ? (
          <div className="py-16 text-center">
            <BookOpen size={28} className="text-[#d8d3c8] mx-auto mb-3" />
            <p className="text-[#8c8070] text-sm">Aucune note pour ce trimestre.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f0ece4]">
                <th className="text-left px-6 py-3 text-[10px] font-semibold text-[#9a9080] uppercase tracking-wider">Élève</th>
                <th className="text-left px-6 py-3 text-[10px] font-semibold text-[#9a9080] uppercase tracking-wider">Matière</th>
                <th className="text-left px-6 py-3 text-[10px] font-semibold text-[#9a9080] uppercase tracking-wider">Note</th>
                <th className="text-left px-6 py-3 text-[10px] font-semibold text-[#9a9080] uppercase tracking-wider">Coeff.</th>
                <th className="text-left px-6 py-3 text-[10px] font-semibold text-[#9a9080] uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-3 text-[10px] font-semibold text-[#9a9080] uppercase tracking-wider">Commentaire</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f8f6f2]">
              {grades.map(g => (
                <tr key={g.id} className="hover:bg-[#faf9f6] transition-colors">
                  <td className="px-6 py-3.5 font-medium text-[#1a1814]">
                    {g.students?.last_name} {g.students?.first_name}
                  </td>
                  <td className="px-6 py-3.5 text-[#6b5f50]">{g.subject}</td>
                  <td className="px-6 py-3.5">
                    <span className={`font-bold ${g.value >= 10 ? 'text-emerald-600' : 'text-red-500'}`}>{g.value}/20</span>
                  </td>
                  <td className="px-6 py-3.5 text-[#9a9080]">{g.coefficient}</td>
                  <td className="px-6 py-3.5 text-[#9a9080]">
                    {g.date ? new Date(g.date).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td className="px-6 py-3.5 text-[#9a9080] italic">{g.comment ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
