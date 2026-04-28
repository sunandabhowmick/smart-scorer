/**
 * Captures scorecard as image.
 * Uses iframe + safe CSS overrides to avoid Tailwind v4 lab() color issues.
 */

export async function captureScorecard(
  element: HTMLElement,
  candidateName: string
): Promise<void> {
  const html2canvas = (await import('html2canvas')).default

  // Create offscreen iframe
  const iframe = document.createElement('iframe')
  iframe.style.cssText =
    'position:fixed;top:-9999px;left:-9999px;border:none;z-index:-1;background:#fff;'
  iframe.width = String(element.offsetWidth || 700)
  iframe.height = '2000'
  document.body.appendChild(iframe)

  const iDoc = iframe.contentDocument!
  iDoc.open()
  iDoc.write(getHTML(element))
  iDoc.close()

  await new Promise(r => setTimeout(r, 500))

  try {
    const canvas = await html2canvas(iDoc.body, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
      foreignObjectRendering: false,
    })

    await saveCanvas(canvas, candidateName)
  } finally {
    document.body.removeChild(iframe)
  }
}

async function saveCanvas(canvas: HTMLCanvasElement, name: string) {
  return new Promise<void>(resolve => {
    canvas.toBlob(async blob => {
      if (!blob) { resolve(); return }
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ])
      } catch {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `scorecard_${name.replace(/\s+/g, '_')}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
      resolve()
    }, 'image/png')
  })
}

function getHTML(element: HTMLElement): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }
  body { background: #ffffff; padding: 16px; }

  /* Reset ALL colors to safe values — override Tailwind v4 lab() */
  [class*="bg-white"]     { background-color: #ffffff !important; }
  [class*="bg-gray-50"]   { background-color: #f9fafb !important; }
  [class*="bg-gray-100"]  { background-color: #f3f4f6 !important; }
  [class*="bg-blue-50"]   { background-color: #eff6ff !important; }
  [class*="bg-blue-100"]  { background-color: #dbeafe !important; }
  [class*="bg-green-50"]  { background-color: #f0fdf4 !important; }
  [class*="bg-green-100"] { background-color: #dcfce7 !important; }
  [class*="bg-red-50"]    { background-color: #fef2f2 !important; }
  [class*="bg-red-100"]   { background-color: #fee2e2 !important; }
  [class*="bg-yellow-50"] { background-color: #fefce8 !important; }
  [class*="bg-yellow-100"]{ background-color: #fef9c3 !important; }

  [class*="text-gray-900"]{ color: #111827 !important; }
  [class*="text-gray-800"]{ color: #1f2937 !important; }
  [class*="text-gray-700"]{ color: #374151 !important; }
  [class*="text-gray-600"]{ color: #4b5563 !important; }
  [class*="text-gray-500"]{ color: #6b7280 !important; }
  [class*="text-gray-400"]{ color: #9ca3af !important; }
  [class*="text-blue-700"]{ color: #1d4ed8 !important; }
  [class*="text-blue-900"]{ color: #1e3a5f !important; }
  [class*="text-green-600"]{ color: #16a34a !important; }
  [class*="text-green-700"]{ color: #15803d !important; }
  [class*="text-green-800"]{ color: #166534 !important; }
  [class*="text-red-600"] { color: #dc2626 !important; }
  [class*="text-red-700"] { color: #b91c1c !important; }
  [class*="text-red-800"] { color: #991b1b !important; }
  [class*="text-yellow-600"]{ color: #ca8a04 !important; }
  [class*="text-yellow-700"]{ color: #a16207 !important; }
  [class*="text-yellow-800"]{ color: #854d0e !important; }

  [class*="border-gray-100"]{ border-color: #f3f4f6 !important; }
  [class*="border-gray-200"]{ border-color: #e5e7eb !important; }
  [class*="border-blue-100"]{ border-color: #dbeafe !important; }
  [class*="border-green-100"]{ border-color: #dcfce7 !important; }
  [class*="border-red-100"]{ border-color: #fee2e2 !important; }

  /* Progress bars */
  [class*="bg-green-500"]  { background-color: #22c55e !important; }
  [class*="bg-yellow-400"] { background-color: #facc15 !important; }
  [class*="bg-red-400"]    { background-color: #f87171 !important; }

  /* Rounded corners */
  [class*="rounded-xl"]   { border-radius: 12px !important; }
  [class*="rounded-full"] { border-radius: 9999px !important; }
  [class*="rounded-lg"]   { border-radius: 8px !important; }

  /* Font weights */
  [class*="font-bold"]    { font-weight: 700 !important; }
  [class*="font-semibold"]{ font-weight: 600 !important; }
  [class*="font-medium"]  { font-weight: 500 !important; }

  /* Spacing helpers */
  [class*="p-4"]  { padding: 16px !important; }
  [class*="p-3"]  { padding: 12px !important; }
  [class*="px-2"] { padding-left: 8px !important; padding-right: 8px !important; }
  [class*="py-1"] { padding-top: 4px !important; padding-bottom: 4px !important; }
  [class*="mb-2"] { margin-bottom: 8px !important; }
  [class*="mb-3"] { margin-bottom: 12px !important; }
  [class*="gap-1"]{ gap: 4px !important; }
  [class*="gap-2"]{ gap: 8px !important; }
  [class*="gap-3"]{ gap: 12px !important; }

  /* Layout */
  [class*="grid"]         { display: grid !important; }
  [class*="flex"]         { display: flex !important; }
  [class*="flex-wrap"]    { flex-wrap: wrap !important; }
  [class*="items-center"] { align-items: center !important; }
  [class*="justify-between"]{ justify-content: space-between !important; }
  [class*="space-y-1"] > * + * { margin-top: 4px !important; }
  [class*="space-y-5"] > * + * { margin-top: 20px !important; }
  [class*="grid-cols-2"]  { grid-template-columns: 1fr 1fr !important; }
  [class*="grid-cols-1"]  { grid-template-columns: 1fr !important; }
  [class*="w-full"]       { width: 100% !important; }
  [class*="overflow-hidden"]{ overflow: hidden !important; }

  /* Text sizes */
  [class*="text-xs"]  { font-size: 12px !important; line-height: 1.4 !important; }
  [class*="text-sm"]  { font-size: 14px !important; line-height: 1.5 !important; }
  [class*="text-base"]{ font-size: 16px !important; }
  [class*="text-lg"]  { font-size: 18px !important; }

  /* Border */
  [class*="border"]   { border: 1px solid #e5e7eb !important; }
  [class*="border-2"] { border: 2px solid #e5e7eb !important; }

  /* Leading */
  [class*="leading-relaxed"]{ line-height: 1.625 !important; }

  /* Tracking */
  [class*="tracking-wider"]{ letter-spacing: 0.05em !important; }
  [class*="uppercase"]    { text-transform: uppercase !important; }

  /* Height for progress bars */
  [class*="h-2"] { height: 8px !important; }
  [class*="h-1"] { height: 4px !important; }
</style>
</head>
<body>${element.outerHTML}</body>
</html>`
}
