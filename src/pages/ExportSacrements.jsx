import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import { supabase } from '../lib/supabase'

const SACREMENT_LABELS = { bapteme: 'Bapteme', communion: 'Communion', profession_de_foi: 'Profession de foi' }
const SACREMENT_STATUS = { demande: 'Demande', en_preparation: 'En preparation', recu: 'Recu' }

export default function ExportSacrements() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('sacrements')
        .select('*, students(first_name, last_name, class, schools(name))')
        .order('created_at', { ascending: false })
      setRows(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  function exportCSV() {
    const header = ['Nom', 'Prenom', 'Classe', 'Ecole', 'Sacrement', 'Statut', 'Date demande', 'Date prevue', 'Notes']
    const lines = [header.join(';')]
    for (const r of rows) {
      const s = r.students
      lines.push([
        s?.last_name ?? '',
        s?.first_name ?? '',
        s?.class ?? '',
        s?.schools?.name ?? '',
        SACREMENT_LABELS[r.type] ?? r.type,
        SACREMENT_STATUS[r.status] ?? r.status,
        r.date_request ? new Date(r.date_request).toLocaleDateString('fr-FR') : '',
        r.date_planned ? new Date(r.date_planned).toLocaleDateString('fr-FR') : '',
        (r.notes ?? '').replace(/;/g, ','),
      ].join(';'))
    }
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sacrements_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const statusColor = {
    demande:        'bg-yellow-100 text-yellow-700',
    en_preparation: 'bg-blue-100 text-blue-700',
    recu:           'bg-green-100 text-green-700',
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm">
          <ArrowLeft size={15} /> Retour
        </button>
        <button onClick={exportCSV} disabled={!rows.length}
          className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
          <Download size={15} /> Exporter CSV
        </button>
      </div>
      <h1 className="text-xl font-bold text-gray-800 mb-1">Demandes de sacrements</h1>
      <p className="text-gray-400 text-sm mb-5">{rows.length} demande{rows.length !== 1 ? 's' : ''}</p>

      {loading ? (
        <p className="text-center text-gray-400 py-10 text-sm">Chargement...</p>
      ) : rows.length === 0 ? (
        <p className="text-center text-gray-400 py-10 text-sm">Aucune demande.</p>
      ) : (
        <div className="space-y-2">
          {rows.map(r => {
            const s = r.students
            return (
              <div key={r.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{s?.last_name} {s?.first_name}
                      {s?.class && <span className="ml-2 text-xs text-gray-400 font-normal">{s.class}</span>}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{s?.schools?.name}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {SACREMENT_STATUS[r.status] ?? r.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs font-medium text-gray-700">{SACREMENT_LABELS[r.type] ?? r.type}</span>
                  {r.date_request && <span className="text-xs text-gray-400">Demande le {new Date(r.date_request).toLocaleDateString('fr-FR')}</span>}
                  {r.date_planned && <span className="text-xs text-gray-400">Prevu le {new Date(r.date_planned).toLocaleDateString('fr-FR')}</span>}
                </div>
                {r.notes && <p className="text-xs text-gray-400 italic mt-1">{r.notes}</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
