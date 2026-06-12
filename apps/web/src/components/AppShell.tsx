import type { ReactNode } from 'react'
import Navbar from './Navbar'

/**
 * App frame for the "chromed" routes: the Maersk Navbar plus a centered,
 * max-width content container with consistent horizontal padding and vertical
 * rhythm. Used as a React Router layout element in App.tsx
 * (`<AppShell><Outlet /></AppShell>`). Full-bleed routes (JoinSession,
 * ChatSession) render outside the shell.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-maersk-surface text-maersk-ink">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {children}
      </main>
    </div>
  )
}
