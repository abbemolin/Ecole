import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Download, FileText, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'

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

  async function exportStudent(student) {
    setExporting(student.id)
    const [gradesRes, attendanceRes, commentsRes, parentsRes] = await Promise.all([
      supabase.from('grades').select('*').eq('student_id', student.id).order('date'),
      supabase.from('attendance').select('*').eq('student_id', student.id).order('date'),
      supabase.from('comments').select('*').eq('student_id', student.id),
      supabase.from('parent_contacts').select('*').eq('student_id', student.id),
    ])
    const data = {
      grades: gradesRes.data ?? [],
      attendance: attendanceRes.data ?? [],
      comments: commentsRes.data ?? [],
      parents: parentsRes.data ?? [],
    }
    const lines = [
      `Dossier élève — ${student.last_name} ${student.first_name}`,
      `Paroisse : ${student.schools?.name}  |  Classe : ${student.class ?? '—'}`,
      '',
      '=== NOTES ===',
      ...data.grades.map(g => `${g.date ?? ''} | ${g.subject} | ${g.value}/20 (coeff.${g.coefficient}) | ${g.term}`),
      '',
      '=== PRÉSENCES ===',
      ...data.attendance.map(a => `${a.date} | ${a.status}${a.reason ? ' — ' + a.reason : ''}`),
      '',
      '=== APPRÉCIATIONS ===',
      ...data.comments.map(c => `[${c.term}] ${c.text} (${c.author ?? ''})`),
      '',
      '=== CONTACTS PARENTS ===',
      ...data.parents.map(p => `${p.last_name} ${p.first_name} (${p.relationship ?? ''}) | ${p.email ?? ''} | ${p.phone ?? ''}`),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${student.last_name}_${student.first_name}.txt`; a.click()
    URL.revokeObjectURL(url)
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1a1814] tracking-tight">Exports</h1>
        <p className="text-sm text-[#8c8070] mt-0.5">Dossier complet par élève</p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-[#c8c0b0] text-sm">Chargement…</div>
      ) : students.length === 0 ? (
        <div className="py-16 text-center">
          <Users size={28} className="text-[#d8d3c8] mx-auto mb-3" />
          <p className="text-[#8c8070] text-sm">Aucun élève.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([school, list]) => (
            <div key={school}>
              <p className="text-[10px] font-semibold text-[#9a9080] uppercase tracking-widest mb-2 px-1">{school}</p>
              <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#f0ece4]">
                      <th className="text-left px-6 py-3 text-[10px] font-semibold text-[#9a9080] uppercase tracking-wider">Élève</th>
                      <th className="text-left px-6 py-3 text-[10px] font-semibold text-[#9a9080] uppercase tracking-wider">Classe</th>
                      <th className="px-6 py-3 w-24" />
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
                          <button onClick={() => exportStudent(s)} disabled={exporting === s.id}
                            className="flex items-center gap-1.5 ml-auto text-[#192848] hover:text-[#111c35] disabled:opacity-50 text-xs font-medium transition-colors">
                            <Download size={13} />
                            {exporting === s.id ? 'Export…' : 'Exporter'}
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
