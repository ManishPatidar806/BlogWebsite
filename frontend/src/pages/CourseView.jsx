import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  ChevronLeft, ChevronRight, Menu, X, Clock, 
  BookOpen, ArrowLeft, Home, User
} from 'lucide-react'

import { courseService } from '../services/api'
import MarkdownPreview from '../components/editor/MarkdownPreview'

export default function CourseView() {
  const { courseSlug, lessonSlug } = useParams()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Fetch course with lessons list
  const { data: courseData, isLoading: courseLoading } = useQuery({
    queryKey: ['course-view', courseSlug],
    queryFn: () => courseService.getCourseBySlug(courseSlug),
    enabled: !!courseSlug,
  })

  // Fetch current lesson content
  const { data: lessonData, isLoading: lessonLoading, error: lessonError } = useQuery({
    queryKey: ['lesson-view', courseSlug, lessonSlug],
    queryFn: () => lessonSlug 
      ? courseService.getLesson(courseSlug, lessonSlug)
      : courseService.getFirstLesson(courseSlug),
    enabled: !!courseSlug,
  })

  const course = courseData?.data
  const lessons = course?.lessons || []
  const currentLesson = lessonData?.data

  // Find current, previous, and next lessons
  const currentIndex = lessons.findIndex(l => l.slug === (lessonSlug || currentLesson?.slug))
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null

  // Navigate to lesson without full page reload
  const navigateToLesson = (slug) => {
    navigate(`/learn/${courseSlug}/${slug}`)
    setMobileSidebarOpen(false)
  }

  if (courseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50 dark:bg-ink-950">
        <div className="animate-spin w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-ink-50 dark:bg-ink-950">
        <BookOpen className="w-16 h-16 text-ink-300 dark:text-ink-600 mb-4" />
        <p className="text-xl text-ink-600 dark:text-ink-400 mb-4">Course not found</p>
        <Link to="/blog" className="btn-primary">
          Back to Blog
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-ink-50 dark:bg-ink-950">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:sticky top-0 left-0 h-screen z-50 lg:z-0
          w-72 xl:w-80 bg-white dark:bg-ink-900 
          border-r border-ink-200 dark:border-ink-800
          transform transition-transform duration-300 ease-in-out
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${sidebarOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full lg:w-0 lg:border-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex-shrink-0 p-4 border-b border-ink-200 dark:border-ink-800">
            <div className="flex items-center justify-between">
              <Link 
                to="/blog" 
                className="flex items-center gap-2 text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to Blog</span>
              </Link>
              <button 
                onClick={() => setMobileSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{course.icon || '📚'}</span>
                <div>
                  <h1 className="text-lg font-bold text-ink-900 dark:text-ink-100">
                    {course.title}
                  </h1>
                  <p className="text-xs text-ink-500">
                    {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
                  </p>
                </div>
              </div>
              {course.author && (
                <div className="flex items-center gap-2 mt-3 text-sm text-ink-500">
                  <User className="w-4 h-4" />
                  <span>by {course.author.username}</span>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Content - Lesson List */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {lessons.map((lesson, index) => {
                const isActive = lesson.slug === (lessonSlug || currentLesson?.slug)
                return (
                  <li key={lesson.id}>
                    <button
                      onClick={() => navigateToLesson(lesson.slug)}
                      className={`
                        w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors
                        flex items-center gap-3
                        ${isActive 
                          ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 font-medium' 
                          : 'text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800'
                        }
                      `}
                    >
                      <span className={`
                        w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium
                        ${isActive 
                          ? 'bg-accent-500 text-white' 
                          : 'bg-ink-200 dark:bg-ink-700 text-ink-600 dark:text-ink-400'
                        }
                      `}>
                        {index + 1}
                      </span>
                      <span className="flex-1 line-clamp-2">{lesson.title}</span>
                    </button>
                  </li>
                )
              })}
            </ul>

            {lessons.length === 0 && (
              <p className="text-sm text-ink-500 text-center py-8">
                No lessons in this course yet.
              </p>
            )}
          </nav>

          {/* Sidebar Footer */}
          <div className="flex-shrink-0 p-4 border-t border-ink-200 dark:border-ink-800">
            <Link 
              to="/"
              className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-white dark:bg-ink-900 border-b border-ink-200 dark:border-ink-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-medium text-ink-900 dark:text-ink-100 truncate mx-4">
              {course.title}
            </span>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Desktop Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden lg:flex fixed left-0 top-1/2 -translate-y-1/2 z-30 p-2 bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-r-lg shadow-sm hover:bg-ink-50 dark:hover:bg-ink-700 transition-colors"
          style={{ left: sidebarOpen ? '18rem' : '0' }}
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {/* Lesson Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {lessonLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full" />
            </div>
          ) : lessonError || !currentLesson ? (
            <div className="text-center py-20">
              <BookOpen className="w-16 h-16 text-ink-300 dark:text-ink-600 mx-auto mb-4" />
              <p className="text-xl text-ink-600 dark:text-ink-400 mb-2">
                No lesson found
              </p>
              <p className="text-ink-500 mb-6">
                This course doesn't have any published lessons yet.
              </p>
              <Link to="/blog" className="btn-primary">
                Back to Blog
              </Link>
            </div>
          ) : (
            <motion.article
              key={currentLesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Lesson Header */}
              <header className="mb-8">
                <div className="flex items-center gap-2 text-sm text-ink-500 mb-4">
                  <Link 
                    to="/blog" 
                    className="hover:text-accent-600 dark:hover:text-accent-400"
                  >
                    Courses
                  </Link>
                  <span>/</span>
                  <Link 
                    to={`/learn/${courseSlug}`}
                    className="hover:text-accent-600 dark:hover:text-accent-400"
                  >
                    {course.title}
                  </Link>
                  <span>/</span>
                  <span className="text-ink-700 dark:text-ink-300">{currentLesson.title}</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold text-ink-900 dark:text-ink-100 font-serif mb-4">
                  {currentLesson.title}
                </h1>

                <div className="flex items-center gap-4 text-sm text-ink-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {currentLesson.reading_time || 5} min read
                  </span>
                  <span>
                    Lesson {currentIndex + 1} of {lessons.length}
                  </span>
                </div>
              </header>

              {/* Lesson Content */}
              <div className="prose-container">
                <MarkdownPreview content={currentLesson.content} />
              </div>

              {/* Navigation */}
              <nav className="mt-12 pt-8 border-t border-ink-200 dark:border-ink-800">
                <div className="flex items-center justify-between gap-4">
                  {prevLesson ? (
                    <button
                      onClick={() => navigateToLesson(prevLesson.slug)}
                      className="flex-1 group text-left p-4 rounded-lg border border-ink-200 dark:border-ink-700 hover:border-accent-500 dark:hover:border-accent-500 transition-colors"
                    >
                      <span className="text-xs text-ink-500 flex items-center gap-1 mb-1">
                        <ChevronLeft className="w-3 h-3" />
                        Previous Lesson
                      </span>
                      <span className="text-sm font-medium text-ink-900 dark:text-ink-100 group-hover:text-accent-600 dark:group-hover:text-accent-400 line-clamp-2">
                        {prevLesson.title}
                      </span>
                    </button>
                  ) : (
                    <div className="flex-1" />
                  )}

                  {nextLesson ? (
                    <button
                      onClick={() => navigateToLesson(nextLesson.slug)}
                      className="flex-1 group text-right p-4 rounded-lg border border-ink-200 dark:border-ink-700 hover:border-accent-500 dark:hover:border-accent-500 transition-colors"
                    >
                      <span className="text-xs text-ink-500 flex items-center justify-end gap-1 mb-1">
                        Next Lesson
                        <ChevronRight className="w-3 h-3" />
                      </span>
                      <span className="text-sm font-medium text-ink-900 dark:text-ink-100 group-hover:text-accent-600 dark:group-hover:text-accent-400 line-clamp-2">
                        {nextLesson.title}
                      </span>
                    </button>
                  ) : (
                    <div className="flex-1" />
                  )}
                </div>
              </nav>
            </motion.article>
          )}
        </div>
      </main>
    </div>
  )
}
