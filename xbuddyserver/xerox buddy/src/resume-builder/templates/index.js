import ModernTemplate   from './ModernTemplate'
import MinimalTemplate  from './MinimalTemplate'
import CreativeTemplate from './CreativeTemplate'

export const TEMPLATES = [
  {
    id: 'modern',
    label: 'Modern Professional',
    desc: 'Purple accents, clean sections, great for CS/IT roles',
    component: ModernTemplate,
    accent: '#7c3aed',
  },
  {
    id: 'minimal',
    label: 'Minimal ATS',
    desc: 'Black & white, maximum ATS compatibility, no frills',
    component: MinimalTemplate,
    accent: '#111',
  },
  {
    id: 'creative',
    label: 'Creative Modern',
    desc: 'Two-column sidebar, bold header, stands out visually',
    component: CreativeTemplate,
    accent: '#4c1d95',
  },
]

export function getTemplate(id) {
  return TEMPLATES.find(t => t.id === id) || TEMPLATES[0]
}
