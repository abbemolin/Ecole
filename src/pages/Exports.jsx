import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Download, FileSpreadsheet, Users, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'

// ─── Helpers Excel ────────────────────────────────────────────

function colWidth(w) { return { wch: w } }

function headerStyle() {
  return {
    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
    fill: { fgColor: { rgb: '192848' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      bottom: { style: 'thin', color: { rgb: 'C9A53A' } },
    },
  }
}

function cellStyle(alt) {
  return {
    fill: { fgColor: { rgb: alt ? 'F4F2EE' : 'FFFFFF' } },
    font: { sz: 10 },
    alignment: { vertical: 'center' },
    border: {
      bottom: { style: 'hair', color: { rgb: 'E8E3DA' } },
    },
  }
}

function applyStyles(ws, headers, rows) {
  headers.forEach((_, ci) => {
    const addr = XLSX.utils.encode_cell({ r: 0, c: ci })
    if (ws[addr]) ws[addr].s = headerStyle()
  })
  rows.forEach((_, ri) => {
    headers.forEach((_, ci) => {
      const addr = XLSX.utils.encode_cell({ r: ri + 1, c: ci })
      if (ws[addr]) ws[addr].s = cellStyle(ri % 2 === 1)
    })
  })
}

// ─── Export global (tous élèves) ─────────────────────────────

async function buildExcelTous(students) {
  const ids = students.map(s => s.id)

  const [gradesRes, commentsRes] = await Promise.all([
    supabase.from('grades').select('*, students(first_name, last_name, class, schools(name))').in('student_id', ids).order('last_name', { referencedTable: 'students' }),
    supabase.from('comments').select('*, students(first_name, last_name, class, schools(name))').in('student_id', ids),
  ])

  const grades = gradesRes.data ?? []
  const comments = commentsRes.data ?? []

  // ── Feuille Notes ──
  const notesHeaders = ['Paroisse', 'Nom', 'Prénom', 'Classe', 'Trimestre', 'Matière', 'Note /20', 'Coefficient', 'Date', 'Commentaire']
  const notesRows = grades.map(g => [
    g.students?.schools?.name ?? '',
    g.students?.last_name ?? '',
    g.students?.first_name ?? '',
    g.students?.class ?? '',
    g.term ?? '',
    g.subject ?? '',
    g.value != null ? Number(g.value) : '',
    g.coefficient != null ? Number(g.coefficient) : '',
    g.date ? new Date(g.date).toLocaleDateString('fr-FR') : '',
    g.comment ?? '',
  ])

  const wsNotes = XLSX.utils.aoa_to_sheet([notesHeaders, ...notesRows])
  wsNotes['!cols'] = [20, 16, 14, 10, 14, 16, 10, 10, 12, 30].map(colWidth)
  wsNotes['!rows'] = [{ hpt: 22 }, ...notesRows.map(() => ({ hpt: 18 }))]
  applyStyles(wsNotes, notesHeaders, notesRows)

  // ── Feuille Appréciations ──
  const apprecHeaders = ['Paroisse', 'Nom', 'Prénom', 'Classe', 'Trimestre', 'Appréciation', 'Auteur']
  const apprecRows = comments.map(c => [
    c.students?.schools?.name ?? '',
    c.students?.last_name ?? '',
    c.students?.first_name ?? '',
    c.students?.class ?? '',
    c.term ?? '',
    c.text ?? '',
    c.author ?? '',
  ])

  const wsApprec = XLSX.utils.aoa_to_sheet([apprecHeaders, ...apprecRows])
  wsApprec['!cols'] = [20, 16, 14, 10, 14, 50, 16].map(colWidth)
  wsApprec['!rows'] = [{ hpt: 22 }, ...apprecRows.map(() => ({ hpt: 18 }))]
  applyStyles(wsApprec, apprecHeaders, apprecRows)

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, wsNotes, 'Notes')
  XLSX.utils.book_append_sheet(wb, wsApprec, 'Appréciations')
  return wb
}

// ─── Export individuel ────────────────────────────────────────

