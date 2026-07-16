// Minimal ATS Template — clean, no colors, maximum ATS compatibility

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        fontSize: '10px', fontWeight: '700', letterSpacing: '2px',
        textTransform: 'uppercase', color: '#111',
        borderBottom: '1px solid #111', paddingBottom: '2px', marginBottom: '8px',
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

export default function MinimalTemplate({ data, fontScale = 1 }) {
  const f = (n) => `${n * fontScale}px`
  const { personal, education, skills, projects, experience, certifications, achievements } = data
  const edu = education[0] || {}

  return (
    <div style={{
      fontFamily: "'Arial', sans-serif", fontSize: f(10.5), color: '#111',
      lineHeight: '1.55', padding: '25mm 20mm', background: '#fff',
      minHeight: '297mm', width: '210mm', boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '16px', borderBottom: '1px solid #111', paddingBottom: '12px' }}>
        <div style={{ fontSize: f(22), fontWeight: '800', letterSpacing: '1px' }}>
          {personal.name || 'YOUR NAME'}
        </div>
        <div style={{ fontSize: '9px', color: '#333', marginTop: '5px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px' }}>
          {personal.phone    && <span>{personal.phone}</span>}
          {personal.email    && <span>{personal.email}</span>}
          {personal.location && <span>{personal.location}</span>}
          {personal.linkedin && <span>{personal.linkedin}</span>}
          {personal.github   && <span>{personal.github}</span>}
        </div>
      </div>

      {/* Education */}
      {(edu.college || edu.degree) && (
        <Section title="Education">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: '700' }}>{edu.college}</div>
              <div style={{ color: '#333', fontSize: '10px' }}>{edu.degree}{edu.department ? `, ${edu.department}` : ''}</div>
              {edu.intermediate && <div style={{ fontSize: '9.5px', color: '#555' }}>Intermediate: {edu.intermediate}</div>}
              {edu.schooling    && <div style={{ fontSize: '9.5px', color: '#555' }}>Schooling: {edu.schooling}</div>}
            </div>
            <div style={{ textAlign: 'right', fontSize: '9.5px' }}>
              {edu.year && <div>{edu.year}</div>}
              {edu.cgpa && <div><strong>CGPA: {edu.cgpa}</strong></div>}
            </div>
          </div>
        </Section>
      )}

      {/* Skills */}
      {(skills.languages || skills.frameworks || skills.tools) && (
        <Section title="Skills">
          {skills.languages  && <div style={{ marginBottom: '3px' }}><strong>Languages:</strong> {skills.languages}</div>}
          {skills.frameworks && <div style={{ marginBottom: '3px' }}><strong>Frameworks:</strong> {skills.frameworks}</div>}
          {skills.tools      && <div style={{ marginBottom: '3px' }}><strong>Tools:</strong> {skills.tools}</div>}
          {skills.soft       && <div><strong>Soft Skills:</strong> {skills.soft}</div>}
        </Section>
      )}

      {/* Experience */}
      {experience.some(e => e.role || e.company) && (
        <Section title="Experience">
          {experience.filter(e => e.role || e.company).map(exp => (
            <div key={exp.id} style={{ marginBottom: '9px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{exp.role}{exp.company ? ` | ${exp.company}` : ''}</strong>
                <span style={{ fontSize: '9.5px' }}>{exp.duration}</span>
              </div>
              {exp.description && <div style={{ color: '#333', fontSize: '9.5px', marginTop: '2px' }}>{exp.description}</div>}
            </div>
          ))}
        </Section>
      )}

      {/* Projects */}
      {projects.some(p => p.title) && (
        <Section title="Projects">
          {projects.filter(p => p.title).map(proj => (
            <div key={proj.id} style={{ marginBottom: '9px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{proj.title}</strong>
                {proj.link && <span style={{ fontSize: '9px' }}>{proj.link}</span>}
              </div>
              {proj.description && <div style={{ color: '#333', fontSize: '9.5px', marginTop: '2px' }}>{proj.description}</div>}
              {proj.tech && <div style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>Tech: {proj.tech}</div>}
            </div>
          ))}
        </Section>
      )}

      {/* Certifications */}
      {certifications.some(c => c.course) && (
        <Section title="Certifications">
          {certifications.filter(c => c.course).map(cert => (
            <div key={cert.id} style={{ marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
              <span><strong>{cert.course}</strong>{cert.platform ? ` — ${cert.platform}` : ''}</span>
              {cert.year && <span style={{ fontSize: '9.5px' }}>{cert.year}</span>}
            </div>
          ))}
        </Section>
      )}

      {/* Achievements */}
      {achievements && (
        <Section title="Achievements">
          <div style={{ color: '#333', fontSize: '9.5px', whiteSpace: 'pre-line' }}>{achievements}</div>
        </Section>
      )}
    </div>
  )
}
