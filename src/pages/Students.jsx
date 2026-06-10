import { useEffect, useState } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { Plus, Search, ChevronRight, X, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'

const inp = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full'

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
    setShowForm(false)
    setSaving(false)
    load()
  }

  const filtered = students.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Élèves</h1>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700">
          <Plus size={15} /> Ajouter
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 mb-1 block">Prénom *</label>
              <input className={inp} value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Nom *</label>
              <input className={inp} value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} /></div>
          </div>
          <div><label className="text-xs text-gray-500 mb-1 block">Classe</label>
            <input className={inp} placeholder="6ème A, CE2…" value={form.class} onChange={e => setForm(f => ({ ...f, class: e.target.value }))} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">École *</label>
            <select className={inp} value={form.school_id} onChange={e => setForm(f => ({ ...f, school_id: e.target.value }))}>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select></div>
          <div className="flex gap-2">
            <button onClick={add} disabled={saving ||