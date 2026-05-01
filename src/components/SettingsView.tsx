import { useState } from 'react'

interface SettingsViewProps {
  onBack: () => void
}

export default function SettingsView({ onBack }: SettingsViewProps) {
  const [serverUrl, setServerUrl] = useState('http://localhost:13378')
  const [apiKey, setApiKey] = useState('')

  return (
    <div className="w-full h-full p-htpc-8">
      <button
        onClick={onBack}
        className="absolute top-htpc-4 left-htpc-4 text-htpc-lg hover:text-primary transition-colors"
      >
        ← Back
      </button>

      <h1 className="text-htpc-3xl font-bold mb-htpc-8">Settings</h1>

      <div className="max-w-2xl space-y-htpc-6">
        <div>
          <label className="block text-htpc-lg mb-htpc-2">Audiobookshelf Server URL</label>
          <input
            type="text"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            className="w-full bg-surface border-2 border-surfaceHighlight rounded-lg px-htpc-4 py-htpc-2 text-htpc-base focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-htpc-lg mb-htpc-2">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full bg-surface border-2 border-surfaceHighlight rounded-lg px-htpc-4 py-htpc-2 text-htpc-base focus:border-primary focus:outline-none"
          />
        </div>

        <div className="pt-htpc-4">
          <button className="bg-primary hover:bg-primary/80 px-htpc-8 py-htpc-3 rounded-lg text-htpc-lg font-semibold transition-colors">
            Save Settings
          </button>
        </div>

        <div className="pt-htpc-8 border-t border-surfaceHighlight">
          <h2 className="text-htpc-xl font-semibold mb-htpc-4">Game Controller Mapping</h2>
          <div className="space-y-htpc-2 text-htpc-base text-gray-400">
            <p>A Button: Select/Play</p>
            <p>B Button: Back</p>
            <p>D-Pad: Navigate</p>
            <p>Left Stick: Navigate</p>
            <p>Right Stick: Seek/Volume</p>
            <p>Start: Settings</p>
            <p>Select: Back</p>
          </div>
        </div>
      </div>
    </div>
  )
}
