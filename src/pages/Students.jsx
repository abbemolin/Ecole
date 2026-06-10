import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Plus, Search, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Students() {
  const { schoolId, schools } = useOutletContext()
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      let q = supabase
        .from('students')
        .select('*, schools(name)')
        .order('last_name')
      if (schoolId) q = q.eq('school_id', schoolId)
      const { data } = await q
      setStudents(data ?? [])
      setLoading(false)
    }
    load()
  }, [schoolId])

  const filtered = students.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Élèves</h1>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
          <Plus size={16} /> Ajouter un élève
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un élève…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-400 py-12 text-sm">Chargement…</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">Aucun élève trouvé.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Nom</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Prénom</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Classe</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">École</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{s.last_name}</td>
                  <td className="px-6 py-4 text-gray-600">{s.first_name}</td>
                  <td className="px-6 py-4 text-gray-600">{s.class ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{s.schools?.name ?? '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <ChevronRight size={16} className="text-gray-400 ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
