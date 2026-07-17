import * as React from "react"
import { cn } from "@/lib/utils"

function AlertDialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) {
  return open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative z-50 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        {children}
      </div>
    </div>
  ) : null
}

export function AlertDialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 space-y-1">{children}</div>
}

export function AlertDialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold">{children}</h2>
}

export function AlertDialogDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}

export function AlertDialogFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mt-4 flex justify-end gap-3", className)}>{children}</div>
}

export { AlertDialog }
