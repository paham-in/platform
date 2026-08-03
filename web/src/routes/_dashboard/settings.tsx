import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getClassesOptions,
  getMeOptions,
  getSubjectsOptions,
  patchMeMutation,
} from "@/lib/api/@tanstack/react-query.gen"
import { Checkbox } from "@/components/ui/checkbox"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { BookOpen, Loader2, Save } from "lucide-react"
import { toast } from "sonner"

function SettingsPage() {
  const qc = useQueryClient()
  const { data: user, isLoading: userLoading } = useQuery(getMeOptions())
  const { data: classes = [] } = useQuery(getClassesOptions())
  const { data: subjects = [] } = useQuery(getSubjectsOptions())

  const [name, setName] = useState("")
  const [classId, setClassId] = useState("")
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([])
  const [initialized, setInitialized] = useState(false)

  const roles = user?.roles ?? []
  const isTeacher = roles.includes("teacher")
  const isStudent = roles.includes("student")

  if (user && !initialized) {
    setName(user.name ?? "")
    setSelectedSubjectIds((user.subjects ?? []).map((s) => s.id!).filter((id) => id !== undefined))
    if (user.class_id) {
      const found = classes.find((c) => c.id === user.class_id)
      setClassId(String(user.class_id))
      // only mark init after classes loaded so SelectItem exists
      if (found || classes.length === 0) setInitialized(true)
    } else {
      setClassId("none")
      setInitialized(true)
    }
  }

  const updateProfile = useMutation({
    ...patchMeMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] })
      toast.success("Profil berhasil disimpan")
    },
    onError: () => {
      toast.error("Gagal menyimpan profil")
    },
  })

  if (userLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const toggleSubject = (subjectId: number) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
    )
  }

  const handleSave = () => {
    const body: Record<string, unknown> = {}
    if (name !== user?.name) body.name = name
    if (isStudent) {
      const parsedClassId = classId === "none" ? null : Number(classId)
      if (parsedClassId !== (user as any)?.class_id) body.class_id = parsedClassId
    }
    if (isTeacher) {
      const current = (user?.subjects ?? []).map((s) => s.id!).filter((id) => id !== undefined).sort()
      const next = [...selectedSubjectIds].sort()
      if (JSON.stringify(current) !== JSON.stringify(next)) body.subject_ids = selectedSubjectIds
    }
    if (Object.keys(body).length === 0) return
    updateProfile.mutate({ body })
  }

  return (
    <main className="p-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Pengaturan</h1>

      <div className="flex max-w-lg flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {isStudent && (
            <div className="space-y-2">
              <Label htmlFor="class">Kelas</Label>
              <Select value={classId} onValueChange={(v) => setClassId(v ?? "none")}>
                <SelectTrigger id="class" className="w-full">
                  <SelectValue placeholder="Pilih kelas">
                    {classId === "none" ? "Tidak ada" : classes.find((c) => String(c.id) === classId)?.name ?? classId}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id!)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {isTeacher && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> Mata Pelajaran Saya
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              Pilih mata pelajaran yang Anda ajarkan. Murid bisa menemukan Anda lewat subjek ini di halaman Les Privat.
            </p>
            <div className="max-h-[240px] space-y-2 overflow-y-auto rounded-md border p-3">
              {subjects.map((s) => (
                <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted">
                  <Checkbox
                    checked={selectedSubjectIds.includes(s.id!)}
                    onCheckedChange={() => toggleSubject(s.id!)}
                  />
                  {s.name}
                </label>
              ))}
              {subjects.length === 0 && (
                <p className="text-sm text-muted-foreground">Belum ada mata pelajaran.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <Button
          onClick={handleSave}
          disabled={updateProfile.isPending}
          className="w-full"
        >
          {updateProfile.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Simpan
        </Button>
      </div>
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/settings")({
  component: SettingsPage,
})
