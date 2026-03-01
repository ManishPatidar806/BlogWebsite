import { useState, useEffect } from 'react'
import { Link, useSearchParams, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronDown, ChevronRight, Search, X, Menu, 
  BookOpen, Tag, Folder, TrendingUp, Clock, Star
} from 'lucide-react'
import { categoryService, tagService, postService } from '../../services/api'

// W3Schools-style Topic Sidebar
export default function TopicSidebar({ 
  activePostSlug = null,
  showMobile = false,
  onCloseMobile = () => {},
  className = ''
}) {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState({})
  
  const selectedCategory = searchParams.get('category') || ''
  const selectedTag = searchParams.get('tag') || ''

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
  })

  // Fetch tags
  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: tagService.getAll,
  })

  // Fetch recent posts for sidebar
  const { data: recentPostsData } = useQuery({
    queryKey: ['posts', 'sidebar-recent'],
    queryFn: () => postService.getAll({ page_size: 5, sort: 'latest' }),
  })

  // Fetch trending/popular posts
  const { data: popularPostsData } = useQuery({
    queryKey: ['posts', 'sidebar-popular'],
    queryFn: () => postService.getAll({ page_size: 5, sort: 'popular' }),
  })

  const categories = categoriesData?.data || []
  const tags = tagsData?.data || []
  const recentPosts = recentPostsData?.data?.items || []
  const popularPosts = popularPostsData?.data?.items || []

  // Filter items by search
  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Toggle category expansion
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  // Check if a link is active
  const isActive = (type, value) => {
    if (type === 'category') return selectedCategory === value
    if (type === 'tag') return selectedTag === value
    return false
  }

  // Sidebar section component
  const SidebarSection = ({ title, icon: Icon, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen)
    
    return (
      <div className="mb-4">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-ink-700 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 rounded-lg transition-colors"
        >
          <span className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-accent-500" />
            {title}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-1">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  const sidebarContent = (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-ink-200 dark:border-ink-800">
        <div className="flex items-center justify-between mb-4">
          <Link to="/blog" className="flex items-center gap-2 text-lg font-bold text-ink-900 dark:text-ink-100">
            <BookOpen className="w-5 h-5 text-accent-500" />
            Topics
          </Link>
          {showMobile && (
            <button 
              onClick={onCloseMobile}
              className="p-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-ink-100 dark:bg-ink-800 border-0 rounded-lg focus:ring-2 focus:ring-accent-500"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-ink-400 hover:text-ink-600" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Categories - Link to W3Schools-style tutorial pages */}
        <SidebarSection title="Categories" icon={Folder} defaultOpen={true}>
          {filteredCategories.length === 0 ? (
            <p className="px-3 py-2 text-sm text-ink-500">No categories found</p>
          ) : (
            <div className="space-y-1">
              <Link
                to="/blog"
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                  !selectedCategory && !selectedTag
                    ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 font-medium'
                    : 'text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-ink-400" />
                All Posts
              </Link>
              {filteredCategories.map((category) => (
                <Link
                  key={category.id}
                  to={`/blog?category=${category.slug}`}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                    isActive('category', category.slug)
                      ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 font-medium'
                      : 'text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800'
                  }`}
                >
                  <span 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: category.color || '#6366f1' }}
                  />
                  {category.name}
                  {category.posts_count !== undefined && (
                    <span className="ml-auto text-xs text-ink-400">
                      {category.posts_count}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </SidebarSection>

        {/* Tags */}
        <SidebarSection title="Tags" icon={Tag} defaultOpen={true}>
          {filteredTags.length === 0 ? (
            <p className="px-3 py-2 text-sm text-ink-500">No tags found</p>
          ) : (
            <div className="flex flex-wrap gap-2 px-2">
              {filteredTags.slice(0, 15).map((tag) => (
                <Link
                  key={tag.id}
                  to={`/blog?tag=${tag.slug}`}
                  className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                    isActive('tag', tag.slug)
                      ? 'bg-accent-500 text-white font-medium'
                      : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-400 hover:bg-ink-200 dark:hover:bg-ink-700'
                  }`}
                  style={tag.color && !isActive('tag', tag.slug) ? { 
                    backgroundColor: `${tag.color}20`, 
                    color: tag.color 
                  } : {}}
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}
        </SidebarSection>

        {/* Trending Posts */}
        <SidebarSection title="Trending" icon={TrendingUp} defaultOpen={true}>
          {popularPosts.length === 0 ? (
            <p className="px-3 py-2 text-sm text-ink-500">No trending posts</p>
          ) : (
            <div className="space-y-2">
              {popularPosts.map((post, index) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className={`block px-3 py-2 rounded-lg transition-colors ${
                    activePostSlug === post.slug
                      ? 'bg-accent-100 dark:bg-accent-900/30'
                      : 'hover:bg-ink-100 dark:hover:bg-ink-800'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-accent-500 text-white text-xs font-bold rounded">
                      {index + 1}
                    </span>
                    <span className="text-sm text-ink-700 dark:text-ink-300 line-clamp-2">
                      {post.title}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SidebarSection>

        {/* Recent Posts */}
        <SidebarSection title="Recent" icon={Clock} defaultOpen={false}>
          {recentPosts.length === 0 ? (
            <p className="px-3 py-2 text-sm text-ink-500">No recent posts</p>
          ) : (
            <div className="space-y-2">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className={`block px-3 py-2 rounded-lg transition-colors ${
                    activePostSlug === post.slug
                      ? 'bg-accent-100 dark:bg-accent-900/30'
                      : 'hover:bg-ink-100 dark:hover:bg-ink-800'
                  }`}
                >
                  <p className="text-sm text-ink-700 dark:text-ink-300 line-clamp-2">
                    {post.title}
                  </p>
                  <p className="text-xs text-ink-500 mt-1">
                    {post.reading_time || 5} min read
                  </p>
                </Link>
              ))}
            </div>
          )}
        </SidebarSection>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-ink-200 dark:border-ink-800">
        <Link 
          to="/blog" 
          className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          Browse All Posts
        </Link>
      </div>
    </div>
  )

  // Mobile overlay
  if (showMobile) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 lg:hidden"
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={onCloseMobile}
          />
          
          {/* Sidebar */}
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-ink-900 shadow-xl"
          >
            {sidebarContent}
          </motion.aside>
        </motion.div>
      </AnimatePresence>
    )
  }

  // Desktop sidebar
  return (
    <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0 bg-white dark:bg-ink-900 border-r border-ink-200 dark:border-ink-800 sticky top-0 h-screen overflow-hidden">
      {sidebarContent}
    </aside>
  )
}

// Sidebar toggle button for mobile
export function SidebarToggle({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden fixed bottom-4 left-4 z-40 p-3 bg-accent-500 text-white rounded-full shadow-lg hover:bg-accent-600 transition-colors"
    >
      <Menu className="w-6 h-6" />
    </button>
  )
}
