import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, X, Check, Star, Minus } from 'lucide-react'
import { supabase } from '../lib/supabase'

const TERMS = ['Trimestre 1', 'Trimestre 2', 'Trimestre 3']
const HERRADE_ID_KEY = 'Herrade de Landsberg'

const input = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full'

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  )
}

// ─── Onglet Infos ─────────────────────────────────────────────
function TabInfos({ student, schools, onSave }) {
  const [form, setForm] = useState({
    first_name: student.first_name,
    last_name: student.last_name,
    birth_date: student.birth_date ?? '',
    class: student.class ?? '',
    school_id: student.school_id,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    await supabase.from('students').update(form).eq('id', student.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    onSave(form)
  }

  return (
    <div className="max-w-md space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Prénom">
          <input className={input} value={form.first_name}
            onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
        </Field>
        <Field label="Nom">
          <input className={input} value={form.last_name}
            onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
        </Field>
      </div>
      <Field label="Date de naissance">
        <input type="date" className={input} value={form.birth_date}
          onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))} />
      </Field>
      <Field label="Classe">
        <input className={input} placeholder="ex: 6ème A, CM2…" value={form.class}
          onChange={e => setForm(f => ({ ...f, class: e.target.value }))} />
      </Field>
      <Field label="École">
        <select className={input} value={form.school_id}
          onChange={e => setForm(f => ({ ...f, school_id: e.target.value }))}>
          {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>
      <button onClick={save} disabled={saving}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
        <Check size={15} />
        {saving ? 'Enregistrement…' : saved ? 'Enregistré ✓' : 'Enregistrer'}
      </button>
    </div>
  )
}

