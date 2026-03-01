import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Save, Eye, Edit3, ArrowLeft, Check, Clock,
  Bold, Italic, Heading1, Heading2, List,
  ListOrdered, Quote, Code, Link2, Image, Undo, Redo,
  Video, Sparkles
} from 'lucide-react'

import { courseService, uploadService, aiService } from '../services/api'
import MarkdownPreview from '../components/editor/MarkdownPreview'
import AIAssistant from '../components/editor/AIAssistant'

// Get the base URL for uploaded images
const API_URL = import.meta.env.VITE_API_URL || '/api/v1'
const API_BASE = API_URL.replace('/api/v1', '')

export default function LessonEditor() {
  const { courseId, lessonId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const textareaRef = useRef(null)
  const imageInputRef = useRef(null)
  
  // Editor state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  
  // UI state
  const [view, setView] = useState('split') // 'edit' | 'split' | 'preview'
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  
  // History for undo/redo
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Fetch course info
  const { data: courseData } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseService.getCourseById(courseId),
    enabled: !!courseId,
  })

  // Fetch existing lesson if editing
  const { data: lessonData, isLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => courseService.getLessonById(lessonId),
    enabled: !!lessonId,
  })

  const course = courseData?.data

  // Initialize editor with existing lesson data
  useEffect(() => {
    if (lessonData?.data) {
      const lesson = lessonData.data
      setTitle(lesson.title)
      setContent(lesson.content)
      setExcerpt(lesson.excerpt || '')
      setIsPublished(lesson.is_published)
    }
  }, [lessonData])

  // Create lesson mutation
  const createMutation = useMutation({
    mutationFn: (data) => courseService.createLesson({ ...data, course_id: courseId }),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['course', courseId])
      toast.success('Lesson created')
      navigate(`/courses/${courseId}/lessons`)
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to create lesson')
    },
  })

  // Update lesson mutation
  const updateMutation = useMutation({
    mutationFn: (data) => courseService.updateLesson(lessonId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['course', courseId])
      queryClient.invalidateQueries(['lesson', lessonId])
      toast.success('Lesson updated')
      setHasChanges(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update lesson')
    },
  })

  // Image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: (file) => uploadService.uploadImage(file),
    onSuccess: (response) => {
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
    { icon: Video, action: () => {
      const url = prompt('Enter video URL (YouTube, Vimeo, or direct video link):')
      if (url) {
        const videoTitle = prompt('Enter video title (optional):') || 'Video'
        insertText(`[video:${videoTitle}](${url})`)
      }
    }, tooltip: 'Embed Video' },
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

  // Save lesson
  const handleSave = (publish = isPublished) => {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!content.trim()) {
      toast.error('Content is required')
      return
    }

    setIsSaving(true)
    const data = {
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt.trim() || null,
      is_published: publish,
    }

    if (lessonId) {
      updateMutation.mutate(data, {
        onSettled: () => setIsSaving(false),
      })
    } else {
      createMutation.mutate(data, {
        onSettled: () => setIsSaving(false),
      })
    }
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
            to={`/courses/${courseId}/lessons`}
            className="p-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-700 dark:text-ink-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          
          <div className="hidden sm:flex items-center gap-2 text-sm text-ink-600 dark:text-ink-400">
            {course && (
              <>
                <span className="font-medium">{course.title}</span>
                <span>•</span>
              </>
            )}
            <span>{wordCount} words</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {readingTime} min read
            </span>
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

          {/* Publish checkbox */}
          <label className="hidden sm:flex items-center gap-2 text-sm text-ink-600 dark:text-ink-400 mr-2">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => {
                setIsPublished(e.target.checked)
                setHasChanges(true)
              }}
              className="w-4 h-4 rounded border-ink-300 text-accent-500 focus:ring-accent-500"
            />
            Publish
          </label>

          {/* Save buttons */}
          <button
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="btn-secondary btn-sm hidden sm:flex items-center gap-1"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          
          <button
            onClick={() => handleSave(true)}
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
                {lessonId ? 'Update' : 'Create'} & Publish
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
              placeholder="Lesson title..."
              className="w-full text-2xl sm:text-3xl font-bold text-ink-900 dark:text-ink-100 bg-transparent border-none outline-none placeholder:text-ink-400 dark:placeholder:text-ink-500 font-serif"
            />
            <input
              type="text"
              value={excerpt}
              onChange={(e) => {
                setExcerpt(e.target.value)
                setHasChanges(true)
              }}
              placeholder="Brief description (optional)..."
              className="w-full mt-2 text-sm text-ink-600 dark:text-ink-400 bg-transparent border-none outline-none placeholder:text-ink-400 dark:placeholder:text-ink-500"
            />
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-auto p-4">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onSelect={handleTextSelect}
              placeholder="Write your lesson content in Markdown..."
              className="w-full h-full min-h-[500px] resize-none bg-transparent border-none outline-none text-ink-800 dark:text-ink-200 font-mono text-sm leading-relaxed placeholder:text-ink-400 dark:placeholder:text-ink-500"
              spellCheck="true"
            />
          </div>
        </div>

        {/* Preview pane */}
        <div className={`flex-1 overflow-auto bg-white dark:bg-ink-950 ${view === 'edit' ? 'hidden' : ''}`}>
          <div className="max-w-3xl mx-auto p-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-ink-900 dark:text-ink-100 font-serif mb-4">
              {title || 'Untitled Lesson'}
            </h1>
            {excerpt && (
              <p className="text-ink-600 dark:text-ink-400 mb-8">{excerpt}</p>
            )}
            <MarkdownPreview content={content} />
          </div>
        </div>

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
