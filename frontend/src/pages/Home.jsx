import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, PenSquare, BookOpen, Sparkles, TrendingUp } from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import PostCard from '../components/posts/PostCard'
import { useQuery } from '@tanstack/react-query'
import { postService } from '../services/api'

const features = [
  {
    icon: PenSquare,
    title: 'Write Beautifully',
    description: 'A distraction-free Markdown editor with live preview and AI assistance.',
  },
  {
    icon: BookOpen,
    title: 'Read Effortlessly',
    description: 'Clean, minimal reading experience optimized for long-form content.',
  },
  {
    icon: Sparkles,
    title: 'AI Powered',
    description: 'Gemini AI helps improve grammar, clarity, and suggests better headlines.',
  },
  {
    icon: TrendingUp,
    title: 'Grow Your Audience',
    description: 'Analytics, SEO optimization, and social sharing built right in.',
  },
]

export default function Home() {
  const { isAuthenticated, isWriter } = useAuth()
  
  const { data: featuredPosts } = useQuery({
    queryKey: ['posts', 'featured'],
    queryFn: () => postService.getAll({ featured: true, page_size: 3 }),
  })

  const { data: recentPosts } = useQuery({
    queryKey: ['posts', 'recent'],
    queryFn: () => postService.getAll({ page_size: 6 }),
  })

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-200/30 dark:bg-accent-900/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-sage-200/30 dark:bg-sage-900/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <motion.h1 
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-ink-900 dark:text-ink-100 font-serif leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Where Ideas Find
              <span className="text-gradient"> Their Voice</span>
            </motion.h1>
            
            <motion.p 
              className="mt-6 text-lg sm:text-xl text-ink-600 dark:text-ink-400 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              A modern platform for writers to craft stories and readers to discover 
              compelling content. Powered by AI, designed for humans.
            </motion.p>

            <motion.div 
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {isAuthenticated ? (
                <>
                  {isWriter && (
                    <Link to="/editor" className="btn-primary btn-lg flex items-center gap-2">
                      <PenSquare className="w-5 h-5" />
                      Start Writing
                    </Link>
                  )}
                  <Link to="/blog" className="btn-outline btn-lg flex items-center gap-2">
                    Explore Blog
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="btn-primary btn-lg flex items-center gap-2">
                    Start Writing
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link to="/blog" className="btn-outline btn-lg">
                    Read Articles
                  </Link>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-ink-100/50 dark:bg-ink-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-ink-900 dark:text-ink-100 font-serif">
              Everything You Need to Write
            </h2>
            <p className="mt-4 text-lg text-ink-600 dark:text-ink-400 max-w-2xl mx-auto">
              Powerful features designed to help you create, publish, and grow your audience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="card p-6 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 mb-4">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-ink-900 dark:text-ink-100">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts?.data?.items?.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-ink-900 dark:text-ink-100 font-serif">
                  Featured Stories
                </h2>
                <p className="mt-2 text-ink-600 dark:text-ink-400">
                  Hand-picked articles worth your time
                </p>
              </div>
              <Link 
                to="/blog?featured=true" 
                className="hidden sm:flex items-center gap-1 text-accent-600 dark:text-accent-400 hover:underline"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {featuredPosts.data.items.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <PostCard post={post} featured />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Posts */}
      {recentPosts?.data?.items?.length > 0 && (
        <section className="py-20 bg-ink-100/50 dark:bg-ink-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-ink-900 dark:text-ink-100 font-serif">
                  Recent Articles
                </h2>
                <p className="mt-2 text-ink-600 dark:text-ink-400">
                  Fresh perspectives from our community
                </p>
              </div>
              <Link 
                to="/blog" 
                className="flex items-center gap-1 text-accent-600 dark:text-accent-400 hover:underline"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recentPosts.data.items.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <PostCard post={post} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card p-8 sm:p-12 text-center bg-gradient-to-br from-accent-50 to-accent-100 dark:from-accent-900/30 dark:to-accent-800/30 border-accent-200 dark:border-accent-800">
            <h2 className="text-2xl sm:text-3xl font-bold text-ink-900 dark:text-ink-100 font-serif">
              Ready to Share Your Story?
            </h2>
            <p className="mt-4 text-ink-600 dark:text-ink-400 max-w-2xl mx-auto">
              Join thousands of writers who use Inkwell to craft and publish their best work.
              Start for free, no credit card required.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="btn-primary btn-lg">
                Create Free Account
              </Link>
              <Link to="/blog" className="btn-ghost btn-lg">
                Read First
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
