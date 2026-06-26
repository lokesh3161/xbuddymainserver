// Creative Modern Template — two-column sidebar layout

function SideSection({ title, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        fontSize: '9px', fontWeight: '800', letterSpacing: '2px',
        textTransform: 'uppercase', color: '#fff', background: '#5b21b6',
        padding: '3px 8px', borderRadius: '3px', marginBottom: '8px', display: 'inline-block',
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function MainSection({ title, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px',
        textTransform: 'uppercase', color: '#5b21b6',
        borderLeft: '3px solid #5b21b6', paddingLeft: '8px',
        marginBottom: '8px',
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

export default function CreativeTemplate({ data, fontScale = 1 }) {
  const f = (n) => `${n * fontScale}px`
  const { personal, education, skills, projects, experience, certifications, achievements } = data
  const edu = education[0] || {}

  const skillList = (str) => str.split(',').map(s => s.trim()).filter(Boolean)

  return (
    <div style={{
      fontFamily: "'Arial', sans-serif", fontSize: f(10), color: '#1a1a2e',
      background: '#fff', minHeight: '297mm', width: '210mm',
      boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
    }}>
      {/* Top header bar */}
      <div style={{ background: '#4c1d95', padding: '20px 24px', color: '#fff' }}>
        <div style={{ fontSize: f(24), fontWeight: '800', letterSpacing: '-0.5px' }}>
          {personal.name || 'Your Name'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '6px', fontSize: '9px', opacity: 0.85 }}>
          {personal.phone    && <span>📞 {personal.phone}</span>}
          {personal.email    && <span>✉ {personal.email}</span>}
          {personal.location && <span>📍 {personal.location}</span>}
          {personal.linkedin && <span>in {personal.linkedin}</span>}
          {personal.github   && <span>⌥ {personal.github}</span>}
          {personal.portfolio && <span>🌐 {personal.portfolio}</span>}
        </div>
      </div>

      {/* Two-column body */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Left sidebar */}
        <div style={{ width: '38%', background: '#f5f3ff', padding: '18px 14px', borderRight: '1px solid #e9d5ff' }}>

          {/* Education */}
          {(edu.college || edu.degree) && (
            <SideSection title="Education">
              <div style={{ fontWeight: '700', fontSize: '10px' }}>{edu.college}</div>
              <div style={{ color: '#555', fontSize: '9.5px' }}>{edu.degree}</div>
              {edu.department && <div style={{ color: '#666', fontSize: '9px' }}>{edu.department}</div>}
              {edu.cgpa && <div style={{ color: '#5b21b6', fontWeight: '700', fontSize: '9.5px', marginTop: '2px' }}>CGPA: {edu.cgpa}</div>}
              {edu.year && <div style={{ color: '#666', fontSize: '9px' }}>{edu.year}</div>}
              {edu.intermediate && <div style={{ color: '#666', fontSize: '9px', marginTop: '4px' }}>Inter: {edu.intermediate}</div>}
              {edu.schooling    && <div style={{ color: '#666', fontSize: '9px' }}>School: {edu.schooling}</div>}
            </SideSection>
          )}

          {/* Skills */}
          {skills.languages && (
            <SideSection title="Languages">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {skillList(skills.languages).map((s, i) => (
                  <span key={i} style={{ background: '#ede9fe', color: '#5b21b6', borderRadius: '3px', padding: '2px 6px', fontSize: '8.5px', fontWeight: '600' }}>{s}</span>
                ))}
              </div>
            </SideSection>
          )}

          {skills.frameworks && (
            <SideSection title="Frameworks">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {skillList(skills.frameworks).map((s, i) => (
                  <span key={i} style={{ background: '#ede9fe', color: '#5b21b6', borderRadius: '3px', padding: '2px 6px', fontSize: '8.5px', fontWeight: '600' }}>{s}</span>
                ))}
              </div>
            </SideSection>
          )}

          {skills.tools && (
            <SideSection title="Tools">
              <div style={{ color: '#444', fontSize: '9.5px' }}>{skills.tools}</div>
            </SideSection>
          )}

          {skills.soft && (
            <SideSection title="Soft Skills">
              <div style={{ color: '#444', fontSize: '9.5px' }}>{skills.soft}</div>
            </SideSection>
          )}

          {/* Certifications */}
          {certifications.some(c => c.course) && (
            <SideSection title="Certifications">
              {certifications.filter(c => c.course).map(cert => (
                <div key={cert.id} style={{ marginBottom: '6px' }}>
                  <div style={{ fontWeight: '600', fontSize: '9.5px' }}>{cert.course}</div>
                  <div style={{ color: '#666', fontSize: '9px' }}>{cert.platform}{cert.year ? ` · ${cert.year}` : ''}</div>
                </div>
              ))}
            </SideSection>
          )}
        </div>

        {/* Right main */}
        <div style={{ flex: 1, padding: '18px 18px' }}>

          {/* Experience */}
          {experience.some(e => e.role || e.company) && (
            <MainSection title="Experience">
              {experience.filter(e => e.role || e.company).map(exp => (
                <div key={exp.id} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: '700', fontSize: '10.5px' }}>{exp.role}</div>
                    <div style={{ fontSize: '9px', color: '#666' }}>{exp.duration}</div>
                  </div>
                  <div style={{ color: '#5b21b6', fontSize: '9.5px', fontWeight: '600' }}>{exp.company}</div>
                  {exp.description && <div style={{ color: '#444', fontSize: '9.5px', marginTop: '3px' }}>{exp.description}</div>}
                </div>
              ))}
            </MainSection>
          )}

          {/* Projects */}
          {projects.some(p => p.title) && (
            <MainSection title="Projects">
              {projects.filter(p => p.title).map(proj => (
                <div key={proj.id} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontWeight: '700', fontSize: '10.5px' }}>{proj.title}</div>
                    {proj.link && <div style={{ fontSize: '8.5px', color: '#5b21b6' }}>{proj.link}</div>}
                  </div>
                  {proj.description && <div style={{ color: '#444', fontSize: '9.5px', marginTop: '2px' }}>{proj.description}</div>}
                  {proj.tech && (
                    <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                      {proj.tech.split(',').map(t => t.trim()).filter(Boolean).map((t, i) => (
                        <span key={i} style={{ background: '#f3f0ff', color: '#6d28d9', borderRadius: '3px', padding: '1px 6px', fontSize: '8px', fontWeight: '600' }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </MainSection>
          )}

          {/* Achievements */}
          {achievements && (
            <MainSection title="Achievements">
              <div style={{ color: '#444', fontSize: '9.5px', whiteSpace: 'pre-line' }}>{achievements}</div>
            </MainSection>
          )}
        </div>
      </div>
    </div>
  )
}
