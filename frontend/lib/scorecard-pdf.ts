/**
 * ScorQ Scorecard PDF Generator
 * Updated: No overall score, no soft skills, no AI model in footer
 */

export function downloadScorecard(result: any) {
  const candidate = result.candidates || {}
  const cats      = result.category_scores || {}

  const CATS = [
    { key: 'technical',  label: 'Technical Skills', icon: '💻', color: '#1B4F8A', bg: '#EFF6FF', border: '#BFDBFE' },
    { key: 'experience', label: 'Experience',        icon: '📅', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
    { key: 'education',  label: 'Education',         icon: '🎓', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
    { key: 'stability',  label: 'Stability',         icon: '📊', color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA' },
  ]

  const scoreColor = (score: number | null) =>
    score === null ? '#9CA3AF' : score >= 75 ? '#16A34A' : score >= 50 ? '#D97706' : '#DC2626'

  const techScore = cats.technical?.score ?? null
  const techColor = scoreColor(techScore)

  // Signal blocks for header
  const signalBlocks = CATS.map(cat => {
    const score = cats[cat.key]?.score ?? null
    const c = scoreColor(score)
    return `
      <div style="text-align:center;background:${cat.bg};border:1.5px solid ${cat.border};
        border-radius:12px;padding:10px 14px;min-width:70px">
        <div style="font-size:11px;font-weight:700;color:${cat.color};margin-bottom:4px">
          ${cat.label.split(' ')[0]}
        </div>
        <div style="font-size:18px;font-weight:900;color:${c}">
          ${score !== null ? score + '%' : '—'}
        </div>
        ${score !== null ? `
        <div style="margin-top:4px;background:rgba(0,0,0,0.08);border-radius:99px;height:3px">
          <div style="background:${c};width:${score}%;height:3px;border-radius:99px"></div>
        </div>` : ''}
      </div>`
  }).join('')

  // Score breakdown cards — 2x2 grid
  const scoreCards = CATS.map(cat => {
    const catData = cats[cat.key] || {}
    const score   = catData.score ?? null
    const c       = scoreColor(score)
    const certs   = catData.certifications || []

    return `
      <div style="background:${cat.bg};border:1px solid ${cat.border};border-radius:12px;padding:16px;flex:1;min-width:200px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:14px">${cat.icon}</span>
            <span style="font-size:13px;font-weight:700;color:#1F2937">${cat.label}</span>
          </div>
          <span style="font-size:14px;font-weight:900;color:${c}">
            ${score !== null ? score + '%' : '—'}
          </span>
        </div>
        ${score !== null ? `
        <div style="background:rgba(255,255,255,0.7);border-radius:99px;height:6px;margin-bottom:10px">
          <div style="background:${c};width:${score}%;height:6px;border-radius:99px"></div>
        </div>` : `<div style="height:6px;margin-bottom:10px"></div>`}
        <p style="font-size:11px;color:#4B5563;line-height:1.6;margin:0">
          ${catData.reasoning || (score === null ? 'Not scored for this role.' : '')}
        </p>
        ${certs.length > 0 ? `
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.6)">
          <p style="font-size:10px;font-weight:700;color:#7C3AED;margin-bottom:4px">CERTIFICATIONS</p>
          <div style="display:flex;flex-wrap:wrap;gap:4px">
            ${certs.map((c: string) => `
              <span style="font-size:10px;background:white;color:#7C3AED;border:1px solid #DDD6FE;
                padding:2px 8px;border-radius:99px">${c}</span>
            `).join('')}
          </div>
        </div>` : ''}
      </div>`
  }).join('')

  // Matched / missing skills
  const matchedSkills = (result.matched_skills || []).map((s: string) =>
    `<span style="background:#DCFCE7;color:#166534;border:1px solid #BBF7D0;
      padding:3px 10px;border-radius:99px;font-size:11px;font-weight:500;
      margin:2px;display:inline-block">${s}</span>`
  ).join('')

  const partialSkills = (result.partial_skills || []).map((s: string) =>
    `<span style="background:#FEF9C3;color:#854D0E;border:1px solid #FDE047;
      padding:3px 10px;border-radius:99px;font-size:11px;font-weight:500;
      margin:2px;display:inline-block">${s}</span>`
  ).join('')

  const missingSkills = (result.missing_skills || []).map((s: string) =>
    `<span style="background:#FEE2E2;color:#991B1B;border:1px solid #FCA5A5;
      padding:3px 10px;border-radius:99px;font-size:11px;font-weight:500;
      margin:2px;display:inline-block">${s}</span>`
  ).join('')

  const highlights = (result.highlights || []).map((h: string) =>
    `<li style="color:#374151;font-size:12px;margin-bottom:5px;line-height:1.5">▸ ${h}</li>`
  ).join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ScorQ — ${(candidate as any).name || 'Candidate'}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
           color:#1f2937; background:white; }
    @page { size:A4; margin:0; }
    @media print {
      body { print-color-adjust:exact; -webkit-print-color-adjust:exact; }
      .no-print { display:none !important; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div style="background:#1B4F8A;padding:18px 28px;display:flex;
    justify-content:space-between;align-items:center">
    <div>
      <div style="font-size:22px;font-weight:900;color:white;letter-spacing:-0.5px">
        Scor<span style="color:#93C5FD">Q</span>
        <span style="color:rgba(255,255,255,0.4);font-size:11px;
          font-weight:400;margin-left:8px">by HYROI Solutions</span>
      </div>
      <div style="color:rgba(255,255,255,0.5);font-size:11px;margin-top:2px">
        AI-powered resume scoring
      </div>
    </div>
    <div style="text-align:right">
      <div style="color:rgba(255,255,255,0.5);font-size:10px;
        text-transform:uppercase;letter-spacing:0.05em">Candidate Scorecard</div>
      <div style="color:white;font-size:11px;margin-top:2px">
        ${new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
      </div>
    </div>
  </div>

  <!-- Candidate + Signal blocks -->
  <div style="padding:20px 28px;background:#F8FAFC;border-bottom:1px solid #E2E8F0;
    display:flex;justify-content:space-between;align-items:center;gap:16px">
    <div>
      <div style="font-size:20px;font-weight:800;color:#111827">
        ${(candidate as any).name || 'Unknown Candidate'}
      </div>
      <div style="margin-top:5px;display:flex;gap:16px;flex-wrap:wrap">
        ${(candidate as any).email
          ? `<span style="color:#6B7280;font-size:12px">📧 ${(candidate as any).email}</span>` : ''}
        ${(candidate as any).phone
          ? `<span style="color:#6B7280;font-size:12px">📞 ${(candidate as any).phone}</span>` : ''}
      </div>
    </div>
    <!-- Signal blocks -->
    <div style="display:flex;gap:8px;flex-shrink:0">
      ${signalBlocks}
    </div>
  </div>

  <div style="padding:20px 28px">

    <!-- Score Breakdown — 2x2 grid -->
    <div style="margin-bottom:18px">
      <div style="font-size:10px;font-weight:700;color:#9CA3AF;
        text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px">
        Score Breakdown
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${scoreCards}
      </div>
    </div>

    <!-- Skills -->
    ${matchedSkills || partialSkills || missingSkills ? `
    <div style="display:grid;grid-template-columns:${
      [matchedSkills, partialSkills, missingSkills].filter(Boolean).length === 3
        ? '1fr 1fr 1fr' : '1fr 1fr'
    };gap:10px;margin-bottom:18px">
      ${matchedSkills ? `
      <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:12px">
        <div style="font-size:10px;font-weight:700;color:#16A34A;
          text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">
          Matched Skills
        </div>
        <div>${matchedSkills}</div>
      </div>` : ''}
      ${partialSkills ? `
      <div style="background:#FEFCE8;border:1px solid #FDE047;border-radius:10px;padding:12px">
        <div style="font-size:10px;font-weight:700;color:#CA8A04;
          text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">
          Partial Match
        </div>
        <div>${partialSkills}</div>
      </div>` : ''}
      ${missingSkills ? `
      <div style="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:10px;padding:12px">
        <div style="font-size:10px;font-weight:700;color:#DC2626;
          text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">
          Missing Skills
        </div>
        <div>${missingSkills}</div>
      </div>` : ''}
    </div>` : ''}

    <!-- Highlights -->
    ${highlights ? `
    <div style="background:white;border:1px solid #E5E7EB;
      border-radius:10px;padding:14px;margin-bottom:18px">
      <div style="font-size:10px;font-weight:700;color:#374151;
        text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">
        Highlights
      </div>
      <ul style="list-style:none">${highlights}</ul>
    </div>` : ''}

    <!-- AI Assessment -->
    ${result.ai_reasoning ? `
    <div style="background:linear-gradient(135deg,#EFF6FF 0%,#F5F3FF 100%);
      border:1px solid #BFDBFE;border-radius:10px;padding:14px;margin-bottom:18px">
      <div style="font-size:10px;font-weight:700;color:#1D4ED8;
        text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">
        AI Assessment
      </div>
      <p style="font-size:12px;color:#1E40AF;line-height:1.6">${result.ai_reasoning}</p>
    </div>` : ''}

    <!-- Footer -->
    <div style="border-top:1px solid #E5E7EB;padding-top:10px;
      display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:10px;color:#9CA3AF">
        Generated by ScorQ · HYROI Solutions
      </span>
      <span style="font-size:10px;color:#9CA3AF">
        ${new Date().toLocaleDateString('en-IN')}
      </span>
    </div>
  </div>

  <!-- Print button -->
  <div class="no-print" style="position:fixed;bottom:20px;right:20px">
    <button onclick="window.print()"
      style="background:#1B4F8A;color:white;border:none;padding:10px 20px;
        border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;
        box-shadow:0 4px 12px rgba(27,79,138,0.3)">
      Save as PDF
    </button>
  </div>

</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url  = URL.createObjectURL(blob)
  const win  = window.open(url, '_blank')
  if (win) {
    win.onload = () => setTimeout(() => {
      win.print()
      URL.revokeObjectURL(url)
    }, 600)
  }
}
