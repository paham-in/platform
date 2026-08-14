import * as React from "react"
import { useNavigate } from "@tanstack/react-router"

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import type { SidebarGroup } from "@/lib/sidebar"

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-border bg-muted/60 px-1 font-mono text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  )
}

type CommandMenuProps = {
  groups: SidebarGroup[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandMenu({ groups, open, onOpenChange }: CommandMenuProps) {
  const navigate = useNavigate()

  // Buka/tutup palette lewat shortcut ⌘K / Ctrl+K.
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onOpenChange])

  const go = (to: string) => {
    onOpenChange(false)
    navigate({ to })
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Cari halaman"
      description="Cari menu sidebar untuk pindah halaman dengan cepat."
      className="sm:max-w-lg"
    >
      <Command vimBindings={false}>
        <CommandInput placeholder="Cari menu atau halaman..." />
        <CommandList>
          <CommandEmpty>Tidak ada hasil.</CommandEmpty>
          {groups.map((group) => (
            <CommandGroup key={group.label} heading={group.label}>
              {group.items.map((item) =>
                item.items?.length ? (
                  item.items.map((sub) => (
                    <CommandItem
                      key={sub.to}
                      value={`${item.label} ${sub.label}`}
                      onSelect={() => go(sub.to)}
                    >
                      <item.icon />
                      <span>
                        {item.label} <span className="text-muted-foreground">›</span>{" "}
                        {sub.label}
                      </span>
                    </CommandItem>
                  ))
                ) : (
                  <CommandItem
                    key={item.to}
                    value={item.label}
                    onSelect={() => go(item.to!)}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </CommandItem>
                )
              )}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
      <footer className="flex items-center justify-between border-t border-border/50 px-4 py-2.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Kbd>↑↓</Kbd>
          <span>navigasi</span>
          <span className="mx-1 opacity-50">·</span>
          <Kbd>↵</Kbd>
          <span>pilih</span>
          <span className="mx-1 opacity-50">·</span>
          <Kbd>esc</Kbd>
          <span>tutup</span>
        </div>
        <div className="flex items-center gap-1">
          <Kbd>⌘K</Kbd>
        </div>
      </footer>
    </CommandDialog>
  )
}
