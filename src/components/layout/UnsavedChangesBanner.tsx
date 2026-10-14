import React from 'react'
import { Button } from '@/components/ui/button'

interface UnsavedChangesBannerProps {
  count: number
  isSaving?: boolean
  onSave?: () => void | Promise<void>
  onDiscard?: () => void
}

export const UnsavedChangesBanner: React.FC<UnsavedChangesBannerProps> = ({
  count,
  isSaving = false,
  onSave,
  onDiscard
}) => {
  if (count <= 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm bg-card/95 backdrop-blur-md border border-border shadow-xl rounded-xl p-3 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <span className="text-xs font-semibold text-foreground truncate">
        You have {count} unsaved change{count === 1 ? '' : 's'}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        {onDiscard && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isSaving}
            onClick={onDiscard}
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
          >
            Discard
          </Button>
        )}
        {onSave && (
          <Button
            type="button"
            size="sm"
            disabled={isSaving}
            onClick={onSave}
            className="h-8 px-3.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        )}
      </div>
    </div>
  )
}