// ─── Onglet Notes ─────────────────────────────────────────────
function TabNotes({ studentId }) {
  const [grades, setGrades] = useState([])
  const [term, setTerm] = useState(TERMS[0])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ subject: '', value: '', coefficient: '1', date: '', comment: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('grades').select('*')
      .eq('student_id', studentId).eq('term', term).order('date', { ascending: false })
    setGrades(data ?? [])
  }

  useEffect(() => { load() }, [studentId, term])

  async function addGrade() {
    if (!form.subject || !form.value) return
    setSaving(true)
    await supabase.from('grades').insert({
      student_id: studentId, term,
      subject: form.subject,
      value: parseFloat(form.value),
      coefficient: parseFloat(form.coefficient) || 1,
      date: form.date || null,
      comment: form.comment || null,
    })
    setForm({ subject: '', value: '', coefficient: '1', date: '', comment: '' })
    setShowForm(false)
    setSaving(false)
    load()
  }

  async function deleteGrade(id) {
    await supabase.from('grades').delete().eq('id', id)
    load()
  }

  const avg = grades.length
    ? (grades.reduce((s, g) => s + g.value * g.coefficient, 0) /
       grades.reduce((s, g) => s + g.coefficient, 0)).toFixed(2)
    : null

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {TERMS.map(t => (
          <button key={t} onClick={() => setTerm(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${term === t ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {t}
          </button>
        ))}
      </div>

      {avg && (
        <div className="mb-4 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold">
          Moyenne : {avg}/20
        </div>
      )}

      {/* Mobile : cards / Desktop : table */}
      <div className="mb-4">
        {grades.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm bg-white rounded-xl border border-gray-200">Aucune note.</p>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-2 sm:hidden">
              {grades.map(g => (
                <div key={g.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{g.subject}</p>
                    <p className={`text-lg font-bold ${g.value >= 10 ? 'text-green-600' : 'text-red-500'}`}>{g.value}/20</p>
                    {g.comment && <p className="text-xs text-gray-400 italic mt-1">{g.comment}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">coeff. {g.coefficient}</p>
                    {g.date && <p className="text-xs text-gray-400">{new Date(g.date).toLocaleDateString('fr-FR')}</p>}
                    <button onClick={() => deleteGrade(g.id)} className="text-gray-300 hover:text-red-500 mt-2 block ml-auto">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden sm:block bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Matière</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Note</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Coeff.</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Date</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Commentaire</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {grades.map(g => (
                    <tr key={g.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{g.subject}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${g.value >= 10 ? 'text-green-600' : 'text-red-500'}`}>{g.value}/20</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{g.coefficient}</td>
                      <td className="px-4 py-3 text-gray-500">{g.date ? new Date(g.date).toLocaleDateString('fr-FR') : '—'}</td>
                      <td className="px-4 py-3 text-gray-500 italic">{g.comment ?? ''}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => deleteGrade(g.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {showForm ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Matière"><input className={input} placeholder="Mathématiques…" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} /></Field>
            <Field label="Note /20"><input type="number" className={input} min="0" max="20" step="0.5" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} /></Field>
            <Field label="Coefficient"><input type="number" className={input} min="0.5" step="0.5" value={form.coefficient} onChange={e => setForm(f => ({ ...f, coefficient: e.target.value }))} /></Field>
            <Field label="Date"><input type="date" className={input} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></Field>
          </div>
          <Field label="Commentaire"><input className={input} value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} /></Field>
          <div className="flex gap-2">
            <button onClick={addGrade} disabled={saving} className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              <Check size={14} /> {saving ? '…' : 'Ajouter'}
            </button>
            <button onClick={() => setShowForm(false)} className="flex items-center gap-1 border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
              <X size={14} /> Annuler
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 border border-dashed border-blue-300 text-blue-600 px-4 py-2 rounded-lg text-sm hover:bg-blue-50">
          <Plus size={15} /> Ajouter une note
        </button>
      )}
    </div>
  )
}

// ─── Onglet Appréciations ─────────────────────────────────────
function TabComments({ studentId }) {
  const [comments, setComments] = useState([])
  const [term, setTerm] = useState(TERMS[0])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ text: '', author: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('comments').select('*')
      .eq('student_id', studentId).eq('term', term).order('created_at', { ascending: false })
    setComments(data ?? [])
  }

  useEffect(() => { load() }, [studentId, term])

  async function addComment() {
    if (!form.text) return
    setSaving(true)
    await supabase.from('comments').insert({ student_id: studentId, term, text: form.text, author: form.author || null })
    setForm({ text: '', author: '' })
    setShowForm(false)
    setSaving(false)
    load()
  }

  async function deleteComment(id) {
    await supabase.from('comments').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {TERMS.map(t => (
          <button key={t} onClick={() => setTerm(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${term === t ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="space-y-3 mb-4">
        {comments.length === 0 && <p className="text-gray-400 text-sm py-4 text-center">Aucune appréciation.</p>}
        {comments.map(c => (
          <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4 relative group">
            <button onClick={() => deleteComment(c.id)} className="absolute top-3 right-3 text-gray-200 group-hover:text-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
            <p className="text-gray-700 text-sm leading-relaxed pr-6">{c.text}</p>
            <div className="flex items-center justify-between mt-2">
              {c.author && <span className="text-xs text-gray-400">— {c.author}</span>}
              <span className="text-xs text-gray-300 ml-auto">{new Date(c.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
        ))}
      </div>
      {showForm ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <Field label="Appréciation">
            <textarea rows={4} className={input} placeholder="Élève sérieux, bon travail…"
              value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} />
          </Field>
          <Field label="Auteur (optionnel)">
            <input className={input} placeholder="M. Dupont" value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} />
          </Field>
          <div className="flex gap-2">
            <button onClick={addComment} disabled={saving} className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              <Check size={14} /> {saving ? '…' : 'Ajouter'}
            </button>
            <button onClick={() => setShowForm(false)} className="flex items-center gap-1 border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
              <X size={14} /> Annuler
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 border border-dashed border-blue-300 text-blue-600 px-4 py-2 rounded-lg text-sm hover:bg-blue-50">
          <Plus size={15} /> Ajouter une appréciation
        </button>
      )}
    </div>
  )
}

// ─── Onglet Famille ───────────────────────────────────────────
function TabFamily({ studentId }) {
  const [parents, setParents] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', relationship: '', email: '', phone: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('parents').select('*').eq('student_id', studentId)
    setParents(data ?? [])
  }

  useEffect(() => { load() }, [studentId])

  async function addParent() {
    if (!form.first_name || !form.last_name) return
    setSaving(true)
    await supabase.from('parents').insert({ student_id: studentId, ...form })
    setForm({ first_name: '', last_name: '', relationship: '', email: '', phone: '' })
    setShowForm(false)
    setSaving(false)
    load()
  }

  async function deleteParent(id) {
    await supabase.from('parents').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <div className="space-y-3 mb-4">
        {parents.length === 0 && <p className="text-gray-400 text-sm py-4 text-center">Aucun contact enregistré.</p>}
        {parents.map(p => (
          <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4 relative group">
            <button onClick={() => deleteParent(p.id)} className="absolute top-3 right-3 text-gray-200 group-hover:text-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
            <div className="font-semibold text-gray-800 text-sm">
              {p.last_name} {p.first_name}
              {p.relationship && <span className="ml-2 text-xs text-gray-400 font-normal capitalize">({p.relationship})</span>}
            </div>
            <div className="mt-1 space-y-0.5">
              {p.email && <a href={`mailto:${p.email}`} className="block text-sm text-blue-600 hover:underline">{p.email}</a>}
              {p.phone && <a href={`tel:${p.phone}`} className="block text-sm text-blue-600 hover:underline">{p.phone}</a>}
            </div>
          </div>
        ))}
      </div>
      {showForm ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom *"><input className={input} value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} /></Field>
            <Field label="Nom *"><input className={input} value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} /></Field>
          </div>
          <Field label="Lien de parenté">
            <select className={input} value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))}>
              <option value="">— Choisir —</option>
              <option value="mère">Mère</option>
              <option value="père">Père</option>
              <option value="tuteur">Tuteur</option>
              <option value="tutrice">Tutrice</option>
              <option value="autre">Autre</option>
            </select>
          </Field>
          <Field label="Email"><input type="email" className={input} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></Field>
          <Field label="Téléphone"><input type="tel" className={input} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></Field>
          <div className="flex gap-2">
            <button onClick={addParent} disabled={saving} className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              <Check size={14} /> {saving ? '…' : 'Ajouter'}
            </button>
            <button onClick={() => setShowForm(false)} className="flex items-center gap-1 border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
              <X size={14} /> Annuler
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 border border-dashed border-blue-300 text-blue-600 px-4 py-2 rounded-lg text-sm hover:bg-blue-50">
          <Plus size={15} /> Ajouter un contact
        </button>
      )}
    </div>
  )
}

// ─── Onglet Bon Points (Herrade uniquement) ───────────────────
function TabBonPoints({ studentId }) {
  const [entries, setEntries] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ amount: '1', reason: '', date: new Date().toISOString().slice(0, 10) })
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('bon_points')
      .select('*').eq('student_id', studentId).order('date', { ascending: false })
    setEntries(data ?? [])
  }

  useEffect(() => { load() }, [studentId])

  async function add(amount) {
    setSaving(true)
    await supabase.from('bon_points').insert({
      student_id: studentId,
      amount: parseInt(amount),
      reason: form.reason || null,
      date: form.date,
    })
    setForm({ amount: '1', reason: '', date: new Date().toISOString().slice(0, 10) })
    setShowForm(false)
    setSaving(false)
    load()
  }

  async function deleteEntry(id) {
    await supabase.from('bon_points').delete().eq('id', id)
    load()
  }

  const total = entries.reduce((s, e) => s + e.amount, 0)

  return (
    <div>
      {/* Total */}
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4 flex items-center gap-3">
          <Star className="text-amber-400" size={28} fill="currentColor" />
          <div>
            <p className="text-xs text-amber-600 font-medium">Total Bon Points</p>
            <p className="text-3xl font-bold text-amber-700">{total}</p>
          </div>
        </div>
      </div>

      {/* Boutons rapides */}
      {!showForm && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => { setForm(f => ({ ...f, amount: '1' })); setShowForm(true) }}
            className="flex items-center gap-1 bg-amber-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-600 transition-colors">
            <Plus size={15} /> Ajouter
          </button>
          <button
            onClick={() => { setForm(f => ({ ...f, amount: '-1' })); setShowForm(true) }}
            className="flex items-center gap-1 bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors">
            <Minus size={15} /> Retirer
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantité (négatif pour retirer)">
              <input type="number" className={input} value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </Field>
            <Field label="Date">
              <input type="date" className={input} value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </Field>
          </div>
          <Field label="Motif (optionnel)">
            <input className={input} placeholder="Excellent comportement, aide un camarade…"
              value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
          </Field>
          <div className="flex gap-2">
            <button onClick={() => add(form.amount)} disabled={saving}
              className="flex items-center gap-1 bg-amber-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-600 disabled:opacity-50">
              <Check size={14} /> {saving ? '…' : 'Valider'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="flex items-center gap-1 border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
              <X size={14} /> Annuler
            </button>
          </div>
        </div>
      )}

      {/* Historique */}
      <div className="space-y-2">
        {entries.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Aucun bon point enregistré.</p>}
        {entries.map(e => (
          <div key={e.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <span className={`font-bold text-lg ${e.amount > 0 ? 'text-amber-500' : 'text-red-500'}`}>
                {e.amount > 0 ? '+' : ''}{e.amount}
              </span>
              <div>
                {e.reason && <p className="text-sm text-gray-700">{e.reason}</p>}
                <p className="text-xs text-gray-400">{new Date(e.date).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
            <button onClick={() => deleteEntry(e.id)}
              className="text-gray-200 group-hover:text-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────
export default function StudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [schools, setSchools] = useState([])
  const [tab, setTab] = useState('Infos')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: s }, { data: sc }] = await Promise.all([
        supabase.from('students').select('*, schools(name)').eq('id', id).single(),
        supabase.from('schools').select('*'),
      ])
      setStudent(s)
      setSchools(sc ?? [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="p-8 text-gray-400 text-sm">Chargement…</div>
  if (!student) return <div className="p-8 text-gray-400 text-sm">Élève introuvable.</div>

  const isHerrade = student.schools?.name?.includes('Herrade')
  const tabs = ['Infos', 'Notes', 'Appréciations', 'Famille', ...(isHerrade ? ['Bon Points'] : [])]

  return (
    <div className="p-4 sm:p-8">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm mb-4 transition-colors">
        <ArrowLeft size={16} /> Retour
      </button>

      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
          {student.last_name} {student.first_name}
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {student.schools?.name}{student.class ? ` · ${student.class}` : ''}
        </p>
      </div>

      {/* Onglets scrollables sur mobile */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0
              ${tab === t ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Infos'         && <TabInfos     student={student} schools={schools} onSave={u => setStudent(s => ({ ...s, ...u }))} />}
      {tab === 'Notes'         && <TabNotes     studentId={id} />}
      {tab === 'Appréciations' && <TabComments  studentId={id} />}
      {tab === 'Famille'       && <TabFamily    studentId={id} />}
      {tab === 'Bon Points'    && <TabBonPoints studentId={id} />}
    </div>
  )
}
