import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, X, Check, Star, Minus } from 'lucide-react'
import { supabase } from '../lib/supabase'

const TERMS = ['T1', 'T2', 'T3']
const TERM_LABELS = { T1: 'Trimestre 1', T2: 'Trimestre 2', T3: 'Trimestre 3' }
const inp = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full'

function Section({ title, children, action }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  )
}

function SectionClasse({ student, schools, onSave }) {
  const [form, setForm] = useState({ class: student.class ?? '', school_id: student.school_id })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    await supabase.from('students').update(form).eq('id', student.id)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    onSave(form)
  }

  return (
    <Section title="Classe">
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Classe</label>
          <input className={inp} placeholder="6eme A, CE2..." value={form.class}
            onChange={e => setForm(f => ({ ...f, class: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Ecole</label>
          <select className={inp} value={form.school_id} onChange={e => setForm(f => ({ ...f, school_id: e.target.value }))}>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
          <Check size={14} /> {saving ? '...' : saved ? 'Enregistre!' : 'Enregistrer'}
        </button>
      </div>
    </Section>
  )
}

function SectionPresences({ studentId }) {
  const [records, setRecords] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), status: 'absent', reason: '' })
  const [saving, setSaving] = useState(false)

  const STATUS = {
    present: { label: 'Present',  color: 'bg-green-100 text-green-700' },
    absent:  { label: 'Absent',   color: 'bg-red-100 text-red-700' },
    late:    { label: 'Retard',   color: 'bg-amber-100 text-amber-700' },
    excused: { label: 'Excuse',   color: 'bg-blue-100 text-blue-700' },
  }

  async function load() {
    const { data } = await supabase.from('attendance').select('*')
      .eq('student_id', studentId).order('date', { ascending: false }).limit(20)
    setRecords(data ?? [])
  }

  useEffect(() => { load() }, [studentId])

  async function add() {
    setSaving(true)
    await supabase.from('attendance').upsert(
      { student_id: studentId, date: form.date, status: form.status, reason: form.reason || null },
      { onConflict: 'student_id,date' }
    )
    setForm({ date: new Date().toISOString().slice(0, 10), status: 'absent', reason: '' })
    setShowForm(false); setSaving(false); load()
  }

  async function del(id) { await supabase.from('attendance').delete().eq('id', id); load() }

  return (
    <Section title="Presences"
      action={<button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1 text-blue-600 text-xs hover:underline"><Plus size={13} /> Ajouter</button>}>
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-gray-500 mb-1 block">Date</label>
              <input type="date" className={inp} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Statut</label>
              <select className={inp} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {Object.entries(STATUS).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
              </select></div>
          </div>
          <div><label className="text-xs text-gray-500 mb-1 block">Motif</label>
            <input className={inp} placeholder="Optionnel..." value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} /></div>
          <div className="flex gap-2">
            <button onClick={add} disabled={saving} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700 disabled:opacity-50"><Check size={12} /> {saving ? '...' : 'OK'}</button>
            <button onClick={() => setShowForm(false)} className="flex items-center gap-1 border border-gray-200 px-3 py-1.5 rounded-lg text-xs text-gray-500"><X size={12} /> Annuler</button>
          </div>
        </div>
      )}
      {records.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4 bg-white rounded-xl border border-gray-200">Aucune absence enregistree.</p>
      ) : (
        <div className="space-y-2">
          {records.map(r => {
            const s = STATUS[r.status] ?? { label: r.status, color: 'bg-gray-100 text-gray-600' }
            return (
              <div key={r.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>
                  <span className="text-sm text-gray-600">{new Date(r.date).toLocaleDateString('fr-FR')}</span>
                  {r.reason && <span className="text-xs text-gray-400">{r.reason}</span>}
                </div>
                <button onClick={() => del(r.id)} className="text-gray-200 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            )
          })}
        </div>
      )}
    </Section>
  )
}

