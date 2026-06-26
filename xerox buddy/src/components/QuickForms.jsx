import { motion } from 'framer-motion'

const FORMS = [
  { id: 'leave',      title: 'Leave Letter',          icon: '📅', desc: 'Standard leave application',         file: 'leave-letter.pdf'      },
  { id: 'bonafide',   title: 'Bonafide Certificate',  icon: '🎓', desc: 'Request bonafide from college',      file: 'bonafide-form.pdf'     },
  { id: 'resume',     title: 'Resume Template',       icon: '📄', desc: 'Fresher resume template',            file: 'resume-template.pdf'   },
  { id: 'cover',      title: 'Assignment Cover',      icon: '📋', desc: 'Assignment cover page',              file: 'assignment-cover.pdf'  },
  { id: 'internship', title: 'Internship Request',    icon: '💼', desc: 'Internship permission letter',       file: 'internship-request.pdf'},
  { id: 'scholarship',title: 'Scholarship Form',      icon: '🏆', desc: 'Scholarship application form',      file: 'scholarship-form.pdf'  },
  { id: 'lab',        title: 'Lab Record Cover',      icon: '🔬', desc: 'Lab record front page template',    file: 'lab-record.pdf'        },
  { id: 'exam',       title: 'Exam Application',      icon: '📝', desc: 'Exam hall ticket / application',    file: 'exam-application.pdf'  },
]

export default function QuickForms({ onPrintFile }) {
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
          <span>⚡</span> Quick Print Forms
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Common Forms, <span className="gradient-text">Instantly Ready</span>
        </h2>
        <p className="text-gray-500 max-w-xl mx-auto">
          Download or directly print the most commonly used student forms — no searching, no formatting.
        </p>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {FORMS.map((form, i) => (
          <motion.div
            key={form.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl p-5 flex flex-col gap-3 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
              {form.icon}
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">{form.title}</p>
              <p className="text-gray-600 text-xs mt-0.5">{form.desc}</p>
            </div>
            <div className="flex gap-2">
              <a
                href={`/forms/${form.file}`}
                download
                className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-medium text-center transition-all"
              >
                ↓ Download
              </a>
              <button
                onClick={() => onPrintFile(`/forms/${form.file}`, form.title)}
                className="flex-1 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 text-xs font-medium transition-all"
              >
                🖨️ Print
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <p className="text-center text-gray-700 text-xs mt-6">
        Place your PDF files in <span className="font-mono text-gray-600">public/forms/</span> folder
      </p>
    </section>
  )
}
