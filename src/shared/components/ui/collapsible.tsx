import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../../lib/cn"

interface CollapsibleContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | undefined>(undefined)

function useCollapsible() {
  const context = React.useContext(CollapsibleContext)
  if (!context) {
    throw new Error("useCollapsible must be used within a Collapsible")
  }
  return context
}

export interface CollapsibleProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

export function Collapsible({ open: controlledOpen, onOpenChange, children, className }: CollapsibleProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  
  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }, [isControlled, onOpenChange])

  return (
    <CollapsibleContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      <div className={cn("space-y-2", className)}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  )
}

export interface CollapsibleTriggerProps {
  children: React.ReactNode
  className?: string
  asChild?: boolean
}

export function CollapsibleTrigger({ children, className, asChild }: CollapsibleTriggerProps) {
  const { open, onOpenChange } = useCollapsible()

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: () => onOpenChange(!open),
      'aria-expanded': open,
    } as any)
  }

  return (
    <button
      type="button"
      onClick={() => onOpenChange(!open)}
      aria-expanded={open}
      className={cn(
        "flex w-full items-center justify-between rounded-lg p-4 font-medium transition-colors",
        "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        className
      )}
    >
      <span>{children}</span>
      <ChevronDown
        className={cn(
          "h-5 w-5 transition-transform duration-200",
          open && "rotate-180"
        )}
      />
    </button>
  )
}

export interface CollapsibleContentProps {
  children: React.ReactNode
  className?: string
}

export function CollapsibleContent({ children, className }: CollapsibleContentProps) {
  const { open } = useCollapsible()
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [height, setHeight] = React.useState<number | undefined>(open ? undefined : 0)

  React.useEffect(() => {
    if (!contentRef.current) return

    if (open) {
      const contentHeight = contentRef.current.scrollHeight
      setHeight(contentHeight)
      
      // Reset to auto after animation
      const timer = setTimeout(() => {
        setHeight(undefined)
      }, 200)
      
      return () => clearTimeout(timer)
    } else {
      // Set height explicitly before collapsing for smooth animation
      setHeight(contentRef.current.scrollHeight)
      requestAnimationFrame(() => {
        setHeight(0)
      })
    }
  }, [open])

  return (
    <div
      ref={contentRef}
      style={{ height }}
      className={cn(
        "overflow-hidden transition-all duration-200 ease-in-out",
        className
      )}
    >
      <div className="p-4 pt-0">
        {children}
      </div>
    </div>
  )
}