function SectionNotes({ studentId }) {
  const [grades, setGrades] = useState([])
  const [term, setTerm] = useState('T1')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ subject: '', value: '', coefficient: '1', comment: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('grades').select('*')
      .eq('student_id', studentId).eq('term', TERM_LABELS[term]).order('created_at', { ascending: false })
    setGrades(data ?? [])
  }

  useEffect(() => { load() }, [studentId, term])

  async function add() {
    if (!form.subject || !form.value) return
    setSaving(true)
    await supabase.from('grades').insert({
      student_id: studentId, term: TERM_LABELS[term],
      subject: form.subject, value: parseFloat(form.value),
      coefficient: parseFloat(form.coefficient) || 1,
      comment: form.comment || null,
    })
    setForm({ subject: '', value: '', coefficient: '1', comment: '' })
    setShowForm(false); setSaving(false); load()
  }

  async function del(id) { await supabase.from('grades').delete().eq('id', id); load() }

  const avg = grades.length
    ? (grades.reduce((s, g) => s + g.value * g.coefficient, 0) / grades.reduce((s, g) => s + g.coefficient, 0)).toFixed(1)
    : null

  return (
    <Section title="Notes"
      action={<button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1 text-blue-600 text-xs hover:underline"><Plus size={13} /> Ajouter</button>}>
      <div className="flex gap-1 mb-3">
        {TERMS.map(t => (
          <button key={t} onClick={() => setTerm(t)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${term === t ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-500'}`}>
            {t}
          </button>
        ))}
        {avg && <span className="ml-auto text-xs text-blue-700 font-semibold bg-blue-50 px-3 py-1 rounded-lg">Moy. {avg}/20</span>}
      </div>
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-gray-500 mb-1 block">Matiere</label>
              <input className={inp} placeholder="Maths..." value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Note /20</label>
              <input type="number" className={inp} min="0" max="20" step="0.5" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Coefficient</label>
              <input type="number" className={inp} min="0.5" step="0.5" value={form.coefficient} onChange={e => setForm(f => ({ ...f, coefficient: e.target.value }))} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Commentaire</label>
              <input className={inp} value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2">
            <button onClick={add} disabled={saving} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700 disabled:opacity-50"><Check size={12} /> {saving ? '...' : 'OK'}</button>
            <button onClick={() => setShowForm(false)} className="flex items-center gap-1 border border-gray-200 px-3 py-1.5 rounded-lg text-xs text-gray-500"><X size={12} /> Annuler</button>
          </div>
        </div>
      )}
      {grades.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4 bg-white rounded-xl border border-gray-200">Aucune note.</p>
      ) : (
        <div className="space-y-2">
          {grades.map(g => (
            <div key={g.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-800 text-sm">{g.subject}</span>
                {g.comment && <span className="ml-2 text-xs text-gray-400">{g.comment}</span>}
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-bold text-sm ${g.value >= 10 ? 'text-green-600' : 'text-red-500'}`}>{g.value}/20</span>
                <button onClick={() => del(g.id)} className="text-gray-200 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}

function SectionAppreciations({ studentId }) {
  const [comments, setComments] = useState([])
  const [term, setTerm] = useState('T1')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ text: '', author: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('comments').select('*')
      .eq('student_id', studentId).eq('term', TERM_LABELS[term]).order('created_at', { ascending: false })
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
    <Section title="Appreciations"
      action={<button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1 text-blue-600 text-xs hover:underline"><Plus size={13} /> Ajouter</button>}>
      <div className="flex gap-1 mb-3">
        {TERMS.map(t => (
          <button key={t} onClick={() => setTerm(t)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${term === t ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-500'}`}>
            {t}
          </button>
        ))}
      </div>
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3 space-y-2">
          <div><label className="text-xs text-gray-500 mb-1 block">Appreciation</label>
            <textarea rows={3} className={inp} placeholder="Bon trimestre..." value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Auteur</label>
            <input className={inp} placeholder="Optionnel" value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} /></div>
          <div className="flex gap-2">
            <button onClick={add} disabled={saving} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700 disabled:opacity-50"><Check size={12} /> {saving ? '...' : 'OK'}</button>
            <button onClick={() => setShowForm(false)} className="flex items-center gap-1 border border-gray-200 px-3 py-1.5 rounded-lg text-xs text-gray-500"><X size={12} /> Annuler</button>
          </div>
        </div>
      )}
      {comments.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4 bg-white rounded-xl border border-gray-200">Aucune appreciation.</p>
      ) : (
        <div className="space-y-2">
          {comments.map(c => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 relative group">
              <button onClick={() => del(c.id)} className="absolute top-3 right-3 text-gray-200 group-hover:text-red-400"><Trash2 size={14} /></button>
              <p className="text-sm text-gray-700 leading-relaxed pr-5">{c.text}</p>
              {c.author && <p className="text-xs text-gray-400 mt-1">- {c.author}</p>}
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}

function SectionBonPoints({ studentId }) {
  const [entries, setEntries] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [pendingAmount, setPendingAmount] = useState(1)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('bon_points').select('*')
      .eq('student_id', studentId).order('date', { ascending: false })
    setEntries(data ?? [])
  }

  useEffect(() => { load() }, [studentId])

  function openForm(amount) { setPendingAmount(amount); setReason(''); setShowForm(true) }

  async function add() {
    setSaving(true)
    await supabase.from('bon_points').insert({
      student_id: studentId, amount: pendingAmount,
      reason: reason || null, date: new Date().toISOString().slice(0, 10),
    })
    setShowForm(false); setSaving(false); load()
  }

  async function del(id) { await supabase.from('bon_points').delete().eq('id', id); load() }

  const total = entries.reduce((s, e) => s + e.amount, 0)

  return (
    <Section title="Bon Points">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => openForm(-1)}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors">
          <Minus size={18} />
        </button>
        <div className="flex-1 flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 rounded-xl py-3">
          <Star size={20} className="text-amber-400" fill="currentColor" />
          <span className="text-2xl font-bold text-amber-700">{total}</span>
        </div>
        <button onClick={() => openForm(1)}
          className="w-10 h-10 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-700 flex items-center justify-center transition-colors">
          <Plus size={18} />
        </button>
      </div>
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3 space-y-2">
          <p className="text-xs font-medium text-gray-600">{pendingAmount > 0 ? `+${pendingAmount}` : pendingAmount} bon point</p>
          <input className={inp} placeholder="Motif (optionnel)" value={reason} onChange={e => setReason(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={add} disabled={saving} className="flex items-center gap-1 bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-amber-600 disabled:opacity-50"><Check size={12} /> {saving ? '...' : 'Valider'}</button>
            <button onClick={() => setShowForm(false)} className="flex items-center gap-1 border border-gray-200 px-3 py-1.5 rounded-lg text-xs text-gray-500"><X size={12} /> Annuler</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {entries.slice(0, 10).map(e => (
          <div key={e.id} className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex items-center justify-between group">
            <div className="flex items-center gap-2">
              <span className={`font-bold text-sm ${e.amount > 0 ? 'text-amber-500' : 'text-red-500'}`}>{e.amount > 0 ? '+' : ''}{e.amount}</span>
              {e.reason && <span className="text-xs text-gray-500">{e.reason}</span>}
              <span className="text-xs text-gray-300">{new Date(e.date).toLocaleDateString('fr-FR')}</span>
            </div>
            <button onClick={() => del(e.id)} className="text-gray-200 group-hover:text-red-400"><Trash2 size={13} /></button>
          </div>
        ))}
      </div>
    </Section>
  )
}

export default function StudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)

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

  if (loading) return <div className="p-6 text-gray-400 text-sm">Chargement...</div>
  if (!student) return <div className="p-6 text-gray-400 text-sm">Eleve introuvable.</div>

  const isHerrade = student.schools?.name?.includes('Herrade')

  return (
    <div className="p-4 sm:p-6">
      <button onClick={() => navigate('/')} className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm mb-4">
        <ArrowLeft size={15} /> Retour
      </button>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">{student.last_name} {student.first_name}</h1>
        <p className="text-gray-400 text-sm">{student.schools?.name}{student.class ? ` - ${student.class}` : ''}</p>
      </div>
      <SectionClasse student={student} schools={schools} onSave={u => setStudent(s => ({ ...s, ...u }))} />
      <SectionPresences studentId={id} />
      <SectionNotes studentId={id} />
      <SectionAppreciations studentId={id} />
      {isHerrade && <SectionBonPoints studentId={id} />}
    </div>
  )
}
