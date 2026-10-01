import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { FileSpreadsheet, Loader2, Users, ChevronDown, ChevronRight } from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'

// ─── Styles Excel ────────────────────────────────────────────────────────────

const H = () => ({
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
  fill: { fgColor: { rgb: '192848' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: { bottom: { style: 'thin', color: { rgb: 'C9A53A' } } },
})
const C = (alt) => ({
  fill: { fgColor: { rgb: alt ? 'F4F2EE' : 'FFFFFF' } },
  font: { sz: 10 },
  alignment: { vertical: 'center', wrapText: true },
  border: { bottom: { style: 'hair', color: { rgb: 'E8E3DA' } } },
})
const GOLD = () => ({
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
  fill: { fgColor: { rgb: 'B8932E' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: { bottom: { style: 'thin', color: { rgb: '192848' } } },
})

function makeSheet(headers, rows, colWidths, goldHeader = false) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  ws['!cols'] = colWidths.map(w => ({ wch: w }))
  ws['!rows'] = [{ hpt: 24 }, ...rows.map(() => ({ hpt: 18 }))]
  headers.forEach((_, ci) => {
    const addr = XLSX.utils.encode_cell({ r: 0, c: ci })
    if (ws[addr]) ws[addr].s = goldHeader ? GOLD() : H()
  })
  rows.forEach((_, ri) => {
    headers.forEach((_, ci) => {
      const addr = XLSX.utils.encode_cell({ r: ri + 1, c: ci })
      if (ws[addr]) ws[addr].s = C(ri % 2 === 1)
    })
  })
  return ws
}

function dl(wb, filename) {
  XLSX.writeFile(wb, filename)
}

// ─── Export Notes + Appréciations (tous élèves) ──────────────────────────────

async function exportNotesGlobal(students) {
  const ids = students.map(s => s.id)
  const [{ data: grades }, { data: comments }] = await Promise.all([
    supabase.from('grades').select('*, students(first_name,last_name,class,schools(name))').in('student_id', ids).order('last_name', { referencedTable: 'students' }).order('term'),
    supabase.from('comments').select('*, students(first_name,last_name,class,schools(name))').in('student_id', ids).order('last_name', { referencedTable: 'students' }),
  ])

  const notesH = ['Établissement', 'Nom', 'Prénom', 'Classe', 'Trimestre', 'Matière', 'Note /20', 'Coefficient', 'Date', 'Commentaire']
  const notesR = (grades ?? []).map(g => [
    g.students?.schools?.name ?? '', g.students?.last_name ?? '', g.students?.first_name ?? '',
    g.students?.class ?? '', g.term ?? '', g.subject ?? '',
    g.value != null ? Number(g.value) : '', g.coefficient != null ? Number(g.coefficient) : '',
    g.date ? new Date(g.date).toLocaleDateString('fr-FR') : '', g.comment ?? '',
  ])

  const apprecH = ['Établissement', 'Nom', 'Prénom', 'Classe', 'Trimestre', 'Appréciation', 'Auteur']
  const apprecR = (comments ?? []).map(c => [
    c.students?.schools?.name ?? '', c.students?.last_name ?? '', c.students?.first_name ?? '',
    c.students?.class ?? '', c.term ?? '', c.text ?? '', c.author ?? '',
  ])

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, makeSheet(notesH, notesR, [20, 16, 14, 10, 14, 18, 10, 10, 12, 35]), 'Notes')
  XLSX.utils.book_append_sheet(wb, makeSheet(apprecH, apprecR, [20, 16, 14, 10, 14, 55, 16], true), 'Appréciations')
  dl(wb, 'Notes_et_appreciations.xlsx')
}

// ─── Export Sacrements ───────────────────────────────────────────────────────

const SAC_LABELS = { bapteme: 'Baptême', communion: 'Communion', profession_de_foi: 'Profession de foi' }
const SAC_STATUS = { demande: 'Demandé', en_preparation: 'En préparation', recu: 'Reçu' }

async function exportSacrements(students) {
  const ids = students.map(s => s.id)
  const { data } = await supabase
    .from('sacrements')
    .select('*, students(first_name,last_name,class,schools(name))')
    .in('student_id', ids)
    .order('last_name', { referencedTable: 'students' })

  const headers = ['Établissement', 'Nom', 'Prénom', 'Classe', 'Sacrement', 'Statut', 'Date demande', 'Date prévue', 'Notes']
  const rows = (data ?? []).map(r => [
    r.students?.schools?.name ?? '', r.students?.last_name ?? '', r.students?.first_name ?? '',
    r.students?.class ?? '', SAC_LABELS[r.type] ?? r.type, SAC_STATUS[r.status] ?? r.status,
    r.date_request ? new Date(r.date_request).toLocaleDateString('fr-FR') : '',
    r.date_planned ? new Date(r.date_planned).toLocaleDateString('fr-FR') : '',
    r.notes ?? '',
  ])

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, makeSheet(headers, rows, [20, 16, 14, 10, 18, 16, 14, 14, 30], true), 'Sacrements')
  dl(wb, 'Sacrements.xlsx')
}

// ─── Export dossier complet (individuel) ─────────────────────────────────────

async function exportDossierEleve(student) {
  const id = student.id
  const [{ data: grades }, { data: comments }, { data: attendance }, { data: parents }, { data: sacrements }, { data: bonPoints }] = await Promise.all([
    supabase.from('grades').select('*').eq('student_id', id).order('term').order('date'),
    supabase.from('comments').select('*').eq('student_id', id).order('term'),
    supabase.from('attendance').select('*').eq('student_id', id).order('date', { ascending: false }),
    supabase.from('parent_contacts').select('*').eq('student_id', id),
    supabase.from('sacrements').select('*').eq('student_id', id),
    supabase.from('bon_points').select('*').eq('student_id', id).order('date', { ascending: false }),
  ])

  const wb = XLSX.utils.book_new()

  // Notes
  XLSX.utils.book_append_sheet(wb, makeSheet(
    ['Trimestre', 'Matière', 'Note /20', 'Coefficient', 'Date', 'Commentaire'],
    (grades ?? []).map(g => [g.term ?? '', g.subject ?? '', g.value != null ? Number(g.value) : '', g.coefficient != null ? Number(g.coefficient) : '', g.date ? new Date(g.date).toLocaleDateString('fr-FR') : '', g.comment ?? '']),
    [14, 20, 10, 10, 12, 40]
  ), 'Notes')

  // Appréciations
  XLSX.utils.book_append_sheet(wb, makeSheet(
    ['Trimestre', 'Appréciation', 'Auteur'],
    (comments ?? []).map(c => [c.term ?? '', c.text ?? '', c.author ?? '']),
    [14, 65, 18], true
  ), 'Appréciations')

  // Présences
  XLSX.utils.book_append_sheet(wb, makeSheet(
    ['Date', 'Statut', 'Motif'],
    (attendance ?? []).map(a => [a.date ? new Date(a.date).toLocaleDateString('fr-FR') : '', a.status ?? '', a.reason ?? '']),
    [14, 14, 40]
  ), 'Présences')

  // Parents
  XLSX.utils.book_append_sheet(wb, makeSheet(
    ['Nom', 'Prénom', 'Lien', 'Téléphone', 'Email', 'Notes'],
    (parents ?? []).map(p => [p.last_name ?? '', p.first_name ?? '', p.relationship ?? '', p.phone ?? '', p.email ?? '', p.notes ?? '']),
    [16, 14, 12, 16, 28, 30]
  ), 'Parents')

  // Sacrements
  XLSX.utils.book_append_sheet(wb, makeSheet(
    ['Sacrement', 'Statut', 'Date demande', 'Date prévue', 'Notes'],
    (sacrements ?? []).map(s => [SAC_LABELS[s.type] ?? s.type, SAC_STATUS[s.status] ?? s.status, s.date_request ? new Date(s.date_request).toLocaleDateString('fr-FR') : '', s.date_planned ? new Date(s.date_planned).toLocaleDateString('fr-FR') : '', s.notes ?? '']),
    [20, 16, 14, 14, 30], true
  ), 'Sacrements')

  // Bons points
  if ((bonPoints ?? []).length > 0) {
    XLSX.utils.book_append_sheet(wb, makeSheet(
      ['Date', 'Montant', 'Motif'],
      bonPoints.map(b => [b.date ? new Date(b.date).toLocaleDateString('fr-FR') : '', b.amount, b.reason ?? '']),
      [14, 10, 40]
    ), 'Bons Points')
  }

  dl(wb, `Dossier_${student.last_name}_${student.first_name}.xlsx`)
}

// ─── Composant ───────────────────────────────────────────────────────────────

function ExportCard({ title, description, buttonLabel, color, onClick, loading }) {
  return (
    <div className="bg-white border border-black/5 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4">
      <div>
        <p className="font-semibold text-[#1a1814] text-sm">{title}</p>
        <p className="text-xs text-[#8c8070] mt-0.5">{description}</p>
      </div>
      <button onClick={onClick} disabled={loading}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors shadow-sm flex-shrink-0 disabled:opacity-50 ${color}`}>
        {loading ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
        {loading ? 'Export…' : buttonLabel}
      </button>
    </div>
  )
}

function StudentGroup({ label, students, exporting, onExport }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="mb-4">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-1 py-1.5 mb-2 text-left w-full">
        {open ? <ChevronDown size={12} className="text-[#9a9080]" /> : <ChevronRight size={12} className="text-[#9a9080]" />}
        <span className="text-[10px] font-semibold text-[#9a9080] uppercase tracking-widest">{label}</span>
        <span className="text-[10px] text-[#b8b0a0]">— {students.length} élève{students.length > 1 ? 's' : ''}</span>
      </button>
      {open && (
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f0ece4]">
                <th className="text-left px-6 py-3 text-[10px] font-semibold text-[#9a9080] uppercase tracking-wider">Élève</th>
                <th className="text-left px-6 py-3 text-[10px] font-semibold text-[#9a9080] uppercase tracking-wider">Classe</th>
                <th className="px-6 py-3 text-right text-[10px] font-semibold text-[#9a9080] uppercase tracking-wider">Dossier complet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f8f6f2]">
              {students.map(s => (
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
                    <button onClick={() => onExport(s)} disabled={!!exporting}
                      className="inline-flex items-center gap-1.5 text-[#192848] hover:text-[#c9a53a] disabled:opacity-40 text-xs font-medium transition-colors">
                      {exporting === s.id ? <Loader2 size={13} className="animate-spin" /> : <FileSpreadsheet size={13} />}
                      {exporting === s.id ? 'Export…' : '5 onglets'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function Exports() {
  const { schoolId } = useOutletContext()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(null)

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

  async function run(key, fn) {
    setExporting(key)
    try { await fn() } finally { setExporting(null) }
  }

  const grouped = students.reduce((acc, s) => {
    const key = s.schools?.name ?? 'Inconnue'
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1a1814] tracking-tight">Exports</h1>
        <p className="text-sm text-[#8c8070] mt-0.5">Fichiers Excel prêts à imprimer ou partager</p>
      </div>

      {/* Exports globaux */}
      <p className="text-[10px] font-semibold text-[#9a9080] uppercase tracking-widest mb-3 px-1">Exports globaux</p>
      <div className="space-y-3 mb-8">
        <ExportCard
          title="Notes & Appréciations"
          description="2 onglets : toutes les notes + toutes les appréciations, triées par élève"
          buttonLabel="Exporter"
          color="bg-[#192848] hover:bg-[#111c35]"
          loading={exporting === 'notes'}
          onClick={() => run('notes', () => exportNotesGlobal(students))}
        />
        <ExportCard
          title="Sacrements"
          description="Toutes les demandes de sacrements avec statut et dates"
          buttonLabel="Exporter"
          color="bg-[#c9a53a] hover:bg-[#b8932e]"
          loading={exporting === 'sacrements'}
          onClick={() => run('sacrements', () => exportSacrements(students))}
        />
      </div>

      {/* Dossiers individuels */}
      <p className="text-[10px] font-semibold text-[#9a9080] uppercase tracking-widest mb-3 px-1">Dossier complet par élève</p>
      <p className="text-xs text-[#8c8070] mb-4 px-1">Notes · Appréciations · Présences · Parents · Sacrements · Bons points</p>

      {loading ? (
        <div className="py-16 text-center text-[#c8c0b0] text-sm">Chargement…</div>
      ) : students.length === 0 ? (
        <div className="py-16 text-center">
          <Users size={28} className="text-[#d8d3c8] mx-auto mb-3" />
          <p className="text-[#8c8070] text-sm">Aucun élève.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([school, list]) => (
          <StudentGroup key={school} label={school} students={list} exporting={exporting}
            onExport={s => run(s.id, () => exportDossierEleve(s))} />
        ))
      )}
    </div>
  )
}
