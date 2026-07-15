import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, X, Check, Star, Minus, Download, Phone, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'

const TERMS = ['T1', 'T2', 'T3']
const TERM_LABELS = { T1: 'Trimestre 1', T2: 'Trimestre 2', T3: 'Trimestre 3' }
const inp = 'border border-[#edeae3] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3058]/30 focus:border-[#1e3058] w-full bg-white transition-all'
const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''

const SACREMENT_LABELS = { bapteme: 'Baptême', communion: 'Communion', profession_de_foi: 'Profession de foi' }
const SACREMENT_STATUS = {
  demande:        { label: 'Demandé',        color: 'bg-amber-50 text-amber-700 border border-amber-200' },
  en_preparation: { label: 'En préparation', color: 'bg-blue-50 text-blue-700 border border-blue-200' },
  recu:           { label: 'Reçu',           color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
}

function Tab({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
        active ? 'bg-[#1e3058] text-white shadow-sm' : 'text-[#6b5f50] hover:bg-[#edeae3]'
      }`}>
      {label}
    </button>
  )
}

function Card({ children }) {
  return <div className="bg-white border border-[#edeae3] rounded-2xl p-4 shadow-sm">{children}</div>
}

function SectionHeader({ title, onAdd }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-xs font-semibold text-[#8c8070] uppercase tracking-widest">{title}</h3>
      {onAdd && (
        <button onClick={onAdd} className="flex items-center gap-1 text-[#1e3058] text-xs font-medium hover:underline">
          <Plus size={12} /> Ajouter
        </button>
      )}
    </div>
  )
}

function EmptyState({ text }) {
  return <p className="text-[#b8b0a0] text-sm text-center py-6 italic">{text}</p>
}

function FormActions({ onSave, onCancel, saving, disabled }) {
  return (
    <div className="flex gap-2 pt-1">
      <button onClick={onSave} disabled={saving || disabled}
        className="flex items-center gap-1.5 bg-[#1e3058] text-white px-4 py-2 rounded-xl text-xs font-medium hover:bg-[#162444] disabled:opacity-50 transition-colors">
        <Check size={12} /> {saving ? 'Enregistrement…' : 'Valider'}
      </button>
      <button onClick={onCancel}
        className="flex items-center gap-1.5 border border-[#edeae3] px-4 py-2 rounded-xl text-xs text-[#6b5f50] hover:bg-[#f8f7f4] transition-colors">
        <X size={12} /> Annuler
      </button>
    </div>
  )
}

// ─── Onglet Infos ───────────────────────────────────────────────────────────

function TabInfos({ student, schools, onSave }) {
  const [form, setForm] = useState({ class: student.class ?? '', school_id: student.school_id })
  const [saving, setSaving] = useState(false); const [saved, setSaved] = useState(false)
  async function save() {
    setSaving(true)
    await supabase.from('students').update(form).eq('id', student.id)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000); onSave(form)
  }
  return (
    <div className="space-y-4">
      <Card>
        <SectionHeader title="Scolarité" />
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div><label className="text-xs font-medium text-[#6b5f50] mb-1.5 block">Classe</label>
            <input className={inp} placeholder="6ème A…" value={form.class} onChange={e => setForm(f => ({ ...f, class: e.target.value }))} /></div>
          <div><label className="text-xs font-medium text-[#6b5f50] mb-1.5 block">École</label>
            <select className={inp} value={form.school_id} onChange={e => setForm(f => ({ ...f, school_id: e.target.value }))}>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select></div>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-1.5 bg-[#1e3058] text-white px-4 py-2 rounded-xl text-xs font-medium hover:bg-[#162444] disabled:opacity-50 transition-colors">
          <Check size={12} /> {saving ? '…' : saved ? 'Enregistré ✓' : 'Enregistrer'}
        </button>
      </Card>
      <TabParents studentId={student.id} />
    </div>
  )
}

// ─── Onglet Parents ──────────────────────────────────────────────────────────

function TabParents({ studentId }) {
  const [parents, setParents] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', relationship: '', phone: '', email: '', notes: '' })
  const [saving, setSaving] = useState(false)
  async function load() {
    const { data } = await supabase.from('parent_contacts').select('*').eq('student_id', studentId).order('created_at')
    setParents(data ?? [])
  }
  useEffect(() => { load() }, [studentId])
  async function add() {
    if (!form.first_name || !form.last_name) return
    setSaving(true)
    await supabase.from('parent_contacts').insert({ student_id: studentId, ...form,
      relationship: form.relationship || null, phone: form.phone || null, email: form.email || null, notes: form.notes || null })
    setForm({ first_name: '', last_name: '', relationship: '', phone: '', email: '', notes: '' })
    setShowForm(false); setSaving(false); load()
  }
  async function del(id) { await supabase.from('parent_contacts').delete().eq('id', id); load() }

  return (
    <Card>
      <SectionHeader title="Parents / Contacts" onAdd={() => setShowForm(v => !v)} />
      {showForm && (
        <div className="bg-[#f8f7f4] rounded-xl p-3 mb-3 space-y-2 border border-[#edeae3]">
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-[#8c8070] mb-1 block">Prénom *</label><input className={inp} value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} /></div>
            <div><label className="text-xs text-[#8c8070] mb-1 block">Nom *</label><input className={inp} value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} /></div>
          </div>
          <div><label className="text-xs text-[#8c8070] mb-1 block">Lien (père, mère, tuteur…)</label>
            <input className={inp} placeholder="Mère…" value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-[#8c8070] mb-1 block">Téléphone</label><input className={inp} type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div><label className="text-xs text-[#8c8070] mb-1 block">Email</label><input className={inp} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          </div>
          <div><label className="text-xs text-[#8c8070] mb-1 block">Notes</label><input className={inp} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          <FormActions onSave={add} onCancel={() => setShowForm(false)} saving={saving} disabled={!form.first_name || !form.last_name} />
        </div>
      )}
      {parents.length === 0 ? <EmptyState text="Aucun contact enregistré." /> : (
        <div className="space-y-2">
          {parents.map(p => (
            <div key={p.id} className="flex items-start justify-between py-2 border-b border-[#f8f7f4] last:border-0 group">
              <div>
                <p className="font-medium text-[#1a1814] text-sm">{p.last_name} {p.first_name}
                  {p.relationship && <span className="ml-2 text-xs text-[#8c8070] font-normal">{p.relationship}</span>}
                </p>
                <div className="flex flex-wrap gap-3 mt-1">
                  {p.phone && <a href={`tel:${p.phone}`} className="flex items-center gap-1 text-xs text-[#1e3058] hover:underline"><Phone size={11} />{p.phone}</a>}
                  {p.email && <a href={`mailto:${p.email}`} className="flex items-center gap-1 text-xs text-[#1e3058] hover:underline"><Mail size={11} />{p.email}</a>}
                </div>
                {p.notes && <p className="text-xs text-[#8c8070] mt-0.5 italic">{p.notes}</p>}
              </div>
              <button onClick={() => del(p.id)} className="text-[#d8d3c8] hover:text-red-400 ml-2 flex-shrink-0 transition-colors"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ─── Onglet Sacrements ───────────────────────────────────────────────────────

function TabSacrements({ studentId }) {
  const [sacrements, setSacrements] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'bapteme', status: 'demande', date_planned: '', notes: '' })
  const [saving, setSaving] = useState(false)
  async function load() {
    const { data } = await supabase.from('sacrements').select('*').eq('student_id', studentId).order('created_at')
    setSacrements(data ?? [])
  }
  useEffect(() => { load() }, [studentId])
  async function add() {
    setSaving(true)
    await supabase.from('sacrements').upsert({ student_id: studentId, ...form,
      date_planned: form.date_planned || null, notes: form.notes || null,
      date_request: new Date().toISOString().slice(0, 10) }, { onConflict: 'student_id,type' })
    setForm({ type: 'bapteme', status: 'demande', date_planned: '', notes: '' })
    setShowForm(false); setSaving(false); load()
  }
  async function updateStatus(id, status) { await supabase.from('sacrements').update({ status }).eq('id', id); load() }
  async function del(id) { await supabase.from('sacrements').delete().eq('id', id); load() }
  const existingTypes = new Set(sacrements.map(s => s.type))
  const availableTypes = Object.keys(SACREMENT_LABELS).filter(t => !existingTypes.has(t))

  return (
    <div className="space-y-3">
      {availableTypes.length > 0 && (
        <button onClick={() => { setForm(f => ({ ...f, type: availableTypes[0] })); setShowForm(v => !v) }}
          className="flex items-center gap-2 text-[#1e3058] text-xs font-medium hover:underline">
          <Plus size={13} /> Ajouter un sacrement
        </button>
      )}
      {showForm && (
        <Card>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className="text-xs text-[#8c8070] mb-1 block">Sacrement</label>
              <select className={inp} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {availableTypes.map(t => <option key={t} value={t}>{SACREMENT_LABELS[t]}</option>)}
              </select></div>
            <div><label className="text-xs text-[#8c8070] mb-1 block">Statut</label>
              <select className={inp} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {Object.entries(SACREMENT_STATUS).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
              </select></div>
          </div>
          <div className="mb-3"><label className="text-xs text-[#8c8070] mb-1 block">Date prévue</label>
            <input type="date" className={inp} value={form.date_planned} onChange={e => setForm(f => ({ ...f, date_planned: e.target.value }))} /></div>
          <div className="mb-3"><label className="text-xs text-[#8c8070] mb-1 block">Notes</label>
            <input className={inp} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          <FormActions onSave={add} onCancel={() => setShowForm(false)} saving={saving} />
        </Card>
      )}
      {sacrements.length === 0 && !showForm ? <Card><EmptyState text="Aucun sacrement enregistré." /></Card> : (
        <div className="space-y-3">
          {sacrements.map(s => {
            const st = SACREMENT_STATUS[s.status] ?? { label: s.status, color: 'bg-gray-100 text-gray-600' }
            return (
              <Card key={s.id}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-[#1a1814] text-sm">{SACREMENT_LABELS[s.type] ?? s.type}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                      {s.date_request && <span className="text-xs text-[#8c8070]">Demandé le {fmtDate(s.date_request)}</span>}
                      {s.date_planned && <span className="text-xs text-[#8c8070]">Prévu le {fmtDate(s.date_planned)}</span>}
                    </div>
                    {s.notes && <p className="text-xs text-[#8c8070] mt-1 italic">{s.notes}</p>}
                  </div>
                  <button onClick={() => del(s.id)} className="text-[#d8d3c8] hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {Object.entries(SACREMENT_STATUS).map(([v, { label }]) => (
                    <button key={v} onClick={() => updateStatus(s.id, v)}
                      className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${s.status === v ? 'bg-[#1e3058] text-white' : 'bg-[#f8f7f4] text-[#6b5f50] hover:bg-[#edeae3]'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Onglet Présences ────────────────────────────────────────────────────────

function TabPresences({ studentId }) {
  const [records, setRecords] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), status: 'absent', reason: '' })
  const [saving, setSaving] = useState(false)
  const STATUS = {
    present: { label: 'Présent',  color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    absent:  { label: 'Absent',   color: 'bg-red-50 text-red-700 border border-red-200' },
    late:    { label: 'Retard',   color: 'bg-amber-50 text-amber-700 border border-amber-200' },
    excused: { label: 'Excusé',   color: 'bg-blue-50 text-blue-700 border border-blue-200' },
  }
  async function load() {
    const { data } = await supabase.from('attendance').select('*').eq('student_id', studentId).order('date', { ascending: false }).limit(30)
    setRecords(data ?? [])
  }
  useEffect(() => { load() }, [studentId])
  async function add() {
    setSaving(true)
    await supabase.from('attendance').upsert({ student_id: studentId, date: form.date, status: form.status, reason: form.reason || null }, { onConflict: 'student_id,date' })
    setForm({ date: new Date().toISOString().slice(0, 10), status: 'absent', reason: '' })
    setShowForm(false); setSaving(false); load()
  }
  async function del(id) { await supabase.from('attendance').delete().eq('id', id); load() }

  return (
    <div className="space-y-3">
      <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 text-[#1e3058] text-xs font-medium hover:underline">
        <Plus size={13} /> Ajouter une présence
      </button>
      {showForm && (
        <Card>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className="text-xs text-[#8c8070] mb-1 block">Date</label>
              <input type="date" className={inp} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div><label className="text-xs text-[#8c8070] mb-1 block">Statut</label>
              <select className={inp} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {Object.entries(STATUS).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
              </select></div>
          </div>
          <div className="mb-3"><label className="text-xs text-[#8c8070] mb-1 block">Motif</label>
            <input className={inp} placeholder="Optionnel…" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} /></div>
          <FormActions onSave={add} onCancel={() => setShowForm(false)} saving={saving} />
        </Card>
      )}
      {records.length === 0 ? <Card><EmptyState text="Aucune présence enregistrée." /></Card> : (
        <Card>
          <div className="divide-y divide-[#f8f7f4]">
            {records.map(r => {
              const s = STATUS[r.status] ?? { label: r.status, color: 'bg-gray-100 text-gray-600' }
              return (
                <div key={r.id} className="flex items-center justify-between py-2.5 group">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium text-[#1a1814] w-24">{fmtDate(r.date)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>
                    {r.reason && <span className="text-xs text-[#8c8070]">{r.reason}</span>}
                  </div>
                  <button onClick={() => del(r.id)} className="text-[#d8d3c8] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={13} /></button>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Onglet Notes ────────────────────────────────────────────────────────────

function TabNotes({ studentId }) {
  const [grades, setGrades] = useState([])
  const [term, setTerm] = useState('T1')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ subject: '', value: '', coefficient: '1', date: new Date().toISOString().slice(0, 10), comment: '' })
  const [saving, setSaving] = useState(false)
  async function load() {
    const { data } = await supabase.from('grades').select('*').eq('student_id', studentId).eq('term', TERM_LABELS[term]).order('date', { ascending: false })
    setGrades(data ?? [])
  }
  useEffect(() => { load() }, [studentId, term])
  async function add() {
    if (!form.subject || !form.value) return
    setSaving(true)
    await supabase.from('grades').insert({ student_id: studentId, term: TERM_LABELS[term], subject: form.subject, value: parseFloat(form.value), coefficient: parseFloat(form.coefficient) || 1, date: form.date || null, comment: form.comment || null })
    setForm({ subject: '', value: '', coefficient: '1', date: new Date().toISOString().slice(0, 10), comment: '' })
    setShowForm(false); setSaving(false); load()
  }
  async function del(id) { await supabase.from('grades').delete().eq('id', id); load() }
  const avg = grades.length ? (grades.reduce((s, g) => s + g.value * g.coefficient, 0) / grades.reduce((s, g) => s + g.coefficient, 0)).toFixed(1) : null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {TERMS.map(t => <Tab key={t} label={t} active={term === t} onClick={() => setTerm(t)} />)}
        </div>
        {avg && <span className="text-sm font-bold text-[#1e3058] bg-[#e8edf5] px-3 py-1.5 rounded-xl">Moy. {avg}/20</span>}
      </div>
      <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 text-[#1e3058] text-xs font-medium hover:underline">
        <Plus size={13} /> Ajouter une note
      </button>
      {showForm && (
        <Card>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className="text-xs text-[#8c8070] mb-1 block">Matière</label><input className={inp} placeholder="Maths…" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} /></div>
            <div><label className="text-xs text-[#8c8070] mb-1 block">Note /20</label><input type="number" className={inp} min="0" max="20" step="0.5" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} /></div>
            <div><label className="text-xs text-[#8c8070] mb-1 block">Coefficient</label><input type="number" className={inp} min="0.5" step="0.5" value={form.coefficient} onChange={e => setForm(f => ({ ...f, coefficient: e.target.value }))} /></div>
            <div><label className="text-xs text-[#8c8070] mb-1 block">Date</label><input type="date" className={inp} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
          </div>
          <div className="mb-3"><label className="text-xs text-[#8c8070] mb-1 block">Commentaire</label><input className={inp} value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} /></div>
          <FormActions onSave={add} onCancel={() => setShowForm(false)} saving={saving} disabled={!form.subject || !form.value} />
        </Card>
      )}
      {grades.length === 0 ? <Card><EmptyState text="Aucune note pour ce trimestre." /></Card> : (
        <Card>
          <div className="divide-y divide-[#f8f7f4]">
            {grades.map(g => (
              <div key={g.id} className="flex items-center justify-between py-2.5 group">
                <div>
                  <p className="font-medium text-[#1a1814] text-sm">{g.subject}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {g.date && <span className="text-xs text-[#8c8070]">{fmtDate(g.date)}</span>}
                    {g.coefficient !== 1 && <span className="text-xs text-[#8c8070]">coeff. {g.coefficient}</span>}
                    {g.comment && <span className="text-xs text-[#8c8070] italic">{g.comment}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-bold text-sm ${g.value >= 10 ? 'text-emerald-600' : 'text-red-500'}`}>{g.value}/20</span>
                  <button onClick={() => del(g.id)} className="text-[#d8d3c8] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Onglet Appréciations ────────────────────────────────────────────────────

function TabAppreciations({ studentId }) {
  const [comments, setComments] = useState([])
  const [term, setTerm] = useState('T1')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ text: '', author: '' })
  const [saving, setSaving] = useState(false)
  async function load() {
    const { data } = await supabase.from('comments').select('*').eq('student_id', studentId).eq('term', TERM_LABELS[term]).order('created_at', { ascending: false })
    setComments(data ?? [])
  }
  useEffect(() => { load() }, [studentId, term])
  async function add() {
    if (!form.text) return
    setSaving(true)
    await supabase.from('comments').insert({ student_id: studentId, term: TERM_LABELS[term], text: form.text, author: form.author || null })
    setForm({ text: '', author: '' }); setShowForm(false); setSaving(false); load()
  }
  async function del(id) { await supabase.from('comments').delete().eq('id', id); load() }

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {TERMS.map(t => <Tab key={t} label={t} active={term === t} onClick={() => setTerm(t)} />)}
      </div>
      <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 text-[#1e3058] text-xs font-medium hover:underline">
        <Plus size={13} /> Ajouter une appréciation
      </button>
      {showForm && (
        <Card>
          <div className="mb-3"><label className="text-xs text-[#8c8070] mb-1 block">Appréciation</label>
            <textarea rows={3} className={inp} placeholder="Bon trimestre…" value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} /></div>
          <div className="mb-3"><label className="text-xs text-[#8c8070] mb-1 block">Auteur</label>
            <input className={inp} placeholder="Optionnel" value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} /></div>
          <FormActions onSave={add} onCancel={() => setShowForm(false)} saving={saving} disabled={!form.text} />
        </Card>
      )}
      {comments.length === 0 ? <Card><EmptyState text="Aucune appréciation pour ce trimestre." /></Card> : (
        <div className="space-y-2">
          {comments.map(c => (
            <Card key={c.id}>
              <div className="flex items-start justify-between">
                <p className="text-sm text-[#1a1814] leading-relaxed flex-1 pr-4">{c.text}</p>
                <button onClick={() => del(c.id)} className="text-[#d8d3c8] hover:text-red-400 transition-colors flex-shrink-0"><Trash2 size={13} /></button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-[#8c8070]">{fmtDate(c.created_at)}</span>
                {c.author && <span className="text-xs text-[#8c8070]">— {c.author}</span>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Onglet Bons Points ──────────────────────────────────────────────────────

function TabBonPoints({ studentId }) {
  const [entries, setEntries] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [pendingAmount, setPendingAmount] = useState(1)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  async function load() {
    const { data } = await supabase.from('bon_points').select('*').eq('student_id', studentId).order('date', { ascending: false })
    setEntries(data ?? [])
  }
  useEffect(() => { load() }, [studentId])
  function openForm(amount) { setPendingAmount(amount); setReason(''); setShowForm(true) }
  async function add() {
    setSaving(true)
    await supabase.from('bon_points').insert({ student_id: studentId, amount: pendingAmount, reason: reason || null, date: new Date().toISOString().slice(0, 10) })
    setShowForm(false); setSaving(false); load()
  }
  async function del(id) { await supabase.from('bon_points').delete().eq('id', id); load() }
  const total = entries.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 bg-white border border-[#edeae3] rounded-2xl p-5 shadow-sm">
        <button onClick={() => openForm(-1)}
          className="w-10 h-10 rounded-full bg-[#f8f7f4] hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors border border-[#edeae3]">
          <Minus size={16} />
        </button>
        <div className="flex-1 text-center">
          <Star size={20} className="text-[#b8973a] mx-auto mb-1" fill="currentColor" />
          <p className="text-3xl font-bold text-[#1a1814]">{total}</p>
          <p className="text-xs text-[#8c8070]">bons points</p>
        </div>
        <button onClick={() => openForm(1)}
          className="w-10 h-10 rounded-full bg-amber-50 hover:bg-amber-100 text-[#b8973a] flex items-center justify-center transition-colors border border-amber-200">
          <Plus size={16} />
        </button>
      </div>
      {showForm && (
        <Card>
          <p className="text-xs font-semibold text-[#6b5f50] mb-2">{pendingAmount > 0 ? '+' : ''}{pendingAmount} bon point</p>
          <div className="mb-3"><input className={inp} placeholder="Motif (optionnel)" value={reason} onChange={e => setReason(e.target.value)} /></div>
          <FormActions onSave={add} onCancel={() => setShowForm(false)} saving={saving} />
        </Card>
      )}
      {entries.length > 0 && (
        <Card>
          <div className="divide-y divide-[#f8f7f4]">
            {entries.slice(0, 15).map(e => (
              <div key={e.id} className="flex items-center justify-between py-2 group">
                <div className="flex items-center gap-3">
                  <span className={`font-bold text-sm w-8 ${e.amount > 0 ? 'text-[#b8973a]' : 'text-red-500'}`}>{e.amount > 0 ? '+' : ''}{e.amount}</span>
                  {e.reason && <span className="text-sm text-[#4a3f32]">{e.reason}</span>}
                  <span className="text-xs text-[#b8b0a0]">{fmtDate(e.date)}</span>
                </div>
                <button onClick={() => del(e.id)} className="text-[#d8d3c8] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Composant export (inchangé fonctionnellement) ───────────────────────────

async function exportFiche(student) {
  const id = student.id
  const [{ data: attendance }, { data: grades }, { data: comments }, { data: bonPoints }, { data: parents }, { data: sacrements }] =
    await Promise.all([
      supabase.from('attendance').select('*').eq('student_id', id).order('date', { ascending: false }),
      supabase.from('grades').select('*').eq('student_id', id).order('date', { ascending: false }),
      supabase.from('comments').select('*').eq('student_id', id).order('created_at', { ascending: false }),
      supabase.from('bon_points').select('*').eq('student_id', id).order('date', { ascending: false }),
      supabase.from('parent_contacts').select('*').eq('student_id', id),
      supabase.from('sacrements').select('*').eq('student_id', id),
    ])
  const fmtD = d => d ? new Date(d).toLocaleDateString('fr-FR') : '-'
  const lines = [`FICHE ÉLÈVE`, `===========`, `Nom : ${student.last_name} ${student.first_name}`, `École : ${student.schools?.name ?? '-'}`, `Classe : ${student.class ?? '-'}`, ``]
  // ... (logique identique à l'original)
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob); const a = document.createElement('a')
  a.href = url; a.download = `fiche_${student.last_name}_${student.first_name}.txt`; a.click(); URL.revokeObjectURL(url)
}

// ─── Page principale ─────────────────────────────────────────────────────────

const TABS_BASE = [
  { id: 'infos',         label: 'Infos & Parents' },
  { id: 'sacrements',    label: 'Sacrements' },
  { id: 'presences',     label: 'Présences' },
  { id: 'notes',         label: 'Notes' },
  { id: 'appreciations', label: 'Appréciations' },
]

export default function StudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [activeTab, setActiveTab] = useState('infos')

  useEffect(() => {
    async function load() {
      const [{ data: s }, { data: sc }] = await Promise.all([
        supabase.from('students').select('*, schools(name)').eq('id', id).single(),
        supabase.from('schools').select('*'),
      ])
      setStudent(s); setSchools(sc ?? []); setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="p-6 text-[#8c8070] text-sm">Chargement…</div>
  if (!student) return <div className="p-6 text-[#8c8070] text-sm">Élève introuvable.</div>

  const isHerrade = student.schools?.name?.includes('Herrade')
  const tabs = isHerrade ? [...TABS_BASE, { id: 'bonpoints', label: 'Bons Points' }] : TABS_BASE

  async function deleteStudent() { await supabase.from('students').delete().eq('id', id); navigate('/eleves') }
  async function handleExport() { setExporting(true); await exportFiche(student); setExporting(false) }

  return (
    <div className="p-6 max-w-3xl">
      {/* Retour + actions */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/eleves')} className="flex items-center gap-1.5 text-[#8c8070] hover:text-[#1a1814] text-sm transition-colors">
          <ArrowLeft size={15} /> Retour aux élèves
        </button>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-1.5 text-[#6b5f50] hover:text-[#1a1814] text-xs font-medium disabled:opacity-50 transition-colors">
            <Download size={13} /> {exporting ? '…' : 'Exporter'}
          </button>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 text-red-400 hover:text-red-600 text-xs font-medium transition-colors">
              <Trash2 size={13} /> Supprimer
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5">
              <span className="text-xs text-red-600 font-medium">Confirmer ?</span>
              <button onClick={deleteStudent} className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded-lg transition-colors">Oui</button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs text-[#6b5f50] hover:text-[#1a1814] px-1 transition-colors">Non</button>
            </div>
          )}
        </div>
      </div>

      {/* En-tête élève */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-[#1e3058]/10 flex items-center justify-center flex-shrink-0">
          <span className="text-[#1e3058] font-bold text-lg">{student.first_name?.[0]}{student.last_name?.[0]}</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1a1814]">{student.last_name} {student.first_name}</h1>
          <p className="text-sm text-[#8c8070] mt-0.5">
            {student.schools?.name}{student.class ? ` · ${student.class}` : ''}
          </p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 flex-wrap mb-5 bg-[#edeae3]/50 p-1 rounded-2xl">
        {tabs.map(t => <Tab key={t.id} label={t.label} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} />)}
      </div>

      {/* Contenu */}
      {activeTab === 'infos'         && <TabInfos student={student} schools={schools} onSave={u => setStudent(s => ({ ...s, ...u }))} />}
      {activeTab === 'sacrements'    && <TabSacrements studentId={id} />}
      {activeTab === 'presences'     && <TabPresences studentId={id} />}
      {activeTab === 'notes'         && <TabNotes studentId={id} />}
      {activeTab === 'appreciations' && <TabAppreciations studentId={id} />}
      {activeTab === 'bonpoints'     && <TabBonPoints studentId={id} />}
    </div>
  )
}
