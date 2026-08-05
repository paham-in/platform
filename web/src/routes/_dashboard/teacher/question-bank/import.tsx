import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import { RichContent } from "@/components/ui/rich-content"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAdminChaptersOptions, getAdminQuestionsBankOptions, getAdminQuestionsBankQueryKey, postAdminQuestionsBankMutation } from "@/lib/api/@tanstack/react-query.gen"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, UploadCloud, FileText, CheckCircle2, XCircle, Download, HelpCircle } from "lucide-react"
import { toast } from "sonner"
import { unzipDocx, parseDocumentXml, buildQuestions, generateTemplateDocx, type ImportQuestion } from "@/lib/docx-parser"

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html")
  return (doc.body.textContent || "").trim()
}

function normalizeQuestion(html: string): string {
  return stripHtml(html).toLowerCase().replace(/\s+/g, " ").trim()
}

function ImportQuestions() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data: chapters = [] } = useQuery(getAdminChaptersOptions())
  const { data: existingQuestions = [] } = useQuery(getAdminQuestionsBankOptions())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [parsing, setParsing] = useState(false)
  const [fileName, setFileName] = useState("")
  const [questions, setQuestions] = useState<ImportQuestion[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [chapterId, setChapterId] = useState("")
  const [parseError, setParseError] = useState("")

  const chapterOptions = chapters.map((c) => ({ label: c.title ?? "", value: String(c.id) }))

  // Set soal yang sudah ada (normalized) untuk deteksi duplikasi
  const existingSet = new Set(existingQuestions.map((q) => normalizeQuestion(q.question ?? "")))
  const isDuplicate = (i: number) => existingSet.has(normalizeQuestion(questions[i]?.question ?? ""))

  const { mutate: createQuestion, isPending } = useMutation({
    ...postAdminQuestionsBankMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminQuestionsBankQueryKey() })
    },
  })

  const handleFile = async (file: File) => {
    setParsing(true)
    setParseError("")
    setQuestions([])
    setSelected(new Set())
    setFileName(file.name)
    try {
      const { doc, numbering } = await unzipDocx(file)
      const paras = parseDocumentXml(doc, numbering)
      const parsed = buildQuestions(doc, paras, numbering)
      if (parsed.length === 0) {
        setParseError("Tidak ada soal yang terdeteksi. Pastikan format: nomor soal di paragraf sendiri, opsi A/B/C/D di baris terpisah.")
      } else {
        setQuestions(parsed)
        // Auto-uncheck soal yang sudah ada (duplikat) — user bisa centang ulang manual
        const initial = new Set<number>()
        parsed.forEach((q, i) => {
          if (!existingSet.has(normalizeQuestion(q.question ?? ""))) initial.add(i)
        })
        setSelected(initial)
      }
    } catch (err: any) {
      setParseError(err?.message || "Gagal membaca file. Pastikan file .docx valid.")
    } finally {
      setParsing(false)
    }
  }

  const toggleAll = () => {
    if (selected.size === questions.length) setSelected(new Set())
    else setSelected(new Set(questions.map((_, i) => i)))
  }
  const toggleOne = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const importSelected = () => {
    if (!chapterId) {
      toast.error("Pilih chapter terlebih dahulu")
      return
    }
    const toImport = questions.filter((_, i) => selected.has(i))
    toImport.forEach((q) => {
      createQuestion({
        body: {
          chapter_id: Number(chapterId),
          question: q.question,
          options: q.options,
          correct_index: q.correctIndex,
          explanation: q.explanation,
        },
      })
    })
    toast.success(`${toImport.length} soal berhasil diimport`)
    navigate({ to: "/teacher/question-bank" })
  }

  const downloadTemplate = async () => {
    try {
      const blob = await generateTemplateDocx()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "template-soal-bank.docx"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      toast.error("Gagal membuat template")
    }
  }

  return (
    <main className="p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link to="/teacher/question-bank" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>

        <h1 className="text-2xl font-bold tracking-tight">Import Soal dari Word</h1>

        {/* Cara penulisan format */}
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-medium">
                <HelpCircle className="h-4 w-4 text-muted-foreground" /> Cara Penulisan Format
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="mr-1 h-4 w-4" /> Download Template
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <p className="mb-2 font-semibold">Contoh format (tabel)</p>
                <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted-foreground">{`┌───────────────────────────────┐
│ Siapa presiden RI?            │  ← row 1: soal
├───────────────────────────────┤
│ a. Soekarno                   │  ← row 2: opsi
│ b. Moh. Hatta                 │
│ c. Soeharto                   │
│ d. B.J. Habibie               │
├───────────────────────────────┤
│ Soekarno...                   │  ← row 3: pembahasan
└───────────────────────────────┘`}</pre>
                <p className="mt-2 text-xs text-muted-foreground">Buat 1 tabel dengan 1 kolom. Opsi yang benar di-<em>highlight</em> (mis. kuning).</p>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><span className="font-medium text-foreground">Aturan:</span></p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>Setiap soal dibuat dalam <strong>1 tabel berisi 1 kolom</strong> (Insert → Table → 1 kolom).</li>
                  <li><strong>Row 1</strong> = pertanyaan (boleh berisi poin/list).</li>
                  <li><strong>Row 2</strong> = opsi jawaban <code className="rounded bg-muted px-1">a.</code>–<code className="rounded bg-muted px-1">e.</code> satu per baris.</li>
                  <li>Opsi yang benar di-<em>highlight</em> (mis. warna kuning) → otomatis jadi kunci jawaban.</li>
                  <li><strong>Row 3</strong> (opsional) = pembahasan.</li>
                  <li>Rumus dari Equation Editor Word (Insert → Equation / Alt+=) otomatis dikonversi ke LaTeX.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload */}
        <Card>
          <CardContent className="p-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
                e.target.value = ""
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <UploadCloud className="h-8 w-8" />
              <span className="text-sm font-medium">Klik untuk pilih file .docx</span>
              <span className="text-xs">Mendukung rumus Equation Editor (OMML) yang dikonversi ke LaTeX</span>
            </button>
            {parsing && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner /> Memproses dokumen...
              </div>
            )}
            {fileName && !parsing && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" /> {fileName} — {questions.length} soal terdeteksi
              </div>
            )}
            {parseError && (
              <div className="mt-4 flex items-center gap-2 text-sm text-destructive">
                <XCircle className="h-4 w-4" /> {parseError}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        {questions.length > 0 && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Checkbox checked={selected.size === questions.length} onCheckedChange={toggleAll} />
                <span className="text-sm">Pilih semua ({selected.size}/{questions.length})</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Label className="text-sm">Chapter</Label>
                <Select items={chapterOptions} value={chapterId} onValueChange={(v) => setChapterId(v ?? "")}>
                  <SelectTrigger className="w-[220px]"><SelectValue placeholder="Pilih chapter" /></SelectTrigger>
                  <SelectContent>
                    {chapterOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={importSelected} disabled={selected.size === 0 || !chapterId || isPending}>
                  {isPending ? <Spinner /> : <CheckCircle2 className="h-4 w-4" />}
                  Import Terpilih
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {questions.map((q, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selected.has(i)}
                        onCheckedChange={() => toggleOne(i)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="font-medium">
                          <span className="mr-1 text-muted-foreground">{i + 1}.</span>
                          {q.question ? <RichContent html={q.question} /> : <span className="text-muted-foreground">(kosong)</span>}
                          {isDuplicate(i) && (
                            <span className="ml-2 inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                              <XCircle className="h-3 w-3" /> Duplikat
                            </span>
                          )}
                        </div>
                        {q.options.length > 0 && (
                          <div className="grid gap-1 pl-6 text-sm">
                            {q.options.map((opt, oi) => (
                              <div key={oi} className="flex items-start gap-2">
                                <span className={`shrink-0 rounded px-1.5 text-xs font-semibold ${
                                  q.correctIndex === oi ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                                }`}>
                                  {String.fromCharCode(65 + oi)}
                                </span>
                                <div className="flex-1"><RichContent html={opt} /></div>
                              </div>
                            ))}
                          </div>
                        )}
                        {q.explanation && (
                          <div className="pl-6 text-xs text-muted-foreground">
                            <span className="font-medium">Pembahasan:</span> <RichContent html={q.explanation} />
                          </div>
                        )}
                        {q.options.length === 0 && (
                          <p className="text-xs text-amber-600">Soal tanpa opsi — periksa format sebelum import.</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/teacher/question-bank/import")({
  component: ImportQuestions,
})
