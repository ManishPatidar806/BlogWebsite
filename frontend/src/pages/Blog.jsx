import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, Filter, X, ChevronDown, Loader2, BookOpen, FileText, Layers, User } from 'lucide-react'

import { postService, tagService, categoryService, courseService } from '../services/api'
import PostCard from '../components/posts/PostCard'

// Course Card Component (similar style to PostCard)
function CourseCard({ course }) {
  return (
    <article className="card card-hover overflow-hidden">
      {/* Cover Image */}
      {course.cover_image ? (
        <Link to={`/learn/${course.slug}`} className="block aspect-video overflow-hidden">
          <img
            src={course.cover_image}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </Link>
      ) : (
        <Link 
          to={`/learn/${course.slug}`} 
          className="block aspect-video overflow-hidden bg-gradient-to-br from-accent-100 to-accent-200 dark:from-accent-900/30 dark:to-accent-800/30 flex items-center justify-center"
        >
          <BookOpen className="w-16 h-16 text-accent-500/50" />
        </Link>
      )}

      <div className="p-5">
        {/* Course Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300">
            Course
          </span>
          <span className="flex items-center gap-1 text-xs text-ink-500">
            <Layers className="w-3.5 h-3.5" />
            {course.lessons_count || 0} lessons
          </span>
        </div>

        {/* Title */}
        <Link to={`/learn/${course.slug}`}>
          <h3 className="font-semibold text-lg text-ink-900 dark:text-ink-100 hover:text-accent-600 dark:hover:text-accent-400 transition-colors line-clamp-2">
            {course.title}
          </h3>
        </Link>

        {/* Description */}
        {course.description && (
          <p className="mt-2 text-sm text-ink-600 dark:text-ink-400 line-clamp-2">
            {course.description}
          </p>
        )}

        {/* Author */}
        {course.author && (
          <div className="mt-4 flex items-center gap-2">
            <User className="w-4 h-4 text-ink-400" />
            <span className="text-sm text-ink-600 dark:text-ink-400">
              {course.author.username}
            </span>
          </div>
        )}
      </div>
    </article>
  )
}

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState('posts') // 'posts' | 'courses'
  
  // Get current filters from URL
  const searchQuery = searchParams.get('q') || ''
  const selectedTag = searchParams.get('tag') || ''
  const selectedCategory = searchParams.get('category') || ''
  const sortBy = searchParams.get('sort') || 'latest'
  const page = parseInt(searchParams.get('page') || '1', 10)

  // Fetch posts
  const { data: postsData, isLoading: postsLoading, isFetching: postsFetching } = useQuery({
    queryKey: ['posts', { searchQuery, selectedTag, selectedCategory, sortBy, page }],
    queryFn: () => postService.getAll({
      search: searchQuery || undefined,
      tag: selectedTag || undefined,
      category: selectedCategory || undefined,
      sort: sortBy,
      page,
      limit: 12,
    }),
    enabled: activeTab === 'posts',
  })

  // Fetch public courses
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['public-courses'],
    queryFn: courseService.getPublicCourses,
    enabled: activeTab === 'courses',
  })

  // Fetch tags and categories for filters
  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: tagService.getAll,
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
  })

  const posts = postsData?.data?.items || []
  const totalPages = postsData?.data?.pages || 1
  const courses = coursesData?.data || []
  const tags = tagsData?.data || []
  const categories = categoriesData?.data || []

  // Update search params
  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }
    // Reset to page 1 when filters change
    if (key !== 'page') {
      newParams.set('page', '1')
    }
    setSearchParams(newParams)
  }

  const clearFilters = () => {
    setSearchParams({})
  }

  const hasActiveFilters = searchQuery || selectedTag || selectedCategory || sortBy !== 'latest'

  const isLoading = activeTab === 'posts' ? postsLoading : coursesLoading
  const isFetching = activeTab === 'posts' ? postsFetching : false

  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-ink-900 dark:text-ink-100 font-serif">
            Explore
          </h1>
          <p className="text-ink-600 dark:text-ink-400 mt-2">
            Discover stories, ideas, and courses from our community
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center bg-ink-100 dark:bg-ink-800 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'posts'
                  ? 'bg-white dark:bg-ink-700 text-ink-900 dark:text-ink-100 shadow-sm'
                  : 'text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              Posts
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'courses'
                  ? 'bg-white dark:bg-ink-700 text-ink-900 dark:text-ink-100 shadow-sm'
                  : 'text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Courses
            </button>
          </div>
        </div>

        {/* Posts Tab Content */}
        {activeTab === 'posts' && (
          <>
            {/* Search and filters */}
            <div className="mb-8 space-y-4 max-w-4xl mx-auto">
              {/* Search bar */}
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-500 dark:text-ink-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => updateFilter('q', e.target.value)}
                    placeholder="Search posts..."
                    className="input pl-12 w-full"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => updateFilter('q', '')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-ink-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-ink-200 dark:bg-ink-700' : ''}`}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="w-2 h-2 rounded-full bg-accent-500" />
                  )}
                </button>
              </div>

              {/* Filter panel */}
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="card p-6"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* Sort */}
                    <div>
                      <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-2">
                        Sort by
                      </label>
                      <div className="relative">
                        <select
                          value={sortBy}
                          onChange={(e) => updateFilter('sort', e.target.value)}
                          className="input w-full appearance-none pr-10"
                        >
                          <option value="latest">Latest</option>
                          <option value="popular">Most Popular</option>
                          <option value="oldest">Oldest</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500 dark:text-ink-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-2">
                        Category
                      </label>
                      <div className="relative">
                        <select
                          value={selectedCategory}
                          onChange={(e) => updateFilter('category', e.target.value)}
                          className="input w-full appearance-none pr-10"
                        >
                          <option value="">All Categories</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.slug}>{cat.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500 dark:text-ink-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-2">
                        Tag
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {tags.slice(0, 6).map((tag) => (
                          <button
                            key={tag.id}
                            onClick={() => updateFilter('tag', selectedTag === tag.slug ? '' : tag.slug)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              selectedTag === tag.slug
                                ? 'bg-accent-500 text-white'
                                : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-400 hover:bg-ink-200 dark:hover:bg-ink-700'
                            }`}
                          >
                            #{tag.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="mt-4 text-sm text-accent-600 hover:text-accent-500"
                    >
                      Clear all filters
                    </button>
                  )}
                </motion.div>
              )}
            </div>

            {/* Results info */}
            {(searchQuery || selectedTag || selectedCategory) && (
              <p className="text-ink-600 dark:text-ink-400 mb-6 text-center">
                {posts.length} results
                {searchQuery && <span> for "{searchQuery}"</span>}
                {selectedTag && <span> in #{selectedTag}</span>}
                {selectedCategory && <span> in {selectedCategory}</span>}
              </p>
            )}

            {/* Posts grid */}
            {postsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-accent-500 animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xl text-ink-600 dark:text-ink-400 mb-4">
                  No posts found
                </p>
                <p className="text-ink-600 dark:text-ink-400">
                  Try adjusting your search or filters
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="btn-primary mt-4"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
                  {posts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <PostCard post={post} />
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    <button
                      onClick={() => updateFilter('page', String(page - 1))}
                      disabled={page <= 1}
                      className="btn-secondary btn-sm disabled:opacity-50"
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (page <= 3) {
                          pageNum = i + 1
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = page - 2 + i
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => updateFilter('page', String(pageNum))}
                            className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                              page === pageNum
                                ? 'bg-accent-500 text-white'
                                : 'text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>
                    
                    <button
                      onClick={() => updateFilter('page', String(page + 1))}
                      disabled={page >= totalPages}
                      className="btn-secondary btn-sm disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Courses Tab Content */}
        {activeTab === 'courses' && (
          <>
            {coursesLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-accent-500 animate-spin" />
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen className="w-16 h-16 text-ink-300 dark:text-ink-600 mx-auto mb-4" />
                <p className="text-xl text-ink-600 dark:text-ink-400 mb-4">
                  No courses available yet
                </p>
                <p className="text-ink-600 dark:text-ink-400">
                  Check back soon for new learning content
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
                {courses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="w-full"
                  >
                    <CourseCard course={course} />
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {isFetching && !isLoading && (
          <div className="fixed bottom-4 right-4 bg-white dark:bg-ink-800 rounded-lg shadow-lg px-4 py-2 flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-accent-500 animate-spin" />
            <span className="text-sm text-ink-600 dark:text-ink-400">Loading...</span>
          </div>
        )}
      </div>
    </div>
  )
}
