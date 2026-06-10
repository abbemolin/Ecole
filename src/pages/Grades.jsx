import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Plus } from 'lucide-react'
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Notes</h1>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
          <Plus size={16} /> Ajouter une note
        </button>
      </div>

      {/* Trimestre tabs */}
      <div className="flex gap-2 mb-6">
        {TERMS.map(t => (
          <button
            key={t}
            onClick={() => setTerm(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${term === t ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-400 py-12 text-sm">Chargement…</p>
        ) : grades.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">Aucune note pour ce trimestre.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Élève</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Matière</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Note</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Coeff.</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Date</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Commentaire</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {grades.map(g => (
                <tr key={g.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {g.students?.last_name} {g.students?.first_name}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{g.subject}</td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${g.value >= 10 ? 'text-green-600' : 'text-red-500'}`}>
                      {g.value}/20
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{g.coefficient}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {g.date ? new Date(g.date).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-500 italic">{g.comment ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
