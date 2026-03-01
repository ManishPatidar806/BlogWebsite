import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import mermaid from 'mermaid'
import { Play } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

// Configure Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
})

// Video embed component
function VideoEmbed({ url, title }) {
  const [isPlaying, setIsPlaying] = useState(false)
  
  // Parse video URL to get embed info
  const getVideoInfo = (url) => {
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    if (ytMatch) {
      return {
        type: 'youtube',
        id: ytMatch[1],
        embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`,
        thumbnailUrl: `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`
      }
    }
    
    // Vimeo
    const vimeoMatch = url.match(/(?:vimeo\.com\/)([0-9]+)/)
    if (vimeoMatch) {
      return {
        type: 'vimeo',
        id: vimeoMatch[1],
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
        thumbnailUrl: null
      }
    }
    
    // Direct video URL (mp4, webm, etc.)
    if (url.match(/\.(mp4|webm|ogg)$/i)) {
      return {
        type: 'direct',
        url: url
      }
    }
    
    return null
  }
  
  const videoInfo = getVideoInfo(url)
  
  if (!videoInfo) {
    return (
      <div className="my-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400 text-sm">Invalid video URL: {url}</p>
      </div>
    )
  }
  
  // Direct video player
  if (videoInfo.type === 'direct') {
    return (
      <figure className="my-6">
        <video
          controls
          className="w-full rounded-lg max-h-[500px] bg-ink-900"
          preload="metadata"
        >
          <source src={url} type={`video/${url.split('.').pop()}`} />
          Your browser does not support the video tag.
        </video>
        {title && (
          <figcaption className="text-center text-sm text-ink-500 mt-2">
            {title}
          </figcaption>
        )}
      </figure>
    )
  }
  
  // Embedded video (YouTube, Vimeo)
  return (
    <figure className="my-6">
      <div className="relative aspect-video bg-ink-900 rounded-lg overflow-hidden">
        {!isPlaying && videoInfo.thumbnailUrl ? (
          <>
            <img
              src={videoInfo.thumbnailUrl}
              alt={title || 'Video thumbnail'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
            <button
              onClick={() => setIsPlaying(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
            >
              <div className="w-16 h-16 flex items-center justify-center bg-red-600 rounded-full group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 text-white ml-1" fill="white" />
              </div>
            </button>
          </>
        ) : (
          <iframe
            src={isPlaying ? videoInfo.embedUrl : videoInfo.embedUrl.replace('autoplay=1', 'autoplay=0')}
            title={title || 'Video'}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
      {title && (
        <figcaption className="text-center text-sm text-ink-500 mt-2">
          {title}
        </figcaption>
      )}
    </figure>
  )
}

// Mermaid diagram component
function MermaidDiagram({ code }) {
  const containerRef = useRef(null)
  const [svg, setSvg] = useState('')
  const [error, setError] = useState(null)
  const { theme } = useTheme()
  
  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current || !code) return
      
      try {
        // Update mermaid theme based on app theme
        mermaid.initialize({
          startOnLoad: false,
          theme: theme === 'dark' ? 'dark' : 'default',
          securityLevel: 'loose',
        })
        
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
        const { svg } = await mermaid.render(id, code)
        setSvg(svg)
        setError(null)
      } catch (err) {
        console.error('Mermaid render error:', err)
        setError('Failed to render diagram')
      }
    }
    
    renderDiagram()
  }, [code, theme])
  
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 my-4">
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        <pre className="mt-2 text-xs text-ink-600 dark:text-ink-400 overflow-x-auto">
          {code}
        </pre>
      </div>
    )
  }
  
  return (
    <div 
      ref={containerRef}
      className="my-4 flex justify-center overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

export default function MarkdownPreview({ content }) {
  const { theme } = useTheme()
  
  if (!content) {
    return (
      <p className="text-ink-400 dark:text-ink-500 italic">
        Start writing to see preview...
      </p>
    )
  }

  return (
    <div className="markdown-preview prose prose-ink dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom heading rendering
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-ink-900 dark:text-ink-100 mt-8 mb-4 font-serif">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-bold text-ink-900 dark:text-ink-100 mt-6 mb-3 font-serif">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold text-ink-900 dark:text-ink-100 mt-4 mb-2">
              {children}
            </h3>
          ),
          
          // Paragraphs
          p: ({ children }) => (
            <p className="text-ink-700 dark:text-ink-300 leading-relaxed mb-4">
              {children}
            </p>
          ),
          
          // Code blocks with syntax highlighting
          code: ({ inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''
            const codeString = String(children).replace(/\n$/, '')
            
            // Handle Mermaid diagrams
            if (!inline && language === 'mermaid') {
              return <MermaidDiagram code={codeString} />
            }
            
            if (!inline && language) {
              return (
                <SyntaxHighlighter
                  style={theme === 'dark' ? oneDark : oneLight}
                  language={language}
                  PreTag="div"
                  className="rounded-lg !bg-ink-100 dark:!bg-ink-800 !my-4"
                  {...props}
                >
                  {codeString}
                </SyntaxHighlighter>
              )
            }
            
            if (!inline) {
              return (
                <pre className="bg-ink-100 dark:bg-ink-800 rounded-lg p-4 overflow-x-auto my-4">
                  <code className="text-sm font-mono text-ink-800 dark:text-ink-200">
                    {children}
                  </code>
                </pre>
              )
            }
            
            return (
              <code className="bg-ink-100 dark:bg-ink-800 text-accent-600 dark:text-accent-400 px-1.5 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            )
          },
          
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-accent-500 pl-4 my-4 italic text-ink-600 dark:text-ink-400">
              {children}
            </blockquote>
          ),
          
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-2 my-4 text-ink-700 dark:text-ink-300">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-2 my-4 text-ink-700 dark:text-ink-300">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border border-ink-200 dark:border-ink-700 rounded-lg">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-ink-100 dark:bg-ink-800">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left text-sm font-semibold text-ink-900 dark:text-ink-100 border-b border-ink-200 dark:border-ink-700">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-sm text-ink-700 dark:text-ink-300 border-b border-ink-200 dark:border-ink-700">
              {children}
            </td>
          ),
          
          // Images and Videos
          img: ({ src, alt }) => {
            // Check if this is a video URL
            const isVideoUrl = src && (
              src.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/) ||
              src.match(/(?:vimeo\.com\/)([0-9]+)/) ||
              src.match(/\.(mp4|webm|ogg)$/i)
            )
            
            if (isVideoUrl) {
              return <VideoEmbed url={src} title={alt} />
            }
            
            return (
              <figure className="my-6">
                <img
                  src={src}
                  alt={alt}
                  className="rounded-lg max-w-full h-auto mx-auto"
                  loading="lazy"
                />
                {alt && (
                  <figcaption className="text-center text-sm text-ink-500 mt-2">
                    {alt}
                  </figcaption>
                )}
              </figure>
            )
          },
          
          // Links - detect video links and render as video embeds
          a: ({ href, children }) => {
            // Check if this is a video link that should be embedded
            const isVideoUrl = href && (
              href.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/) ||
              href.match(/(?:vimeo\.com\/)([0-9]+)/) ||
              href.match(/\.(mp4|webm|ogg)$/i)
            )
            
            // Check if the link text indicates it should be embedded (e.g., "[video:Title](url)")
            const childText = typeof children === 'string' ? children : children?.[0]
            const shouldEmbed = childText?.toString().startsWith('video:')
            
            if (isVideoUrl && shouldEmbed) {
              const title = childText.toString().replace('video:', '').trim()
              return <VideoEmbed url={href} title={title} />
            }
            
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-600 dark:text-accent-400 hover:underline"
              >
                {children}
              </a>
            )
          },
          
          // Horizontal rule
          hr: () => (
            <hr className="my-8 border-t border-ink-200 dark:border-ink-700" />
          ),
          
          // Checkbox (for task lists)
          input: ({ type, checked }) => {
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="mr-2 rounded border-ink-300 text-accent-500 focus:ring-accent-500"
                />
              )
            }
            return null
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
