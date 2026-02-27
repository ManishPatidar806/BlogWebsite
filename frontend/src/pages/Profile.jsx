import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Calendar, MapPin, Link2, Twitter, 
  Github, FileText, Heart, Eye
} from 'lucide-react'

import { userService, postService } from '../services/api'
import Avatar from '../components/ui/Avatar'
import PostCard from '../components/posts/PostCard'

export default function Profile() {
  const { username } = useParams()

  // Fetch user profile
  const { data: userData, isLoading: userLoading, error } = useQuery({
    queryKey: ['user', username],
    queryFn: () => userService.getProfile(username),
  })

  // Fetch user's posts
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['user-posts', username],
    queryFn: () => postService.getByAuthor(username),
    enabled: !!userData?.data,
  })

  const user = userData?.data
  const posts = postsData?.data?.items || []

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    })
  }

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-xl text-ink-600 dark:text-ink-400 mb-4">User not found</p>
        <Link to="/" className="btn-primary">
          Go Home
        </Link>
      </div>
    )
  }

  return (
    <div className="py-8 sm:py-12">
      <div className="container">
        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 sm:p-8 mb-8"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar
              src={user.profile?.avatar_url}
              name={user.username}
              size="2xl"
            />
            
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-ink-900 dark:text-ink-100">
                {user.profile?.display_name || user.username}
              </h1>
              <p className="text-ink-600 dark:text-ink-400 mt-1">@{user.username}</p>
              
              {user.profile?.bio && (
                <p className="text-ink-700 dark:text-ink-300 mt-4 max-w-2xl">
                  {user.profile.bio}
                </p>
              )}

              {/* Meta info */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4 text-sm text-ink-600 dark:text-ink-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {formatDate(user.created_at)}
                </span>
                
                {user.profile?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {user.profile.location}
                  </span>
                )}
              </div>

              {/* Social links */}
              <div className="flex justify-center sm:justify-start gap-3 mt-4">
                {user.profile?.website && (
                  <a
                    href={user.profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
                    title="Website"
                  >
                    <Link2 className="w-5 h-5" />
                  </a>
                )}
                {user.profile?.twitter && (
                  <a
                    href={`https://twitter.com/${user.profile.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
                    title="Twitter"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
                {user.profile?.github && (
                  <a
                    href={`https://github.com/${user.profile.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
                    title="GitHub"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex sm:flex-col gap-6 sm:gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-ink-900 dark:text-ink-100">
                  {user.stats?.total_posts || 0}
                </p>
                <p className="text-sm text-ink-600 dark:text-ink-400">Posts</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-ink-900 dark:text-ink-100">
                  {user.stats?.total_likes || 0}
                </p>
                <p className="text-sm text-ink-600 dark:text-ink-400">Likes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-ink-900 dark:text-ink-100">
                  {user.stats?.total_views || 0}
                </p>
                <p className="text-sm text-ink-600 dark:text-ink-400">Views</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Posts */}
        <div>
          <h2 className="text-xl font-semibold text-ink-900 dark:text-ink-100 mb-6">
            Posts by {user.profile?.display_name || user.username}
          </h2>

          {postsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-accent-500 border-t-transparent rounded-full" />
            </div>
          ) : posts.length === 0 ? (
            <div className="card p-12 text-center">
              <FileText className="w-16 h-16 text-ink-300 dark:text-ink-600 mx-auto mb-4" />
              <p className="text-ink-600 dark:text-ink-400">
                No posts yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <PostCard post={post} showAuthor={false} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
