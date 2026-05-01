import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  onGamepadConnected: (callback: (index: number) => void) => {
    ipcRenderer.on('gamepad-connected', (_event, index) => callback(index))
  },
  onGamepadDisconnected: (callback: (index: number) => void) => {
    ipcRenderer.on('gamepad-disconnected', (_event, index) => callback(index))
  },
  onGamepadButtonPress: (callback: (data: { button: string; pressed: boolean }) => void) => {
    ipcRenderer.on('gamepad-button-press', (_event, data) => callback(data))
  },
  onGamepadAxisMove: (callback: (data: { axis: string; value: number }) => void) => {
    ipcRenderer.on('gamepad-axis-move', (_event, data) => callback(data))
  }
})
