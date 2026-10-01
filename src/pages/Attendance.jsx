import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { CalendarCheck, Check, X, Clock, UserCheck, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'

const STATUS = {
  present: { label: 'Présent',  short: 'P', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200', btn: 'bg-emerald-500 text-white' },
  absent:  { label: 'Absent',   short: 'A', color: 'bg-red-50 text-red-600 border border-red-200',             btn: 'bg-red-500 text-white' },
  late:    { label: 'Retard',   short: 'R', color: 'bg-amber-50 text-amber-700 border border-amber-200',       btn: 'bg-amber-500 text-white' },
  excused: { label: 'Excusé',   short: 'E', color: 'bg-blue-50 text-blue-700 border border-blue-200',          btn: 'bg-blue-500 text-white' },
}

// ── Onglet Saisie en masse ────────────────────────────────────────────────────

function SaisieMasse({ schoolId, schools }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [students, setStudents] = useState([])
  const [presences, setPresences] = useState({}) // id -> status
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [defaultStatus, setDefaultStatus] = useState('present')
  const [selectedSchool, setSelectedSchool] = useState(schoolId || '')

  useEffect(() => { setSelectedSchool(schoolId || '') }, [schoolId])

  useEffect(() => {
    async function load() {
      if (!selectedSchool) { setStudents([]); return }
      const { data } = await supabase.from('students').select('id, first_name, last_name, class')
        .eq('school_id', selectedSchool).order('last_name')
      const list = data ?? []
      setStudents(list)
      // Pré-remplir avec le statut par défaut
      const init = {}
      list.forEach(s => { init[s.id] = defaultStatus })
      setPresences(init)
    }
    load()
  }, [selectedSchool])

  function applyDefault() {
    const init = {}
    students.forEach(s => { init[s.id] = defaultStatus })
    setPresences(init)
  }

  function toggle(id, status) {
    setPresences(p => ({ ...p, [id]: status }))
  }

  async function save() {
    setSaving(true)
    const rows = students.map(s => ({
      student_id: s.id, date, status: presences[s.id] ?? 'present', reason: null,
    }))
    await supabase.from('attendance').upsert(rows, { onConflict: 'student_id,date' })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  const grouped = students.reduce((acc, s) => {
    const k = s.class || 'Sans classe'
    if (!acc[k]) acc[k] = []
    acc[k].push(s)
    return acc
  }, {})

  const counts = Object.values(presences).reduce((acc, v) => { acc[v] = (acc[v] ?? 0) + 1; return acc }, {})

  return (
    <div>
      {/* Contrôles */}
      <div className="flex flex-wrap gap-3 mb-5 items-end">
        <div>
          <label className="text-xs font-medium text-[#6b5f50] mb-1.5 block">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="border border-black/8 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#192848]/20 focus:border-[#192848] transition-all shadow-sm" />
        </div>
        {!schoolId && (
          <div>
            <label className="text-xs font-medium text-[#6b5f50] mb-1.5 block">Établissement</label>
            <select value={selectedSchool} onChange={e => setSelectedSchool(e.target.value)}
              className="border border-black/8 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#192848]/20 transition-all shadow-sm">
              <option value="">— Choisir —</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="text-xs font-medium text-[#6b5f50] mb-1.5 block">Statut par défaut</label>
          <div className="flex gap-1">
            {Object.entries(STATUS).map(([k, v]) => (
              <button key={k} onClick={() => setDefaultStatus(k)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${defaultStatus === k ? v.btn : 'bg-white border-black/8 text-[#6b5f50]'}`}>
                {v.label}
              </button>
            ))}
            <button onClick={applyDefault}
              className="px-3 py-2 rounded-xl text-xs font-medium bg-[#f0ece4] text-[#4a3f32] hover:bg-[#e8e3da] transition-all ml-1">
              Tout mettre
            </button>
          </div>
        </div>
      </div>

      {!selectedSchool ? (
        <div className="py-16 text-center">
          <CalendarCheck size={28} className="text-[#d8d3c8] mx-auto mb-3" />
          <p className="text-[#8c8070] text-sm">Sélectionnez un établissement pour commencer la saisie.</p>
        </div>
      ) : students.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[#8c8070] text-sm">Aucun élève dans cet établissement.</p>
        </div>
      ) : (
        <>
          {/* Résumé */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {Object.entries(STATUS).map(([k, v]) => counts[k] ? (
              <span key={k} className={`px-3 py-1 rounded-full text-xs font-medium ${v.color}`}>
                {counts[k]} {v.label.toLowerCase()}{counts[k] > 1 ? 's' : ''}
              </span>
            ) : null)}
          </div>

          {/* Liste par classe */}
          <div className="space-y-3 mb-5">
            {Object.entries(grouped).sort().map(([classe, list]) => (
              <div key={classe} className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-[#f0ece4] bg-[#faf9f6]">
                  <span className="text-xs font-semibold text-[#4a3f32] uppercase tracking-wider">{classe}</span>
                  <span className="ml-2 text-[10px] text-[#9a9080]">{list.length} élève{list.length > 1 ? 's' : ''}</span>
                </div>
                <div className="divide-y divide-[#f8f6f2]">
                  {list.map(s => {
                    const cur = presences[s.id] ?? 'present'
                    return (
                      <div key={s.id} className="flex items-center justify-between px-5 py-3">
                        <span className="font-medium text-[#1a1814] text-sm">{s.last_name} {s.first_name}</span>
                        <div className="flex gap-1">
                          {Object.entries(STATUS).map(([k, v]) => (
                            <button key={k} onClick={() => toggle(s.id, k)}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${cur === k ? v.btn + ' shadow-sm' : 'bg-[#f0ece4] text-[#9a9080] hover:bg-[#e8e3da]'}`}
                              title={v.label}>
                              {v.short}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 bg-[#192848] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#111c35] disabled:opacity-50 transition-colors shadow-sm">
            {saving ? 'Enregistrement…' : saved ? '✓ Enregistré !' : <><Check size={15} /> Enregistrer les présences</>}
          </button>
        </>
      )}
    </div>
  )
}

// ── Onglet Consultation ───────────────────────────────────────────────────────

function Consultation({ schoolId }) {
  const [records, setRecords] = useState([])
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      let q = supabase.from('attendance').select('*, students(first_name, last_name, class, school_id, schools(name))').eq('date', date).order('status')
      const { data } = await q
      const filtered = schoolId ? (data ?? []).filter(r => r.students?.school_id === schoolId) : (data ?? [])
      setRecords(filtered)
      setLoading(false)
    }
    load()
  }, [schoolId, date])

  const fmtDateLong = d => new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const counts = records.reduce((acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc }, {})

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="border border-black/8 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#192848]/20 transition-all shadow-sm" />
        <span className="text-sm text-[#8c8070] capitalize">{fmtDateLong(date)}</span>
      </div>

      {records.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {Object.entries(STATUS).map(([k, v]) => counts[k] ? (
            <span key={k} className={`px-3 py-1 rounded-full text-xs font-medium ${v.color}`}>
              {counts[k]} {v.label.toLowerCase()}{counts[k] > 1 ? 's' : ''}
            </span>
          ) : null)}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[#c8c0b0] text-sm">Chargement…</div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarCheck size={28} className="text-[#d8d3c8] mx-auto mb-3" />
            <p className="text-[#8c8070] text-sm">Aucun enregistrement pour cette date.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f0ece4]">
                <th className="text-left px-6 py-3 text-[10px] font-semibold text-[#9a9080] uppercase tracking-wider">Élève</th>
                <th className="text-left px-6 py-3 text-[10px] font-semibold text-[#9a9080] uppercase tracking-wider">Classe</th>
                <th className="text-left px-6 py-3 text-[10px] font-semibold text-[#9a9080] uppercase tracking-wider">Statut</th>
                <th className="text-left px-6 py-3 text-[10px] font-semibold text-[#9a9080] uppercase tracking-wider">Motif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f8f6f2]">
              {records.map(r => {
                const s = STATUS[r.status] ?? { label: r.status, color: 'bg-gray-100 text-gray-600' }
                return (
                  <tr key={r.id} className="hover:bg-[#faf9f6] transition-colors">
                    <td className="px-6 py-3.5 font-medium text-[#1a1814]">{r.students?.last_name} {r.students?.first_name}</td>
                    <td className="px-6 py-3.5 text-[#6b5f50]">{r.students?.class ?? '—'}</td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>
                    </td>
                    <td className="px-6 py-3.5 text-[#9a9080]">{r.reason ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function Attendance() {
  const { schoolId, schools } = useOutletContext()
  const [tab, setTab] = useState('saisie')

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1a1814] tracking-tight">Présences</h1>
      </div>

      <div className="flex gap-1 mb-6 bg-white border border-black/5 rounded-xl p-1 w-fit shadow-sm">
        <button onClick={() => setTab('saisie')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === 'saisie' ? 'bg-[#192848] text-white shadow-sm' : 'text-[#8c8070] hover:text-[#1a1814]'}`}>
          Saisie en masse
        </button>
        <button onClick={() => setTab('consultation')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === 'consultation' ? 'bg-[#192848] text-white shadow-sm' : 'text-[#8c8070] hover:text-[#1a1814]'}`}>
          Consultation
        </button>
      </div>

      {tab === 'saisie' ? <SaisieMasse schoolId={schoolId} schools={schools} /> : <Consultation schoolId={schoolId} />}
    </div>
  )
}
