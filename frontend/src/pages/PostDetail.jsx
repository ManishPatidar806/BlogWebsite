import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  Heart, Bookmark, Share2, MessageCircle, 
  Clock, Calendar, ArrowLeft, Edit3, 
  Twitter, Facebook, Linkedin, Link2,
  ChevronDown, Send, MoreHorizontal, Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'

import { postService, commentService } from '../services/api'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/ui/Avatar'
import MarkdownPreview from '../components/editor/MarkdownPreview'

export default function PostDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')

  // Fetch post
  const { data: postData, isLoading, error } = useQuery({
    queryKey: ['post', slug],
    queryFn: () => postService.getBySlug(slug),
  })

  // Fetch comments
  const { data: commentsData } = useQuery({
    queryKey: ['comments', slug],
    queryFn: () => commentService.getByPost(postData?.data?.id),
    enabled: !!postData?.data?.id,
  })

  const post = postData?.data
  const comments = commentsData?.data || []

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: () => postService.like(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['post', slug])
    },
  })

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: () => postService.bookmark(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['post', slug])
      toast.success(post.is_bookmarked ? 'Removed from bookmarks' : 'Added to bookmarks')
    },
  })

  // Comment mutations
  const addCommentMutation = useMutation({
    mutationFn: (content) => commentService.create(post.id, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', slug])
      setCommentText('')
      toast.success('Comment added')
    },
    onError: () => toast.error('Failed to add comment'),
  })

  const addReplyMutation = useMutation({
    mutationFn: ({ parentId, content }) => commentService.create(post.id, { content, parent_id: parentId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', slug])
      setReplyingTo(null)
      setReplyText('')
      toast.success('Reply added')
    },
  })

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => commentService.delete(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', slug])
      toast.success('Comment deleted')
    },
  })

  // Share functions
  const shareUrl = window.location.href
  const shareText = post?.title || ''

  const shareLinks = [
    { name: 'Twitter', icon: Twitter, url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}` },
    { name: 'Facebook', icon: Facebook, url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
    { name: 'LinkedIn', icon: Linkedin, url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` },
  ]

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    toast.success('Link copied')
    setShowShareMenu(false)
  }

  const handleSubmitComment = (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      toast.error('Please login to comment')
      return
    }
    if (commentText.trim()) {
      addCommentMutation.mutate(commentText.trim())
    }
  }

  const handleSubmitReply = (e, parentId) => {
    e.preventDefault()
    if (replyText.trim()) {
      addReplyMutation.mutate({ parentId, content: replyText.trim() })
    }
  }

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-xl text-ink-600 dark:text-ink-400 mb-4">Post not found</p>
        <Link to="/blog" className="btn-primary">
          Back to Blog
        </Link>
      </div>
    )
  }

  const isAuthor = user?.id === post.author?.id

  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <motion.article
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="py-8"
      >
        {/* Back button */}
        <div className="container mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Cover image */}
      {post.cover_image && (
        <div className="w-full h-64 sm:h-80 md:h-96 mb-8 overflow-hidden">
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="container">
        <div className="max-w-3xl mx-auto">
          {/* Categories and tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {post.categories?.map((cat) => (
              <Link
                key={cat.id}
                to={`/blog?category=${cat.slug}`}
                className="badge badge-accent"
              >
                {cat.name}
              </Link>
            ))}
            {post.tags?.map((tag) => (
              <Link
                key={tag.id}
                to={`/blog?tag=${tag.slug}`}
                className="badge"
              >
                #{tag.name}
              </Link>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-ink-900 dark:text-ink-100 font-serif mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Author and meta */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-8 pb-8 border-b border-ink-200 dark:border-ink-800">
            <div className="flex items-center gap-4">
              <Link to={`/profile/${post.author?.username}`}>
                <Avatar
                  src={post.author?.profile?.avatar_url}
                  name={post.author?.username}
                  size="lg"
                />
              </Link>
              <div>
                <Link
                  to={`/profile/${post.author?.username}`}
                  className="font-medium text-ink-900 dark:text-ink-100 hover:text-accent-600 dark:hover:text-accent-400"
                >
                  {post.author?.profile?.display_name || post.author?.username}
                </Link>
                <div className="flex items-center gap-3 text-sm text-ink-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(post.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {post.reading_time || 5} min read
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAuthor && (
                <Link
                  to={`/editor/${post.id}`}
                  className="btn-secondary btn-sm flex items-center gap-1"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </Link>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="mb-12">
            <MarkdownPreview content={post.content} />
          </div>

          {/* Actions bar */}
          {/* <div className="flex items-center justify-between py-6 border-y border-ink-200 dark:border-ink-800 mb-12">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    toast.error('Please login to like')
                    return
                  }
                  likeMutation.mutate()
                }}
                className={`flex items-center gap-2 transition-colors ${
                  post.is_liked ? 'text-red-500' : 'text-ink-500 hover:text-red-500'
                }`}
              >
                <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
                <span>{post.likes_count || 0}</span>
              </button>

              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    toast.error('Please login to bookmark')
                    return
                  }
                  bookmarkMutation.mutate()
                }}
                className={`flex items-center gap-2 transition-colors ${
                  post.is_bookmarked ? 'text-accent-500' : 'text-ink-500 hover:text-accent-500'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${post.is_bookmarked ? 'fill-current' : ''}`} />
              </button>

              <a
                href="#comments"
                className="flex items-center gap-2 text-ink-500 hover:text-ink-700 dark:hover:text-ink-300"
              >
                <MessageCircle className="w-5 h-5" />
                <span>{comments.length}</span>
              </a>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="flex items-center gap-2 text-ink-500 hover:text-ink-700 dark:hover:text-ink-300"
              >
                <Share2 className="w-5 h-5" />
                Share
              </button>

              {showShareMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-ink-800 rounded-xl shadow-lg border border-ink-200 dark:border-ink-700 py-2 z-10"
                >
                  {shareLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-ink-700 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700"
                    >
                      <link.icon className="w-4 h-4" />
                      {link.name}
                    </a>
                  ))}
                  <button
                    onClick={copyLink}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-ink-700 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700 w-full"
                  >
                    <Link2 className="w-4 h-4" />
                    Copy Link
                  </button>
                </motion.div>
              )}
            </div>
          </div> */}

          {/* Author bio */}
          {post.author?.profile?.bio && (
            <div className="card p-6 mb-12">
              <div className="flex items-start gap-4">
                <Link to={`/profile/${post.author.username}`}>
                  <Avatar
                    src={post.author.profile.avatar_url}
                    name={post.author.username}
                    size="xl"
                  />
                </Link>
                <div>
                  <p className="text-sm text-ink-500 mb-1">Written by</p>
                  <Link
                    to={`/profile/${post.author.username}`}
                    className="text-lg font-semibold text-ink-900 dark:text-ink-100 hover:text-accent-600"
                  >
                    {post.author.profile.display_name || post.author.username}
                  </Link>
                  <p className="text-ink-600 dark:text-ink-400 mt-2">
                    {post.author.profile.bio}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Comments section */}
          {/* <section id="comments" className="mb-12">
            <h2 className="text-2xl font-bold text-ink-900 dark:text-ink-100 mb-6">
              Comments ({comments.length})
            </h2>

            {/* Comment form */}
            {/* <form onSubmit={handleSubmitComment} className="mb-8">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={isAuthenticated ? "Share your thoughts..." : "Login to comment"}
                disabled={!isAuthenticated}
                rows={3}
                className="input w-full resize-none mb-3"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!commentText.trim() || addCommentMutation.isPending || !isAuthenticated}
                  className="btn-primary btn-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  Post Comment
                </button>
              </div>
            </form> */}

            {/* Comments list */}
            {/* <div className="space-y-6">
              {comments.filter(c => !c.parent_id).map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  replies={comments.filter(c => c.parent_id === comment.id)}
                  user={user}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  replyText={replyText}
                  setReplyText={setReplyText}
                  onSubmitReply={handleSubmitReply}
                  onDelete={(id) => deleteCommentMutation.mutate(id)}
                  isAuthenticated={isAuthenticated}
                />
              ))}

              {comments.length === 0 && (
                <p className="text-center text-ink-500 py-8">
                  Be the first to comment!
                </p>
              )}
            </div> */}
          {/* </section> */} 
        </div>
      </div>
      </motion.article>
    </div>
  )
}

// function CommentCard({
//   comment,
//   replies,
//   user,
//   replyingTo,
//   setReplyingTo,
//   replyText,
//   setReplyText,
//   onSubmitReply,
//   onDelete,
//   isAuthenticated,
// }) {
//   const [showActions, setShowActions] = useState(false)
//   const isAuthor = user?.id === comment.user?.id

//   return (
//     <div className="group">
//       <div className="flex gap-4">
//         <Avatar
//           src={comment.user?.profile?.avatar_url}
//           name={comment.user?.username}
//           size="md"
//         />
//         <div className="flex-1">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <span className="font-medium text-ink-900 dark:text-ink-100">
//                 {comment.user?.profile?.display_name || comment.user?.username}
//               </span>
//               <span className="text-sm text-ink-500">
//                 {new Date(comment.created_at).toLocaleDateString()}
//               </span>
//             </div>
            
//             {isAuthor && (
//               <div className="relative">
//                 <button
//                   onClick={() => setShowActions(!showActions)}
//                   className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-ink-100 dark:hover:bg-ink-800 transition-opacity"
//                 >
//                   <MoreHorizontal className="w-4 h-4 text-ink-500" />
//                 </button>
//                 {showActions && (
//                   <div className="absolute right-0 top-full mt-1 bg-white dark:bg-ink-800 rounded-lg shadow-lg border border-ink-200 dark:border-ink-700 py-1 z-10">
//                     <button
//                       onClick={() => onDelete(comment.id)}
//                       className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-ink-100 dark:hover:bg-ink-700 w-full"
//                     >
//                       <Trash2 className="w-4 h-4" />
//                       Delete
//                     </button>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
          
//           {/* <p className="text-ink-700 dark:text-ink-300 mt-1">
//             {comment.content}
//           </p> */}
          
//           {/* <button
//             onClick={() => {
//               if (!isAuthenticated) {
//                 toast.error('Please login to reply')
//                 return
//               }
//               setReplyingTo(replyingTo === comment.id ? null : comment.id)
//             }}
//             className="text-sm text-accent-600 hover:text-accent-500 mt-2"
//           >
//             Reply
//           </button> */}

//           {/* Reply form */}
//           {/* {replyingTo === comment.id && (
//             <form
//               onSubmit={(e) => onSubmitReply(e, comment.id)}
//               className="mt-3"
//             >
//               <textarea
//                 value={replyText}
//                 onChange={(e) => setReplyText(e.target.value)}
//                 placeholder="Write a reply..."
//                 rows={2}
//                 className="input w-full resize-none text-sm"
//                 autoFocus
//               />
//               <div className="flex gap-2 mt-2">
//                 <button
//                   type="button"
//                   onClick={() => setReplyingTo(null)}
//                   className="btn-ghost btn-sm"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={!replyText.trim()}
//                   className="btn-primary btn-sm"
//                 >
//                   Reply
//                 </button>
//               </div>
//             </form>
//           )} */}

//           {/* Replies */}
//           {/* {replies.length > 0 && (
//             <div className="mt-4 pl-4 border-l-2 border-ink-200 dark:border-ink-700 space-y-4">
//               {replies.map((reply) => (
//                 <div key={reply.id} className="flex gap-3">
//                   <Avatar
//                     src={reply.user?.profile?.avatar_url}
//                     name={reply.user?.username}
//                     size="sm"
//                   />
//                   <div>
//                     <div className="flex items-center gap-2">
//                       <span className="font-medium text-ink-900 dark:text-ink-100 text-sm">
//                         {reply.user?.profile?.display_name || reply.user?.username}
//                       </span>
//                       <span className="text-xs text-ink-500">
//                         {new Date(reply.created_at).toLocaleDateString()}
//                       </span>
//                     </div>
//                     <p className="text-ink-700 dark:text-ink-300 text-sm">
//                       {reply.content}
//                     </p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )} */}
//         </div>
//       </div>
//     </div>
//   )
// }
