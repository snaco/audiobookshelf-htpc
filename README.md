# Audiobookshelf HTPC

A dedicated HTPC client for Audiobookshelf with game controller support. Inspired by Plex HTPC, this app provides a 10-foot interface optimized for living room use with gamepad navigation.

## Features

- **HTPC-Optimized UI**: Large text, high contrast, and 10-foot interface design
- **Game Controller Support**: Full support for Xbox, PlayStation, and generic gamepads
- **Keyboard Navigation**: Full keyboard controls for non-controller users
- **Audiobookshelf Integration**: Connect to your existing Audiobookshelf server
- **Audio Playback**: Stream audiobooks directly from your server
- **AppImage Build**: Self-contained Linux executable for easy distribution

## Prerequisites

- Node.js 18+ and npm
- Audiobookshelf server running locally or remotely
- (Optional) Game controller (Xbox, PlayStation, or generic USB gamepad)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd audiobookshelf-htpc
```

2. Install dependencies:
```bash
npm install
```

## Development

Run the development server with hot reload:
```bash
npm run dev
```

Run Electron in development mode:
```bash
npm run electron:dev
```

## Building

Build for production:
```bash
npm run build
```

Build Linux AppImage:
```bash
npm run electron:build:linux
```

The AppImage will be created in the `release/` directory.

## Configuration

On first launch, configure your Audiobookshelf connection in Settings:

1. Press `Start` button on gamepad or `Ctrl+S` on keyboard to open Settings
2. Enter your Audiobookshelf server URL (e.g., `http://localhost:13378`)
3. Enter your API key (generate this in Audiobookshelf server settings)
4. Click Save

## Controls

### Game Controller

- **A Button**: Select/Play
- **B Button**: Back
- **D-Pad**: Navigate library
- **Left Stick**: Navigate library
- **Right Stick**: Seek/Volume control
- **Start Button**: Open Settings
- **Select Button**: Go back

### Keyboard

- **Arrow Keys**: Navigate
- **Enter/Space**: Select/Play
- **Escape**: Back
- **Ctrl+S**: Settings
- **Arrow Left/Right**: Seek
- **Arrow Up/Down**: Volume

## Project Structure

```
audiobookshelf-htpc/
├── electron/
│   ├── main.ts          # Electron main process
│   └── preload.ts       # Preload script for IPC
├── src/
│   ├── components/      # React components
│   │   ├── LibraryView.tsx
│   │   ├── PlayerView.tsx
│   │   └── SettingsView.tsx
│   ├── hooks/
│   │   └── useGamepad.ts  # Game controller hook
│   ├── services/
│   │   └── audiobookshelfApi.ts  # API client
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── build/
│   └── icon.svg        # App icon
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## Technology Stack

- **Electron**: Desktop application framework
- **React**: UI library
- **Vite**: Build tool and dev server
- **TypeScript**: Type safety
- **TailwindCSS**: Styling
- **Axios**: HTTP client for API calls

## License

MIT