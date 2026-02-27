import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Bookmark, Trash2, Search, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useState } from 'react'

import { postService } from '../services/api'
import PostCard from '../components/posts/PostCard'

export default function Bookmarks() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch bookmarks
  const { data: bookmarksData, isLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: postService.getBookmarks,
  })

  // Remove bookmark mutation
  const removeMutation = useMutation({
    mutationFn: (postId) => postService.bookmark(postId),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookmarks'])
      toast.success('Removed from bookmarks')
    },
  })

  const bookmarks = bookmarksData?.data?.items || []
  
  // Filter bookmarks by search
  const filteredBookmarks = searchQuery
    ? bookmarks.filter(post => 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : bookmarks

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100">
          Bookmarks
        </h1>
        <p className="text-ink-600 dark:text-ink-400 mt-1">
          Posts you've saved for later
        </p>
      </div>

      {/* Search */}
      {bookmarks.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bookmarks..."
            className="input pl-10 w-full max-w-md"
          />
        </div>
      )}

      {/* Bookmarks grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-accent-500 animate-spin" />
        </div>
      ) : filteredBookmarks.length === 0 ? (
        <div className="card p-12 text-center">
          <Bookmark className="w-16 h-16 text-ink-300 dark:text-ink-600 mx-auto mb-4" />
          <p className="text-xl text-ink-600 dark:text-ink-400 mb-2">
            {searchQuery ? 'No bookmarks found' : 'No bookmarks yet'}
          </p>
          <p className="text-ink-500">
            {searchQuery 
              ? 'Try a different search term'
              : 'Save posts you want to read later'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookmarks.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative"
            >
              <PostCard post={post} />
              <button
                onClick={() => removeMutation.mutate(post.id)}
                disabled={removeMutation.isPending}
                className="absolute top-4 right-4 p-2 rounded-lg bg-white/90 dark:bg-ink-800/90 hover:bg-red-50 dark:hover:bg-red-900/30 text-ink-500 hover:text-red-600 transition-colors shadow-sm"
                title="Remove bookmark"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
