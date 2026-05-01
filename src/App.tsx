import { useState, useEffect } from 'react'
import { useGamepad } from './hooks/useGamepad'
import LibraryView from './components/LibraryView'
import PlayerView from './components/PlayerView'
import SettingsView from './components/SettingsView'

type View = 'library' | 'player' | 'settings'

function App() {
  const [currentView, setCurrentView] = useState<View>('library')
  const { gamepads, connected } = useGamepad()

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch(e.key) {
        case 'Escape':
          setCurrentView('library')
          break
        case 's':
          if (e.ctrlKey) {
            setCurrentView('settings')
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  return (
    <div className="w-full h-full bg-darker text-white">
      {connected && (
        <div className="fixed top-4 right-4 bg-surface px-4 py-2 rounded-lg text-htpc-sm">
          Gamepad Connected
        </div>
      )}
      
      {currentView === 'library' && <LibraryView onSelectBook={() => setCurrentView('player')} />}
      {currentView === 'player' && <PlayerView onBack={() => setCurrentView('library')} />}
      {currentView === 'settings' && <SettingsView onBack={() => setCurrentView('library')} />}
    </div>
  )
}

export default App
