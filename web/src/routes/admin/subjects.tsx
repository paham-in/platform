import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Route as RootRoute } from "@/routes/__root";
import { createRoute, Link } from "@tanstack/react-router";
import {
  BookMarked,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";

type Subject = {
  id: number;
  name: string;
  slug: string;
  description: string;
  materialCount: number;
};

const mockSubjects: Subject[] = [
  {
    id: 1,
    name: "Matematika",
    slug: "matematika",
    description: "Aljabar, geometri, kalkulus, dan statistika",
    materialCount: 24,
  },
  {
    id: 2,
    name: "Fisika",
    slug: "fisika",
    description: "Mekanika, termodinamika, gelombang, dan optik",
    materialCount: 18,
  },
  {
    id: 3,
    name: "Bahasa Inggris",
    slug: "bahasa-inggris",
    description: "Grammar, reading, writing, dan speaking",
    materialCount: 31,
  },
  {
    id: 4,
    name: "Biologi",
    slug: "biologi",
    description: "Sel, genetika, ekologi, dan evolusi",
    materialCount: 15,
  },
  {
    id: 5,
    name: "Kimia",
    slug: "kimia",
    description: "Stoikiometri, termokimia, dan kimia organik",
    materialCount: 12,
  },
  {
    id: 6,
    name: "Sejarah",
    slug: "sejarah",
    description: "Sejarah Indonesia dan dunia",
    materialCount: 9,
  },
];

const sidebarLinks = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Kelola User", href: "/admin/users" },
  { icon: BookMarked, label: "Mata Pelajaran", href: "/admin/subjects" },
];

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: "/admin/subjects",
  component: function AdminSubjects() {
    const [subjects, setSubjects] = useState<Subject[]>(mockSubjects);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Subject | null>(null);
    const [form, setForm] = useState({ name: "", description: "" });
    const perPage = 5;

    const filtered = subjects.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase()),
    );
    const totalPages = Math.ceil(filtered.length / perPage);
    const paged = filtered.slice((page - 1) * perPage, page * perPage);

    const openAdd = () => {
      setEditing(null);
      setForm({ name: "", description: "" });
      setDialogOpen(true);
    };

    const openEdit = (s: Subject) => {
      setEditing(s);
      setForm({ name: s.name, description: s.description });
      setDialogOpen(true);
    };

    const save = () => {
      const slug = form.name.toLowerCase().replace(/\s+/g, "-");
      if (editing) {
        setSubjects(
          subjects.map((s) =>
            s.id === editing.id
              ? { ...s, name: form.name, slug, description: form.description }
              : s,
          ),
        );
      } else {
        setSubjects([
          ...subjects,
          { id: Date.now(), ...form, slug, materialCount: 0 },
        ]);
      }
      setDialogOpen(false);
    };

    const remove = (id: number) => {
      if (confirm("Yakin hapus mata pelajaran ini?"))
        setSubjects(subjects.filter((s) => s.id !== id));
    };

    return (
      <div className="flex min-h-screen bg-muted/20">
        <aside className="hidden w-64 shrink-0 flex-col border-r bg-card p-4 md:flex">
          <Link to="/" className="mb-8 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              B
            </div>
            <span className="text-lg font-bold">Bimbel</span>
          </Link>
          <nav className="flex-1 space-y-1">
            {sidebarLinks.map((s) => (
              <Link
                key={s.label}
                to={s.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <s.icon className="h-4 w-4" /> {s.label}
              </Link>
            ))}
          </nav>
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-3 text-muted-foreground"
              asChild
            >
              <a href="/login">
                <LogOut className="h-4 w-4" /> Keluar
              </a>
            </Button>
          </div>
        </aside>

        <div className="flex-1">
          <header className="flex items-center justify-between border-b bg-card px-6 py-3">
            <h1 className="text-lg font-bold">Mata Pelajaran</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/dashboard" className="hover:text-foreground">
                Dashboard
              </Link>
              <ChevronDown className="h-3 w-3 -rotate-90" />
              <span>Mata Pelajaran</span>
            </div>
          </header>

          <main className="p-6">
            <div className="rounded-xl border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b p-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari mata pelajaran..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={openAdd}>
                      <Plus className="mr-1 h-4 w-4" /> Tambah
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editing
                          ? "Edit Mata Pelajaran"
                          : "Tambah Mata Pelajaran"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nama</Label>
                        <Input
                          id="name"
                          value={form.name}
                          onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                          }
                          placeholder="Nama mata pelajaran"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="desc">Deskripsi</Label>
                        <Input
                          id="desc"
                          value={form.description}
                          onChange={(e) =>
                            setForm({ ...form, description: e.target.value })
                          }
                          placeholder="Deskripsi singkat"
                        />
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => setDialogOpen(false)}
                        >
                          Batal
                        </Button>
                        <Button onClick={save}>
                          {editing ? "Simpan" : "Tambah"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="pl-6">Nama</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Jumlah Materi</TableHead>
                    <TableHead className="pr-6 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="pl-6 font-medium">
                        {s.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.slug}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {s.description}
                      </TableCell>
                      <TableCell>{s.materialCount}</TableCell>
                      <TableCell className="pr-6 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(s)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => remove(s.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paged.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="p-8 text-center text-muted-foreground"
                      >
                        Tidak ada mata pelajaran ditemukan
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t p-4">
                  <p className="text-sm text-muted-foreground">
                    Halaman {page} dari {totalPages}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  },
});
