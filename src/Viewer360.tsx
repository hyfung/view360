import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface Props {
  imageUrl: string
}

const FOV_MIN = 20
const FOV_MAX = 120
const FOV_DEFAULT = 75

export default function Viewer360({ imageUrl }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({
    lon: 0,    // horizontal angle (degrees)
    lat: 0,    // vertical angle (degrees)
    fov: FOV_DEFAULT,
    dragging: false,
    lastX: 0,
    lastY: 0,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    animId: 0,
  })
  const [fov, setFov] = useState(FOV_DEFAULT)
  const [saved, setSaved] = useState(false)

  // Touch support
  const touchRef = useRef<{ dist: number; lastX: number; lastY: number } | null>(null)

  const updateCamera = useCallback(() => {
    const s = stateRef.current
    if (!s.camera) return
    s.lat = Math.max(-85, Math.min(85, s.lat))
    const phi = THREE.MathUtils.degToRad(90 - s.lat)
    const theta = THREE.MathUtils.degToRad(s.lon)
    s.camera.lookAt(
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.sin(theta)
    )
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const s = stateRef.current

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    s.renderer = renderer

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(FOV_DEFAULT, canvas.clientWidth / canvas.clientHeight, 0.1, 1000)
    camera.position.set(0, 0, 0)
    s.camera = camera

    const texture = new THREE.TextureLoader().load(imageUrl)
    texture.colorSpace = THREE.SRGBColorSpace
    const geometry = new THREE.SphereGeometry(500, 60, 40)
    geometry.scale(-1, 1, 1)  // flip inside-out
    const material = new THREE.MeshBasicMaterial({ map: texture })
    scene.add(new THREE.Mesh(geometry, material))

    const animate = () => {
      s.animId = requestAnimationFrame(animate)
      updateCamera()
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(canvas)

    return () => {
      cancelAnimationFrame(s.animId)
      ro.disconnect()
      renderer.dispose()
      texture.dispose()
      geometry.dispose()
      material.dispose()
    }
  }, [imageUrl, updateCamera])

  // Sync FOV to camera
  useEffect(() => {
    const s = stateRef.current
    s.fov = fov
    if (s.camera) {
      s.camera.fov = fov
      s.camera.updateProjectionMatrix()
    }
  }, [fov])

  // Mouse handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const s = stateRef.current
    s.dragging = true
    s.lastX = e.clientX
    s.lastY = e.clientY
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const s = stateRef.current
    if (!s.dragging) return
    const dx = e.clientX - s.lastX
    const dy = e.clientY - s.lastY
    s.lastX = e.clientX
    s.lastY = e.clientY
    const speed = s.fov / 500
    s.lon -= dx * speed
    s.lat += dy * speed
  }, [])

  const onMouseUp = useCallback(() => {
    stateRef.current.dragging = false
  }, [])

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const s = stateRef.current
    const newFov = Math.max(FOV_MIN, Math.min(FOV_MAX, s.fov + e.deltaY * 0.05))
    s.fov = newFov
    setFov(newFov)
  }, [])

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchRef.current = { dist: 0, lastX: e.touches[0].clientX, lastY: e.touches[0].clientY }
      stateRef.current.dragging = true
    } else if (e.touches.length === 2) {
      stateRef.current.dragging = false
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      touchRef.current = { dist: Math.sqrt(dx * dx + dy * dy), lastX: 0, lastY: 0 }
    }
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    const s = stateRef.current
    if (!touchRef.current) return
    if (e.touches.length === 1 && s.dragging) {
      const dx = e.touches[0].clientX - touchRef.current.lastX
      const dy = e.touches[0].clientY - touchRef.current.lastY
      touchRef.current.lastX = e.touches[0].clientX
      touchRef.current.lastY = e.touches[0].clientY
      const speed = s.fov / 500
      s.lon -= dx * speed
      s.lat += dy * speed
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const delta = touchRef.current.dist - dist
      const newFov = Math.max(FOV_MIN, Math.min(FOV_MAX, s.fov + delta * 0.1))
      s.fov = newFov
      setFov(newFov)
      touchRef.current.dist = dist
    }
  }, [])

  const onTouchEnd = useCallback(() => {
    stateRef.current.dragging = false
    touchRef.current = null
  }, [])

  const saveView = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `view360_${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }, [])

  return (
    <div className="viewer-root">
      <canvas
        ref={canvasRef}
        className="viewer-canvas"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      />
      <div className="hud">
        <div className="hud-row">
          <label className="hud-label">FOV</label>
          <input
            type="range"
            min={FOV_MIN}
            max={FOV_MAX}
            value={fov}
            onChange={e => setFov(Number(e.target.value))}
            className="hud-slider"
          />
          <span className="hud-value">{Math.round(fov)}°</span>
        </div>
        <div className="hud-row hud-bottom-row">
          <span className="hud-hint">Drag to pan · Scroll to zoom</span>
          <button className={`save-btn ${saved ? 'saved' : ''}`} onClick={saveView}>
            {saved ? '✓ Saved' : 'Save view'}
          </button>
        </div>
      </div>
    </div>
  )
}
