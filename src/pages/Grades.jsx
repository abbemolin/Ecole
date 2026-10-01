import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { BookOpen, Pencil, Trash2, Check, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

const TERMS = ['Trimestre 1', 'Trimestre 2', 'Trimestre 3']
const inp = 'border border-black/8 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#192848]/20 focus:border-[#192848] w-full bg-white transition-all'

export default function Grades() {
  const { schoolId } = useOutletContext()
  const [grades, setGrades] = useState([])
  const [term, setTerm] = useState(TERMS[0])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // { id, value, coefficient, date, comment }
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    let q = supabase.from('grades').select('*, students(first_name, last_name, school_id)').eq('term', term).order('last_name', { referencedTable: 'students' })
    const { data } = await q
    const filtered = schoolId ? (data ?? []).filter(g => g.students?.school_id === schoolId) : (data ?? [])
    setGrades(filtered)
    setLoading(false)
  }

  useEffect(() => { setEditing(null); load() }, [schoolId, term])

  async function save() {
    if (!editing?.value) return
    setSaving(true)
    await supabase.from('grades').update({
      value: parseFloat(editing.value),
      coefficient: parseFloat(editing.coefficient) || 1,
      date: editing.date || null,
      comment: editing.comment || null,
    }).eq('id', editing.id)
    setEditing(null); setSaving(false); load()
  }

  async function del(id) {
    await supabase.from('grades').delete().eq('id', id)
    load()
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1a1814] tracking-tight">Notes</h1>
        <p className="text-sm text-[#8c8070] mt-0.5">{grades.length} note{grades.length > 1 ? 's' : ''} enregistrée{grades.length > 1 ? 's' : ''}</p>
      </div>

      <div className="flex gap-1.5 mb-5 bg-white border border-black/5 rounded-xl p-1 w-fit shadow-sm">
        {TERMS.map(t => (
          <button key={t} onClick={() => setTerm(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${term === t ? 'bg-[#192848] text-white shadow-sm' : 'text-[#8c8070] hover:text-[#1a1814]'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[#c8c0b0] text-sm">Chargement…</div>
        ) : grades.length === 0 ? (
          <div className="py-16 text-center">
            <BookOpen size={28} className="text-[#d8d3c8] mx-auto mb-3" />
            <p className="text-[#8c8070] text-sm">Aucune note pour ce trimestre.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f0ece4]">
                <th className="text-left px-6 py-3 text-[10px] font-semibold text-[#9a9080] uppercase tracking-wider">Élève</th>
                <th className="text-left px-6 py-3 text-[10px] font-semibold text-[#9a9080] uppercase tracking-wider">Note</th>
                <th className="text-left px-6 py-3 text-[10px] font-semibold text-[#9a9080] uppercase tracking-wider">Coeff.</th>
                <th className="text-left px-6 py-3 text-[10px] font-semibold text-[#9a9080] uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-3 text-[10px] font-semibold text-[#9a9080] uppercase tracking-wider">Commentaire</th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f8f6f2]">
              {grades.map(g => editing?.id === g.id ? (
                <tr key={g.id} className="bg-[#f8f7f4]">
                  <td className="px-6 py-3 font-medium text-[#1a1814]">{g.students?.last_name} {g.students?.first_name}</td>
                  <td className="px-3 py-2"><input type="number" className={inp} min="0" max="20" step="0.5" value={editing.value} onChange={e => setEditing(v => ({ ...v, value: e.target.value }))} autoFocus style={{ width: 72 }} /></td>
                  <td className="px-3 py-2"><input type="number" className={inp} min="0.5" step="0.5" value={editing.coefficient} onChange={e => setEditing(v => ({ ...v, coefficient: e.target.value }))} style={{ width: 72 }} /></td>
                  <td className="px-3 py-2"><input type="date" className={inp} value={editing.date ?? ''} onChange={e => setEditing(v => ({ ...v, date: e.target.value }))} style={{ width: 140 }} /></td>
                  <td className="px-3 py-2"><input className={inp} value={editing.comment ?? ''} onChange={e => setEditing(v => ({ ...v, comment: e.target.value }))} placeholder="Commentaire…" /></td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1">
                      <button onClick={save} disabled={saving || !editing.value}
                        className="w-7 h-7 rounded-lg bg-[#192848] text-white flex items-center justify-center hover:bg-[#111c35] disabled:opacity-50 transition-colors">
                        <Check size={12} />
                      </button>
                      <button onClick={() => setEditing(null)}
                        className="w-7 h-7 rounded-lg bg-[#f0ece4] text-[#6b5f50] flex items-center justify-center hover:bg-[#e8e3da] transition-colors">
                        <X size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={g.id} className="hover:bg-[#faf9f6] transition-colors group">
                  <td className="px-6 py-3.5 font-medium text-[#1a1814]">{g.students?.last_name} {g.students?.first_name}</td>
                  <td className="px-6 py-3.5">
                    <span className={`font-bold ${g.value >= 10 ? 'text-emerald-600' : 'text-red-500'}`}>{g.value}/20</span>
                  </td>
                  <td className="px-6 py-3.5 text-[#9a9080]">{g.coefficient}</td>
                  <td className="px-6 py-3.5 text-[#9a9080]">{g.date ? new Date(g.date).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-6 py-3.5 text-[#9a9080] italic">{g.comment ?? '—'}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditing({ id: g.id, value: String(g.value), coefficient: String(g.coefficient), date: g.date ?? '', comment: g.comment ?? '' })}
                        className="w-7 h-7 rounded-lg bg-[#f0ece4] text-[#6b5f50] flex items-center justify-center hover:bg-[#192848] hover:text-white transition-colors">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => del(g.id)}
                        className="w-7 h-7 rounded-lg bg-[#f0ece4] text-[#6b5f50] flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
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
