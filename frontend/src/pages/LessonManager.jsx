import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  Plus, ArrowLeft, Edit, Trash2, Eye, EyeOff, 
  ChevronUp, ChevronDown, FileText
} from 'lucide-react'

import { courseService } from '../services/api'

export default function LessonManager() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch course with lessons
  const { data: courseData, isLoading: courseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseService.getCourseById(courseId),
    enabled: !!courseId,
  })

  const course = courseData?.data
  const lessons = course?.lessons || []

  // Update lesson mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => courseService.updateLesson(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['course', courseId])
    },
  })

  // Delete lesson mutation
  const deleteMutation = useMutation({
    mutationFn: courseService.deleteLesson,
    onSuccess: () => {
      queryClient.invalidateQueries(['course', courseId])
    },
  })

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: ({ lessonId, newOrder }) => courseService.reorderLesson(lessonId, newOrder),
    onSuccess: () => {
      queryClient.invalidateQueries(['course', courseId])
    },
  })

  const handleDelete = (lesson) => {
    if (confirm(`Are you sure you want to delete "${lesson.title}"?`)) {
      deleteMutation.mutate(lesson.id)
    }
  }

  const handleMoveUp = (lesson, index) => {
    if (index > 0) {
      reorderMutation.mutate({ lessonId: lesson.id, newOrder: lessons[index - 1].order })
    }
  }

  const handleMoveDown = (lesson, index) => {
    if (index < lessons.length - 1) {
      reorderMutation.mutate({ lessonId: lesson.id, newOrder: lessons[index + 1].order })
    }
  }

  const togglePublish = (lesson) => {
    updateMutation.mutate({
      id: lesson.id,
      data: { is_published: !lesson.is_published }
    })
  }

  if (courseLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-ink-600 dark:text-ink-400">Course not found</p>
        <Link to="/courses" className="btn-primary mt-4">
          Back to Courses
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/courses"
            className="p-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              {course.cover_image ? (
                <img src={course.cover_image} alt="" className="w-8 h-8 rounded object-cover" />
              ) : (
                <span className="text-2xl">📚</span>
              )}
              <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100">
                {course.title}
              </h1>
            </div>
            <p className="text-ink-600 dark:text-ink-400 mt-1">
              Manage lessons in this course
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {course.is_published && (
            <Link
              to={`/learn/${course.slug}`}
              target="_blank"
              className="btn-secondary flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View Course
            </Link>
          )}
          <Link
            to={`/courses/${courseId}/lessons/new`}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Lesson
          </Link>
        </div>
      </div>

      {/* Lessons List */}
      {lessons.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-ink-900 rounded-xl border border-ink-200 dark:border-ink-800">
          <FileText className="w-16 h-16 text-ink-300 dark:text-ink-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-ink-900 dark:text-ink-100 mb-2">
            No lessons yet
          </h3>
          <p className="text-ink-600 dark:text-ink-400 mb-6">
            Add your first lesson to this course
          </p>
          <Link
            to={`/courses/${courseId}/lessons/new`}
            className="btn-primary"
          >
            Add Lesson
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-ink-900 rounded-xl border border-ink-200 dark:border-ink-800 overflow-hidden">
          <div className="divide-y divide-ink-200 dark:divide-ink-800">
            {lessons.map((lesson, index) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-4 p-4 hover:bg-ink-50 dark:hover:bg-ink-800/50 transition-colors"
              >
                {/* Order Controls */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleMoveUp(lesson, index)}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-ink-200 dark:hover:bg-ink-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMoveDown(lesson, index)}
                    disabled={index === lessons.length - 1}
                    className="p-1 rounded hover:bg-ink-200 dark:hover:bg-ink-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Order Number */}
                <div className="w-8 h-8 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center text-sm font-medium text-accent-700 dark:text-accent-300">
                  {index + 1}
                </div>

                {/* Lesson Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-ink-900 dark:text-ink-100 truncate">
                      {lesson.title}
                    </h3>
                    {lesson.is_published ? (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        Published
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-400">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-ink-500 mt-1">
                    {lesson.reading_time || 5} min read • Slug: {lesson.slug}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePublish(lesson)}
                    className={`p-2 rounded-lg transition-colors ${
                      lesson.is_published
                        ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                        : 'text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800'
                    }`}
                    title={lesson.is_published ? 'Unpublish' : 'Publish'}
                  >
                    {lesson.is_published ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                  <Link
                    to={`/courses/${courseId}/lessons/${lesson.id}/edit`}
                    className="p-2 rounded-lg text-ink-400 hover:text-accent-600 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(lesson)}
                    className="p-2 rounded-lg text-ink-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
