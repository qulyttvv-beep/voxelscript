const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let currentProjectPath = null;
let fileToOpen = null; // File passed via command line (double-click .voxel)

// Handle file association - when user double-clicks a .voxel file
function handleFileOpen(filePath) {
    if (filePath && (filePath.endsWith('.voxel') || filePath.endsWith('.vxl'))) {
        if (mainWindow && mainWindow.webContents) {
            const content = fs.readFileSync(filePath, 'utf-8');
            mainWindow.webContents.send('file-opened', { path: filePath, content });
        } else {
            fileToOpen = filePath;
        }
    }
}

// Windows: Handle file from command line args
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine) => {
        // Someone tried to run a second instance, focus our window
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
            
            // Check if file was passed
            const filePath = commandLine.find(arg => arg.endsWith('.voxel') || arg.endsWith('.vxl'));
            if (filePath) {
                handleFileOpen(filePath);
            }
        }
    });
}

// Check command line args for file to open
process.argv.slice(1).forEach(arg => {
    if (arg.endsWith('.voxel') || arg.endsWith('.vxl')) {
        fileToOpen = arg;
    }
});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        backgroundColor: '#000000',
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        frame: false,
        titleBarStyle: 'hidden'
    });

    mainWindow.loadFile('index.html');

    // DevTools disabled for production
    // mainWindow.webContents.openDevTools();

    // When window is ready, open file if passed via command line
    mainWindow.webContents.on('did-finish-load', () => {
        if (fileToOpen) {
            handleFileOpen(fileToOpen);
            fileToOpen = null;
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Create custom menu
const menuTemplate = [
    {
        label: 'File',
        submenu: [
            { label: 'New File', accelerator: 'CmdOrCtrl+N', click: () => mainWindow.webContents.send('menu-new-file') },
            { label: 'Open File', accelerator: 'CmdOrCtrl+O', click: () => openFile() },
            { label: 'Open Folder', accelerator: 'CmdOrCtrl+Shift+O', click: () => openFolder() },
            { type: 'separator' },
            { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => mainWindow.webContents.send('menu-save') },
            { label: 'Save As', accelerator: 'CmdOrCtrl+Shift+S', click: () => mainWindow.webContents.send('menu-save-as') },
            { type: 'separator' },
            { label: 'Exit', accelerator: 'Alt+F4', click: () => app.quit() }
        ]
    },
    {
        label: 'Run',
        submenu: [
            { label: 'Run Script', accelerator: 'F5', click: () => mainWindow.webContents.send('menu-run') },
            { label: 'Stop Script', accelerator: 'Shift+F5', click: () => mainWindow.webContents.send('menu-stop') }
        ]
    },
    {
        label: 'View',
        submenu: [
            { label: 'Toggle 3D View', accelerator: 'CmdOrCtrl+3', click: () => mainWindow.webContents.send('menu-toggle-3d') },
            { label: 'Toggle File Browser', accelerator: 'CmdOrCtrl+B', click: () => mainWindow.webContents.send('menu-toggle-files') },
            { type: 'separator' },
            { label: 'Toggle DevTools', accelerator: 'F12', click: () => mainWindow.webContents.toggleDevTools() },
            { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.reload() }
        ]
    }
];

app.whenReady().then(() => {
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
    createWindow();
});

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

// IPC Handlers

// Open file dialog
async function openFile() {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'VoxelScript Files', extensions: ['voxel', 'vxl'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const content = fs.readFileSync(filePath, 'utf-8');
        mainWindow.webContents.send('file-opened', { path: filePath, content });
    }
}

// Open folder dialog
async function openFolder() {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
        currentProjectPath = result.filePaths[0];
        const files = scanDirectory(currentProjectPath);
        mainWindow.webContents.send('folder-opened', { path: currentProjectPath, files });
    }
}

// Scan directory for files
function scanDirectory(dirPath, relativePath = '') {
    const items = [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relPath = path.join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
            items.push({
                name: entry.name,
                path: fullPath,
                relativePath: relPath,
                type: 'folder',
                children: scanDirectory(fullPath, relPath)
            });
        } else if (entry.name.endsWith('.voxel') || entry.name.endsWith('.vxl')) {
            items.push({
                name: entry.name,
                path: fullPath,
                relativePath: relPath,
                type: 'file'
            });
        }
    }
    
    return items;
}

// Read file
ipcMain.handle('read-file', async (event, filePath) => {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return { success: true, content };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Write file
ipcMain.handle('write-file', async (event, filePath, content) => {
    try {
        fs.writeFileSync(filePath, content, 'utf-8');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Save file dialog
ipcMain.handle('save-file-dialog', async (event, defaultName) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: defaultName || 'untitled.voxel',
        filters: [
            { name: 'VoxelScript Files', extensions: ['voxel'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });
    
    return result.canceled ? null : result.filePath;
});

// Create new file
ipcMain.handle('create-file', async (event, dirPath, fileName) => {
    try {
        const filePath = path.join(dirPath, fileName);
        if (!fileName.endsWith('.voxel')) {
            fileName += '.voxel';
        }
        fs.writeFileSync(path.join(dirPath, fileName), '// New VoxelScript file\n\nprint "Hello, Voxel!"\n', 'utf-8');
        return { success: true, path: path.join(dirPath, fileName) };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Get project path
ipcMain.handle('get-project-path', async () => {
    return currentProjectPath;
});

// Scan current project
ipcMain.handle('scan-project', async () => {
    if (currentProjectPath) {
        return scanDirectory(currentProjectPath);
    }
    return [];
});

// Open folder from renderer
ipcMain.handle('open-folder-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
        currentProjectPath = result.filePaths[0];
        const files = scanDirectory(currentProjectPath);
        return { path: currentProjectPath, files };
    }
    return null;
});

// Window controls
ipcMain.on('window-minimize', () => {
    mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
});

ipcMain.on('window-close', () => {
    mainWindow.close();
});
