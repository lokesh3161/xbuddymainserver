import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { jsPDF } from 'jspdf'
import { LETTER_TYPES, generateLetter } from '../utils/letterTemplates'

const EMPTY = { type: 'leave', name: '', receiver: '', department: '', rollNo: '', year: '', reason: '', days: '', extra: '' }

function generatePdfBlob(text, subject) {
  const doc  = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 20
  const width  = 210 - margin * 2
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  const lines = doc.splitTextToSize(text, width)
  let y = margin
  lines.forEach(line => {
    if (y > 270) { doc.addPage(); y = margin }
    doc.text(line, margin, y)
    y += 6
  })
  return doc
}

export default function LetterGenerator({ onPrintGenerated }) {
  const [form,    setForm]    = useState(EMPTY)
  const [preview, setPreview] = useState('')
  const [shown,   setShown]   = useState(false)

  function handleChange(field, value) {
    const updated = { ...form, [field]: value }
    setForm(updated)
    if (shown) setPreview(generateLetter(updated))
  }

  function handleGenerate(e) {
    e.preventDefault()
    const text = generateLetter(form)
    setPreview(text)
    setShown(true)
  }

  function handleDownload() {
    const doc = generatePdfBlob(preview, form.type)
    doc.save(`${form.type}-letter.pdf`)
  }

  async function handlePrint() {
    const doc  = generatePdfBlob(preview, form.type)
    const blob = doc.output('blob')
    const file = new File([blob], `${form.type}-letter.pdf`, { type: 'application/pdf' })
    onPrintGenerated(file)
  }

  const selectedType = LETTER_TYPES.find(t => t.id === form.type)

  return (
    <section className="max-w-6xl mx-auto px-4 py-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 text-sm font-medium mb-4">
          <span>✍️</span> Smart Letter Generator
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Generate Letters <span className="gradient-text">Instantly</span>
        </h2>
        <p className="text-gray-500 max-w-xl mx-auto">
          Fill in your details and get a professionally formatted letter ready to print in seconds.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-6 space-y-4"
        >
          {/* Letter type */}
          <div>
            <label className="text-gray-400 text-xs mb-2 block">Letter Type</label>
            <div className="grid grid-cols-3 gap-2">
              {LETTER_TYPES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleChange('type', t.id)}
                  className={`py-2 px-2 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1 ${
                    form.type === t.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <span>{t.icon}</span>
                  <span className="leading-tight text-center">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fields */}
          {[
            { field: 'name',       label: 'Your Full Name',        placeholder: 'e.g. Rahul Sharma'         },
            { field: 'rollNo',     label: 'Roll Number',           placeholder: 'e.g. 21CS045'              },
            { field: 'year',       label: 'Year / Semester',       placeholder: 'e.g. II Year / 3rd Sem'    },
            { field: 'department', label: 'Department',            placeholder: 'e.g. Computer Science'     },
            { field: 'receiver',   label: 'To (Receiver)',         placeholder: 'e.g. The HOD / Principal'  },
            { field: 'reason',     label: 'Reason / Purpose',      placeholder: 'e.g. Medical emergency'    },
            { field: 'days',       label: 'Number of Days / Weeks',placeholder: 'e.g. 3'                    },
          ].map(({ field, label, placeholder }) => (
            <div key={field}>
              <label className="text-gray-400 text-xs mb-1 block">{label}</label>
              <input
                type="text"
                value={form[field]}
                onChange={e => handleChange(field, e.target.value)}
                placeholder={placeholder}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all"
              />
            </div>
          ))}

          <div>
            <label className="text-gray-400 text-xs mb-1 block">Additional Details (optional)</label>
            <textarea
              value={form.extra}
              onChange={e => handleChange('extra', e.target.value)}
              placeholder="Any extra information..."
              rows={3}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all resize-none"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleGenerate}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all"
          >
            ✍️ Generate Letter
          </motion.button>
        </motion.div>

        {/* Preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-white font-semibold text-sm">
              {selectedType?.icon} {selectedType?.label} Preview
            </p>
            <AnimatePresence>
              {shown && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2"
                >
                  <button
                    onClick={handleDownload}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-medium transition-all"
                  >
                    ↓ Download PDF
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-400 text-xs font-medium transition-all"
                  >
                    🖨️ Print with X Buddy
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1 bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 overflow-y-auto min-h-[400px]">
            {shown ? (
              <pre className="text-gray-200 text-xs leading-relaxed whitespace-pre-wrap font-mono">
                {preview}
              </pre>
            ) : (
              <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-500 mb-4">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                </div>
                <p className="text-gray-400 text-sm font-medium">Letter preview will appear here</p>
                <p className="text-neutral-600 text-xs mt-1.5">Fill in the form and click</p>
                <span className="mt-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium">Generate Letter</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
