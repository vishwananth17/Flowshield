import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export function ThemeToggle() {
  const { toggleTheme, isDark } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="
        relative w-14 h-7 rounded-full
        border border-[var(--border-default)]
        bg-[var(--bg-elevated)]
        transition-all duration-300
        hover:border-[var(--border-gold)]
        focus:outline-none focus:ring-2
        focus:ring-[var(--color-primary)]
        focus:ring-offset-2
        focus:ring-offset-[var(--bg-base)]
      "
    >
      {/* Track */}
      <span className="
        absolute inset-0.5 rounded-full
        bg-gradient-to-r from-[var(--bg-inset)] to-[var(--bg-elevated)]
      " />

      {/* Thumb */}
      <span className={`
        absolute top-0.5 w-6 h-6 rounded-full
        flex items-center justify-center
        transition-all duration-300 ease-spring
        shadow-[var(--shadow-sm)]
        ${isDark
          ? 'left-0.5 bg-[var(--navy-500)]'
          : 'left-7 bg-[var(--gradient-primary)]'
        }
      `}>
        {isDark
          ? <Moon size={12} className="text-gold-300" />
          : <Sun size={12} className="text-[var(--bg-base)]" />
        }
      </span>
    </button>
  )
}
