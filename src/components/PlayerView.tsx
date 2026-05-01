import { useState, useEffect } from 'react'

interface PlayerViewProps {
  onBack: () => void
}

export default function PlayerView({ onBack }: PlayerViewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(30)
  const [volume, setVolume] = useState(75)

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch(e.key) {
        case 'Backspace':
        case 'Escape':
          onBack()
          break
        case ' ':
          setIsPlaying(!isPlaying)
          break
        case 'ArrowRight':
          setProgress(p => Math.min(100, p + 5))
          break
        case 'ArrowLeft':
          setProgress(p => Math.max(0, p - 5))
          break
        case 'ArrowUp':
          setVolume(v => Math.min(100, v + 5))
          break
        case 'ArrowDown':
          setVolume(v => Math.max(0, v - 5))
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isPlaying, onBack])

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-htpc-8">
      <button
        onClick={onBack}
        className="absolute top-htpc-4 left-htpc-4 text-htpc-lg hover:text-primary transition-colors"
      >
        ← Back
      </button>

      <div className="bg-surface rounded-lg aspect-square w-96 mb-htpc-8 flex items-center justify-center">
        <span className="text-htpc-3xl">📖</span>
      </div>

      <h1 className="text-htpc-2xl font-bold mb-htpc-2">The Hobbit</h1>
      <p className="text-htpc-lg text-gray-400 mb-htpc-8">J.R.R. Tolkien</p>

      <div className="w-full max-w-4xl mb-htpc-4">
        <div className="bg-surfaceHighlight h-4 rounded-full overflow-hidden">
          <div 
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-htpc-sm text-gray-400 mt-htpc-1">
          <span>3:18:00</span>
          <span>11:00:00</span>
        </div>
      </div>

      <div className="flex items-center gap-htpc-8 mb-htpc-8">
        <button className="text-htpc-2xl hover:text-primary transition-colors">
          ⏮
        </button>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-24 h-24 rounded-full bg-primary hover:bg-primary/80 flex items-center justify-center text-htpc-3xl transition-all"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className="text-htpc-2xl hover:text-primary transition-colors">
          ⏭
        </button>
      </div>

      <div className="flex items-center gap-htpc-4">
        <span className="text-htpc-lg">🔊</span>
        <div className="bg-surfaceHighlight w-64 h-4 rounded-full overflow-hidden">
          <div 
            className="bg-secondary h-full transition-all duration-300"
            style={{ width: `${volume}%` }}
          />
        </div>
        <span className="text-htpc-base text-gray-400">{volume}%</span>
      </div>

      <div className="absolute bottom-htpc-4 text-htpc-sm text-gray-500">
        Controls: Space (Play/Pause) | Arrows (Seek/Volume) | Escape (Back)
      </div>
    </div>
  )
}
