import { app, BrowserWindow, ipcMain, screen } from "electron";

let mainWindow: BrowserWindow;
let userSetOpacity = 1;


app.whenReady().then(() => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  

  const position = { x: width - 350, y: height - 400 };

  
  mainWindow = new BrowserWindow({
    width: 300,
    height: 350,
    x: position.x,
    y: position.y,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    resizable: true,
    movable: true,
    minimizable: true,
    closable: true,
  });

  mainWindow.loadURL("http://localhost:5173");

  // Normal window operation handlers
  ipcMain.on('set-opacity', (_, opacity) => {
    userSetOpacity = opacity;
    mainWindow.setOpacity(opacity);
  });
  
  ipcMain.on('set-ignore-mouse-events', (_, ignore, options) => {
    mainWindow.setIgnoreMouseEvents(ignore, options);
  });

  mainWindow.on('blur', () => {
    mainWindow.setOpacity(0.5);
  });
  
  mainWindow.on('focus', () => {
    mainWindow.setOpacity(userSetOpacity);
  });

  ipcMain.on('move-window', (_, { dx, dy }) => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x + dx, y + dy);

  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
});