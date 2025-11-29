const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow;
let currentFile = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        title: 'VoxelScript 3D Editor',
        icon: path.join(__dirname, 'assets', 'icon.png'),
        frame: false,
        transparent: false,
        backgroundColor: '#000000',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    mainWindow.loadFile('index.html');
    
    // Create menu
    const menu = Menu.buildFromTemplate([
        {
            label: 'File',
            submenu: [
                { label: 'New', accelerator: 'CmdOrCtrl+N', click: () => mainWindow.webContents.send('new-file') },
                { label: 'Open', accelerator: 'CmdOrCtrl+O', click: openFile },
                { label: 'Save', accelerator: 'CmdOrCtrl+S', click: saveFile },
                { label: 'Save As', accelerator: 'CmdOrCtrl+Shift+S', click: saveFileAs },
                { type: 'separator' },
                { label: 'Exit', accelerator: 'Alt+F4', click: () => app.quit() }
            ]
        },
        {
            label: 'Run',
            submenu: [
                { label: 'Run Script', accelerator: 'F5', click: () => mainWindow.webContents.send('run-script') },
                { label: 'Stop', accelerator: 'Shift+F5', click: () => mainWindow.webContents.send('stop-script') }
            ]
        },
        {
            label: 'View',
            submenu: [
                { label: 'Toggle 3D View', accelerator: 'CmdOrCtrl+3', click: () => mainWindow.webContents.send('toggle-3d') },
                { label: 'Toggle Console', accelerator: 'CmdOrCtrl+`', click: () => mainWindow.webContents.send('toggle-console') },
                { type: 'separator' },
                { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', click: () => mainWindow.webContents.send('zoom-in') },
                { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: () => mainWindow.webContents.send('zoom-out') },
                { type: 'separator' },
                { label: 'Developer Tools', accelerator: 'F12', click: () => mainWindow.webContents.toggleDevTools() }
            ]
        },
        {
            label: 'Help',
            submenu: [
                { label: 'Documentation', click: () => require('electron').shell.openExternal('https://github.com/qulyttvv-beep/voxelscript') },
                { label: 'About', click: showAbout }
            ]
        }
    ]);
    Menu.setApplicationMenu(menu);
}

async function openFile() {
    const result = await dialog.showOpenDialog(mainWindow, {
        filters: [{ name: 'VoxelScript', extensions: ['voxel', 'vxl'] }],
        properties: ['openFile']
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
        currentFile = result.filePaths[0];
        const content = fs.readFileSync(currentFile, 'utf-8');
        mainWindow.webContents.send('file-opened', { path: currentFile, content });
    }
}

async function saveFile() {
    if (currentFile) {
        mainWindow.webContents.send('get-content-for-save');
    } else {
        saveFileAs();
    }
}

async function saveFileAs() {
    const result = await dialog.showSaveDialog(mainWindow, {
        filters: [{ name: 'VoxelScript', extensions: ['voxel'] }],
        defaultPath: 'untitled.voxel'
    });
    
    if (!result.canceled) {
        currentFile = result.filePath;
        mainWindow.webContents.send('get-content-for-save');
    }
}

function showAbout() {
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'About VoxelScript 3D Editor',
        message: 'VoxelScript 3D Editor v1.0.0',
        detail: 'A futuristic 3D code editor for the VoxelScript programming language.\n\nMatrix Edition 🟢\n\nCreated by qulyttvv-beep'
    });
}

// IPC Handlers
ipcMain.on('save-content', (event, content) => {
    if (currentFile) {
        fs.writeFileSync(currentFile, content, 'utf-8');
        mainWindow.webContents.send('file-saved', currentFile);
    }
});

ipcMain.on('run-voxel', (event, code) => {
    const isWindows = process.platform === 'win32';
    const voxelCmd = isWindows ? 'voxel.cmd' : 'voxel';
    
    const child = spawn(voxelCmd, ['-e', code], {
        shell: true,
        env: process.env
    });
    
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
        output += data.toString();
        mainWindow.webContents.send('script-output', data.toString());
    });
    
    child.stderr.on('data', (data) => {
        errorOutput += data.toString();
        mainWindow.webContents.send('script-error', data.toString());
    });
    
    child.on('close', (code) => {
        mainWindow.webContents.send('script-done', { code, output, errorOutput });
    });
});

ipcMain.on('run-voxel-file', (event, filePath) => {
    const isWindows = process.platform === 'win32';
    const voxelCmd = isWindows ? 'voxel.cmd' : 'voxel';
    
    const child = spawn(voxelCmd, [filePath], {
        shell: true,
        env: process.env
    });
    
    child.stdout.on('data', (data) => {
        mainWindow.webContents.send('script-output', data.toString());
    });
    
    child.stderr.on('data', (data) => {
        mainWindow.webContents.send('script-error', data.toString());
    });
    
    child.on('close', (code) => {
        mainWindow.webContents.send('script-done', { code });
    });
});

ipcMain.on('minimize', () => mainWindow.minimize());
ipcMain.on('maximize', () => {
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
});
ipcMain.on('close', () => mainWindow.close());

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
