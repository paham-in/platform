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
  /**
   * HTML (dengan math LaTeX embedded).
   * Untuk paragraf normal: dibungkus `<p>...</p>`.
   * Untuk list item: konten dalam (tanpa `<p>`), akan dibungkus `<li>` oleh `paragraphsToHtml`.
   */
  html: string
  /** Jika paragraf adalah item auto-numbering Word → tipe list yang akan dirender */
  listType?: "ol" | "ul"
  /** Jika paragraf memakai style Heading Word → tag blok yang akan dipakai */
  blockTag?: "h1" | "h2" | "h3" | "p"
}

/** Hasil unzip .docx: document.xml + map numbering (numId → tipe list) */
export interface DocxContext {
  doc: Document
  numbering: Map<number, "ol" | "ul">
  /** rId → target rel (e.g. "media/image1.png", relatif ke folder word/) */
  rels: Map<string, string>
  /** extension lowercase → mime type, dari [Content_Types].xml */
  contentTypes: Map<string, string>
  zip: JSZip
}

/** Satu gambar yang diekstrak dari .docx, diidentifikasi lewat placeholder di HTML */
export interface DocxImage {
  /** Token pengganti sementara di HTML: "%%DOCX_IMG_0%%" */
  placeholder: string
  rId: string
  originalName: string
  mime: string
  blob: Blob | null
}

