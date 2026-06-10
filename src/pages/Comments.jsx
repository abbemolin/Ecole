import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'

const TERMS = ['Trimestre 1', 'Trimestre 2', 'Trimestre 3']

export default function Comments() {
  const { schoolId } = useOutletContext()
  const [comments, setComments] = useState([])
  const [term, setTerm] = useState(TERMS[0])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      let q = supabase
        .from('comments')
        .select('*, students(first_name, last_name, class, school_id)')
        .eq('term', term)
        .order('created_at', { ascending: false })
      const { data } = await q
      const filtered = schoolId
        ? (data ?? []).filter(c => c.students?.school_id === schoolId)
        : (data ?? [])
      setComments(filtered)
      setLoading(false)
    }
    load()
  }, [schoolId, term])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Appréciations</h1>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
          <Plus size={16} /> Ajouter une appréciation
        </button>
      </div>

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

      {loading ? (
        <p className="text-center text-gray-400 py-12 text-sm">Chargement…</p>
      ) : comments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">Aucune appréciation pour ce trimestre.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map(c => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-semibold text-gray-800">
                    {c.students?.last_name} {c.students?.first_name}
                  </span>
                  <span className="ml-2 text-xs text-gray-400">{c.students?.class}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : ''}
                </span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{c.text}</p>
              {c.author && (
                <p className="mt-2 text-xs text-gray-400">— {c.author}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
