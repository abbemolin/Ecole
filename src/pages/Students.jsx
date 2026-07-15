import { useEffect, useState } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { Plus, Search, ChevronRight, ChevronDown, X, Check, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'

const inp = 'border border-[#edeae3] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3058]/30 focus:border-[#1e3058] w-full bg-white transition-all'

function ClassGroup({ label, students, navigate }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="mb-3">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#edeae3]/60 hover:bg-[#edeae3] transition-colors text-left mb-1">
        <div className="flex items-center gap-2">
          {open ? <ChevronDown size={13} className="text-[#8c8070]" /> : <ChevronRight size={13} className="text-[#8c8070]" />}
          <span className="font-semibold text-[#4a3f32] text-sm">{label}</span>
        </div>
        <span className="text-xs text-[#b8b0a0] bg-white px-2 py-0.5 rounded-full border border-[#edeae3]">
          {students.length} élève{students.length > 1 ? 's' : ''}
        </span>
      </button>
      {open && (
        <div className="space-y-1 pl-1">
          {students.map(s => (
            <button key={s.id} onClick={() => navigate(`/eleves/${s.id}`)}
              className="w-full flex items-center justify-between bg-white border border-[#edeae3] rounded-xl px-4 py-3 hover:border-[#1e3058]/30 hover:shadow-sm transition-all text-left group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1e3058]/8 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#1e3058] font-semibold text-xs">{s.first_name?.[0]}{s.last_name?.[0]}</span>
                </div>
                <div>
                  <p className="font-semibold text-[#1a1814] text-sm">{s.last_name} {s.first_name}</p>
                  {s.schools?.name && <p className="text-xs text-[#8c8070] mt-0.5">{s.schools.name}</p>}
                </div>
              </div>
              <ChevronRight size={15} className="text-[#d8d3c8] group-hover:text-[#1e3058] transition-colors flex-shrink-0" />
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

  const groups = filtered.reduce((acc, s) => {
    const key = s.class || 'Sans classe'
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  const sortedKeys = Object.keys(groups).sort((a, b) => {
    if (a === 'Sans classe') return 1
    if (b === 'Sans classe') return -1
    return a.localeCompare(b, 'fr')
  })

  return (
    <div className="p-6 max-w-3xl">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1814]">Élèves</h1>
          <p className="text-sm text-[#8c8070] mt-0.5">{students.length} élève{students.length > 1 ? 's' : ''} enregistré{students.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-[#1e3058] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#162444] transition-colors shadow-sm">
          <Plus size={15} /> Ajouter
        </button>
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <div className="bg-white border border-[#edeae3] rounded-2xl p-5 mb-5 shadow-sm">
          <h3 className="font-semibold text-[#1a1814] text-sm mb-4">Nouvel élève</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-medium text-[#6b5f50] mb-1.5 block">Prénom *</label>
              <input className={inp} value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} placeholder="Marie" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6b5f50] mb-1.5 block">Nom *</label>
              <input className={inp} value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Dupont" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs font-medium text-[#6b5f50] mb-1.5 block">Classe</label>
              <input className={inp} placeholder="6ème A, CE2…" value={form.class} onChange={e => setForm(f => ({ ...f, class: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6b5f50] mb-1.5 block">École *</label>
              <select className={inp} value={form.school_id} onChange={e => setForm(f => ({ ...f, school_id: e.target.value }))}>
                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={add} disabled={saving || !form.first_name || !form.last_name}
              className="flex items-center gap-1.5 bg-[#1e3058] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#162444] disabled:opacity-50 transition-colors">
              <Check size={14} /> {saving ? 'Enregistrement…' : 'Ajouter'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="flex items-center gap-1.5 border border-[#edeae3] px-4 py-2 rounded-xl text-sm text-[#6b5f50] hover:bg-[#f8f7f4] transition-colors">
              <X size={14} /> Annuler
            </button>
          </div>
        </div>
      )}

      {/* Recherche */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b8b0a0]" />
        <input type="text" placeholder="Rechercher un élève…" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#edeae3] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3058]/30 focus:border-[#1e3058] transition-all" />
      </div>

      {/* Liste */}
      {loading ? (
        <div className="py-16 text-center text-[#b8b0a0] text-sm">Chargement…</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Users size={32} className="text-[#d8d3c8] mx-auto mb-3" />
          <p className="text-[#8c8070] text-sm">Aucun élève trouvé.</p>
        </div>
      ) : (
        sortedKeys.map(key => <ClassGroup key={key} label={key} students={groups[key]} navigate={navigate} />)
      )}
    </div>
  )
}
