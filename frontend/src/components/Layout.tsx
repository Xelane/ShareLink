import { ReactNode } from 'react'
import Header from './Header'
import { useTheme } from '../context/ThemeContext'

export default function Layout({ children }: { children: ReactNode }) {
  const { theme } = useTheme()

  return (
    <div className={`min-h-screen flex flex-col ${theme}`}>
      <Header className="transition-colors duration-500" />
        <main className="flex-grow flex items-center justify-center p-6 bg-[var(--bg-color2)] text-[var(--text-color)] transition-colors duration-500">
        {children}
      </main>
    </div>
  )
}
