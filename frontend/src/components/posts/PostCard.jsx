import { Link } from 'react-router-dom'
import { Heart, Bookmark, MessageCircle, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

import Avatar from '../ui/Avatar'

export default function PostCard({ post, featured = false, compact = false, showAuthor = true }) {
  const publishedDate = post.published_at 
    ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true })
    : 'Draft'

  if (compact) {
    return (
      <article className="card card-hover p-4">
        <Link to={`/blog/${post.slug}`}>
          <h3 className="font-semibold text-ink-900 dark:text-ink-100 hover:text-accent-600 dark:hover:text-accent-400 transition-colors line-clamp-2">
            {post.title}
          </h3>
        </Link>
        <div className="mt-2 flex items-center justify-between text-xs text-ink-600 dark:text-ink-400">
          <span>{publishedDate}</span>
          {/* Commented out like/comment stats
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" />
              {post.likes_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              {post.comments_count || 0}
            </span>
          </div>
          */}
        </div>
      </article>
    )
  }

  return (
    <article className={`card card-hover overflow-hidden ${featured ? 'h-full' : ''}`}>
      {/* Cover Image */}
      {post.cover_image && (
        <Link to={`/blog/${post.slug}`} className="block aspect-video overflow-hidden">
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </Link>
      )}

      <div className="p-5">
        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag.id}
                to={`/blog?tag=${tag.slug}`}
                className="tag text-xs"
                style={tag.color ? { backgroundColor: `${tag.color}20`, color: tag.color } : {}}
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* Title */}
        <Link to={`/blog/${post.slug}`}>
          <h3 className={`font-semibold text-ink-900 dark:text-ink-100 hover:text-accent-600 dark:hover:text-accent-400 transition-colors line-clamp-2 ${featured ? 'text-xl' : 'text-lg'}`}>
            {post.title}
          </h3>
        </Link>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="mt-2 text-sm text-ink-600 dark:text-ink-400 line-clamp-2">
            {post.excerpt}
          </p>
        )}

        {/* Author & Meta */}
        <div className="mt-4 flex items-center justify-between">
          {showAuthor ? (
            <Link 
              to={`/profile/${post.author?.username}`}
              className="flex items-center gap-2 group"
            >
              <Avatar 
                src={post.author?.profile?.avatar_url}
                alt={post.author?.username}
                size="xs"
              />
              <span className="text-sm text-ink-700 dark:text-ink-300 group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
                {post.author?.profile?.display_name || post.author?.username}
              </span>
            </Link>
          ) : (
            <span className="text-xs text-ink-600 dark:text-ink-400">{publishedDate}</span>
          )}

          <div className="flex items-center gap-3 text-ink-500 dark:text-ink-400 text-xs">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.reading_time || 5} min
            </span>
          </div>
        </div>

        {/* Stats - Commented out like/bookmark/comment stats
        <div className="mt-3 pt-3 border-t border-ink-200 dark:border-ink-800 flex items-center justify-between text-xs text-ink-600 dark:text-ink-400">
          {showAuthor && <span>{publishedDate}</span>}
          
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Heart className={`w-3.5 h-3.5 ${post.is_liked ? 'fill-red-500 text-red-500' : ''}`} />
              {post.likes_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              {post.comments_count || 0}
            </span>
            {post.is_bookmarked && (
              <Bookmark className="w-3.5 h-3.5 fill-accent-500 text-accent-500" />
            )}
          </div>
        </div>
        */}
      </div>
    </article>
  )
}