async function buildExcelEleve(student) {
  const [gradesRes, commentsRes] = await Promise.all([
    supabase.from('grades').select('*').eq('student_id', student.id).order('term').order('date'),
    supabase.from('comments').select('*').eq('student_id', student.id).order('term'),
  ])

  const grades = gradesRes.data ?? []
  const comments = commentsRes.data ?? []

  // ── Feuille Notes ──
  const notesHeaders = ['Trimestre', 'Matière', 'Note /20', 'Coefficient', 'Date', 'Commentaire']
  const notesRows = grades.map(g => [
    g.term ?? '',
    g.subject ?? '',
    g.value != null ? Number(g.value) : '',
    g.coefficient != null ? Number(g.coefficient) : '',
    g.date ? new Date(g.date).toLocaleDateString('fr-FR') : '',
    g.comment ?? '',
  ])

  const wsNotes = XLSX.utils.aoa_to_sheet([notesHeaders, ...notesRows])
  wsNotes['!cols'] = [14, 18, 10, 10, 12, 40].map(colWidth)
  wsNotes['!rows'] = [{ hpt: 22 }, ...notesRows.map(() => ({ hpt: 18 }))]
  applyStyles(wsNotes, notesHeaders, notesRows)

  // ── Feuille Appréciations ──
  const apprecHeaders = ['Trimestre', 'Appréciation', 'Auteur']
  const apprecRows = comments.map(c => [c.term ?? '', c.text ?? '', c.author ?? ''])

  const wsApprec = XLSX.utils.aoa_to_sheet([apprecHeaders, ...apprecRows])
  wsApprec['!cols'] = [14, 60, 18].map(colWidth)
  wsApprec['!rows'] = [{ hpt: 22 }, ...apprecRows.map(() => ({ hpt: 18 }))]
  applyStyles(wsApprec, apprecHeaders, apprecRows)

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, wsNotes, 'Notes')
  XLSX.utils.book_append_sheet(wb, wsApprec, 'Appréciations')
  return wb
}

// ─── Composant ────────────────────────────────────────────────

export default function Exports() {
  const { schoolId } = useOutletContext()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(null) // id élève ou 'tous'

  useEffect(() => {
    async function load() {
      setLoading(true)
      let q = supabase.from('students').select('*, schools(name)').order('last_name')
      if (schoolId) q = q.eq('school_id', schoolId)
      const { data } = await q
      setStudents(data ?? [])
      setLoading(false)
    }
    load()
  }, [schoolId])

  async function exportTous() {
    setExporting('tous')
    const wb = await buildExcelTous(students)
    XLSX.writeFile(wb, 'Notes_et_appreciations_tous.xlsx')
    setExporting(null)
  }

  async function exportEleve(student) {
    setExporting(student.id)
    const wb = await buildExcelEleve(student)
    XLSX.writeFile(wb, `${student.last_name}_${student.first_name}_notes.xlsx`)
    setExporting(null)
  }

  const grouped = students.reduce((acc, s) => {
    const key = s.schools?.name ?? 'Inconnue'
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1814] tracking-tight">Exports</h1>
          <p className="text-sm text-[#8c8070] mt-0.5">Notes & appréciations en Excel</p>
        </div>
        <button onClick={exportTous} disabled={exporting === 'tous' || loading || students.length === 0}
          className="flex items-center gap-2 bg-[#c9a53a] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#b8932e] disabled:opacity-50 transition-colors shadow-sm">
          {exporting === 'tous'
            ? <><Loader2 size={14} className="animate-spin" /> Export en cours…</>
            : <><FileSpreadsheet size={14} /> Exporter tous</>}
        </button>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-4 mb-5 px-1">
        <div className="flex items-center gap-1.5 text-xs text-[#8c8070]">
          <div className="w-3 h-3 rounded bg-[#192848]" />
          Onglet Notes
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#8c8070]">
          <div className="w-3 h-3 rounded bg-[#c9a53a]" />
          Onglet Appréciations
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-[#c8c0b0] text-sm">Chargement…</div>
      ) : students.length === 0 ? (
        <div className="py-16 text-center">
          <Users size={28} className="text-[#d8d3c8] mx-auto mb-3" />
          <p className="text-[#8c8070] text-sm">Aucun élève.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([school, list]) => (
            <div key={school}>
              <p className="text-[10px] font-semibold text-[#9a9080] uppercase tracking-widest mb-2 px-1">{school}</p>
              <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#f0ece4]">
                      <th className="text-left px-6 py-3 text-[10px] font-semibold text-[#9a9080] uppercase tracking-wider">Élève</th>
                      <th className="text-left px-6 py-3 text-[10px] font-semibold text-[#9a9080] uppercase tracking-wider">Classe</th>
                      <th className="px-6 py-3 w-36 text-right text-[10px] font-semibold text-[#9a9080] uppercase tracking-wider">Export individuel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f8f6f2]">
                    {list.map(s => (
                      <tr key={s.id} className="hover:bg-[#faf9f6] transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-[#192848]/8 flex items-center justify-center flex-shrink-0">
                              <span className="text-[#192848] font-semibold text-[10px]">{s.first_name?.[0]}{s.last_name?.[0]}</span>
                            </div>
                            <span className="font-medium text-[#1a1814]">{s.last_name} {s.first_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-[#8c8070]">{s.class ?? '—'}</td>
                        <td className="px-6 py-3.5 text-right">
                          <button onClick={() => exportEleve(s)} disabled={!!exporting}
                            className="inline-flex items-center gap-1.5 text-[#192848] hover:text-[#c9a53a] disabled:opacity-40 text-xs font-medium transition-colors">
                            {exporting === s.id
                              ? <Loader2 size={13} className="animate-spin" />
                              : <Download size={13} />}
                            {exporting === s.id ? 'Export…' : '.xlsx'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
