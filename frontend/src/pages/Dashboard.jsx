import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  FileText, Heart, Eye, MessageCircle,
  TrendingUp, Users, PenTool, Clock,
  ArrowRight, ArrowUpRight, ArrowDownRight
} from 'lucide-react'

import { userService, postService } from '../services/api'
import { useAuth } from '../context/AuthContext'
import PostCard from '../components/posts/PostCard'

export default function Dashboard() {
  const { user } = useAuth()

  // Fetch author stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['author-stats'],
    queryFn: userService.getStats,
  })

  // Fetch recent posts
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['my-posts', { limit: 4 }],
    queryFn: () => postService.getMyPosts({ limit: 4 }),
  })

  const stats = statsData?.data || {}
  const recentPosts = postsData?.data?.items || []

  const statCards = [
    {
      label: 'Total Posts',
      value: stats.total_posts || 0,
      change: stats.posts_change || 0,
      icon: FileText,
      color: 'accent',
    },
    {
      label: 'Total Views',
      value: stats.total_views || 0,
      change: stats.views_change || 0,
      icon: Eye,
      color: 'blue',
    },
    /* Commented out like/comment stats
    {
      label: 'Total Likes',
      value: stats.total_likes || 0,
      change: stats.likes_change || 0,
      icon: Heart,
      color: 'red',
    },
    {
      label: 'Comments',
      value: stats.total_comments || 0,
      change: stats.comments_change || 0,
      icon: MessageCircle,
      color: 'green',
    },
    */
  ]

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink-900 dark:text-ink-100">
            Welcome back, {user?.profile?.display_name || user?.username}!
          </h1>
          <p className="text-ink-600 dark:text-ink-400 mt-1">
            Here's what's happening with your blog
          </p>
        </div>
        <Link to="/editor" className="btn-primary flex items-center gap-2 w-fit">
          <PenTool className="w-4 h-4" />
          New Post
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-ink-500 text-sm">{stat.label}</p>
                <p className="text-3xl font-bold text-ink-900 dark:text-ink-100 mt-1">
                  {statsLoading ? '—' : formatNumber(stat.value)}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                stat.color === 'accent' ? 'bg-accent-100 dark:bg-accent-900/30' :
                stat.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                stat.color === 'red' ? 'bg-red-100 dark:bg-red-900/30' :
                'bg-green-100 dark:bg-green-900/30'
              }`}>
                <stat.icon className={`w-5 h-5 ${
                  stat.color === 'accent' ? 'text-accent-600' :
                  stat.color === 'blue' ? 'text-blue-600' :
                  stat.color === 'red' ? 'text-red-600' :
                  'text-green-600'
                }`} />
              </div>
            </div>
            {stat.change !== 0 && (
              <div className={`flex items-center gap-1 mt-3 text-sm ${
                stat.change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change > 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                <span>{Math.abs(stat.change)}% from last month</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Recent posts and quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent posts */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ink-900 dark:text-ink-100">
              Recent Posts
            </h2>
            <Link
              to="/my-posts"
              className="text-sm text-accent-600 hover:text-accent-500 flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {postsLoading ? (
            <div className="card p-8 flex items-center justify-center">
              <div className="animate-spin w-6 h-6 border-2 border-accent-500 border-t-transparent rounded-full" />
            </div>
          ) : recentPosts.length === 0 ? (
            <div className="card p-8 text-center">
              <PenTool className="w-12 h-12 text-ink-300 dark:text-ink-600 mx-auto mb-4" />
              <p className="text-ink-600 dark:text-ink-400 mb-4">
                You haven't written any posts yet
              </p>
              <Link to="/editor" className="btn-primary">
                Write Your First Post
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentPosts.map((post) => (
                <PostCard key={post.id} post={post} compact />
              ))}
            </div>
          )}
        </div>

        {/* Quick actions & drafts */}
        <div className="space-y-6">
          {/* Quick actions */}
          <div className="card p-6">
            <h3 className="font-semibold text-ink-900 dark:text-ink-100 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link
                to="/editor"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
                  <PenTool className="w-5 h-5 text-accent-600" />
                </div>
                <div>
                  <p className="font-medium text-ink-900 dark:text-ink-100">New Post</p>
                  <p className="text-sm text-ink-500">Start writing</p>
                </div>
              </Link>
              
              <Link
                to="/my-posts?status=draft"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-ink-900 dark:text-ink-100">Drafts</p>
                  <p className="text-sm text-ink-500">{stats.drafts_count || 0} pending</p>
                </div>
              </Link>
              
              <Link
                to="/settings"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-ink-100 dark:bg-ink-800 flex items-center justify-center">
                  <Users className="w-5 h-5 text-ink-600 dark:text-ink-400" />
                </div>
                <div>
                  <p className="font-medium text-ink-900 dark:text-ink-100">Profile</p>
                  <p className="text-sm text-ink-500">Update your info</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Writing tips */}
          <div className="card p-6 bg-gradient-to-br from-accent-50 to-accent-100 dark:from-accent-900/30 dark:to-accent-800/30 border-accent-200 dark:border-accent-800">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-500 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-ink-900 dark:text-ink-100 mb-1">
                  Writing Tip
                </h4>
                <p className="text-sm text-ink-600 dark:text-ink-400">
                  Posts with images get 2x more engagement. Try adding a cover image to your next post!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
