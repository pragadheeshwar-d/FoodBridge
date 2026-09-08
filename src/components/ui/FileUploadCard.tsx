import { useState, useRef, useCallback } from 'react'
import { Upload, X, FileText, AlertCircle } from 'lucide-react'

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_EXTENSIONS_LABEL = 'PDF, JPG or PNG'

interface FileUploadCardProps {
  label?: string
  file: File | null
  onChange: (file: File | null) => void
  error?: string
  helperText?: string
}

export function FileUploadCard({ label, file, onChange, error, helperText }: FileUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const validateFile = useCallback((f: File): string | null => {
    if (!ALLOWED_TYPES.includes(f.type)) {
      return `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS_LABEL}`
    }
    if (f.size > MAX_SIZE_BYTES) {
      return 'File size exceeds 5MB limit.'
    }
    return null
  }, [])

  const handleFile = useCallback(
    (f: File) => {
      const err = validateFile(f)
      if (err) {
        setLocalError(err)
        onChange(null)
      } else {
        setLocalError(null)
        onChange(f)
      }
    },
    [validateFile, onChange],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragActive(false)
      const droppedFile = e.dataTransfer.files?.[0]
      if (droppedFile) handleFile(droppedFile)
    },
    [handleFile],
  )

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const onDragLeave = useCallback(() => setDragActive(false), [])

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0]
      if (selected) handleFile(selected)
    },
    [handleFile],
  )

  const removeFile = useCallback(() => {
    onChange(null)
    setLocalError(null)
    if (inputRef.current) inputRef.current.value = ''
  }, [onChange])

  const displayError = error || localError

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-text dark:text-gray-200">{label}</label>
      )}

      {file ? (
        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 dark:bg-primary/10 px-4 py-3">
          <FileText className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-text dark:text-gray-200">{file.name}</p>
            <p className="text-xs text-text-secondary">
              {(file.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={removeFile}
            className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-text-secondary hover:text-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 cursor-pointer transition-all ${
            dragActive
              ? 'border-primary bg-primary/10'
              : displayError
                ? 'border-red-400 bg-red-50 dark:bg-red-900/10'
                : 'border-gray-300 dark:border-gray-600 hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/5'
          }`}
        >
          <Upload className={`w-8 h-8 ${dragActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`} />
          <div className="text-center">
            <p className="text-sm font-medium text-text dark:text-gray-200">Upload certificate</p>
            <p className="text-xs text-text-secondary mt-0.5">
              {ALLOWED_EXTENSIONS_LABEL} &middot; Max 5MB
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={onInputChange}
        className="hidden"
      />

      {displayError && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="w-3 h-3" /> {displayError}
        </p>
      )}
      {helperText && !displayError && (
        <p className="text-xs text-text-secondary">{helperText}</p>
      )}
    </div>
  )
}
