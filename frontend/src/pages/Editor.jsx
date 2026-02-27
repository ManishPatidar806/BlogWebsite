import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Save, Eye, Edit3, Settings, ArrowLeft, 
  Sparkles, Check, X, Upload, Clock,
  Bold, Italic, Heading1, Heading2, List,
  ListOrdered, Quote, Code, Link2, Image,
  Undo, Redo
} from 'lucide-react'

import { postService, aiService, uploadService } from '../services/api'
import MarkdownPreview from '../components/editor/MarkdownPreview'
import AIAssistant from '../components/editor/AIAssistant'
import EditorSettings from '../components/editor/EditorSettings'

// Get the base URL for uploaded images
const API_URL = import.meta.env.VITE_API_URL || '/api/v1'
const API_BASE = API_URL.replace('/api/v1', '')

export default function Editor() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const textareaRef = useRef(null)
  const autoSaveTimeoutRef = useRef(null)
  const imageInputRef = useRef(null)
  
  // Editor state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [status, setStatus] = useState('draft')
  const [tags, setTags] = useState([])
  const [categories, setCategories] = useState([])
  
  // UI state
  const [view, setView] = useState('split') // 'edit' | 'split' | 'preview'
  const [showSettings, setShowSettings] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [hasChanges, setHasChanges] = useState(false)
  
  // History for undo/redo
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Load existing post if editing
  const { data: existingPost, isLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => postService.getById(postId),
    enabled: !!postId,
  })

  // Initialize editor with existing post data
  useEffect(() => {
    if (existingPost?.data) {
      const post = existingPost.data
      setTitle(post.title)
      setContent(post.content)
      setExcerpt(post.excerpt || '')
      setCoverImage(post.cover_image || '')
      setStatus(post.status)
      setTags(post.tags?.map(t => t.id) || [])
      setCategories(post.categories?.map(c => c.id) || [])
    }
  }, [existingPost])

  // Create/Update mutations
  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (postId) {
        return postService.update(postId, data)
      }
      return postService.create(data)
    },
    onSuccess: (response) => {
      setLastSaved(new Date())
      setHasChanges(false)
      toast.success(postId ? 'Post updated' : 'Post created')
      if (!postId) {
        navigate(`/editor/${response.data.id}`, { replace: true })
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to save')
    },
  })

  // Auto-save draft
  const autoSaveDraft = useMutation({
    mutationFn: (data) => postService.saveDraft(data),
    onSuccess: () => {
      setLastSaved(new Date())
    },
  })

  // Image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: (file) => uploadService.uploadImage(file),
    onSuccess: (response) => {
      // Prepend base URL to the relative path
      const imageUrl = response.data.url.startsWith('http') 
        ? response.data.url 
        : `${API_BASE}${response.data.url}`
      insertText(`![${response.data.original_filename || 'image'}](${imageUrl})`)
      toast.success('Image uploaded')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Image upload failed')
    },
  })

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadImageMutation.mutate(file)
    }
  }

  // Word count and reading time
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  // Auto-save effect
  useEffect(() => {
    if (hasChanges && (title || content)) {
      clearTimeout(autoSaveTimeoutRef.current)
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSaveDraft.mutate({
          post_id: postId || null,
          title: title || 'Untitled',
          content: content,
        })
      }, 30000) // Auto-save every 30 seconds
    }
    
    return () => clearTimeout(autoSaveTimeoutRef.current)
  }, [title, content, hasChanges, postId])

  // Track changes
  const handleTitleChange = (e) => {
    setTitle(e.target.value)
    setHasChanges(true)
  }

  const handleContentChange = (e) => {
    const newContent = e.target.value
    setContent(newContent)
    setHasChanges(true)
    
    // Add to history for undo/redo
    setHistory(prev => [...prev.slice(0, historyIndex + 1), newContent])
    setHistoryIndex(prev => prev + 1)
  }

  // Handle text selection for AI
  const handleTextSelect = () => {
    const selection = window.getSelection()
    const text = selection?.toString().trim()
    if (text) {
      setSelectedText(text)
    }
  }

  // Insert text at cursor
  const insertText = useCallback((text, wrap = false, wrapEnd = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = content.substring(start, end)
    
    let newContent
    if (wrap && selected) {
      newContent = content.substring(0, start) + text + selected + (wrapEnd || text) + content.substring(end)
    } else {
      newContent = content.substring(0, start) + text + content.substring(end)
    }
    
    setContent(newContent)
    setHasChanges(true)
    
    // Restore focus
    setTimeout(() => {
      textarea.focus()
      const newPos = start + text.length + (wrap ? selected.length + (wrapEnd || text).length : 0)
      textarea.setSelectionRange(newPos, newPos)
    }, 0)
  }, [content])

  // Toolbar actions
  const toolbarActions = [
    { icon: Bold, action: () => insertText('**', true, '**'), tooltip: 'Bold' },
    { icon: Italic, action: () => insertText('*', true, '*'), tooltip: 'Italic' },
    { icon: Heading1, action: () => insertText('# '), tooltip: 'Heading 1' },
    { icon: Heading2, action: () => insertText('## '), tooltip: 'Heading 2' },
    { icon: List, action: () => insertText('- '), tooltip: 'Bullet List' },
    { icon: ListOrdered, action: () => insertText('1. '), tooltip: 'Numbered List' },
    { icon: Quote, action: () => insertText('> '), tooltip: 'Quote' },
    { icon: Code, action: () => insertText('```\n', true, '\n```'), tooltip: 'Code Block' },
    { icon: Link2, action: () => insertText('[', true, '](url)'), tooltip: 'Link' },
    { icon: Image, action: () => imageInputRef.current?.click(), tooltip: 'Upload Image' },
  ]

  // Undo/Redo
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1)
      setContent(history[historyIndex - 1])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1)
      setContent(history[historyIndex + 1])
    }
  }

  // Save post
  const handleSave = (publishStatus = status) => {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!content.trim()) {
      toast.error('Content is required')
      return
    }

    setIsSaving(true)
    saveMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt.trim() || null,
      cover_image: coverImage.trim() || null,
      status: publishStatus,
      tag_ids: tags,
      category_ids: categories,
    }, {
      onSettled: () => setIsSaving(false),
    })
  }

  // Apply AI suggestion
  const applyAISuggestion = (newText) => {
    if (selectedText) {
      // Replace selected text
      setContent(content.replace(selectedText, newText))
    } else {
      // Replace full content
      setContent(newText)
    }
    setHasChanges(true)
    setShowAI(false)
    toast.success('Applied AI suggestion')
  }

  // Apply AI title suggestion
  const applyTitleSuggestion = (newTitle) => {
    setTitle(newTitle)
    setHasChanges(true)
    setShowAI(false)
    toast.success('Title applied')
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-ink-50 dark:bg-ink-950">
        <div className="animate-spin w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-ink-50 dark:bg-ink-950">
      {/* Header */}
      <header className="flex-shrink-0 h-14 border-b border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/my-posts"
            className="p-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-700 dark:text-ink-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          
          <div className="hidden sm:flex items-center gap-2 text-sm text-ink-600 dark:text-ink-400">
            <span>{wordCount} words</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {readingTime} min read
            </span>
            {lastSaved && (
              <>
                <span>•</span>
                <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Saved
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="hidden md:flex items-center bg-ink-100 dark:bg-ink-800 rounded-lg p-1">
            <button
              onClick={() => setView('edit')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'edit' ? 'bg-white dark:bg-ink-700 shadow-sm' : 'text-ink-600 dark:text-ink-400'
              }`}
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('split')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'split' ? 'bg-white dark:bg-ink-700 shadow-sm' : 'text-ink-600 dark:text-ink-400'
              }`}
            >
              Split
            </button>
            <button
              onClick={() => setView('preview')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'preview' ? 'bg-white dark:bg-ink-700 shadow-sm' : 'text-ink-600 dark:text-ink-400'
              }`}
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>

          {/* AI Button */}
          <button
            onClick={() => setShowAI(!showAI)}
            className={`btn-ghost btn-icon ${showAI ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-600' : ''}`}
            title="AI Assistant"
          >
            <Sparkles className="w-5 h-5" />
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`btn-ghost btn-icon ${showSettings ? 'bg-ink-200 dark:bg-ink-700' : ''}`}
            title="Post Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Save buttons */}
          <button
            onClick={() => handleSave('draft')}
            disabled={isSaving}
            className="btn-secondary btn-sm hidden sm:flex items-center gap-1"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          
          <button
            onClick={() => handleSave('published')}
            disabled={isSaving}
            className="btn-primary btn-sm flex items-center gap-1"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Publish
              </>
            )}
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex-shrink-0 h-12 border-b border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 px-4 flex items-center gap-1 overflow-x-auto hide-scrollbar">
        {toolbarActions.map((action, i) => (
          <button
            key={i}
            onClick={action.action}
            className="p-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-600 dark:text-ink-400 transition-colors"
            title={action.tooltip}
          >
            <action.icon className="w-4 h-4" />
          </button>
        ))}
        
        <div className="w-px h-6 bg-ink-200 dark:bg-ink-700 mx-2" />
        
        <button
          onClick={undo}
          disabled={historyIndex <= 0}
          className="p-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-600 dark:text-ink-400 disabled:opacity-30 transition-colors"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          className="p-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-600 dark:text-ink-400 disabled:opacity-30 transition-colors"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>
        
        <div className="w-px h-6 bg-ink-200 dark:bg-ink-700 mx-2" />
        
        {/* Mermaid diagram button */}
        <button
          onClick={() => insertText('```mermaid\ngraph TD\n    A[Start] --> B[Process]\n    B --> C[End]\n```\n')}
          className="p-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-600 dark:text-ink-400 transition-colors"
          title="Insert Diagram"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="6" height="6" rx="1" />
            <rect x="15" y="3" width="6" height="6" rx="1" />
            <rect x="9" y="15" width="6" height="6" rx="1" />
            <line x1="6" y1="9" x2="6" y2="12" />
            <line x1="6" y1="12" x2="12" y2="12" />
            <line x1="12" y1="12" x2="12" y2="15" />
            <line x1="18" y1="9" x2="18" y2="12" />
            <line x1="18" y1="12" x2="12" y2="12" />
          </svg>
        </button>
        
        {/* Hidden file input for image upload */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        
        {/* Upload loading indicator */}
        {uploadImageMutation.isPending && (
          <div className="flex items-center gap-2 text-sm text-accent-500">
            <div className="w-4 h-4 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
            Uploading...
          </div>
        )}
      </div>

      {/* Main editor area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor pane */}
        <div className={`flex flex-col ${view === 'preview' ? 'hidden' : view === 'split' ? 'w-1/2' : 'w-full'} border-r border-ink-200 dark:border-ink-800`}>
          {/* Title */}
          <div className="p-4 border-b border-ink-200 dark:border-ink-800">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Post title..."
              className="w-full text-2xl sm:text-3xl font-bold text-ink-900 dark:text-ink-100 bg-transparent border-none outline-none placeholder:text-ink-400 dark:placeholder:text-ink-500 font-serif"
            />
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-auto p-4">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onSelect={handleTextSelect}
              placeholder="Write your story in Markdown..."
              className="w-full h-full min-h-[500px] resize-none bg-transparent border-none outline-none text-ink-800 dark:text-ink-200 font-mono text-sm leading-relaxed placeholder:text-ink-400 dark:placeholder:text-ink-500"
              spellCheck="true"
            />
          </div>
        </div>

        {/* Preview pane */}
        <div className={`flex-1 overflow-auto bg-white dark:bg-ink-950 ${view === 'edit' ? 'hidden' : ''}`}>
          <div className="max-w-3xl mx-auto p-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-ink-900 dark:text-ink-100 font-serif mb-8">
              {title || 'Untitled Post'}
            </h1>
            <MarkdownPreview content={content} />
          </div>
        </div>

        {/* Settings panel */}
        <AnimatePresence>
          {showSettings && (
            <EditorSettings
              excerpt={excerpt}
              setExcerpt={setExcerpt}
              coverImage={coverImage}
              setCoverImage={setCoverImage}
              tags={tags}
              setTags={setTags}
              categories={categories}
              setCategories={setCategories}
              onClose={() => setShowSettings(false)}
            />
          )}
        </AnimatePresence>

        {/* AI Assistant panel */}
        <AnimatePresence>
          {showAI && (
            <AIAssistant
              text={selectedText || content}
              onApply={applyAISuggestion}
              onApplyTitle={applyTitleSuggestion}
              onClose={() => setShowAI(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
