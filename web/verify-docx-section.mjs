import { DOMParser } from '@xmldom/xmldom'

// Simulate parseDocumentXml for a docx with section headers + numbered list items
// In Word, "1. teks" as auto-numbering → <w:numPr> so the "1." is NOT in <w:t>.
// Manual "1. teks" → "1." IS in <w:t>.
const xml = `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>--- pertanyaan</w:t></w:r></w:p>
    <w:p><w:r><w:t>Perhatikan pernyataan:</w:t></w:r></w:p>
    <!-- AUTO-NUMBERED item: numPr, no "1." in text -->
    <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Soekarno presiden pertama</w:t></w:r></w:p>
    <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Hatta wakil presiden</w:t></w:r></w:p>
    <w:p><w:r><w:t>Manakah yang benar?</w:t></w:r></w:p>
    <w:p><w:r><w:t>--- jawaban</w:t></w:r></w:p>
    <w:p><w:r><w:t>a. 1 dan 2</w:t></w:r></w:p>
    <w:p><w:r><w:t>b. 1 saja</w:t></w:r></w:p>
    <w:p><w:r><w:t>c. 2 saja</w:t></w:r></w:p>
    <w:p><w:r><w:t>--- kunci</w:t></w:r></w:p>
    <w:p><w:r><w:t>b</w:t></w:r></w:p>
  </w:body>
</w:document>`

const doc = new DOMParser().parseFromString(xml, 'application/xml')
function children(el) { return Array.from(el.childNodes).filter(n => n.nodeType === 1) }
function descendants(el, localName) {
  const out = []; const walk = n => { for (const c of n.childNodes) { if (c.nodeType !== 1) continue; if (c.localName === localName) out.push(c); walk(c) } }; walk(el); return out
}
function isWordElement(el) { return el.tagName.startsWith('w:') || el.tagName === 'w:t' || !el.tagName.includes(':') }
function collectText(el) { return descendants(el, 't').filter(t => isWordElement(t)).map(t => t.textContent || '').join('') }
function isMathNode(el) { return el.localName === 'oMath' || el.localName === 'oMathPara' }
function isSectionHeader(text) {
  const m = text.match(/^---\s*([a-zA-Z]+)\s*$/)
  if (!m) return null
  const n = m[1].toLowerCase()
  return ['pertanyaan','jawaban','kunci','pembahasan'].includes(n) ? n : null
}

// parseDocumentXml
const paragraphs = descendants(doc.documentElement, 'p')
const parsed = paragraphs.map(p => {
  let text = '', html = ''
  for (const child of children(p)) {
    if (child.localName === 'r') { const t = collectText(child); if (t) { text += t; html += t } }
    else if (child.localName === 'pPr') { /* structural */ }
    else if (isMathNode(child)) { /* skip */ }
  }
  const cleanText = text.trim()
  return cleanText ? { text: cleanText, html: `<p>${html.trim()}</p>` } : null
}).filter(Boolean)

console.log('Parsed paragraphs:')
parsed.forEach((p, i) => console.log(`  [${i}] "${p.text}"`))

// buildQuestionsSection
let current = null, section = null, buffer = []
const questions = []
const optionPattern = /^[a-e][.)]\s*(.*)$/i
const keyPattern = /(?:kunci\s*[:=]\s*)?([A-Ea-e])/i
const flushQ = () => { if (current) { questions.push(current); current = null } }
const flushS = () => {
  if (!current || section === null) return
  const joined = buffer.filter(p => p.text.trim() !== '').map(p => p.html || `<p>${p.text}</p>`).join('')
  if (section === 'pertanyaan') current.question = joined
  else if (section === 'pembahasan') current.explanation = joined
  buffer.length = 0
}
for (const para of parsed) {
  const text = para.text.trim()
  const header = isSectionHeader(text)
  if (header) {
    flushS(); section = header
    if (header === 'pertanyaan') { flushQ(); current = { question: '', options: [], correctIndex: 0, explanation: '' } }
    continue
  }
  if (!current || section === null) continue
  if (section === 'jawaban') {
    const m = text.match(optionPattern)
    if (m) current.options.push(`<p>${m[1]}</p>`)
  } else if (section === 'kunci') {
    const km = text.match(keyPattern)
    if (km) { const idx = km[1].toUpperCase().charCodeAt(0) - 65; if (idx >= 0 && idx < current.options.length) current.correctIndex = idx }
  } else { buffer.push(para) }
}
flushS(); flushQ()

console.log('\nResult:')
questions.forEach((q, i) => {
  console.log(`Q${i+1} question="${q.question}"`)
  console.log(`  options=${JSON.stringify(q.options)} correct=${q.correctIndex}`)
})
