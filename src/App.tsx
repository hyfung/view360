import { useCallback, useRef, useState } from 'react'
import Viewer360 from './Viewer360'
import './App.css'

const GALLERY_IMAGES = [
  'typer_01.JPG',
  'typer_02.JPG',
  'typer_03.JPG',
  'typer_04.JPG',
  'typer_05.JPG',
  'typer_06.JPG',
]

export default function App() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const revokePrev = (prev: string | null) => {
    if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
  }

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    setImageUrl(prev => { revokePrev(prev); return url })
  }, [])

  const selectGalleryImage = useCallback((filename: string) => {
    setImageUrl(prev => { revokePrev(prev); return `${import.meta.env.BASE_URL}${filename}` })
  }, [])

  const handleBack = useCallback(() => {
    setImageUrl(prev => { revokePrev(prev); return null })
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
        <div className="viewer-wrapper">
          <Viewer360 imageUrl={imageUrl} />
          <button className="back-btn" onClick={handleBack}>← Gallery</button>
        </div>
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
            <p>Select a sample image to explore</p>
            <div className="gallery-grid">
              {GALLERY_IMAGES.map(name => (
                <button
                  key={name}
                  className="gallery-thumb"
                  onClick={() => selectGalleryImage(name)}
                >
                  <img src={`${import.meta.env.BASE_URL}${name}`} alt={name} />
                  <span>{name.replace(/\.[^.]+$/, '')}</span>
                </button>
              ))}
            </div>
            <p className="hint">— or drop / browse your own —</p>
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
