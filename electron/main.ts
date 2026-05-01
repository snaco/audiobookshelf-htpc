import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    fullscreen: false,
    frame: true,
    autoHideMenuBar: true
  })

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC handlers for game controller events
ipcMain.on('gamepad-connected', (event, gamepadIndex: number) => {
  console.log('Gamepad connected:', gamepadIndex)
})

ipcMain.on('gamepad-disconnected', (event, gamepadIndex: number) => {
  console.log('Gamepad disconnected:', gamepadIndex)
})

ipcMain.on('gamepad-button-press', (event, data: { button: string; pressed: boolean }) => {
  console.log('Button press:', data)
})

ipcMain.on('gamepad-axis-move', (event, data: { axis: string; value: number }) => {
  console.log('Axis move:', data)
})
