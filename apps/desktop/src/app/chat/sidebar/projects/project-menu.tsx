import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Codicon } from '@/components/ui/codicon'
import { ColorSwatches } from '@/components/ui/color-swatches'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { useI18n } from '@/i18n'
import { PROFILE_SWATCHES } from '@/lib/profile-color'
import { cn } from '@/lib/utils'
import { dismissAutoProject } from '@/store/layout'
import {
  copyPath,
  deleteProject,
  openProjectAddFolder,
  openProjectRename,
  revealPath,
  setActiveProject,
  updateProject
} from '@/store/projects'

import type { SidebarProjectTree } from './workspace-groups'

// Curated codicons for the project glyph (tinted by the chosen color).
const ICONS = [
  'folder-library', 'repo', 'rocket', 'beaker', 'flame', 'star-full', 'heart',
  'zap', 'target', 'lightbulb', 'tools', 'device-desktop', 'device-mobile', 'terminal',
  'dashboard', 'globe', 'broadcast', 'cloud', 'database', 'package', 'book',
  'organization', 'bug', 'shield', 'key', 'gift', 'telescope', 'home'
]

// Per-project actions, modeled on git GUIs (GitHub Desktop / GitKraken): reveal
// in the file manager, copy path, and "Remove from sidebar" (never deletes files
// — auto projects are dismissed, explicit ones drop their entry). Explicit
// projects additionally get rename / add folder / set active. Hidden until the
// row is hovered (group/workspace), matching the + affordance.
export function ProjectMenu({
  project,
  isActive,
  scoped = false,
  onExitScope
}: {
  project: SidebarProjectTree
  isActive: boolean
  // True when rendered in the entered-project header, so removal can leave the
  // now-defunct scope.
  scoped?: boolean
  onExitScope?: () => void
}) {
  const { t } = useI18n()
  const p = t.sidebar.projects
  const target = { id: project.id, name: project.label }
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [appearanceOpen, setAppearanceOpen] = useState(false)

  const removeAuto = () => {
    dismissAutoProject(project.id)

    if (scoped) {
      onExitScope?.()
    }
  }

  const confirmDelete = () => {
    void deleteProject(project.id)
    setConfirmDeleteOpen(false)

    if (scoped) {
      onExitScope?.()
    }
  }

  return (
    <Popover onOpenChange={setAppearanceOpen} open={appearanceOpen}>
      <DropdownMenu>
        <PopoverAnchor asChild>
          <DropdownMenuTrigger asChild>
            <button
              aria-label={p.menu}
              className={cn(
                'grid size-4 shrink-0 place-items-center rounded-sm bg-transparent text-(--ui-text-quaternary) opacity-0 transition-opacity hover:bg-(--ui-control-hover-background) hover:text-foreground data-[state=open]:opacity-100',
                // In the project header reveal on the whole header hover; in overview
                // rows reveal on the row hover.
                scoped ? 'group-hover/section:opacity-100' : 'group-hover/workspace:opacity-100'
              )}
              onClick={event => event.stopPropagation()}
              type="button"
            >
              <Codicon name="kebab-vertical" size="0.75rem" />
            </button>
          </DropdownMenuTrigger>
        </PopoverAnchor>
        {/* Closing the menu refocuses the trigger (also the popover anchor),
            which the appearance popover would read as focus-outside and die on.
            Suppress that refocus so it survives. */}
        <DropdownMenuContent align="end" className="w-48" onCloseAutoFocus={event => event.preventDefault()} sideOffset={6}>
          {!project.isAuto && (
            <>
              <DropdownMenuItem onSelect={() => openProjectRename(target)}>
                <Codicon name="edit" size="0.875rem" />
                <span>{p.menuRename}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setAppearanceOpen(true)}>
                <Codicon name="symbol-color" size="0.875rem" />
                <span>{p.menuAppearance}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openProjectAddFolder(target)}>
                <Codicon name="new-folder" size="0.875rem" />
                <span>{p.menuAddFolder}</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled={isActive} onSelect={() => void setActiveProject(project.id)}>
                <Codicon name="target" size="0.875rem" />
                <span>{p.menuSetActive}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem disabled={!project.path} onSelect={() => void revealPath(project.path)}>
            <Codicon name="folder-opened" size="0.875rem" />
            <span>{p.reveal}</span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!project.path} onSelect={() => void copyPath(project.path)}>
            <Codicon name="copy" size="0.875rem" />
            <span>{p.copyPath}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {project.isAuto ? (
            <DropdownMenuItem onSelect={removeAuto} variant="destructive">
              <Codicon name="trash" size="0.875rem" />
              <span>{p.removeFromSidebar}</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setConfirmDeleteOpen(true)} variant="destructive">
              <Codicon name="trash" size="0.875rem" />
              <span>{`${p.menuDelete}…`}</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <PopoverContent align="end" className="w-auto p-2" onClick={event => event.stopPropagation()} sideOffset={6}>
        <ColorSwatches
          clearIcon="circle-slash"
          clearLabel={p.noColor}
          onChange={color => void updateProject(project.id, { color })}
          swatches={PROFILE_SWATCHES}
          value={project.color ?? null}
        />
        <div className="mt-2 grid grid-cols-7 gap-1">
          {ICONS.map(name => (
            <button
              aria-label={name}
              className={cn(
                'grid size-7 place-items-center rounded-md text-(--ui-text-tertiary) transition hover:bg-(--ui-control-hover-background)',
                project.icon === name && 'bg-(--ui-control-active-background) text-foreground'
              )}
              key={name}
              onClick={() => void updateProject(project.id, { icon: project.icon === name ? null : name })}
              style={project.icon === name && project.color ? { color: project.color } : undefined}
              type="button"
            >
              <Codicon name={name} size="0.875rem" />
            </button>
          ))}
        </div>
      </PopoverContent>
      <Dialog onOpenChange={setConfirmDeleteOpen} open={confirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{`${p.menuDelete} "${project.label}"?`}</DialogTitle>
            <DialogDescription>
              This removes the saved project from Hermes. Files, git repos, and worktrees stay untouched.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setConfirmDeleteOpen(false)} variant="ghost">
              Cancel
            </Button>
            <Button onClick={confirmDelete} variant="destructive">
              {p.menuDelete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Popover>
  )
}
