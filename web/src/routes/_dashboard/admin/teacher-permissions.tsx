import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, ShieldCheck, UserX } from "lucide-react"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Badge } from "@/components/ui/badge"
import { getAdminUsersOptions } from "@/lib/api/@tanstack/react-query.gen"
import type { UserAdminListUsersResponse } from "@/lib/api/types.gen"
import { TeacherPermissionsDialog } from "@/components/admin/users"

// Badge izin: pill hijau kalau diizinkan; outline muted kalau tidak.
function PermBadge({ granted, label }: { granted: boolean; label: string }) {
  if (!granted) return <Badge variant="outline" className="text-muted-foreground">Tidak ada</Badge>
  return <Badge variant="outline" className="border-transparent bg-green-100 text-green-700">{label}</Badge>
}

function AdminTeacherPermissions() {
  const { data: teachers = [], isLoading } = useQuery(
    getAdminUsersOptions({ query: { role: "teacher" } })
  )
  const [editing, setEditing] = useState<UserAdminListUsersResponse | null>(null)
  const [page, setPage] = useState(1)
  const perPage = 5

  const totalPages = Math.ceil(teachers.length / perPage)
  const paged = teachers.slice((page - 1) * perPage, page * perPage)

  return (
    <>
      <main className="p-6">
        <h1 className="mb-4 text-2xl font-bold tracking-tight">Hak Akses Guru</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          Atur guru mana yang boleh membuat, mengubah, dan menghapus materi & paket soal. Guru tanpa
          izin tidak bisa mengelola konten platform.
        </p>

        <Card className="pt-0 gap-0 pb-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Kelola Materi</TableHead>
                  <TableHead>Kelola Paket Soal</TableHead>
                  <TableHead className="pr-6 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell className="pl-6"><div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                      <TableCell className="pr-6 text-right"><Skeleton className="h-8 w-8 rounded ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : paged.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="pl-6"><div className="flex items-center gap-3">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="h-8 w-8 rounded-full" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{u.name?.[0]}</div>
                      )}
                      <span className="font-medium">{u.name}</span>
                    </div></TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <PermBadge granted={!!u.can_manage_materials} label="Boleh kelola" />
                    </TableCell>
                    <TableCell>
                      <PermBadge granted={!!u.can_manage_question_packages} label="Boleh kelola" />
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setEditing(u)}>
                            <ShieldCheck className="h-4 w-4" /> Atur Hak Akses
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && paged.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Empty className="border-0 p-8">
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><UserX /></EmptyMedia>
                          <EmptyTitle>Tidak ada guru ditemukan</EmptyTitle>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          {totalPages > 1 && (
            <CardFooter className="flex items-center justify-between border-t">
              <p className="text-sm text-muted-foreground">
                Halaman {page} dari {totalPages}
              </p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  Sebelumnya
                </Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                  Berikutnya
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </main>

      {editing && <TeacherPermissionsDialog user={editing} onClose={() => setEditing(null)} />}
    </>
  )
}

export const Route = createFileRoute("/_dashboard/admin/teacher-permissions")({
  component: AdminTeacherPermissions,
})
