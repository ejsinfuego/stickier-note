const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const https = require('https');
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

// Function to check for updates
function checkForUpdates(currentVersion: string) {
  const options = {
    hostname: 'api.github.com',
    path: '/repos/ejsinfuego/stickier-note/releases/latest',
    headers: {
      'User-Agent': 'Stickier-Note-App'
    }
  };

  https.get(options, (res: any) => {
    let data = '';
    
    res.on('data', (chunk: string) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const release = JSON.parse(data);
        const latestVersion = release.tag_name.replace('v', '');
        
        // Compare versions (simple string comparison works for semver like 1.0.2)
        if (latestVersion > currentVersion) {
          interface UpdateDialogOptions {
            type: 'info';
            title: string;
            message: string;
            buttons: string[];
            detail: string;
          }

          interface UpdateDialogResult {
            response: number;
          }

          dialog.showMessageBox({
            type: 'info',
            title: 'Update Available',
            message: `A new version (${latestVersion}) is available!`,
            buttons: ['Download', 'Later'],
            detail: 'Would you like to download the latest version?'
          } as UpdateDialogOptions).then((result: UpdateDialogResult) => {
            if (result.response === 0) {
              // Open the release page in the default browser
              require('electron').shell.openExternal(release.html_url);
            }
          });
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    });
  }).on('error', (error: Error) => {
    console.error('Error checking for updates:', error);
  });
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
      // In a packaged app, load from dist directory
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
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
      note: string;
      noteColor: string;
      textColor: string;
      textContent: string;
      htmlContent?: string; // Add HTML content field
    }
  
    ipcMain.handle('save-note', async (_: Electron.IpcMainInvokeEvent, noteData: NoteData) => {
      return await dbSaveNote(noteData);
    });
  
    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") {
        app.quit();
      }
    });

    // Check for updates when app starts (only in packaged app)
    if (app.isPackaged) {
      const currentVersion = app.getVersion();
      checkForUpdates(currentVersion);
    }
  });

  
} catch (error) {
  console.error('Failed to load database module:', error);
  app.quit();
}
const { saveNote: dbSaveNote, getNote: dbGetNote } = require(databasePath);



