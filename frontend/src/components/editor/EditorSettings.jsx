import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { X, Image, Hash, Folder, FileText, Upload, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

import { tagService, categoryService, uploadService } from '../../services/api'

// Get the base URL for uploaded images
const API_URL = import.meta.env.VITE_API_URL || '/api/v1'
const API_BASE = API_URL.replace('/api/v1', '')

export default function EditorSettings({
  excerpt,
  setExcerpt,
  coverImage,
  setCoverImage,
  tags,
  setTags,
  categories,
  setCategories,
  onClose,
}) {
  const [tagInput, setTagInput] = useState('')
  const fileInputRef = useRef(null)

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: (file) => uploadService.uploadImage(file),
    onSuccess: (response) => {
      // Prepend base URL to the relative path
      const imageUrl = response.data.url.startsWith('http') 
        ? response.data.url 
        : `${API_BASE}${response.data.url}`
      setCoverImage(imageUrl)
      toast.success('Cover image uploaded')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Upload failed')
    },
  })

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadMutation.mutate(file)
    }
  }

  // Fetch available tags
  const { data: availableTags } = useQuery({
    queryKey: ['tags'],
    queryFn: tagService.getAll,
  })

  // Fetch available categories
  const { data: availableCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
  })

  const handleToggleTag = (tagId) => {
    setTags(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handleToggleCategory = (categoryId) => {
    setCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="w-80 border-l border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-ink-200 dark:border-ink-800">
        <h3 className="font-semibold text-ink-900 dark:text-ink-100">Post Settings</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-500"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Settings content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Cover Image */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-ink-700 dark:text-ink-300 mb-2">
            <Image className="w-4 h-4" />
            Cover Image
          </label>
          
          {/* Upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="w-full mb-2 btn-secondary flex items-center justify-center gap-2"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Image
              </>
            )}
          </button>
          
          {/* Or use URL */}
          <p className="text-xs text-ink-400 text-center mb-2">or paste URL</p>
          <input
            type="url"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="input w-full"
          />
          {coverImage && (
            <div className="mt-2 rounded-lg overflow-hidden relative">
              <img
                src={coverImage}
                alt="Cover preview"
                className="w-full h-32 object-cover"
                onError={(e) => e.target.style.display = 'none'}
              />
              <button
                onClick={() => setCoverImage('')}
                className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Excerpt */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-ink-700 dark:text-ink-300 mb-2">
            <FileText className="w-4 h-4" />
            Excerpt
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Write a brief summary of your post..."
            rows={3}
            maxLength={300}
            className="input w-full resize-none"
          />
          <p className="text-xs text-ink-400 mt-1">
            {excerpt.length}/300 characters
          </p>
        </div>

        {/* Tags */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-ink-700 dark:text-ink-300 mb-2">
            <Hash className="w-4 h-4" />
            Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTags?.data?.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleToggleTag(tag.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  tags.includes(tag.id)
                    ? 'bg-accent-500 text-white'
                    : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-400 hover:bg-ink-200 dark:hover:bg-ink-700'
                }`}
              >
                #{tag.name}
              </button>
            ))}
          </div>
          {(!availableTags?.data || availableTags.data.length === 0) && (
            <p className="text-xs text-ink-400">No tags available</p>
          )}
        </div>

        {/* Categories */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-ink-700 dark:text-ink-300 mb-2">
            <Folder className="w-4 h-4" />
            Categories
          </label>
          <div className="space-y-2">
            {availableCategories?.data?.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={categories.includes(category.id)}
                  onChange={() => handleToggleCategory(category.id)}
                  className="rounded border-ink-300 text-accent-500 focus:ring-accent-500"
                />
                <span className="text-sm text-ink-700 dark:text-ink-300">
                  {category.name}
                </span>
              </label>
            ))}
          </div>
          {(!availableCategories?.data || availableCategories.data.length === 0) && (
            <p className="text-xs text-ink-400">No categories available</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
