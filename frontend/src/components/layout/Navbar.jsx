import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Search, PenSquare } from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import ThemeToggle from '../ui/ThemeToggle'
import Avatar from '../ui/Avatar'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/blog', label: 'Blog' },
]

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { user, isAuthenticated, isWriter, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glass border-b border-ink-200/50 dark:border-ink-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-soft group-hover:shadow-soft-lg transition-shadow">
                <span className="text-white font-bold text-xl">I</span>
              </div>
              <span className="text-xl font-semibold text-ink-900 dark:text-ink-100 hidden sm:block">
                Inkwell
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => `
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/20' 
                      : 'text-ink-700 dark:text-ink-300 hover:text-ink-900 dark:hover:text-ink-100 hover:bg-ink-100 dark:hover:bg-ink-800'
                    }
                  `}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* Search button */}
              <button
                className="btn-ghost btn-icon"
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              <ThemeToggle />

              {isAuthenticated ? (
                <>
                  {isWriter && (
                    <Link to="/editor" className="btn-primary btn-sm hidden sm:flex items-center gap-1">
                      <PenSquare className="w-4 h-4" />
                      Write
                    </Link>
                  )}
                  
                  <Link to="/dashboard" className="ml-1">
                    <Avatar 
                      src={user?.profile?.avatar_url}
                      alt={user?.username}
                      size="sm"
                      className="ring-2 ring-transparent hover:ring-accent-400 transition-all"
                    />
                  </Link>
                </>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/login" className="btn-ghost btn-sm">
                    Writer Sign In
                  </Link>
                  <Link to="/register" className="btn-primary btn-sm">
                    Become a Writer
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                className="md:hidden btn-ghost btn-icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-b border-ink-200/50 dark:border-ink-800/50"
          >
            <nav className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => `
                    block px-4 py-3 rounded-xl text-sm font-medium transition-colors
                    ${isActive 
                      ? 'text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/20' 
                      : 'text-ink-600 dark:text-ink-400'
                    }
                  `}
                >
                  {link.label}
                </NavLink>
              ))}
              
              <div className="divider" />
              
              {isAuthenticated ? (
                <>
                  <NavLink
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-xl text-sm font-medium text-ink-600 dark:text-ink-400"
                  >
                    Dashboard
                  </NavLink>
                  {isWriter && (
                    <Link
                      to="/editor"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
                    >
                      <PenSquare className="w-4 h-4" />
                      Write
                    </Link>
                  )}
                </>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Link 
                    to="/login" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-secondary flex-1"
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-primary flex-1"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
