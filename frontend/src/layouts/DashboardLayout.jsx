import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  FileText, 
  Bookmark, 
  Settings, 
  PenSquare,
  Menu,
  X,
  LogOut
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import ThemeToggle from '../components/ui/ThemeToggle'
import Avatar from '../components/ui/Avatar'

const sidebarLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/my-posts', icon: FileText, label: 'My Posts' },
  { to: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout, isWriter } = useAuth()

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink-900/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 
          bg-white dark:bg-ink-900 
          border-r border-ink-200 dark:border-ink-800
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-ink-200 dark:border-ink-800">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">I</span>
            </div>
            <span className="text-xl font-semibold text-ink-900 dark:text-ink-100">
              Inkwell
            </span>
          </NavLink>
          
          <button
            className="lg:hidden p-1 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5 text-ink-600 dark:text-ink-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl
                text-sm font-medium transition-colors
                ${isActive 
                  ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400' 
                  : 'text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800'
                }
              `}
              onClick={() => setSidebarOpen(false)}
            >
              <link.icon className="w-5 h-5" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* New Post Button */}
        {isWriter && (
          <div className="px-4 mt-4">
            <NavLink
              to="/editor"
              className="btn-primary w-full flex items-center justify-center gap-2"
              onClick={() => setSidebarOpen(false)}
            >
              <PenSquare className="w-4 h-4" />
              New Post
            </NavLink>
          </div>
        )}

        {/* User section at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-ink-200 dark:border-ink-800">
          <div className="flex items-center gap-3 mb-4">
            <Avatar 
              src={user?.profile?.avatar_url} 
              alt={user?.username}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink-900 dark:text-ink-100 truncate">
                {user?.profile?.display_name || user?.username}
              </p>
              <p className="text-xs text-ink-500 truncate">
                {user?.email}
              </p>
            </div>
            <ThemeToggle />
          </div>
          
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 h-16 bg-white dark:bg-ink-900 border-b border-ink-200 dark:border-ink-800 flex items-center px-4">
          <button
            className="p-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5 text-ink-600 dark:text-ink-400" />
          </button>
          
          <div className="flex-1 flex justify-center">
            <NavLink to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">I</span>
              </div>
            </NavLink>
          </div>
          
          <ThemeToggle />
        </header>

        {/* Page content */}
        <motion.main 
          className="p-6 lg:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  )
}
