import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Search, Phone, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Parents() {
  const { schoolId } = useOutletContext()
  const [parents, setParents] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      let q = supabase
        .from('parents')
        .select('*, students(first_name, last_name, class, school_id)')
        .order('last_name')
      const { data } = await q
      const filtered = schoolId
        ? (data ?? []).filter(p => p.students?.school_id === schoolId)
        : (data ?? [])
      setParents(filtered)
      setLoading(false)
    }
    load()
  }, [schoolId])

  const displayed = parents.filter(p =>
    `${p.first_name} ${p.last_name} ${p.students?.last_name}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Contacts parents</h1>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par nom de parent ou d'élève…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-400 py-12 text-sm">Chargement…</p>
        ) : displayed.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">Aucun contact trouvé.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Parent</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Lien</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Élève</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Email</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Téléphone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayed.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {p.last_name} {p.first_name}
                  </td>
                  <td className="px-6 py-4 text-gray-500 capitalize">{p.relationship ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {p.students?.last_name} {p.students?.first_name}
                    <span className="ml-1 text-xs text-gray-400">({p.students?.class})</span>
                  </td>
                  <td className="px-6 py-4">
                    {p.email ? (
                      <a href={`mailto:${p.email}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                        <Mail size={14} /> {p.email}
                      </a>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {p.phone ? (
                      <a href={`tel:${p.phone}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                        <Phone size={14} /> {p.phone}
                      </a>
                    ) : '—'}
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
