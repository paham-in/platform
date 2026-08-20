import { useEffect, useRef, useState } from "react"
import {
  BoldIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ImagePlusIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  RedoIcon,
  Sigma,
  StrikethroughIcon,
  Trash2Icon,
  UndoIcon,
} from "lucide-react"
import { Node as TipTapNode, mergeAttributes } from "@tiptap/core"
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer, type Editor } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import type { EditorView } from "@tiptap/pm/view"
import { NodeSelection } from "@tiptap/pm/state"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import ImageExt from "@tiptap/extension-image"
import { Mathematics } from "@tiptap/extension-mathematics"
import "katex/dist/katex.min.css"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { MathInputDialog } from "./math-input-dialog"
import { Spinner } from "@/components/ui/spinner"
import { postContentTempImages, deleteContentTempImages } from "@/lib/api/sdk.gen"

const ToolbarButton = ({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={cn(
      "flex h-8 w-8 items-center justify-center rounded text-sm transition-colors hover:bg-muted",
      active && "bg-muted text-foreground",
    )}
  >
    {children}
  </button>
);

// UploadPlaceholder: node sementara untuk gambar yang sedang diunggah. Tampil
// sebagai kotak dashed dengan spinner (mirip area drag & drop), lalu diganti
// node gambar saat upload selesai. Atribut `id` dipakai untuk mengidentifikasi
// node per-upload.
const UploadPlaceholder = TipTapNode.create({
  name: "uploadPlaceholder",
  group: "block",
  atom: true,
  selectable: false,
  draggable: false,
  addAttributes() {
    return {
      id: { default: null },
    }
  },
  parseHTML() {
    return [{ tag: "div[data-upload-placeholder]" }]
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-upload-placeholder": "" })]
  },
  addNodeView() {
    return ReactNodeViewRenderer(UploadPlaceholderView)
  },
})

function UploadPlaceholderView() {
  return (
    <NodeViewWrapper>
      <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/20">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    </NodeViewWrapper>
  )
}

export function TiptapEditor({
  content,
  onChange,
  editable = true,
  tempFolder,
  onUploadingChange,
}: {
  content: string;
  onChange: (html: string) => void;
  editable?: boolean;
  tempFolder?: string;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [mathOpen, setMathOpen] = useState(false)
  const [editLatex, setEditLatex] = useState<string | null>(null)
  const [pendingUploads, setPendingUploads] = useState(0)
  const editorElRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    onUploadingChange?.(pendingUploads > 0)
  }, [pendingUploads, onUploadingChange])

  // uploadTemp mengunggah gambar ke storage temp lalu mengembalikan URL-nya.
  // Gambar dipindahkan ke lokasi permanen saat content di-submit (backend).
  const uploadTemp = async (file: File): Promise<string | undefined> => {
    if (!tempFolder) return undefined
    try {
      const res = await postContentTempImages({ body: { image: file, folder: tempFolder } })
      return res?.data?.url
    } catch {
      toast.error("Gagal mengunggah gambar")
      return undefined
    }
  }

  // insertPlaceholder menyisipkan node kotak dashed + spinner (feedback loading)
  // lalu mengembalikan id-nya, dipakai untuk mengganti node saat upload selesai.
  const insertPlaceholder = (view: EditorView, pos?: number): string => {
    const id = crypto.randomUUID()
    const node = view.state.schema.nodes.uploadPlaceholder.create({ id })
    const target = pos ?? view.state.selection.to
    view.dispatch(view.state.tr.insert(target, node))
    view.focus()
    return id
  }

  const replacePlaceholder = (view: EditorView, id: string, url: string) => {
    view.state.doc.descendants((node, nodePos) => {
      if (node.type.name === "uploadPlaceholder" && node.attrs.id === id) {
        const image = view.state.schema.nodes.image.create({ src: url })
        view.dispatch(view.state.tr.replaceWith(nodePos, nodePos + node.nodeSize, image))
        return false
      }
    })
  }

  const removePlaceholder = (view: EditorView, id: string) => {
    view.state.doc.descendants((node, nodePos) => {
      if (node.type.name === "uploadPlaceholder" && node.attrs.id === id) {
        view.dispatch(view.state.tr.delete(nodePos, nodePos + node.nodeSize))
        return false
      }
    })
  }

  // uploadImages menyisipkan placeholder langsung (feedback loading), lalu
  // menggantinya dengan URL hasil upload. Kalau gagal, placeholder dihapus.
  const uploadImages = (view: EditorView, files: File[], pos?: number) => {
    let insertPos = pos
    for (const f of files) {
      const id = insertPlaceholder(view, insertPos)
      if (insertPos != null) insertPos += 1
      setPendingUploads((n) => n + 1)
      void uploadTemp(f).then((url) => {
        try {
          if (url) replacePlaceholder(view, id, url)
          else removePlaceholder(view, id)
        } catch {
          // editor sudah di-unmount, transaksi dibuang
        }
        setPendingUploads((n) => n - 1)
      })
    }
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Mathematics,
      ImageExt,
      UploadPlaceholder,
    ],
    content,
    editable,
    editorProps: {
      // drag & drop gambar: sisipkan placeholder, unggah ke storage temp, lalu
      // ganti src-nya dengan URL hasil upload (bukan blob lokal).
      handleDrop: (view, event) => {
        if (!tempFolder) return false
        const files = Array.from(event.dataTransfer?.files ?? [])
        const imgs = files.filter((f) => f.type.startsWith("image/"))
        if (!imgs.length) return false
        event.preventDefault()
        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY })
        uploadImages(view, imgs, coords?.pos)
        return true
      },
      handlePaste: (view, event) => {
        if (!tempFolder) return false
        const files = Array.from(event.clipboardData?.files ?? [])
        const imgs = files.filter((f) => f.type.startsWith("image/"))
        if (!imgs.length) return false
        event.preventDefault()
        uploadImages(view, imgs)
        return true
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // sync content prop changes (e.g. draft restore, reset to empty)
  useEffect(() => {
    if (editor && editor.getHTML() !== content) {
      editor.commands.setContent(content)
    }
  }, [editor, content])

  // click handler on math nodes + images
  useEffect(() => {
    const el = editorElRef.current
    if (!el || !editable) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // check math node first
      const mathEl = target.closest('[data-type="inline-math"], [data-type="block-math"]')
      if (mathEl && editor) {
        const latex = mathEl.getAttribute("data-latex") || ""
        setEditLatex(latex)
        setMathOpen(true)
        return
      }
      // check image
      const img = target.closest("img[src]")
      if (img && editor) {
        if (!editorElRef.current?.contains(img as Node)) return
        const pos = editor.view.posAtDOM(img as Node, 0)
        if (pos != null) {
          const resolved = editor.state.doc.resolve(pos)
          for (let d = resolved.depth; d >= 0; d--) {
            if (resolved.node(d).type.name === "image") {
              editor.commands.setNodeSelection(d === 0 ? pos : resolved.before(d))
              break
            }
          }
        }
        return
      }
    }
    el.addEventListener("click", handler)
    return () => el.removeEventListener("click", handler)
  }, [editor, editable])

  if (!editor) return null;

  const handleMathInsert = (latex: string) => {
    if (editLatex !== null) {
      editor.chain().focus().updateInlineMath({ latex }).run()
    } else {
      editor.chain().focus().insertInlineMath({ latex }).run()
    }
  }

  const openMathForInsert = () => {
    setEditLatex(null)
    setMathOpen(true)
  }

  const handleResize = (pct: number) => {
    editor.chain().focus().updateAttributes("image", { width: `${pct}%` }).run()
  }

  const handleDeleteImage = async () => {
    const sel = editor.state.selection
    const src = sel instanceof NodeSelection && sel.node.type.name === "image"
      ? (sel.node.attrs.src as string)
      : ""
    if (src && /public\/temp_[a-z_]+/.test(src)) {
      const res = await deleteContentTempImages({ body: { url: src } })
      if (res.error) {
        toast.error(res.error.error || "Gagal menghapus gambar")
        return
      }
    }
    editor.chain().focus().deleteSelection().run()
  }

  return (
    <div className="rounded-md border">
      <Toolbar
        editor={editor}
        onOpenMath={openMathForInsert}
        onUploadImage={(files) => uploadImages(editor.view, files)}
        canUpload={!!tempFolder}
      />
      <div ref={editorElRef}>
        <EditorContent
          editor={editor}
          className="prose prose-sm dark:prose-invert max-w-none p-4 focus:outline-none [&_.ProseMirror]:min-h-[300px] [&_.ProseMirror]:outline-none [&_.ProseMirror_img]:mx-auto [&_.ProseMirror_img]:block"
        />
      </div>
      <MathInputDialog
        open={mathOpen}
        initialLatex={editLatex ?? ""}
        onOpenChange={(v) => { setMathOpen(v); if (!v) setEditLatex(null) }}
        onInsert={handleMathInsert}
      />

      <BubbleMenu
        editor={editor}
        appendTo={document.body}
        shouldShow={({ editor }: { editor: Editor }) => {
          const sel = editor.state.selection
          return sel instanceof NodeSelection && sel.node.type.name === "image"
        }}
        className="flex items-center gap-0.5 rounded-xl border bg-background p-1 shadow-lg"
      >
        {[25, 50, 75, 100].map((pct) => (
          <button
            key={pct}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleResize(pct)}
            className="flex h-7 min-w-10 items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors hover:bg-muted"
          >
            {pct}%
          </button>
        ))}
        <div className="mx-1 h-4 w-px bg-border" />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => void handleDeleteImage()}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-destructive transition-colors hover:bg-destructive/10"
        >
          <Trash2Icon className="h-4 w-4" />
        </button>
      </BubbleMenu>
    </div>
  );
}

