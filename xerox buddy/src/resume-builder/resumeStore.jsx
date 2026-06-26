import { createContext, useContext, useState } from 'react'

export const EMPTY_RESUME = {
  personal: {
    name: '', phone: '', email: '', linkedin: '',
    github: '', portfolio: '', location: '',
  },
  education: [
    { id: 1, college: '', degree: '', department: '', cgpa: '', year: '', intermediate: '', schooling: '' },
  ],
  skills: { languages: '', frameworks: '', tools: '', soft: '' },
  projects: [
    { id: 1, title: '', description: '', tech: '', link: '' },
  ],
  experience: [
    { id: 1, role: '', company: '', duration: '', description: '' },
  ],
  certifications: [
    { id: 1, course: '', platform: '', year: '' },
  ],
  achievements: '',
  template: 'modern',
}

const ResumeContext = createContext(null)

export function ResumeProvider({ children }) {
  const [resume, setResume] = useState(EMPTY_RESUME)

  function updatePersonal(field, value) {
    setResume(r => ({ ...r, personal: { ...r.personal, [field]: value } }))
  }

  function updateSkills(field, value) {
    setResume(r => ({ ...r, skills: { ...r.skills, [field]: value } }))
  }

  function updateListItem(section, id, field, value) {
    setResume(r => ({
      ...r,
      [section]: r[section].map(item => item.id === id ? { ...item, [field]: value } : item),
    }))
  }

  function addListItem(section, template) {
    setResume(r => ({
      ...r,
      [section]: [...r[section], { ...template, id: Date.now() }],
    }))
  }

  function removeListItem(section, id) {
    setResume(r => ({
      ...r,
      [section]: r[section].filter(item => item.id !== id),
    }))
  }

  function setTemplate(t) {
    setResume(r => ({ ...r, template: t }))
  }

  function updateAchievements(value) {
    setResume(r => ({ ...r, achievements: value }))
  }

  return (
    <ResumeContext.Provider value={{
      resume, updatePersonal, updateSkills,
      updateListItem, addListItem, removeListItem,
      setTemplate, updateAchievements,
    }}>
      {children}
    </ResumeContext.Provider>
  )
}

export function useResume() {
  return useContext(ResumeContext)
}
