/**
 * Generates a clean one-page scorecard PDF
 */

export function downloadScorecard(result: any) {
  const candidate = result.candidates || {}
  const cats = result.category_scores || {}
  const scoreColor = result.overall_score >= 75 ? '#16a34a'
    : result.overall_score >= 50 ? '#d97706' : '#dc2626'

  const catRows = Object.entries(cats).map(([key, cat]: [string, any]) => {
    const labels: Record<string, string> = {
      technical:  'Technical Skills',
      experience: 'Experience',
      education:  'Education',
      soft_skills:'Soft Skills',
      stability:  'Stability',
    }
    const color = cat.score >= 75 ? '#16a34a' : cat.score >= 50 ? '#d97706' : '#dc2626'
    return `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;font-weight:600;color:#374151;font-size:13px">
          ${labels[key] || key}
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;text-align:center">
          <span style="color:${color};font-weight:800;font-size:16px">${cat.score}%</span>
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;width:200px">
          <div style="background:#f3f4f6;border-radius:99px;height:8px">
            <div style="background:${color};width:${cat.score}%;height:8px;border-radius:99px"></div>
          </div>
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#6b7280;max-width:220px;line-height:1.5">
          ${cat.reasoning || ''}
        </td>
      </tr>`
  }).join('')

  const matchedSkills = (result.matched_skills || []).map((s: string) =>
    `<span style="background:#dcfce7;color:#166534;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:500;margin:2px;display:inline-block">${s}</span>`
  ).join('')

  const highlights = (result.highlights || []).map((h: string) =>
    `<li style="color:#374151;font-size:12px;margin-bottom:5px;line-height:1.5">• ${h}</li>`
  ).join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ScorQ — ${candidate.name || 'Candidate'}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:#1f2937; background:white; }
    @page { size:A4; margin:0; }
    @media print {
      body { print-color-adjust:exact; -webkit-print-color-adjust:exact; }
      .no-print { display:none !important; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div style="background:#1B4F8A;padding:20px 32px;display:flex;justify-content:space-between;align-items:center">
    <div>
      <div style="font-size:20px;font-weight:900;color:white;letter-spacing:-0.5px">
        Scor<span style="color:#60A5FA">Q</span>
        <span style="color:rgba(255,255,255,0.4);font-size:12px;font-weight:400;margin-left:8px">by HYROI Solutions</span>
      </div>
      <div style="color:rgba(255,255,255,0.5);font-size:11px;margin-top:2px">AI-powered resume scoring</div>
    </div>
    <div style="text-align:right">
      <div style="color:rgba(255,255,255,0.5);font-size:10px;text-transform:uppercase;letter-spacing:0.05em">Candidate Scorecard</div>
      <div style="color:white;font-size:11px;margin-top:2px">${new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</div>
    </div>
  </div>

  <!-- Candidate -->
  <div style="padding:20px 32px;background:#f8fafc;border-bottom:2px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center">
    <div>
      <div style="font-size:20px;font-weight:800;color:#111827">${candidate.name || 'Unknown'}</div>
      <div style="margin-top:5px;display:flex;gap:18px">
        ${candidate.email ? `<span style="color:#6b7280;font-size:12px">📧 ${candidate.email}</span>` : ''}
        ${candidate.phone ? `<span style="color:#6b7280;font-size:12px">📞 ${candidate.phone}</span>` : ''}
      </div>
    </div>
    <div style="text-align:center">
      <div style="width:72px;height:72px;border-radius:50%;border:4px solid ${scoreColor};display:flex;flex-direction:column;align-items:center;justify-content:center;background:white">
        <span style="font-size:22px;font-weight:900;color:${scoreColor};line-height:1">${result.overall_score}</span>
        <span style="font-size:10px;color:${scoreColor}">/ 100</span>
      </div>
      <div style="margin-top:5px;font-size:10px;color:#6b7280;font-weight:600">OVERALL SCORE</div>
    </div>
  </div>

  <div style="padding:20px 32px">

    <!-- Score Breakdown -->
    <div style="margin-bottom:20px">
      <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px">Score Breakdown</div>
      <table style="width:100%;border-collapse:collapse;background:white;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">
        <thead>
          <tr style="background:#eff6ff">
            <th style="padding:9px 14px;text-align:left;font-size:11px;color:#6b7280;font-weight:600">Category</th>
            <th style="padding:9px 14px;text-align:center;font-size:11px;color:#6b7280;font-weight:600">Score</th>
            <th style="padding:9px 14px;font-size:11px;color:#6b7280;font-weight:600">Progress</th>
            <th style="padding:9px 14px;text-align:left;font-size:11px;color:#6b7280;font-weight:600">AI Reasoning</th>
          </tr>
        </thead>
        <tbody>${catRows}</tbody>
      </table>
    </div>

    <!-- Matched Skills + Highlights side by side -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
      ${matchedSkills ? `
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px">
        <div style="font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">✅ Matched Skills</div>
        <div>${matchedSkills}</div>
      </div>` : ''}
      ${highlights ? `
      <div style="background:white;border:1px solid #e5e7eb;border-radius:10px;padding:14px">
        <div style="font-size:11px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">⭐ Highlights</div>
        <ul style="list-style:none">${highlights}</ul>
      </div>` : ''}
    </div>

    <!-- AI Assessment -->
    ${result.ai_reasoning ? `
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px;margin-bottom:20px">
      <div style="font-size:11px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">💡 AI Assessment</div>
      <p style="font-size:12px;color:#1e40af;line-height:1.6">${result.ai_reasoning}</p>
    </div>` : ''}

    <!-- Footer -->
    <div style="border-top:1px solid #e5e7eb;padding-top:12px;display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:10px;color:#9ca3af">Generated by ScorQ · HYROI Solutions</span>
      <span style="font-size:10px;color:#9ca3af">AI Model: ${result.model_used || 'AI'}</span>
    </div>
  </div>

  <!-- Print button -->
  <div class="no-print" style="position:fixed;bottom:20px;right:20px">
    <button onclick="window.print()"
      style="background:#1B4F8A;color:white;border:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(27,79,138,0.3)">
      🖨️ Save as PDF
    </button>
  </div>

</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (win) {
    win.onload = () => setTimeout(() => { win.print(); URL.revokeObjectURL(url) }, 600)
  }
}
