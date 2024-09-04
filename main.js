// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, screen, systemPreferences, desktopCapturer } = require('electron');
const util = require("electron-util");
const path = require('path');
const IS_OSX = process.platform === 'darwin';
const { uIOhook, UiohookKey } = require('uiohook-napi');
const fs = require('fs');

let mainWindow = null;
let overlayWindow = null;

const preloadPath = path.join(__dirname, 'preload.js');
console.log(`Preload script path: ${preloadPath}`);

let config;

function readConfig() {
    const configPath = path.join(app.getPath('userData'), 'config.json');
    try {
        if (fs.existsSync(configPath)) {
            const content = fs.readFileSync(configPath, 'utf-8');
            config = JSON.parse(content);
            console.log('Configuration loaded:', config);
        } else {
            console.log('No configuration file found, loading defaults.');
            config = { overlay: { width: 800, height: 600, x: 100, y: 100 } }; // Default config
        }
    } catch (error) {
        console.error('Error reading config file:', error);
        config = { overlay: { width: 800, height: 600, x: 100, y: 100 } }; // Fallback default
    }
}

function createWindow() {
    // Get the primary display's size
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    // Set the main window size to half the screen width and full height
    const windowWidth = Math.floor(width / 2);
    const windowHeight = height;

    // Create the main browser window on the left side.
    mainWindow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        x: 0, // Left side of the screen
        y: 0,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            devTools: true,
            sandbox: false,
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false,
        }
    });
    mainWindow.webContents.setFrameRate(1);

    // Load the index.html of the app.
    mainWindow.loadFile('index.html');

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    // Create the overlay window.
    createOverlayWindow();
}

function createOverlayWindow() {
    // Set the overlay window size to 200x200
    const overlayWidth = 800;
    const overlayHeight = 50;

    // Position it at the top right of the screen
    const overlayX = 1200;
    const overlayY = 0;

    overlayWindow = new BrowserWindow({
        width: overlayWidth,
        height: overlayHeight,
        x: overlayX,
        y: overlayY,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        resizable: false,
        skipTaskbar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            devTools: true,
            sandbox: false,
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false,
        }
    });

    // Load the overlay.html file.
    overlayWindow.loadFile('overlay.html');

    // Make the overlay window click-through.
    overlayWindow.setIgnoreMouseEvents(false); // Set to false if you want it to be interactive

    // Open DevTools for the overlay window
    overlayWindow.webContents.openDevTools({ mode: 'detach' });

    overlayWindow.on('closed', function () {
        overlayWindow = null;
    });

        return overlayWindow;
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    mainWindow.on('closed', function () {
        mainWindow = null;
        if (overlayWindow) overlayWindow.close();
    });

    initializeKeyListeners(mainWindow); // Initialize key listeners when the app is ready
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// IPC and desktop capturer handlers remain the same as in your original code
ipcMain.handle('electronMain:openScreenSecurity', () => util.openSystemPreferences('security', 'Privacy_ScreenCapture'));
ipcMain.handle('electronMain:getScreenAccess', () => !IS_OSX || systemPreferences.getMediaAccessStatus('screen') === 'granted');
ipcMain.handle('electronMain:screen:getSources', () => {
    return desktopCapturer.getSources({types: ['window', 'screen']}).then(async sources => {
        return sources.map(source => {
            source.thumbnailURL = source.thumbnail.toDataURL();
            return source;
        });
    });
});
ipcMain.handle('electronMain:updateOverlaySize', (event, newWidth, newHeight) => {
    if (overlayWindow) {
        overlayWindow.setSize(newWidth, newHeight);
        console.log(`Overlay size updated to: ${newWidth}x${newHeight}`);
    }
});

ipcMain.handle('electronMain:updateOverlayPosition', (event, newX, newY) => {
    if (overlayWindow) {
        overlayWindow.setPosition(newX, newY);
        console.log(`Overlay position updated to: X=${newX}, Y=${newY}`);
    }
});

ipcMain.handle('get-config', () => {
    return config;
});

// Initialize key listeners as in your original code
function initializeKeyListeners(mainWindow) {
    let tabDown = false;
    let backspaceDown = false;
    let keyHoldTimeout = null;

    uIOhook.on('keydown', (e) => {
        if (e.keycode === UiohookKey.Tab && !tabDown) {
            tabDown = true;
            keyHoldTimeout = setTimeout(() => {
                mainWindow.webContents.send('trigger-screenshot');
                console.log("Tab held for 500ms - Screenshot triggered");
            }, 300);
        }
        /*
        if (e.keycode === UiohookKey.Backspace && !backspaceDown) {
            backspaceDown = true;
            keyHoldTimeout = setTimeout(() => {
                mainWindow.webContents.send('trigger-create-match');
                console.log("backspace held for 500ms - New match triggered");
            }, 300);
        }
        */
    });

    uIOhook.on('keyup', (e) => {
        if (e.keycode === UiohookKey.Tab && tabDown) {
            tabDown = false;
            if (keyHoldTimeout) {
                clearTimeout(keyHoldTimeout);
                keyHoldTimeout = null;
                console.log("Tab released before 500ms - Screenshot canceled");
            }
            console.log("Tab up");
        }
        /*
        if (e.keycode === UiohookKey.Backspace && backspaceDown) {
            backspaceDown = false;
            if (keyHoldTimeout) {
                clearTimeout(keyHoldTimeout);
                keyHoldTimeout = null;
                console.log("backspace released before 500ms - BACKSPACE canceled");
            }
        }
            */
    });

    uIOhook.start();
}
