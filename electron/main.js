const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

// WM_CLASS / app id. Window managers (Hyprland, KDE, GNOME, i3, ...) match
// .desktop entries to running windows by this value. We pin it to a known
// constant so the StartupWMClass in the .desktop file (set via electron-builder)
// matches the real window class at runtime.
const WM_CLASS = 'audiobookshelf-htpc';

// Has to be called BEFORE `app.whenReady()` so it influences the user-data
// path, the GTK app id, and the X11 WM_CLASS instance name.
app.setName(WM_CLASS);
process.title = WM_CLASS;

function createWindow() {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: process.env.NODE_ENV !== 'development',
    icon: path.join(__dirname, '..', 'build-resources', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false
    },
    backgroundColor: '#08080f',
    frame: process.env.NODE_ENV === 'development'
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:4200');
    win.webContents.openDevTools();
  } else {
    win.loadURL(
      url.format({
        pathname: path.join(__dirname, '..', 'dist', 'audiobookshelf-htpc', 'browser', 'index.html'),
        protocol: 'file:',
        slashes: true
      })
    );
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