function Toolbar({ editor, onOpenMath, onUploadImage, canUpload }: { editor: Editor; onOpenMath: () => void; onUploadImage: (files: File[]) => void; canUpload: boolean }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const items = [
    { icon: UndoIcon, action: () => editor.chain().focus().undo().run(), active: false },
    { icon: RedoIcon, action: () => editor.chain().focus().redo().run(), active: false },
    { type: "sep" as const },
    { icon: Heading1Icon, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive("heading", { level: 1 }) },
    { icon: Heading2Icon, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
    { icon: Heading3Icon, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }) },
    { type: "sep" as const },
    { icon: BoldIcon, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
    { icon: ItalicIcon, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
    { icon: UnderlineIcon, action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive("underline") },
    { icon: StrikethroughIcon, action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive("strike") },
    { type: "sep" as const },
    { icon: ListIcon, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
    { icon: ListOrderedIcon, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
    { icon: QuoteIcon, action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote") },
    { type: "sep" as const },
    { icon: Sigma, action: onOpenMath, active: editor.isActive("blockMath") },
    ...(canUpload ? [{ icon: ImagePlusIcon, action: () => fileInputRef.current?.click(), active: false }] : []),
  ];

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/20 px-2 py-1.5">
      {items.map((item, i) =>
        item.type === "sep" ? (
          <div key={i} className="mx-1 h-6 w-px bg-border" />
        ) : (
          <ToolbarButton key={i} active={item.active} onClick={item.action}>
            <item.icon className="h-4 w-4" />
          </ToolbarButton>
        ),
      )}
      {canUpload && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) onUploadImage(Array.from(e.target.files))
            e.target.value = ""
          }}
        />
      )}
    </div>
  );
}

// Lucide doesn't have an underline icon, use a simple SVG
function UnderlineIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 4v6a6 6 0 0 0 12 0V4" />
      <line x1="4" x2="20" y1="20" y2="20" />
    </svg>
  );
}
