import { useState } from 'react'
import { useResume } from '../resumeStore.jsx'

const inputCls = 'w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all'
const labelCls = 'text-gray-400 text-xs mb-1 block'

function Field({ label, field, section, placeholder, type = 'text' }) {
  const { resume, updatePersonal, updateSkills } = useResume()
  const value = section === 'personal' ? resume.personal[field] : resume.skills[field]
  const onChange = section === 'personal'
    ? e => updatePersonal(field, e.target.value)
    : e => updateSkills(field, e.target.value)
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={inputCls} />
    </div>
  )
}

function Accordion({ title, icon, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-neutral-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900/60 hover:bg-neutral-800/60 transition-all"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-white text-xs font-semibold">{title}</span>
        </div>
        <span className={`text-gray-500 text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && <div className="p-4 space-y-3 bg-[#0f0f17]">{children}</div>}
    </div>
  )
}

function ListSection({ section, items, template, renderItem, addLabel }) {
  const { addListItem, removeListItem } = useResume()
  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={item.id} className="relative border border-neutral-800 rounded-lg p-3 space-y-2 bg-neutral-900/30">
          {items.length > 1 && (
            <button
              onClick={() => removeListItem(section, item.id)}
              className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs flex items-center justify-center transition-all"
            >✕</button>
          )}
          {renderItem(item, idx)}
        </div>
      ))}
      <button
        onClick={() => addListItem(section, template)}
        className="w-full py-2 border border-dashed border-neutral-700 hover:border-violet-500/50 rounded-lg text-gray-500 hover:text-violet-400 text-xs transition-all"
      >
        + {addLabel}
      </button>
    </div>
  )
}

export default function ResumeForm() {
  const { resume, updateListItem } = useResume()

  function li(section, id, field) {
    return {
      value: resume[section].find(i => i.id === id)?.[field] || '',
      onChange: e => updateListItem(section, id, field, e.target.value),
    }
  }

  return (
    <div className="space-y-2 pb-8">
      {/* Personal */}
      <Accordion title="Personal Details" icon="👤" defaultOpen>
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2"><Field label="Full Name" field="name" section="personal" placeholder="Rahul Sharma" /></div>
          <Field label="Phone" field="phone" section="personal" placeholder="+91 9876543210" />
          <Field label="Email" field="email" section="personal" placeholder="rahul@email.com" type="email" />
          <Field label="LinkedIn" field="linkedin" section="personal" placeholder="linkedin.com/in/rahul" />
          <Field label="GitHub" field="github" section="personal" placeholder="github.com/rahul" />
          <Field label="Portfolio" field="portfolio" section="personal" placeholder="rahul.dev" />
          <Field label="Location" field="location" section="personal" placeholder="Hyderabad, India" />
        </div>
      </Accordion>

      {/* Education */}
      <Accordion title="Education" icon="🎓">
        <ListSection
          section="education"
          items={resume.education}
          template={{ college: '', degree: '', department: '', cgpa: '', year: '', intermediate: '', schooling: '' }}
          addLabel="Add Education"
          renderItem={(item) => (
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <label className={labelCls}>College Name</label>
                <input className={inputCls} placeholder="ABC Engineering College" {...li('education', item.id, 'college')} />
              </div>
              <div>
                <label className={labelCls}>Degree</label>
                <input className={inputCls} placeholder="B.Tech" {...li('education', item.id, 'degree')} />
              </div>
              <div>
                <label className={labelCls}>Department</label>
                <input className={inputCls} placeholder="Computer Science" {...li('education', item.id, 'department')} />
              </div>
              <div>
                <label className={labelCls}>CGPA</label>
                <input className={inputCls} placeholder="8.5" {...li('education', item.id, 'cgpa')} />
              </div>
              <div>
                <label className={labelCls}>Year</label>
                <input className={inputCls} placeholder="2021 – 2025" {...li('education', item.id, 'year')} />
              </div>
              <div>
                <label className={labelCls}>Intermediate</label>
                <input className={inputCls} placeholder="95% — XYZ Junior College" {...li('education', item.id, 'intermediate')} />
              </div>
              <div>
                <label className={labelCls}>Schooling</label>
                <input className={inputCls} placeholder="92% — ABC High School" {...li('education', item.id, 'schooling')} />
              </div>
            </div>
          )}
        />
      </Accordion>

      {/* Skills */}
      <Accordion title="Skills" icon="⚡">
        <Field label="Programming Languages" field="languages" section="skills" placeholder="Python, Java, C++, JavaScript" />
        <Field label="Frameworks & Libraries" field="frameworks" section="skills" placeholder="React, Node.js, Django, Spring" />
        <Field label="Tools & Platforms" field="tools" section="skills" placeholder="Git, Docker, AWS, Figma, VS Code" />
        <Field label="Soft Skills" field="soft" section="skills" placeholder="Leadership, Communication, Problem Solving" />
      </Accordion>

      {/* Experience */}
      <Accordion title="Experience" icon="💼">
        <ListSection
          section="experience"
          items={resume.experience}
          template={{ role: '', company: '', duration: '', description: '' }}
          addLabel="Add Experience"
          renderItem={(item) => (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Role / Title</label>
                  <input className={inputCls} placeholder="Frontend Intern" {...li('experience', item.id, 'role')} />
                </div>
                <div>
                  <label className={labelCls}>Company</label>
                  <input className={inputCls} placeholder="TechCorp Pvt Ltd" {...li('experience', item.id, 'company')} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Duration</label>
                <input className={inputCls} placeholder="Jun 2024 – Aug 2024" {...li('experience', item.id, 'duration')} />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  rows={2}
                  className={inputCls + ' resize-none'}
                  placeholder="Built responsive UI components using React..."
                  {...li('experience', item.id, 'description')}
                />
              </div>
            </div>
          )}
        />
      </Accordion>

      {/* Projects */}
      <Accordion title="Projects" icon="🚀">
        <ListSection
          section="projects"
          items={resume.projects}
          template={{ title: '', description: '', tech: '', link: '' }}
          addLabel="Add Project"
          renderItem={(item) => (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Project Title</label>
                  <input className={inputCls} placeholder="X Buddy" {...li('projects', item.id, 'title')} />
                </div>
                <div>
                  <label className={labelCls}>GitHub Link</label>
                  <input className={inputCls} placeholder="github.com/you/project" {...li('projects', item.id, 'link')} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Tech Stack (comma separated)</label>
                <input className={inputCls} placeholder="React, Node.js, MongoDB" {...li('projects', item.id, 'tech')} />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  rows={2}
                  className={inputCls + ' resize-none'}
                  placeholder="A smart campus printing platform..."
                  {...li('projects', item.id, 'description')}
                />
              </div>
            </div>
          )}
        />
      </Accordion>

      {/* Certifications */}
      <Accordion title="Certifications" icon="🏆">
        <ListSection
          section="certifications"
          items={resume.certifications}
          template={{ course: '', platform: '', year: '' }}
          addLabel="Add Certification"
          renderItem={(item) => (
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-3 sm:col-span-1">
                <label className={labelCls}>Course Name</label>
                <input className={inputCls} placeholder="Full Stack Web Dev" {...li('certifications', item.id, 'course')} />
              </div>
              <div>
                <label className={labelCls}>Platform</label>
                <input className={inputCls} placeholder="Coursera" {...li('certifications', item.id, 'platform')} />
              </div>
              <div>
                <label className={labelCls}>Year</label>
                <input className={inputCls} placeholder="2024" {...li('certifications', item.id, 'year')} />
              </div>
            </div>
          )}
        />
      </Accordion>

      {/* Achievements */}
      <Accordion title="Achievements" icon="🥇">
        <AchievementsField />
      </Accordion>
    </div>
  )
}

function AchievementsField() {
  const { resume, updateAchievements } = useResume()
  return (
    <div>
      <label className={labelCls}>Hackathons, Awards, Competitions</label>
      <textarea
        rows={4}
        value={resume.achievements}
        onChange={e => updateAchievements(e.target.value)}
        placeholder={"• Winner — Smart India Hackathon 2024\n• Top 10 — HackWithInfy\n• Best Project Award — College Tech Fest"}
        className={`${inputCls} resize-none`}
      />
    </div>
  )
}
