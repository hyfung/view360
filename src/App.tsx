import { useCallback, useRef, useState } from 'react'
import Viewer360 from './Viewer360'
import './App.css'

export default function App() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    setImageUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url })
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingFile(false)
    const file = e.dataTransfer.files[0]
    if (file) loadFile(file)
  }, [loadFile])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingFile(true)
  }, [])

  const onDragLeave = useCallback(() => setIsDraggingFile(false), [])

  const onFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) loadFile(file)
  }, [loadFile])

  return (
    <div
      className="app-root"
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      {imageUrl ? (
        <Viewer360 imageUrl={imageUrl} />
      ) : (
        <div className={`drop-zone ${isDraggingFile ? 'drag-over' : ''}`}>
          <div className="drop-content">
            <svg className="drop-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2.5" />
              <ellipse cx="32" cy="32" rx="14" ry="28" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
              <line x1="4" y1="32" x2="60" y2="32" stroke="currentColor" strokeWidth="2" />
              <line x1="32" y1="4" x2="32" y2="60" stroke="currentColor" strokeWidth="2" />
            </svg>
            <h1>360° Image Viewer</h1>
            <p>Drop an equirectangular image here</p>
            <p className="hint">or</p>
            <button className="browse-btn" onClick={() => inputRef.current?.click()}>
              Browse files
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={onFileInput}
            />
            <p className="supported">Supports JPG, PNG, WebP · Equirectangular format</p>
          </div>
        </div>
      )}
    </div>
  )
}
