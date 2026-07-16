// Modern Professional Template

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{
        fontSize: '11px', fontWeight: '700', letterSpacing: '1.5px',
        textTransform: 'uppercase', color: '#7c3aed',
        borderBottom: '1.5px solid #7c3aed', paddingBottom: '3px',
        marginBottom: '10px',
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Tag({ children }) {
  return (
    <span style={{
      display: 'inline-block', background: '#f3f0ff', color: '#6d28d9',
      borderRadius: '4px', padding: '2px 8px', fontSize: '9px',
      fontWeight: '600', marginRight: '5px', marginBottom: '4px',
    }}>
      {children}
    </span>
  )
}

export default function ModernTemplate({ data, fontScale = 1 }) {
  const { personal, education, skills, projects, experience, certifications, achievements } = data
  const edu = education[0] || {}

  const allSkills = [
    ...skills.languages.split(','),
    ...skills.frameworks.split(','),
    ...skills.tools.split(','),
  ].map(s => s.trim()).filter(Boolean)

  const f = (n) => `${n * fontScale}px`

  return (
    <div style={{
      fontFamily: "'Georgia', serif", fontSize: f(10.5), color: '#1a1a2e',
      lineHeight: '1.6', padding: '28mm 22mm', background: '#fff',
      minHeight: '297mm', width: '210mm', boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '20px', borderBottom: '2px solid #7c3aed', paddingBottom: '14px' }}>
        <div style={{ fontSize: f(26), fontWeight: '800', color: '#1a1a2e', letterSpacing: '-0.5px', fontFamily: 'Arial, sans-serif' }}>
          {personal.name || 'Your Name'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '6px', fontSize: '9.5px', color: '#555' }}>
          {personal.phone    && <span>📞 {personal.phone}</span>}
          {personal.email    && <span>✉ {personal.email}</span>}
          {personal.location && <span>📍 {personal.location}</span>}
          {personal.linkedin && <span>🔗 {personal.linkedin}</span>}
          {personal.github   && <span>⌥ {personal.github}</span>}
          {personal.portfolio && <span>🌐 {personal.portfolio}</span>}
        </div>
      </div>

      {/* Education */}
      {(edu.college || edu.degree) && (
        <Section title="Education">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '11px' }}>{edu.college}</div>
              <div style={{ color: '#444', fontSize: '10px' }}>{edu.degree}{edu.department ? ` — ${edu.department}` : ''}</div>
              {edu.intermediate && <div style={{ color: '#666', fontSize: '9.5px', marginTop: '2px' }}>Intermediate: {edu.intermediate}</div>}
              {edu.schooling    && <div style={{ color: '#666', fontSize: '9.5px' }}>Schooling: {edu.schooling}</div>}
            </div>
            <div style={{ textAlign: 'right', fontSize: '9.5px', color: '#666' }}>
              {edu.year && <div>{edu.year}</div>}
              {edu.cgpa && <div style={{ fontWeight: '700', color: '#7c3aed' }}>CGPA: {edu.cgpa}</div>}
            </div>
          </div>
        </Section>
      )}

      {/* Skills */}
      {allSkills.length > 0 && (
        <Section title="Technical Skills">
          <div>
            {skills.languages  && <div style={{ marginBottom: '4px' }}><strong style={{ fontSize: '9.5px' }}>Languages: </strong><span style={{ color: '#444', fontSize: '9.5px' }}>{skills.languages}</span></div>}
            {skills.frameworks && <div style={{ marginBottom: '4px' }}><strong style={{ fontSize: '9.5px' }}>Frameworks: </strong><span style={{ color: '#444', fontSize: '9.5px' }}>{skills.frameworks}</span></div>}
            {skills.tools      && <div style={{ marginBottom: '4px' }}><strong style={{ fontSize: '9.5px' }}>Tools: </strong><span style={{ color: '#444', fontSize: '9.5px' }}>{skills.tools}</span></div>}
            {skills.soft       && <div><strong style={{ fontSize: '9.5px' }}>Soft Skills: </strong><span style={{ color: '#444', fontSize: '9.5px' }}>{skills.soft}</span></div>}
          </div>
        </Section>
      )}

      {/* Experience */}
      {experience.some(e => e.role || e.company) && (
        <Section title="Experience">
          {experience.filter(e => e.role || e.company).map(exp => (
            <div key={exp.id} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: '700', fontSize: '11px' }}>{exp.role}</div>
                <div style={{ fontSize: '9.5px', color: '#666' }}>{exp.duration}</div>
              </div>
              <div style={{ color: '#7c3aed', fontSize: '10px', fontWeight: '600' }}>{exp.company}</div>
              {exp.description && <div style={{ color: '#444', fontSize: '9.5px', marginTop: '3px' }}>{exp.description}</div>}
            </div>
          ))}
        </Section>
      )}

      {/* Projects */}
      {projects.some(p => p.title) && (
        <Section title="Projects">
          {projects.filter(p => p.title).map(proj => (
            <div key={proj.id} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontWeight: '700', fontSize: '11px' }}>{proj.title}</div>
                {proj.link && <div style={{ fontSize: '9px', color: '#7c3aed' }}>{proj.link}</div>}
              </div>
              {proj.description && <div style={{ color: '#444', fontSize: '9.5px', marginTop: '2px' }}>{proj.description}</div>}
              {proj.tech && (
                <div style={{ marginTop: '4px' }}>
                  {proj.tech.split(',').map(t => t.trim()).filter(Boolean).map((t, i) => <Tag key={i}>{t}</Tag>)}
                </div>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* Certifications */}
      {certifications.some(c => c.course) && (
        <Section title="Certifications">
          {certifications.filter(c => c.course).map(cert => (
            <div key={cert.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <div>
                <span style={{ fontWeight: '600', fontSize: '10px' }}>{cert.course}</span>
                {cert.platform && <span style={{ color: '#666', fontSize: '9.5px' }}> — {cert.platform}</span>}
              </div>
              {cert.year && <span style={{ fontSize: '9.5px', color: '#666' }}>{cert.year}</span>}
            </div>
          ))}
        </Section>
      )}

      {/* Achievements */}
      {achievements && (
        <Section title="Achievements">
          <div style={{ color: '#444', fontSize: '9.5px', whiteSpace: 'pre-line' }}>{achievements}</div>
        </Section>
      )}
    </div>
  )
}
