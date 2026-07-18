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
  patchMeMutation,
} from "@/lib/api/@tanstack/react-query.gen"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Loader2, Save } from "lucide-react"

function SettingsPage() {
  const qc = useQueryClient()
  const { data: user, isLoading: userLoading } = useQuery(getMeOptions())
  const { data: classes = [] } = useQuery(getClassesOptions())

  const [name, setName] = useState("")
  const [classId, setClassId] = useState("")
  const [initialized, setInitialized] = useState(false)

  if (user && !initialized) {
    setName(user.name ?? "")
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
    },
  })

  if (userLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const handleSave = () => {
    const body: Record<string, unknown> = {}
    if (name !== user?.name) body.name = name
    const parsedClassId = classId === "none" ? null : Number(classId)
    if (parsedClassId !== (user as any)?.class_id) body.class_id = parsedClassId
    if (Object.keys(body).length === 0) return
    updateProfile.mutate({ body })
  }

  return (
    <main className="p-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Pengaturan</h1>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

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

          {updateProfile.isSuccess && (
            <p className="text-sm text-green-600">Profil berhasil disimpan</p>
          )}
          {updateProfile.isError && (
            <p className="text-sm text-red-600">Gagal menyimpan profil</p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/settings")({
  component: SettingsPage,
})
