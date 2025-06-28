import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Initialize after mount to avoid hydration mismatch
  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = stored === 'dark' || (!stored && prefersDark)
    
    setDark(shouldBeDark)
    setMounted(true)
    
    // Apply initial theme immediately
    if (shouldBeDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [dark, mounted])

  // Prevent flash during hydration
  if (!mounted) return null

  return (
    <button
      onClick={() => setDark(!dark)}
      className="fixed top-4 right-4 z-50 px-3 py-1 bg-gray-200 dark:bg-gray-700 text-black dark:text-white border border-gray-400 dark:border-gray-600 rounded shadow hover:bg-gray-300 dark:hover:bg-gray-600 transition"
    >
      {dark ? '☀ Light Mode' : '🌙 Dark Mode'}
    </button>
  )
}