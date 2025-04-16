// import { app, BrowserWindow, ipcMain, screen } from "electron";
// import { getNote, saveNote } from "./database";

const { app, BrowserWindow, ipcMain } = require('electron');
const electronScreen = require('electron').screen;  // Import screen separately with a different name
const path = require('path'); 
let mainWindow: typeof BrowserWindow;
let userSetOpacity = 1;

let databasePath;
if (app.isPackaged) {
  // Use extraResources path for your database module
  databasePath = path.join(process.resourcesPath, 'database.cjs');
} else {
  // Use relative path for development
  databasePath = path.join(__dirname, 'database');
}

try {
  const { saveNote: dbSaveNote, getNote: dbGetNote } = require(databasePath);

  app.whenReady().then(() => {
    const { width, height } = electronScreen.getPrimaryDisplay().workAreaSize;
    
    const position = { x: width - 350, y: height - 400 };
  
    mainWindow = new BrowserWindow({
      width: 300,
      height: 350,
      minWidth: 300,
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
      roundedCorners: true,
      resizable: true,
      movable: true,
      minimizable: true,
      closable: true,
      backgroundMaterial: 'none',
      vibrancy: 'under-window',
      visualEffectState: 'active',
      
    });
  
   
    if (app.isPackaged) {
      // In a packaged app, __dirname points to the app.asar directory
      mainWindow.loadFile(path.join(__dirname, 'index.html'));
    } else {
      mainWindow.loadURL('http://localhost:5173');
    }
  
    ipcMain.on('set-opacity', (_: Electron.IpcMainEvent, opacity: number) => {
      userSetOpacity = opacity;
      mainWindow.setOpacity(opacity);
    });
  
    ipcMain.on('minimize-window', () => {
      mainWindow.minimize();
    });
    
    interface IgnoreMouseEventsOptions {
      forward?: boolean;
    }
  
    ipcMain.on('set-ignore-mouse-events', (_: Electron.IpcMainEvent, ignore: boolean, options?: IgnoreMouseEventsOptions) => {
      mainWindow.setIgnoreMouseEvents(ignore, options);
    });
  
    mainWindow.on('blur', () => {
      mainWindow.setOpacity(0.5);
    });
    
    mainWindow.on('focus', () => {
      mainWindow.setOpacity(userSetOpacity);
    });
  
    ipcMain.on('move-window', (_: Electron.IpcMainEvent, { dx, dy }: { dx: number, dy: number }) => {
      const [x, y] = mainWindow.getPosition();
      mainWindow.setPosition(x + dx, y + dy);
    });
  
    ipcMain.handle('get-note', async () => {
      return await dbGetNote();
    });
  
    interface NoteData {
      content: string;
      title?: string;
      timestamp?: number;
      id?: string;
    }
  
    ipcMain.handle('save-note', async (_: Electron.IpcMainInvokeEvent, noteData: NoteData) => {
      return await dbSaveNote(noteData);
    });
  
    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") {
        app.quit();
      }
    });
  });

  
} catch (error) {
  console.error('Failed to load database module:', error);
  app.quit();
}
const { saveNote: dbSaveNote, getNote: dbGetNote } = require(databasePath);