export interface DocxToHtmlResult {
  html: string
  images: DocxImage[]
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

/** Cek apakah run memiliki format tertentu di <w:rPr> (bold/italic/underline/highlight). */
function runHasFormat(run: Element, fmt: "b" | "i" | "u" | "highlight"): boolean {
  const rPr = Array.from(run.children).find((c) => c.localName === "rPr")
  if (!rPr) return false
  return Array.from(rPr.children).some((c) => c.localName === fmt)
}

/** Ambil warna highlight dari <w:rPr><w:highlight w:val="..."/></w:rPr> (jika ada). */
function runHighlightColor(run: Element): string | null {
  const rPr = Array.from(run.children).find((c) => c.localName === "rPr")
  if (!rPr) return null
  const hl = Array.from(rPr.children).find((c) => c.localName === "highlight")
  return hl ? (hl.getAttribute("w:val") ?? "yellow") : null
}

/**
 * Buat HTML untuk sebuah run (<w:r>), termasuk formatting dasar dari <w:rPr>.
 * - <w:b/> → <strong>
 * - <w:i/> → <em>
 * - <w:u/> → <u>
 * - <w:highlight/> → <mark>
 */
function collectRunHtml(run: Element): string {
  const text = collectText(run)
  if (!text) return ""

  const bold = runHasFormat(run, "b")
  const italic = runHasFormat(run, "i")
  const underline = runHasFormat(run, "u")
  const highlight = runHasFormat(run, "highlight")
  const hlColor = runHighlightColor(run)

  let out: string = text
  if (bold) out = `<strong>${out}</strong>`
  if (italic) out = `<em>${out}</em>`
  if (underline) out = `<u>${out}</u>`
  if (highlight) out = hlColor && hlColor !== "none" ? `<mark data-color="${hlColor}">${out}</mark>` : `<mark>${out}</mark>`
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
 * Baca word/document.xml (+ word/numbering.xml untuk auto-numbering list)
 * dari file .docx
 */
export async function unzipDocx(file: File): Promise<DocxContext> {
  const zip = await JSZip.loadAsync(file)
  const xmlFile = zip.file("word/document.xml")
  if (!xmlFile) throw new Error("File .docx tidak valid: word/document.xml tidak ditemukan")
  const xmlStr = await xmlFile.async("string")
  const doc = new DOMParser().parseFromString(xmlStr, "application/xml")

  // Parse numbering.xml → map numId → tipe list (ol/ul)
  const numbering = new Map<number, "ol" | "ul">()
  const numFile = zip.file("word/numbering.xml")
  if (numFile) {
    const numXml = await numFile.async("string")
    const numDoc = new DOMParser().parseFromString(numXml, "application/xml")
    numberingFromXml(numDoc, numbering)
  }

  return { doc, numbering, rels: await parseRels(zip), contentTypes: await parseContentTypes(zip), zip }
}

/** Parse word/_rels/document.xml.rels → map rId → target media (misal "media/image1.png"). */
async function parseRels(zip: JSZip): Promise<Map<string, string>> {
  const rels = new Map<string, string>()
  const relFile = zip.file("word/_rels/document.xml.rels")
  if (!relFile) return rels
  const relXml = await relFile.async("string")
  const relDoc = new DOMParser().parseFromString(relXml, "application/xml")
  for (const rel of descendants(relDoc.documentElement, "Relationship")) {
    if (rel.getAttribute("TargetMode") === "External") continue
    const type = rel.getAttribute("Type") ?? ""
    if (!type.includes("/image")) continue
    const id = rel.getAttribute("Id")
    let target = rel.getAttribute("Target")
    if (!id || !target) continue
    if (target.startsWith("/")) target = target.slice(1) // absolute → relatif ke root zip
    rels.set(id, target)
  }
  return rels
}

/** Parse [Content_Types].xml → map extension lowercase → mime type. */
async function parseContentTypes(zip: JSZip): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const ctFile = zip.file("[Content_Types].xml")
  if (!ctFile) return map
  const ctXml = await ctFile.async("string")
  const ctDoc = new DOMParser().parseFromString(ctXml, "application/xml")
  for (const def of descendants(ctDoc.documentElement, "Default")) {
    const ext = def.getAttribute("Extension")
    const ct = def.getAttribute("ContentType")
    if (ext && ct) map.set(ext.toLowerCase(), ct)
  }
  return map
}

/**
 * Parse word/numbering.xml dan isi `numbering` dengan mapping numId → list type.
 * Struktur:
 *   <w:numbering>
 *     <w:abstractNum w:abstractNumId="0">
 *       <w:lvl w:ilvl="0"><w:numFmt w:val="decimal"/>...</w:lvl>
 *     </w:abstractNum>
 *     <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
 *   </w:numbering>
 */
function numberingFromXml(doc: Document, numbering: Map<number, "ol" | "ul">): void {
  // abstractNumId → ilvl → numFmt
  const abstractFmts = new Map<number, Map<number, string>>()

  for (const abstractNum of descendants(doc.documentElement, "abstractNum")) {
    const idAttr = abstractNum.getAttribute("w:abstractNumId")
    if (idAttr === null) continue
    const id = parseInt(idAttr, 10)
    const lvls = new Map<number, string>()
    for (const lvl of descendants(abstractNum, "lvl")) {
      const ilvlAttr = firstDescendant(lvl, "ilvl")?.getAttribute("w:val")
      const fmtEl = firstDescendant(lvl, "numFmt")
      const fmt = fmtEl?.getAttribute("w:val")
      if (ilvlAttr != null && fmt) {
        lvls.set(parseInt(ilvlAttr, 10), fmt)
      }
    }
    abstractFmts.set(id, lvls)
  }

  for (const num of descendants(doc.documentElement, "num")) {
    const numIdAttr = num.getAttribute("w:numId")
    if (numIdAttr === null) continue
    const numId = parseInt(numIdAttr, 10)
    const absIdAttr = firstDescendant(num, "abstractNumId")?.getAttribute("w:val")
    const absId = absIdAttr ? parseInt(absIdAttr, 10) : -1
    const fmt = abstractFmts.get(absId)?.get(0) ?? "decimal"
    // bullet → ul, semua format angka/huruf lain → ol
    numbering.set(numId, fmt === "bullet" ? "ul" : "ol")
  }
}

/** Deteksi list type dari <w:pPr> (auto-numbering Word). */
function detectListType(pPr: Element, numbering: Map<number, "ol" | "ul">): "ol" | "ul" | undefined {
  const numPr = children(pPr).find((c) => c.localName === "numPr")
  if (!numPr) return undefined
  const numIdEl = children(numPr).find((c) => c.localName === "numId")
  const numId = numIdEl ? parseInt(numIdEl.getAttribute("w:val") ?? "0", 10) : 0
  return numbering.get(numId)
}

/** Deteksi heading Word dari <w:pPr><w:pStyle w:val="HeadingN"> */
function detectBlockTag(pPr: Element): "h1" | "h2" | "h3" | "p" | undefined {
  const pStyle = firstDescendant(pPr, "pStyle")
  const val = pStyle?.getAttribute("w:val")
  if (val === "Heading1") return "h1"
  if (val === "Heading2") return "h2"
  if (val === "Heading3") return "h3"
  return undefined
}

/** Ambil rId embed dari <a:blip r:embed="..."/> atau <v:imagedata r:id="..."/>. */
function embedRid(el: Element): string | null {
  for (const a of Array.from(el.attributes)) {
    if (a.localName === "embed" || a.localName === "id") return a.value
  }
  return null
}

/**
 * Buat HTML <img> placeholder untuk <w:drawing>/<w:pict> dan catat ke sink.
 * Tanpa sink → return "" (gambar tetap di-skip, alur soal bank).
 */
function extractImageHtml(el: Element, sink?: DocxImage[]): string {
  if (!sink) return ""
  const blip = firstDescendant(el, "blip")
  let rId = blip ? embedRid(blip) : null
  if (!rId) {
    // <w:pict><v:imagedata r:id="..."/> — format lama
    const imagedata = firstDescendant(el, "imagedata")
    rId = imagedata ? embedRid(imagedata) : null
  }
  if (!rId) return ""
  const idx = sink.length
  sink.push({ placeholder: `%%DOCX_IMG_${idx}%%`, rId, originalName: "", mime: "", blob: null })
  return `<img src="%%DOCX_IMG_${idx}%%" alt="" />`
}

/**
 * Parse satu elemen <w:p> → ParsedParagraph (atau null jika kosong).
 * Reusable untuk dokumen biasa maupun paragraf di dalam tabel.
 */
function parseParagraphElement(p: Element, numbering: Map<number, "ol" | "ul">, imageSink?: DocxImage[]): ParsedParagraph | null {
  let text = ""
  let html = ""
  let listType: "ol" | "ul" | undefined
  let blockTag: "h1" | "h2" | "h3" | "p" | undefined

  for (const child of children(p)) {
    const localName = child.localName

    if (localName === "r") {
      const runText = collectText(child)
      const runHtml = collectRunHtml(child)
      if (runText) {
        text += runText
        html += runHtml || runText
      }
      // Gambar inline di tengah run (Word menaruh <w:drawing> di dalam <w:r>)
      if (imageSink) {
        for (const d of descendants(child, "drawing")) html += extractImageHtml(d, imageSink)
        for (const d of descendants(child, "pict")) html += extractImageHtml(d, imageSink)
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
    } else if (localName === "pPr") {
      listType = detectListType(child, numbering)
      blockTag = detectBlockTag(child)
    } else if (localName === "bookmarkStart" || localName === "bookmarkEnd") {
      // structural — ignore
    } else if (localName === "drawing" || localName === "pict") {
      html += extractImageHtml(child, imageSink)
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
  if (!cleanText && !cleanHtml) return null

  const tag = blockTag ?? "p"
  return {
    text: cleanText,
    html: listType ? (cleanHtml || escapeHtml(cleanText)) : (cleanHtml ? `<${tag}>${cleanHtml}</${tag}>` : ""),
    listType,
    blockTag,
  }
}

/**
 * Parse document.xml → array paragraf.
 * Setiap paragraf punya `text` (polos) dan `html` (dengan math LaTeX embedded).
 * Paragraf auto-numbering Word (punya <w:numPr>) diberi `listType` dan html-nya
 * tidak dibungkus `<p>` (akan dibungkus `<li>` oleh `paragraphsToHtml`).
 */
export function parseDocumentXml(doc: Document, numbering?: Map<number, "ol" | "ul">, imageSink?: DocxImage[]): ParsedParagraph[] {
  const numMap = numbering ?? new Map<number, "ol" | "ul">()
  const paragraphs = descendants(doc.documentElement, "p")
  const result: ParsedParagraph[] = []
  for (const p of paragraphs) {
    const parsed = parseParagraphElement(p, numMap, imageSink)
    if (parsed) result.push(parsed)
  }
  return result
}

/**
 * Cek apakah string HTML mengandung <mark> (hasil highlight Word).
 * Dipakai untuk mendeteksi opsi yang benar di format tabel.
 */
function htmlHasMark(html: string): boolean {
  return /<mark[\s>]/.test(html)
}

/**
 * Hapus tag <mark> dari HTML — highlight hanya dipakai untuk deteksi
 * jawaban benar, tidak ikut tersimpan ke konten tiptap.
 */
function stripMark(html: string): string {
  return html.replace(/<mark[^>]*>/g, "").replace(/<\/mark>/g, "")
}

/**
 * Parse format tabel: 1 tabel = 1 soal.
 * - Row 1 → pertanyaan
 * - Row 2 → opsi jawaban (tiap paragraf = satu opsi; yang di-highlight = benar)
 * - Row 3 (opsional) → pembahasan
 */
export function parseTableQuestions(doc: Document, numbering?: Map<number, "ol" | "ul">): ImportQuestion[] {
  const numMap = numbering ?? new Map<number, "ol" | "ul">()
  const tables = descendants(doc.documentElement, "tbl")
  const questions: ImportQuestion[] = []

  for (const tbl of tables) {
    const rows = descendants(tbl, "tr")
    if (rows.length === 0) continue

    const getRowParagraphs = (row: Element): ParsedParagraph[] => {
      const paras: ParsedParagraph[] = []
      // Ambil semua <w:p> di dalam row (dalam cell)
      for (const p of descendants(row, "p")) {
        const parsed = parseParagraphElement(p, numMap)
        if (parsed) paras.push(parsed)
      }
      return paras
    }

    const rowParas = rows.map(getRowParagraphs)
    // Row 1 = pertanyaan
    const question = paragraphsToHtml(rowParas[0] ?? [])

    // Row 2 = opsi (jika ada)
    const options: string[] = []
    let correctIndex = 0
    const optionParas = rowParas[1] ?? []
    for (const p of optionParas) {
      if (p.text.trim() === "") continue
      let optionHtml = stripPrefix(p.html, "option")
      if (htmlHasMark(optionHtml) && correctIndex === 0) {
        correctIndex = options.length // opsi yang benar (sebelum push)
        optionHtml = stripMark(optionHtml) // highlight tidak ikut tersimpan
      }
      options.push(optionHtml)
    }
    if (correctIndex >= options.length) correctIndex = 0

    // Row 3 (opsional) = pembahasan
    const explanation = rows.length >= 3 ? paragraphsToHtml(rowParas[2] ?? []) : ""

    if (question && options.length >= 2) {
      questions.push({ question, options, correctIndex, explanation })
    }
  }

  return questions
}

/**
 * Gabungkan paragraf menjadi HTML, mengelompokkan list item berurutan
 * menjadi <ol>/<ul>. Paragraf normal → <p>...</p>, list item → <li>...
 */
export function paragraphsToHtml(paras: ParsedParagraph[]): string {
  let out = ""
  let i = 0
  while (i < paras.length) {
    const p = paras[i]
    if (p.listType) {
      const type = p.listType
      const items: string[] = []
      while (i < paras.length && paras[i].listType === type) {
        const item = paras[i]
        if (item.text.trim() !== "" || item.html.trim() !== "") {
          items.push(`<li>${item.html || escapeHtml(item.text)}</li>`)
        }
        i++
      }
      if (items.length > 0) out += `<${type}>${items.join("")}</${type}>`
    } else {
      if (p.text.trim() !== "" || p.html.trim() !== "") {
        out += p.html || `<p>${escapeHtml(p.text)}</p>`
      }
      i++
    }
  }
  return out
}

/**
 * Konversi satu file .docx → HTML siap masuk editor Tiptap + daftar gambar ter-ekstrak.
 * Heading Word (Heading1/2/3) jadi <h1>/<h2>/<h3>; rumus OMML jadi math LaTeX span.
 * Gambar (inline/standalone) jadi <img src="%%DOCX_IMG_n%%"> — blob di-resolve di sini,
 * upload ke storage dilakukan pemanggil (browser tidak bisa langsung baca isi zip).
 */
export async function docxToHtml(file: File): Promise<DocxToHtmlResult> {
  const { doc, numbering, rels, contentTypes, zip } = await unzipDocx(file)
  const images: DocxImage[] = []
  const paras = parseDocumentXml(doc, numbering, images)
  let html = paragraphsToHtml(paras)

  const kept: DocxImage[] = []
  for (const img of images) {
    const target = rels.get(img.rId)
    const entry = target ? zip.file("word/" + target) : null
    if (!entry) continue
    img.originalName = target!.split("/").pop() ?? "image"
    const ext = img.originalName.includes(".") ? img.originalName.split(".").pop()!.toLowerCase() : ""
    img.mime = contentTypes.get(ext) ?? "application/octet-stream"
    img.blob = await entry.async("blob")
    kept.push(img)
  }
  // Placeholder yang media-nya tidak bisa di-resolve → hapus (jangan tinggal token).
  const resolved = new Set(kept.map((i) => i.placeholder))
  html = html.replace(/%%DOCX_IMG_\d+%%/g, (m) => (resolved.has(m) ? m : ""))

  return { html, images: kept }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

type SectionName = "pertanyaan" | "jawaban" | "kunci" | "pembahasan"

/**
 * Deteksi apakah paragraf adalah header section (`--- pertanyaan` dsb).
 * Toleran terhadap spasi & huruf besar/kecil.
 */
function isSectionHeader(text: string): SectionName | null {
  const m = text.match(/^---\s*([a-zA-Z]+)\s*$/)
  if (!m) return null
  const name = m[1].toLowerCase()
  if (name === "pertanyaan" || name === "jawaban" || name === "kunci" || name === "pembahasan") {
    return name
  }
  return null
}

/**
 * Build soal dari hasil parsing docx.
 * Mendukung tiga format (dideteksi otomatis, prioritas tinggi → rendah):
 *  1. Tabel: 1 tabel = 1 soal (row 1 soal, row 2 opsi + highlight benar, row 3 pembahasan)
 *  2. Section: `--- pertanyaan` / `--- jawaban` / `--- kunci` / `--- pembahasan`
 *  3. Natural (fallback): `1.` / `A.` / `Kunci:` / `Pembahasan:`
 */
export function buildQuestions(doc: Document, paras: ParsedParagraph[], numbering?: Map<number, "ol" | "ul">): ImportQuestion[] {
  // 1. Format tabel
  const tableQuestions = parseTableQuestions(doc, numbering)
  if (tableQuestions.length > 0) return tableQuestions

  // 2. Format section
  const hasSection = paras.some((p) => isSectionHeader(p.text.trim()))
  if (hasSection) return buildQuestionsSection(paras)

  // 3. Format natural
  return buildQuestionsNatural(paras)
}

/** Format natural (logika lama): `1.` soal, `A.` opsi, `Kunci:`, `Pembahasan:` */
function buildQuestionsNatural(paras: ParsedParagraph[]): ImportQuestion[] {
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

/** Format section: `--- pertanyaan` / `--- jawaban` / `--- kunci` / `--- pembahasan` */
function buildQuestionsSection(paras: ParsedParagraph[]): ImportQuestion[] {
  const questions: ImportQuestion[] = []
  let current: ImportQuestion | null = null
  let section: SectionName | null = null
  const buffer: ParsedParagraph[] = [] // kumpulan paragraf untuk section aktif

  const optionPattern = /^[a-e][.)]\s*(.*)$/i
  const keyContentPattern = /(?:kunci\s*[:=]\s*)?([A-Ea-e])/i

  const flushQuestion = () => {
    if (current) {
      questions.push(current)
      current = null
    }
  }

  const flushSection = () => {
    if (!current || section === null) return
    const joined = paragraphsToHtml(buffer)
    if (section === "pertanyaan") {
      current.question = joined
    } else if (section === "pembahasan") {
      current.explanation = joined
    }
    buffer.length = 0
  }

  const startSection = (s: SectionName) => {
    flushSection()
    section = s
  }

  for (const para of paras) {
    const text = para.text.trim()
    const header = isSectionHeader(text)
    if (header) {
      startSection(header)
      if (header === "pertanyaan") {
        flushQuestion()
        current = { question: "", options: [], correctIndex: 0, explanation: "" }
      }
      continue
    }
    if (!current || section === null) continue

    if (section === "jawaban") {
      const m = text.match(optionPattern)
      if (m) {
        current.options.push(stripPrefix(para.html, "option"))
      }
      // Baris tanpa pola opsi di dalam jawaban diabaikan
    } else if (section === "kunci") {
      const km = text.match(keyContentPattern)
      if (km) {
        const idx = km[1].toUpperCase().charCodeAt(0) - 65
        if (idx >= 0 && idx < current.options.length) {
          current.correctIndex = idx
        }
      }
    } else {
      // pertanyaan / pembahasan → buffer untuk digabung saat section berubah
      buffer.push(para)
    }
  }

  flushSection()
  flushQuestion()
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
        // Hapus elemen format kosong (strong/em/u/mark) yang ditinggalkan
        p.querySelectorAll("strong, em, u, mark").forEach((el) => {
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
    <!-- Soal 1: tabel 1 kolom, row1 soal, row2 opsi (highlight jawaban benar), row3 pembahasan -->
    <w:tbl>
      <w:tr><w:tc><w:p><w:r><w:t>Siapa presiden pertama Republik Indonesia?</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc>
        <w:p><w:r><w:rPr><w:highlight w:val="yellow"/></w:rPr><w:t>a. Soekarno</w:t></w:r></w:p>
        <w:p><w:r><w:t>b. Moh. Hatta</w:t></w:r></w:p>
        <w:p><w:r><w:t>c. Soeharto</w:t></w:r></w:p>
        <w:p><w:r><w:t>d. B.J. Habibie</w:t></w:r></w:p>
      </w:tc></w:tr>
      <w:tr><w:tc><w:p><w:r><w:t>Soekarno adalah proklamator sekaligus presiden pertama RI.</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>

    <!-- Soal 2: pertanyaan berisi poin, highlight opsi c -->
    <w:tbl>
      <w:tr><w:tc>
        <w:p><w:r><w:t>Perhatikan pernyataan berikut:</w:t></w:r></w:p>
        <w:p><w:r><w:t>1. Soekarno presiden pertama.</w:t></w:r></w:p>
        <w:p><w:r><w:t>2. Moh. Hatta wakil presiden pertama.</w:t></w:r></w:p>
        <w:p><w:r><w:t>Manakah yang benar?</w:t></w:r></w:p>
      </w:tc></w:tr>
      <w:tr><w:tc>
        <w:p><w:r><w:t>a. 1 dan 2</w:t></w:r></w:p>
        <w:p><w:r><w:t>b. 1 saja</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:highlight w:val="yellow"/></w:rPr><w:t>c. 2 saja</w:t></w:r></w:p>
        <w:p><w:r><w:t>d. Semua salah</w:t></w:r></w:p>
      </w:tc></w:tr>
    </w:tbl>

    <!-- Soal 3: opsi mengandung rumus, highlight opsi a -->
    <w:tbl>
      <w:tr><w:tc><w:p><w:r><w:t>Bentuk pecahan dari a dibagi b adalah:</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc>
        <w:p>
          <w:r><w:rPr><w:highlight w:val="yellow"/></w:rPr><w:t>a. </w:t></w:r>
          <m:oMath>
            <m:f>
              <m:num><m:r><m:t>a</m:t></m:r></m:num>
              <m:den><m:r><m:t>b</m:t></m:r></m:den>
            </m:f>
          </m:oMath>
        </w:p>
        <w:p><w:r><w:t>b. ab</w:t></w:r></w:p>
        <w:p><w:r><w:t>c. a+b</w:t></w:r></w:p>
        <w:p><w:r><w:t>d. a-b</w:t></w:r></w:p>
      </w:tc></w:tr>
    </w:tbl>
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
