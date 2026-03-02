import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Plus, Search, Filter, MoreVertical,
  Edit3, Trash2, Eye, EyeOff, ExternalLink,
  Clock, Heart, MessageCircle, ChevronDown
} from 'lucide-react'
import toast from 'react-hot-toast'

import { postService } from '../services/api'

export default function MyPosts() {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  
  const status = searchParams.get('status') || ''
  const searchQuery = searchParams.get('q') || ''
  const [showDeleteModal, setShowDeleteModal] = useState(null)
  const [menuOpen, setMenuOpen] = useState(null)

  // Fetch posts
  const { data: postsData, isLoading } = useQuery({
    queryKey: ['my-posts', { status, searchQuery }],
    queryFn: () => postService.getMyPosts({
      status: status || undefined,
      search: searchQuery || undefined,
    }),
  })

  const posts = postsData?.data?.items || []

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (postId) => postService.delete(postId),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-posts'])
      toast.success('Post deleted')
      setShowDeleteModal(null)
    },
    onError: () => toast.error('Failed to delete post'),
  })

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ postId, status }) => postService.update(postId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-posts'])
      toast.success('Post status updated')
    },
  })

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }
    setSearchParams(newParams)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusBadge = (postStatus) => {
    switch (postStatus) {
      case 'published':
        return <span className="badge badge-accent">Published</span>
      case 'draft':
        return <span className="badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Draft</span>
      case 'archived':
        return <span className="badge bg-ink-200 text-ink-600 dark:bg-ink-700 dark:text-ink-400">Archived</span>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100">
          My Posts
        </h1>
        <Link to="/editor" className="btn-primary flex items-center gap-2 w-fit">
          <Plus className="w-4 h-4" />
          New Post
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => updateFilter('q', e.target.value)}
            placeholder="Search posts..."
            className="input pl-10 w-full"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="input appearance-none pr-10"
          >
            <option value="">All Posts</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
            <option value="archived">Archived</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
        </div>
      </div>

      {/* Posts list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full" />
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-xl text-ink-600 dark:text-ink-400 mb-4">
            {searchQuery || status ? 'No posts found' : 'No posts yet'}
          </p>
          <Link to="/editor" className="btn-primary">
            Write Your First Post
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card p-4 sm:p-6"
            >
              <div className="flex gap-4">
                {/* Cover image */}
                {post.cover_image && (
                  <div className="hidden sm:block w-32 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={post.cover_image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(post.status)}
                      </div>
                      <Link
                        to={post.status === 'published' ? `/blog/${post.slug}` : `/editor/${post.id}`}
                        className="text-lg font-semibold text-ink-900 dark:text-ink-100 hover:text-accent-600 dark:hover:text-accent-400 line-clamp-1"
                      >
                        {post.title}
                      </Link>
                      {post.excerpt && (
                        <p className="text-ink-600 dark:text-ink-400 text-sm mt-1 line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}
                    </div>

                    {/* Actions menu */}
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === post.id ? null : post.id)}
                        className="p-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-700 text-ink-500"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {menuOpen === post.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-ink-800 rounded-lg shadow-lg border border-ink-200 dark:border-ink-700 py-1 z-10"
                        >
                          <Link
                            to={`/editor/${post.id}`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-ink-700 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700"
                          >
                            <Edit3 className="w-4 h-4" />
                            Edit
                          </Link>
                          
                          {post.status === 'published' && (
                            <a
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-ink-700 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700"
                            >
                              <ExternalLink className="w-4 h-4" />
                              View
                            </a>
                          )}
                          
                          {post.status === 'draft' && (
                            <button
                              onClick={() => {
                                updateStatusMutation.mutate({ postId: post.id, status: 'published' })
                                setMenuOpen(null)
                              }}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-ink-700 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700 w-full"
                            >
                              <Eye className="w-4 h-4" />
                              Publish
                            </button>
                          )}
                          
                          {post.status === 'published' && (
                            <button
                              onClick={() => {
                                updateStatusMutation.mutate({ postId: post.id, status: 'draft' })
                                setMenuOpen(null)
                              }}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-ink-700 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700 w-full"
                            >
                              <EyeOff className="w-4 h-4" />
                              Unpublish
                            </button>
                          )}
                          
                          <hr className="my-1 border-ink-200 dark:border-ink-700" />
                          
                          <button
                            onClick={() => {
                              setShowDeleteModal(post.id)
                              setMenuOpen(null)
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-ink-100 dark:hover:bg-ink-700 w-full"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-4 mt-3 text-sm text-ink-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(post.updated_at || post.created_at)}
                    </span>
                    {post.status === 'published' && (
                      <>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {post.views_count || 0}
                        </span>
                        {/* Commented out like/comment stats
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5" />
                          {post.likes_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5" />
                          {post.comments_count || 0}
                        </span>
                        */}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-ink-900 rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-semibold text-ink-900 dark:text-ink-100 mb-2">
              Delete Post
            </h3>
            <p className="text-ink-600 dark:text-ink-400 mb-6">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(showDeleteModal)}
                disabled={deleteMutation.isPending}
                className="btn-primary bg-red-600 hover:bg-red-700"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
