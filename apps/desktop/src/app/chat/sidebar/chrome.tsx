import type * as React from 'react'

// Shared, content-agnostic sidebar chrome — used by both the flat session
// sections and the project/workspace tree, so it lives outside either to keep
// imports one-directional (no index <-> projects cycle).

/** `loaded/total` when there's more on the server, else just the loaded count. */
export const countLabel = (loaded: number, total: number): string =>
  total > loaded ? `${loaded}/${total}` : String(loaded)

/** The muted count chip next to a section/workspace label. */
export function SidebarCount({ children }: { children: React.ReactNode }) {
  return <span className="text-[0.6875rem] font-medium text-(--ui-text-quaternary)">{children}</span>
}
