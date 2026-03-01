import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, BookOpen, Edit, Trash2, Eye, EyeOff, 
  ChevronRight, Layers, ArrowUpDown, X
} from 'lucide-react'

import { courseService } from '../services/api'

export default function CourseManager() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cover_image: '',
    is_published: false
  })

  // Fetch user's courses
  const { data: coursesData, isLoading } = useQuery({
    queryKey: ['my-courses'],
    queryFn: courseService.getMyCourses,
  })

  const courses = coursesData?.data || []

  // Create course mutation
  const createMutation = useMutation({
    mutationFn: courseService.createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries(['my-courses'])
      setShowCreateModal(false)
      resetForm()
    },
  })

  // Update course mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => courseService.updateCourse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-courses'])
      setEditingCourse(null)
      resetForm()
    },
  })

  // Delete course mutation
  const deleteMutation = useMutation({
    mutationFn: courseService.deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries(['my-courses'])
    },
  })

  const resetForm = () => {
    setFormData({ title: '', description: '', cover_image: '', is_published: false })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleEdit = (course) => {
    setEditingCourse(course)
    setFormData({
      title: course.title,
      description: course.description || '',
      cover_image: course.cover_image || '',
      is_published: course.is_published
    })
    setShowCreateModal(true)
  }

  const handleDelete = (course) => {
    if (confirm(`Are you sure you want to delete "${course.title}"? This will delete all lessons inside it.`)) {
      deleteMutation.mutate(course.id)
    }
  }

  const togglePublish = (course) => {
    updateMutation.mutate({
      id: course.id,
      data: { is_published: !course.is_published }
    })
  }

  const closeModal = () => {
    setShowCreateModal(false)
    setEditingCourse(null)
    resetForm()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100">
            My Courses
          </h1>
          <p className="text-ink-600 dark:text-ink-400 mt-1">
            Create and manage your LMS courses
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Course
        </button>
      </div>

      {/* Courses List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full" />
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-ink-900 rounded-xl border border-ink-200 dark:border-ink-800">
          <BookOpen className="w-16 h-16 text-ink-300 dark:text-ink-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-ink-900 dark:text-ink-100 mb-2">
            No courses yet
          </h3>
          <p className="text-ink-600 dark:text-ink-400 mb-6">
            Create your first course to start adding lessons
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Create Course
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-ink-900 rounded-xl border border-ink-200 dark:border-ink-800 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  {course.cover_image ? (
                    <img 
                      src={course.cover_image} 
                      alt={course.title}
                      className="w-16 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-12 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-accent-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-ink-900 dark:text-ink-100 truncate">
                        {course.title}
                      </h3>
                      {course.is_published ? (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          Published
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          Draft
                        </span>
                      )}
                    </div>
                    {course.description && (
                      <p className="text-sm text-ink-600 dark:text-ink-400 mt-1 line-clamp-2">
                        {course.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-ink-500">
                      <span className="flex items-center gap-1">
                        <Layers className="w-4 h-4" />
                        {course.lessons_count} lessons
                      </span>
                      <span>
                        Slug: <code className="text-xs bg-ink-100 dark:bg-ink-800 px-1 rounded">{course.slug}</code>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePublish(course)}
                    className={`p-2 rounded-lg transition-colors ${
                      course.is_published
                        ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                        : 'text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800'
                    }`}
                    title={course.is_published ? 'Unpublish' : 'Publish'}
                  >
                    {course.is_published ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => handleEdit(course)}
                    className="p-2 rounded-lg text-ink-400 hover:text-accent-600 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(course)}
                    className="p-2 rounded-lg text-ink-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <Link
                    to={`/courses/${course.id}/lessons`}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition-colors text-sm font-medium"
                  >
                    Manage Lessons
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-ink-900 rounded-xl shadow-xl max-w-lg w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-ink-900 dark:text-ink-100">
                  {editingCourse ? 'Edit Course' : 'Create New Course'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Java Programming Fundamentals"
                    className="input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What will students learn in this course?"
                    className="input w-full resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">
                    Cover Image URL
                  </label>
                  <input
                    type="text"
                    value={formData.cover_image}
                    onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                    placeholder="https://example.com/course-image.jpg"
                    className="input w-full"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_published"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="w-4 h-4 rounded border-ink-300 text-accent-500 focus:ring-accent-500"
                  />
                  <label htmlFor="is_published" className="text-sm text-ink-700 dark:text-ink-300">
                    Publish course (make visible to readers)
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="btn-primary flex-1"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? 'Saving...'
                      : editingCourse
                      ? 'Update Course'
                      : 'Create Course'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
