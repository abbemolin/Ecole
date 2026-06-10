import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Download, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Exports() {
  const { schoolId } = useOutletContext()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      let q = supabase
        .from('students')
        .select('*, schools(name)')
        .order('last_name')
      if (schoolId) q = q.eq('school_id', schoolId)
      const { data } = await q
      setStudents(data ?? [])
      setLoading(false)
    }
    load()
  }, [schoolId])

  async function exportStudent(student) {
    setExporting(student.id)

    // Fetch all data for this student
    const [gradesRes, attendanceRes, commentsRes, parentsRes] = await Promise.all([
      supabase.from('grades').select('*').eq('student_id', student.id).order('date'),
      supabase.from('attendance').select('*').eq('student_id', student.id).order('date'),
      supabase.from('comments').select('*').eq('student_id', student.id),
      supabase.from('parents').select('*').eq('student_id', student.id),
    ])

    const data = {
      student,
      grades: gradesRes.data ?? [],
      attendance: attendanceRes.data ?? [],
      comments: commentsRes.data ?? [],
      parents: parentsRes.data ?? [],
    }

    // Build a simple text export (replace with PDF generation as needed)
    const lines = [
      `Dossier élève — ${student.last_name} ${student.first_name}`,
      `École : ${student.schools?.name}  |  Classe : ${student.class ?? '—'}`,
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
    a.href = url
    a.download = `${student.last_name}_${student.first_name}.txt`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(null)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Exports</h1>
        <p className="text-sm text-gray-500">Export du dossier complet par élève</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-400 py-12 text-sm">Chargement…</p>
        ) : students.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">Aucun élève.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Élève</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Classe</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">École</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800 flex items-center gap-2">
                    <FileText size={16} className="text-gray-400" />
                    {s.last_name} {s.first_name}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{s.class ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{s.schools?.name ?? '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => exportStudent(s)}
                      disabled={exporting === s.id}
                      className="flex items-center gap-1 ml-auto text-blue-600 hover:text-blue-800 disabled:opacity-50 text-sm"
                    >
                      <Download size={15} />
                      {exporting === s.id ? 'Export…' : 'Exporter'}
                    </button>
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
