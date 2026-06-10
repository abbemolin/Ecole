import { useEffect, useState } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { Plus, Search, ChevronRight, ChevronDown, X, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'

const inp = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full'

function ClassGroup({ label, students, navigate }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-left">
        <div className="flex items-center gap-2">
          {open ? <ChevronDown size={15} className="text-gray-500" /> : <ChevronRight size={15} className="text-gray-500" />}
          <span className="font-semibold text-gray-700 text-sm">{label}</span>
        </div>
        <span className="text-xs text-gray-400">{students.length} eleve{students.length > 1 ? 's' : ''}</span>
      </button>
      {open && (
        <div className="mt-1 space-y-1 pl-2">
          {students.map(s => (
            <button key={s.id} onClick={() => navigate(`/eleves/${s.id}`)}
              className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left">
              <div>
                <p className="font-semibold text-gray-800 text-sm">{s.last_name} {s.first_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.schools?.name}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Students() {
  const { schoolId, schools } = useOutletContext()
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', class: '', school_id: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    let q = supabase.from('students').select('*, schools(name)').order('last_name')
    if (schoolId) q = q.eq('school_id', schoolId)
    const { data } = await q
    setStudents(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [schoolId])
  useEffect(() => {
    if (schools.length) setForm(f => ({ ...f, school_id: schoolId || schools[0].id }))
  }, [schoolId, schools])

  async function add() {
    if (!form.first_name || !form.last_name || !form.school_id) return
    setSaving(true)
    await supabase.from('students').insert({
      first_name: form.first_name, last_name: form.last_name,
      class: form.class || null, school_id: form.school_id,
    })
    setForm({ first_name: '', last_name: '', class: '', school_id: schoolId || schools[0]?.id || '' })
    setShowForm(false); setSaving(false); load()
  }

  const filtered = students.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase())
  )

  // Grouper par classe
  const groups = filtered.reduce((acc, s) => {
    const key = s.class || 'Sans classe'
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  // Trier : classes nommées d'abord (alphabétique), "Sans classe" en dernier
  const sortedKeys = Object.keys(groups).sort((a, b) => {
    if (a === 'Sans classe') return 1
    if (b === 'Sans classe') return -1
    return a.localeCompare(b, 'fr')
  })

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Eleves</h1>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700">
          <Plus size={15} /> Ajouter
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 mb-1 block">Prenom *</label>
              <input className={inp} value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Nom *</label>
              <input className={inp} value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} /></div>
          </div>
          <div><label className="text-xs text-gray-500 mb-1 block">Classe</label>
            <input className={inp} placeholder="6eme A, CE2..." value={form.class} onChange={e => setForm(f => ({ ...f, class: e.target.value }))} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Ecole *</label>
            <select className={inp} value={form.school_id} onChange={e => setForm(f => ({ ...f, school_id: e.target.value }))}>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select></div>
          <div className="flex gap-2">
            <button onClick={add} disabled={saving || !form.first_name || !form.last_name}
              className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              <Check size={14} /> {saving ? '...' : 'Ajouter'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="flex items-center gap-1 border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600">
              <X size={14} /> Annuler
            </button>
          </div>
        </div>
      )}

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-10 text-sm">Chargement...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-10 text-sm">Aucun eleve.</p>
      ) : (
        sortedKeys.map(key => (
          <ClassGroup key={key} label={key} students={groups[key]} navigate={navigate} />
        ))
      )}
    </div>
  )
}
