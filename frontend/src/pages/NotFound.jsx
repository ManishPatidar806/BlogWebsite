import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto text-center"
        >
          {/* 404 illustration */}
          <div className="relative mb-8">
            <span className="text-[150px] sm:text-[200px] font-bold text-ink-100 dark:text-ink-800 select-none">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
                <Search className="w-12 h-12 text-accent-500" />
              </div>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-ink-900 dark:text-ink-100 mb-4">
            Page not found
          </h1>
          
          <p className="text-ink-600 dark:text-ink-400 mb-8">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/"
              className="btn-primary flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>

          {/* Suggestions */}
          <div className="mt-12 pt-8 border-t border-ink-200 dark:border-ink-800">
            <p className="text-sm text-ink-500 mb-4">
              Here are some helpful links instead:
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/blog"
                className="text-accent-600 hover:text-accent-500 hover:underline"
              >
                Browse Blog
              </Link>
              <Link
                to="/login"
                className="text-accent-600 hover:text-accent-500 hover:underline"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-accent-600 hover:text-accent-500 hover:underline"
              >
                Create Account
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
