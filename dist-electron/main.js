var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
var _a = require('electron'), app = _a.app, BrowserWindow = _a.BrowserWindow, ipcMain = _a.ipcMain, dialog = _a.dialog;
var https = require('https');
var electronScreen = require('electron').screen; // Import screen separately with a different name
var path = require('path');
var mainWindow;
var userSetOpacity = 1;
var databasePath;
if (app.isPackaged) {
    // Use extraResources path for your database module
    databasePath = path.join(process.resourcesPath, 'database.cjs');
}
else {
    // Use relative path for development
    databasePath = path.join(__dirname, 'database');
}
// Function to check for updates
function checkForUpdates(currentVersion) {
    var options = {
        hostname: 'api.github.com',
        path: '/repos/ejsinfuego/stickier-note/releases/latest',
        headers: {
            'User-Agent': 'Stickier-Note-App'
        }
    };
    https.get(options, function (res) {
        var data = '';
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            try {
                var release_1 = JSON.parse(data);
                var latestVersion = release_1.tag_name.replace('v', '');
                // Compare versions (simple string comparison works for semver like 1.0.2)
                if (latestVersion > currentVersion) {
                    dialog.showMessageBox({
                        type: 'info',
                        title: 'Update Available',
                        message: "A new version (".concat(latestVersion, ") is available!"),
                        buttons: ['Download', 'Later'],
                        detail: 'Would you like to download the latest version?'
                    }).then(function (result) {
                        if (result.response === 0) {
                            // Open the release page in the default browser
                            require('electron').shell.openExternal(release_1.html_url);
                        }
                    });
                }
            }
            catch (error) {
                console.error('Error checking for updates:', error);
            }
        });
    }).on('error', function (error) {
        console.error('Error checking for updates:', error);
    });
}
try {
    var _b = require(databasePath), dbSaveNote_1 = _b.saveNote, dbGetNote_1 = _b.getNote;
    app.whenReady().then(function () {
        var _a = electronScreen.getPrimaryDisplay().workAreaSize, width = _a.width, height = _a.height;
        var position = { x: width - 350, y: height - 400 };
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
        }
        else {
            mainWindow.loadURL('http://localhost:5173');
        }
        ipcMain.on('set-opacity', function (_, opacity) {
            userSetOpacity = opacity;
            mainWindow.setOpacity(opacity);
        });
        ipcMain.on('minimize-window', function () {
            mainWindow.minimize();
        });
        ipcMain.on('set-ignore-mouse-events', function (_, ignore, options) {
            mainWindow.setIgnoreMouseEvents(ignore, options);
        });
        mainWindow.on('blur', function () {
            mainWindow.setOpacity(0.5);
        });
        mainWindow.on('focus', function () {
            mainWindow.setOpacity(userSetOpacity);
        });
        ipcMain.on('move-window', function (_, _a) {
            var dx = _a.dx, dy = _a.dy;
            var _b = mainWindow.getPosition(), x = _b[0], y = _b[1];
            mainWindow.setPosition(x + dx, y + dy);
        });
        ipcMain.handle('get-note', function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, dbGetNote_1()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); });
        ipcMain.handle('save-note', function (_, noteData) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, dbSaveNote_1(noteData)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); });
        app.on("window-all-closed", function () {
            if (process.platform !== "darwin") {
                app.quit();
            }
        });
        // Check for updates when app starts (only in packaged app)
        if (app.isPackaged) {
            var currentVersion = app.getVersion();
            checkForUpdates(currentVersion);
        }
    });
}
catch (error) {
    console.error('Failed to load database module:', error);
    app.quit();
}
var _c = require(databasePath), dbSaveNote = _c.saveNote, dbGetNote = _c.getNote;
