import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  X, Sparkles, CheckCircle, FileText, 
  Type, RefreshCw, Wand2, Briefcase, Copy
} from 'lucide-react'
import toast from 'react-hot-toast'

import { aiService } from '../../services/api'

const aiActions = [
  { 
    id: 'improve', 
    label: 'Improve Text', 
    icon: Sparkles, 
    description: 'Enhance clarity and flow',
    color: 'accent'
  },
  { 
    id: 'grammar', 
    label: 'Fix Grammar', 
    icon: CheckCircle, 
    description: 'Correct grammar and spelling',
    color: 'green'
  },
  { 
    id: 'rewrite', 
    label: 'Rewrite', 
    icon: RefreshCw, 
    description: 'Complete rewrite with same meaning',
    color: 'blue'
  },
  { 
    id: 'suggest_titles', 
    label: 'Suggest Titles', 
    icon: Type, 
    description: 'Generate headline ideas',
    color: 'purple'
  },
  { 
    id: 'professional', 
    label: 'Make Professional', 
    icon: Briefcase, 
    description: 'Convert to professional tone',
    color: 'ink'
  },
  { 
    id: 'paraphrase', 
    label: 'Paraphrase', 
    icon: FileText, 
    description: 'Reword while keeping meaning',
    color: 'orange'
  },
]

export default function AIAssistant({ text, onApply, onApplyTitle, onClose }) {
  const [result, setResult] = useState(null)
  const [selectedAction, setSelectedAction] = useState(null)

  const mutation = useMutation({
    mutationFn: ({ action, text }) => {
      switch (action) {
        case 'improve':
          return aiService.improve(text)
        case 'grammar':
          return aiService.grammar(text)
        case 'rewrite':
          return aiService.rewrite(text)
        case 'suggest_titles':
          return aiService.suggestTitles(text)
        case 'professional':
          return aiService.professional(text)
        case 'paraphrase':
          return aiService.paraphrase(text)
        default:
          return aiService.improve(text)
      }
    },
    onSuccess: (response) => {
      setResult(response.data)
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'AI request failed')
    },
  })

  const handleAction = (actionId) => {
    if (!text?.trim()) {
      toast.error('No text to process. Select text or write content first.')
      return
    }
    
    setSelectedAction(actionId)
    setResult(null)
    mutation.mutate({ action: actionId, text })
  }

  const handleApply = () => {
    if (result) {
      // For title suggestions, pick the first one or let user choose
      if (selectedAction === 'suggest_titles' && Array.isArray(result.suggestions)) {
        onApply(result.suggestions[0])
      } else {
        onApply(result.result || result.improved_text || result.text)
      }
    }
  }

  const handleCopy = () => {
    const textToCopy = result?.result || result?.improved_text || result?.text || 
      (result?.suggestions ? result.suggestions.join('\n') : '')
    navigator.clipboard.writeText(textToCopy)
    toast.success('Copied to clipboard')
  }

  const truncatedText = text?.length > 200 ? text.substring(0, 200) + '...' : text

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
        <div className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-accent-500" />
          <h3 className="font-semibold text-ink-900 dark:text-ink-100">AI Assistant</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-500"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Selected text preview */}
      <div className="p-4 border-b border-ink-200 dark:border-ink-800">
        <p className="text-xs text-ink-500 mb-2">
          {text ? (text.length > 200 ? 'Selected text:' : 'Processing:') : 'No text selected'}
        </p>
        <p className="text-sm text-ink-700 dark:text-ink-300 line-clamp-3">
          {truncatedText || 'Select text in the editor or it will process the entire content.'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-2 gap-2 mb-4">
          {aiActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleAction(action.id)}
              disabled={mutation.isPending}
              className={`p-3 rounded-lg border text-left transition-all hover:shadow-md ${
                selectedAction === action.id
                  ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20'
                  : 'border-ink-200 dark:border-ink-700 hover:border-ink-300 dark:hover:border-ink-600'
              } ${mutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <action.icon className={`w-4 h-4 mb-1 ${
                selectedAction === action.id ? 'text-accent-500' : 'text-ink-500'
              }`} />
              <p className="text-xs font-medium text-ink-900 dark:text-ink-100">
                {action.label}
              </p>
              <p className="text-xs text-ink-500 line-clamp-1">
                {action.description}
              </p>
            </button>
          ))}
        </div>

        {/* Loading */}
        {mutation.isPending && (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-ink-500">AI is thinking...</p>
            </div>
          </div>
        )}

        {/* Result */}
        {result && !mutation.isPending && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-ink-500">Result:</p>
              <button
                onClick={handleCopy}
                className="text-xs text-accent-600 hover:text-accent-500 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                Copy
              </button>
            </div>
            
            <div className="bg-ink-50 dark:bg-ink-800 rounded-lg p-3 max-h-60 overflow-auto">
              {selectedAction === 'suggest_titles' && result.suggestions ? (
                <ul className="space-y-2">
                  {result.suggestions.map((title, i) => (
                    <li key={i} className="text-sm text-ink-800 dark:text-ink-200">
                      <button
                        onClick={() => {
                          if (onApplyTitle) {
                            onApplyTitle(title)
                          }
                        }}
                        className="text-left w-full hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
                      >
                        {i + 1}. {title}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-800 dark:text-ink-200 whitespace-pre-wrap">
                  {result.result || result.improved_text || result.text}
                </p>
              )}
            </div>

            {selectedAction !== 'suggest_titles' && (
              <button
                onClick={handleApply}
                className="btn-primary w-full mt-4"
              >
                Apply to Editor
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-ink-200 dark:border-ink-800">
        <p className="text-xs text-ink-400 text-center">
          Powered by Google Gemini AI
        </p>
      </div>
    </motion.div>
  )
}
