import JSZip from "jszip"

// ============================================================
// Parser .docx → soal bank soal
// Baca word/document.xml, konversi OMML math → LaTeX, lalu
// deteksi struktur soal (nomor, opsi A/B/C/D, kunci, pembahasan).
//
// Navigasi XML memakai `localName` (bukan CSS selector ber-namespace)
// agar konsisten di semua browser (XMLDocument).
// ============================================================

export interface ParsedParagraph {
  /** Teks biasa (tanpa math) untuk deteksi struktur */
  text: string
  /** HTML (dengan math LaTeX embedded) untuk disimpan ke DB */
  html: string
}

export interface ImportQuestion {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

// ---------- helpers navigasi XML (localName-based) ----------

/** Elemen anak langsung */
function children(el: Element): Element[] {
  return Array.from(el.children)
}

/** Semua turunan (descendant) dengan localName tertentu */
function descendants(el: Element, localName: string): Element[] {
  const out: Element[] = []
  const walk = (node: Element) => {
    for (const child of Array.from(node.children)) {
      if (child.localName === localName) out.push(child)
      walk(child)
    }
  }
  walk(el)
  return out
}

/** Turunan pertama dengan localName tertentu (atau null) */
function firstDescendant(el: Element, localName: string): Element | null {
  return descendants(el, localName)[0] ?? null
}

/** Kumpulkan text dari semua <w:t> (Word text) di dalam elemen.
 *  Jangan ambil <m:t> (math text) — itu bagian dari rumus, bukan teks biasa.
 */
function collectText(el: Element): string {
  return descendants(el, "t")
    .filter((t) => isWordElement(t))
    .map((t) => t.textContent ?? "")
    .join("")
}

/** Cek apakah element ber-namespace Word (prefix w: atau tagName berawalan w:) */
function isWordElement(el: Element): boolean {
  const tag = el.tagName
  return tag.startsWith("w:") || tag === "w:t" || !tag.includes(":")
}

/** Cek apakah element ber-namespace Math (prefix m:) */
function isMathElement(el: Element): boolean {
  const tag = el.tagName
  return tag.startsWith("m:")
}

/** Kumpulkan text dari <m:t> (math text) — untuk konversi OMML→LaTeX */
function collectMathText(el: Element): string {
  return descendants(el, "t")
    .filter((t) => isMathElement(t))
    .map((t) => t.textContent ?? "")
    .join("")
}

/** Cek apakah run memiliki format tertentu di <w:rPr> (bold/italic/underline). */
function runHasFormat(run: Element, fmt: "b" | "i" | "u"): boolean {
  const rPr = Array.from(run.children).find((c) => c.localName === "rPr")
  if (!rPr) return false
  return Array.from(rPr.children).some((c) => c.localName === fmt)
}

/**
 * Buat HTML untuk sebuah run (<w:r>), termasuk formatting dasar dari <w:rPr>.
 * - <w:b/> → <strong>
 * - <w:i/> → <em>
 * - <w:u/> → <u>
 */
function collectRunHtml(run: Element): string {
  const text = collectText(run)
  if (!text) return ""

  const bold = runHasFormat(run, "b")
  const italic = runHasFormat(run, "i")
  const underline = runHasFormat(run, "u")

  let out: string = text
  if (bold) out = `<strong>${out}</strong>`
  if (italic) out = `<em>${out}</em>`
  if (underline) out = `<u>${out}</u>`
  return out
}

// Simbol-simbol umum yang sering muncul di Equation Editor Word (OMML).
// Key = karakter unicode yang ditulis Word di dalam <m:t>.
const SYMBOL_MAP: Record<string, string> = {
  "×": "\\times ",
  "÷": "\\div ",
  "±": "\\pm ",
  "−": "-",
  "–": "-",
  "≤": "\\leq ",
  "≥": "\\geq ",
  "<": "<",
  ">": ">",
  "≠": "\\neq ",
  "≈": "\\approx ",
  "∞": "\\infty ",
  "→": "\\to ",
  "←": "\\leftarrow ",
  "⇒": "\\Rightarrow ",
  "⇔": "\\Leftrightarrow ",
  "∈": "\\in ",
  "∉": "\\notin ",
  "⊂": "\\subset ",
  "⊆": "\\subseteq ",
  "∪": "\\cup ",
  "∩": "\\cap ",
  "∅": "\\emptyset ",
  "∀": "\\forall ",
  "∃": "\\exists ",
  "∑": "\\sum ",
  "∏": "\\prod ",
  "∫": "\\int ",
  "√": "\\sqrt{}",
  "π": "\\pi ",
  "α": "\\alpha ",
  "β": "\\beta ",
  "γ": "\\gamma ",
  "δ": "\\delta ",
  "θ": "\\theta ",
  "λ": "\\lambda ",
  "μ": "\\mu ",
  "σ": "\\sigma ",
  "φ": "\\phi ",
  "ω": "\\omega ",
  "Δ": "\\Delta ",
  "Ω": "\\Omega ",
  "°": "^{\\circ}",
  "′": "'",
  "″": "''",
  "…": "\\ldots ",
  "⋅": "\\cdot ",
  "∙": "\\cdot ",
}

function mapSymbols(s: string): string {
  let out = ""
  for (const ch of s) {
    out += SYMBOL_MAP[ch] ?? ch
  }
  return out
}

/**
 * Escape karakter khusus LaTeX pada teks literal (dari <m:t>).
 * Mencegah KaTeX gagal parse saat teks mengandung %, _, {, }, #, $, ^, ~, \.
 * (Simbol-simbol dari SYMBOL_MAP tetap utuh karena escaping dilakukan sebelum mapSymbols.)
 */
function escapeLatexText(s: string): string {
  return s
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([%#&_{}])/g, "\\$1")
    .replace(/\^/g, "\\^{}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\$/g, "\\$")
}

/** Konversi <m:oMath> / <m:oMathPara> menjadi string LaTeX */
export function ommlToLatex(omath: Element): string {
  let out = ""
  for (const child of children(omath)) {
    out += convertMathElement(child)
  }
  return out.trim()
}

function convertMathElement(el: Element): string {
  const tag = el.localName
  switch (tag) {
    case "oMath":
    case "oMathPara":
      return ommlToLatex(el)
    case "r": {
      // Math run: <m:r><m:t>text</m:t></m:r>
      return mapSymbols(escapeLatexText(collectMathText(el)))
    }
    case "f": {
      // Fraction: <m:f><m:num>..</m:num><m:den>..</m:den></m:f>
      const num = firstDescendant(el, "num")
      const den = firstDescendant(el, "den")
      if (num && den) {
        return `\\frac{${childrenToLatex(num)}}{${childrenToLatex(den)}}`
      }
      return ""
    }
    case "num":
    case "den":
      return childrenToLatex(el)
    case "sSup": {
      const base = firstDescendant(el, "e")
      const sup = firstDescendant(el, "sup")
      if (base && sup) return `${childrenToLatex(base)}^{${childrenToLatex(sup)}}`
      return ""
    }
    case "sSub": {
      const base = firstDescendant(el, "e")
      const sub = firstDescendant(el, "sub")
      if (base && sub) return `${childrenToLatex(base)}_{${childrenToLatex(sub)}}`
      return ""
    }
    case "sSubSup": {
      const base = firstDescendant(el, "e")
      const sub = firstDescendant(el, "sub")
      const sup = firstDescendant(el, "sup")
      if (base && sub && sup) return `${childrenToLatex(base)}_{${childrenToLatex(sub)}}^{${childrenToLatex(sup)}}`
      return ""
    }
    case "rad": {
      const deg = firstDescendant(el, "deg")
      const base = firstDescendant(el, "e")
      const degText = deg ? childrenToLatex(deg) : ""
      const baseText = base ? childrenToLatex(base) : ""
      if (deg && degText) return `\\sqrt[${degText}]{${baseText}}`
      return `\\sqrt{${baseText}}`
    }
    case "d": {
      const inner = firstDescendant(el, "e")
      return childrenToLatex(inner ?? el)
    }
    case "nary": {
      const sub = firstDescendant(el, "sub")
      const sup = firstDescendant(el, "sup")
      const e = firstDescendant(el, "e")
      const eText = e ? childrenToLatex(e) : ""
      const naryPr = firstDescendant(el, "naryPr")
      const chr = naryPr ? firstDescendant(naryPr, "chr") : null
      const op = (chr?.textContent ?? "∫").trim()
      const opLatex = op === "∑" || op === "Σ" ? "\\sum" : op === "∏" ? "\\prod" : "\\int"
      const subT = sub ? childrenToLatex(sub) : ""
      const supT = sup ? childrenToLatex(sup) : ""
      let out = opLatex
      if (subT) out += `_{${subT}}`
      if (supT) out += `^{${supT}}`
      return out + ` ${eText}`
    }
    case "func": {
      const fName = firstDescendant(el, "fName")
      const e = firstDescendant(el, "e")
      const name = fName ? childrenToLatex(fName) : ""
      return `${name} ${e ? childrenToLatex(e) : ""}`
    }
    case "acc": {
      const accPr = firstDescendant(el, "accPr")
      const chr = accPr ? firstDescendant(accPr, "chr") : null
      const e = firstDescendant(el, "e")
      const base = e ? childrenToLatex(e) : ""
      const accent = chr?.textContent?.trim()
      if (accent === "¯") return `\\bar{${base}}`
      if (accent === "→") return `\\vec{${base}}`
      if (accent === "˙") return `\\dot{${base}}`
      return base
    }
    case "bar": {
      const e = firstDescendant(el, "e")
      return `\\overline{${e ? childrenToLatex(e) : ""}}`
    }
    case "groupChr": {
      const e = firstDescendant(el, "e")
      return childrenToLatex(e ?? el)
    }
    case "e":
      return childrenToLatex(el)
    case "t":
      return mapSymbols(escapeLatexText(el.textContent ?? ""))
    // Prudential / metadata elements — skip
    case "dPr":
    case "rPr":
    case "naryPr":
    case "fPr":
    case "sSupPr":
    case "sSubPr":
    case "sSubSupPr":
    case "radPr":
    case "accPr":
    case "funcPr":
    case "mPr":
    case "ctrlPr":
    case "argPr":
    case "limLoc":
    case "grow":
    case "subHide":
    case "supHide":
      return ""
    default: {
      // Unknown element — fallback: extract any text so content is not lost
      const text = collectText(el)
      if (text) return mapSymbols(text)
      return childrenToLatex(el)
    }
  }
}

/** Recursively concatenate LaTeX of all math element children */
function childrenToLatex(el: Element): string {
  let out = ""
  for (const child of children(el)) {
    out += convertMathElement(child)
  }
  return out
}

/** Cek apakah element adalah node math */
function isMathNode(el: Element): boolean {
  const tag = el.localName
  return tag === "oMath" || tag === "oMathPara"
}

/**
 * Baca word/document.xml dari file .docx
 */
export async function unzipDocx(file: File): Promise<Document> {
  const zip = await JSZip.loadAsync(file)
  const xmlFile = zip.file("word/document.xml")
  if (!xmlFile) throw new Error("File .docx tidak valid: word/document.xml tidak ditemukan")
  const xmlStr = await xmlFile.async("string")
  return new DOMParser().parseFromString(xmlStr, "application/xml")
}

/**
 * Parse document.xml → array paragraf.
 * Setiap paragraf punya `text` (polos) dan `html` (dengan math LaTeX embedded).
 */
export function parseDocumentXml(doc: Document): ParsedParagraph[] {
  // Semua elemen <w:p> di seluruh dokumen (localName "p")
  const paragraphs = descendants(doc.documentElement, "p")
  const result: ParsedParagraph[] = []

  for (const p of paragraphs) {
    let text = ""
    let html = ""

    for (const child of children(p)) {
      const localName = child.localName

      if (localName === "r") {
        const runText = collectText(child)
        const runHtml = collectRunHtml(child)
        if (runText) {
          text += runText
          html += runHtml || runText
        }
      } else if (localName === "hyperlink" || localName === "sdt" || localName === "ins" || localName === "del") {
        const runText = collectText(child)
        if (runText) {
          text += runText
          html += runText
        }
      } else if (isMathNode(child)) {
        const latex = ommlToLatex(child)
        if (latex) {
          // Sinkronkan spasi text & html agar stripPrefix tidak merusak markup.
          // text pakai " $...$ ", html pakai " <span>...</span> " (sama-sama spasi di kedua sisi).
          text += ` $${latex}$ `
          html += ` <span data-type="inline-math" data-latex="${escapeHtml(latex)}">${escapeHtml(latex)}</span> `
        }
      } else if (localName === "pPr" || localName === "bookmarkStart" || localName === "bookmarkEnd") {
        // structural — ignore
      } else {
        // Fallback: text inside
        const runText = collectText(child)
        if (runText) {
          text += runText
          html += runText
        }
      }
    }

    const cleanText = text.trim()
    const cleanHtml = html.trim()
    if (cleanText) {
      result.push({
        text: cleanText,
        html: cleanHtml ? `<p>${cleanHtml}</p>` : "",
      })
    }
  }

  return result
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

/**
 * Build soal dari paragraf hasil parsing.
 * Struktur yang dikenali:
 *  - `1. teks` atau `1) teks` → soal baru
 *  - `A. teks` / `A) teks` / `A.` → opsi jawaban
 *  - `Pembahasan: teks` → explanation (merapat ke soal terakhir)
 *  - `Kunci: A` / `Jawaban: A` → correct_index (merapat ke soal terakhir)
 */
export function buildQuestions(paras: ParsedParagraph[]): ImportQuestion[] {
  const questions: ImportQuestion[] = []
  let current: ImportQuestion | null = null

  const optionPattern = /^([A-Ea-e])[.)]\s*(.*)$/
  const questionPattern = /^(\d+)[.)]\s*(.*)$/
  const keyPattern = /^(kunci|jawaban)\s*[:=]\s*([A-Ea-e])/i
  const explanationPattern = /^pembahasan\s*[:=]\s*(.*)$/i

  const flush = () => {
    if (current) {
      questions.push(current)
      current = null
    }
  }

  for (const para of paras) {
    const text = para.text.trim()

    const explanationMatch = text.match(explanationPattern)
    if (explanationMatch && current) {
      current.explanation = stripPrefix(para.html, "explanation")
      continue
    }

    const keyMatch = text.match(keyPattern)
    if (keyMatch && current) {
      const letter = keyMatch[2].toUpperCase()
      const idx = letter.charCodeAt(0) - 65 // A=0
      if (idx >= 0 && idx < current.options.length) {
        current.correctIndex = idx
      }
      continue
    }

    const qMatch = text.match(questionPattern)
    if (qMatch) {
      flush()
      current = {
        question: stripPrefix(para.html, "question"),
        options: [],
        correctIndex: 0,
        explanation: "",
      }
      continue
    }

    const oMatch = text.match(optionPattern)
    if (oMatch && current) {
      current.options.push(stripPrefix(para.html, "option"))
      continue
    }

    // Line continuation — append to current question (e.g. multi-line question)
    if (current && text) {
      if (current.options.length === 0) {
        current.question += para.html || `<p>${text}</p>`
      }
    }
  }

  flush()
  return questions
}

type StripKind = "question" | "option" | "explanation"

/**
 * Buat HTML untuk body (tanpa prefix nomor/huruf seperti "1.", "A.", "Pembahasan:").
 * Memakai regex berbasis jenis elemen agar aman — tidak mengandalkan kesejajaran
 * index antara text polos dan HTML (yang bisa berbeda karena math span).
 */
/**
 * Hapus prefix (nomor/huruf/pembahasan) dari awal konten <p> secara struktural.
 * Memakai DOMParser agar aman terhadap formatting yang membungkus prefix
 * (mis. <strong>1.</strong>) dan math span — tidak memotong tag HTML.
 */
function stripPrefix(html: string, kind: StripKind): string {
  const prefixRe =
    kind === "question"
      ? /^\d+[.)]\s*/
      : kind === "option"
        ? /^[A-Ea-e][.)]\s*/
        : /^pembahasan\s*[:=]\s*/i

  const doc = new DOMParser().parseFromString(html, "text/html")
  const p = doc.body.firstElementChild
  if (!p) return html

  // Telusuri text node pertama di dalam <p>, dan hapus prefix dari situ.
  // Jika text node masih punya sisa setelah prefix, sisanya jadi teks baru
  // di depan; jika habis, hapus text node (dan tag format kosong yang tersisa).
  const walker = doc.createTreeWalker(p, NodeFilter.SHOW_TEXT)
  let node: Text | null = walker.nextNode() as Text | null
  while (node) {
    const match = node.textContent?.match(prefixRe)
    if (match) {
      const rest = node.textContent!.slice(match[0].length)
      if (rest) {
        node.textContent = rest
      } else {
        node.remove()
        // Hapus elemen format kosong (strong/em/u) yang ditinggalkan
        p.querySelectorAll("strong, em, u").forEach((el) => {
          if (!el.textContent?.trim()) el.remove()
        })
      }
      break
    }
    node = walker.nextNode() as Text | null
  }

  return p.outerHTML
}

// ============================================================
// Generator template .docx untuk dipakai guru
// ============================================================

const TEMPLATE_DOCUMENT_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
  <w:body>
    <w:p><w:r><w:t>1. Siapa presiden pertama Republik Indonesia?</w:t></w:r></w:p>
    <w:p><w:r><w:t>A. Soekarno</w:t></w:r></w:p>
    <w:p><w:r><w:t>B. Moh. Hatta</w:t></w:r></w:p>
    <w:p><w:r><w:t>C. Soeharto</w:t></w:r></w:p>
    <w:p><w:r><w:t>D. B.J. Habibie</w:t></w:r></w:p>
    <w:p><w:r><w:t>Pembahasan: Soekarno adalah proklamator sekaligus presiden pertama RI.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Kunci: A</w:t></w:r></w:p>
    <w:p><w:r><w:t>2. Hasil dari 2 + 3 x 4 adalah ...</w:t></w:r></w:p>
    <w:p><w:r><w:t>A. 14</w:t></w:r></w:p>
    <w:p><w:r><w:t>B. 20</w:t></w:r></w:p>
    <w:p><w:r><w:t>C. 24</w:t></w:r></w:p>
    <w:p><w:r><w:t>D. 9</w:t></w:r></w:p>
    <w:p><w:r><w:t>Pembahasan: Kerjakan perkalian dulu, 2 + 12 = 14.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Kunci: A</w:t></w:r></w:p>
    <w:p><w:r><w:t>3. Bentuk pecahan dari a dibagi b adalah:</w:t></w:r></w:p>
    <w:p>
      <w:r><w:t>A. </w:t></w:r>
      <m:oMath>
        <m:f>
          <m:num><m:r><m:t>a</m:t></m:r></m:num>
          <m:den><m:r><m:t>b</m:t></m:r></m:den>
        </m:f>
      </m:oMath>
    </w:p>
    <w:p><w:r><w:t>B. ab</w:t></w:r></w:p>
    <w:p><w:r><w:t>C. a+b</w:t></w:r></w:p>
    <w:p><w:r><w:t>D. a-b</w:t></w:r></w:p>
    <w:p><w:r><w:t>Pembahasan: Pecahan a/b berarti a dibagi b.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Kunci: A</w:t></w:r></w:p>
  </w:body>
</w:document>`

/**
 * Generate file .docx template berisi contoh soal yang bisa di-download guru.
 * Minimal valid docx: [Content_Types].xml + _rels/.rels + word/document.xml.
 */
export async function generateTemplateDocx(): Promise<Blob> {
  const zip = new JSZip()

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
  )
  zip.folder("_rels")!.file(
    ".rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
  )
  zip.folder("word")!.file("document.xml", TEMPLATE_DOCUMENT_XML)

  return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })
}
