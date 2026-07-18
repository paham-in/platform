import {
  BoldIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  RedoIcon,
  StrikethroughIcon,
  UndoIcon,
} from "lucide-react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { cn } from "@/lib/utils";

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
}: {
  content: string;
  onChange: (html: string) => void;
  editable?: boolean;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  return (
    <div className="rounded-md border">
      <Toolbar editor={editor} />
      <EditorContent
        editor={editor}
        className="prose prose-sm dark:prose-invert max-w-none p-4 focus:outline-none [&_.ProseMirror]:min-h-[300px] [&_.ProseMirror]:outline-none"
      />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
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
