import { useEffect, useRef, useState } from "react"
import {
  BoldIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ImageIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  RedoIcon,
  Sigma,
  StrikethroughIcon,
  UndoIcon,
} from "lucide-react"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import ImageExt from "@tiptap/extension-image"
import { Mathematics } from "@tiptap/extension-mathematics"
import "katex/dist/katex.min.css"
import { cn } from "@/lib/utils"
import { MathInputDialog } from "./math-input-dialog"
import { GalleryPicker } from "./gallery-picker"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

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

export function TiptapEditor({
  content,
  onChange,
  editable = true,
  allowImages = true,
}: {
  content: string;
  onChange: (html: string) => void;
  editable?: boolean;
  allowImages?: boolean;
}) {
  const [mathOpen, setMathOpen] = useState(false)
  const [editLatex, setEditLatex] = useState<string | null>(null)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [resizeOpen, setResizeOpen] = useState(false)
  const editorElRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Mathematics,
      ImageExt,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // sync content prop changes (e.g. draft restore)
  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
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
          setResizeOpen(true)
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
    setResizeOpen(false)
  }

  return (
    <div className="rounded-md border">
      <Toolbar editor={editor} onOpenMath={openMathForInsert} onOpenGallery={() => setGalleryOpen(true)} allowImages={allowImages} />
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
      {allowImages && (
        <GalleryPicker
          open={galleryOpen}
          onOpenChange={setGalleryOpen}
          onInsert={(url) => editor.chain().focus().setImage({ src: url }).run()}
        />
      )}

      <Dialog open={resizeOpen} onOpenChange={setResizeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ukuran Gambar</DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            {[25, 50, 75, 100].map((pct) => (
              <Button key={pct} variant="outline" className="flex-1" onClick={() => handleResize(pct)}>
                {pct}%
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Toolbar({ editor, onOpenMath, onOpenGallery, allowImages }: { editor: Editor; onOpenMath: () => void; onOpenGallery: () => void; allowImages: boolean }) {
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
    ...(allowImages ? [{ icon: ImageIcon, action: onOpenGallery, active: false }] : []),
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
