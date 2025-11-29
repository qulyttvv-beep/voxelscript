// VoxelScript Editor - Renderer Process
const { ipcRenderer } = require('electron');
const path = require('path');

// ============================================
// STATE
// ============================================
let state = {
    projectPath: null,
    files: [],
    openTabs: [],
    activeTab: null,
    modified: new Set(),
    isRunning: false,
    show3D: false,
    inputCallback: null
};

// ============================================
// DOM ELEMENTS
// ============================================
const elements = {
    loading: document.getElementById('loading'),
    loadingProgress: document.querySelector('.loading-progress'),
    loadingText: document.querySelector('.loading-text'),
    matrixCanvas: document.getElementById('matrix-canvas'),
    fileTree: document.getElementById('file-tree'),
    tabsContainer: document.getElementById('tabs-container'),
    codeEditor: document.getElementById('code-editor'),
    lineNumbers: document.getElementById('line-numbers'),
    consoleOutput: document.getElementById('console-output'),
    consoleInput: document.getElementById('console-input'),
    view3d: document.getElementById('view-3d'),
    threeCanvas: document.getElementById('three-canvas'),
    modalOverlay: document.getElementById('modal-overlay'),
    newFileInput: document.getElementById('new-file-input'),
    currentFileTitle: document.getElementById('current-file-title'),
    fileModified: document.getElementById('file-modified')
};

// ============================================
// INITIALIZATION
// ============================================
async function init() {
    showLoading();
    initMatrixRain();
    initEventListeners();
    initResizers();
    updateLineNumbers();
    
    // Load any existing project
    const projectPath = await ipcRenderer.invoke('get-project-path');
    if (projectPath) {
        state.projectPath = projectPath;
        state.files = await ipcRenderer.invoke('scan-project');
        renderFileTree();
    }
    
    hideLoading();
}

// ============================================
// LOADING SCREEN
// ============================================
function showLoading() {
    elements.loading.style.display = 'flex';
    let progress = 0;
    const messages = [
        'INITIALIZING NEURAL MATRIX...',
        'LOADING VOXEL CORE...',
        'ESTABLISHING SECURE CONNECTION...',
        'DECRYPTING INTERFACE...',
        'READY.'
    ];
    
    const interval = setInterval(() => {
        progress += Math.random() * 25;
        if (progress > 100) progress = 100;
        elements.loadingProgress.style.width = progress + '%';
        elements.loadingText.textContent = messages[Math.floor((progress / 100) * (messages.length - 1))];
        
        if (progress >= 100) {
            clearInterval(interval);
        }
    }, 200);
}

function hideLoading() {
    setTimeout(() => {
        elements.loading.style.opacity = '0';
        elements.loading.style.transition = 'opacity 0.5s';
        setTimeout(() => {
            elements.loading.style.display = 'none';
        }, 500);
    }, 1000);
}

// ============================================
// MATRIX RAIN EFFECT
// ============================================
function initMatrixRain() {
    const canvas = elements.matrixCanvas;
    const ctx = canvas.getContext('2d');
    
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
    
    const chars = 'VOXEL01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);
    
    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#00ff00';
        ctx.font = fontSize + 'px monospace';
        
        for (let i = 0; i < drops.length; i++) {
            const char = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(char, i * fontSize, drops[i] * fontSize);
            
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    
    setInterval(draw, 50);
}

// ============================================
// EVENT LISTENERS
// ============================================
function initEventListeners() {
    // Window controls
    document.getElementById('btn-minimize').onclick = () => ipcRenderer.send('window-minimize');
    document.getElementById('btn-maximize').onclick = () => ipcRenderer.send('window-maximize');
    document.getElementById('btn-close').onclick = () => ipcRenderer.send('window-close');
    
    // Toolbar buttons
    document.getElementById('btn-new').onclick = showNewFileModal;
    document.getElementById('btn-open').onclick = openFolder;
    document.getElementById('btn-save').onclick = saveCurrentFile;
    document.getElementById('btn-run').onclick = runCode;
    document.getElementById('btn-stop').onclick = stopCode;
    document.getElementById('btn-3d').onclick = toggle3DView;
    document.getElementById('btn-refresh').onclick = refreshFiles;
    document.getElementById('btn-open-folder').onclick = openFolder;
    document.getElementById('btn-new-tab').onclick = showNewFileModal;
    document.getElementById('btn-clear-console').onclick = clearConsole;
    
    // 3D close button
    document.getElementById('close-3d-btn').onclick = toggle3DView;
    
    // ESC key to close 3D view
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && state.show3D) {
            toggle3DView();
        }
    });
    
    // Modal buttons
    document.getElementById('btn-create-file').onclick = createNewFile;
    document.getElementById('btn-cancel-modal').onclick = hideModal;
    document.querySelector('.modal-close').onclick = hideModal;
    
    // Code editor
    elements.codeEditor.addEventListener('input', onEditorInput);
    elements.codeEditor.addEventListener('scroll', syncScroll);
    elements.codeEditor.addEventListener('keydown', onEditorKeydown);
    
    // Console input
    elements.consoleInput.addEventListener('keydown', onConsoleInput);
    
    // New file input enter key
    elements.newFileInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') createNewFile();
        if (e.key === 'Escape') hideModal();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveCurrentFile();
        }
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            showNewFileModal();
        }
        if (e.key === 'F5') {
            e.preventDefault();
            if (e.shiftKey) stopCode();
            else runCode();
        }
        if (e.ctrlKey && e.key === '3') {
            e.preventDefault();
            toggle3DView();
        }
    });
    
    // IPC listeners
    ipcRenderer.on('file-opened', (event, data) => {
        openFileInEditor(data.path, data.content);
    });
    
    ipcRenderer.on('folder-opened', (event, data) => {
        state.projectPath = data.path;
        state.files = data.files;
        renderFileTree();
    });
    
    ipcRenderer.on('menu-new-file', showNewFileModal);
    ipcRenderer.on('menu-save', saveCurrentFile);
    ipcRenderer.on('menu-run', runCode);
    ipcRenderer.on('menu-stop', stopCode);
    ipcRenderer.on('menu-toggle-3d', toggle3DView);
}

// ============================================
// RESIZERS
// ============================================
function initResizers() {
    const resizerLeft = document.getElementById('resizer-left');
    const fileBrowser = document.getElementById('file-browser');
    const resizerBottom = document.getElementById('resizer-bottom');
    const consolePanel = document.getElementById('console-panel');
    
    let isResizing = false;
    let currentResizer = null;
    
    resizerLeft.addEventListener('mousedown', (e) => {
        isResizing = true;
        currentResizer = 'left';
    });
    
    resizerBottom.addEventListener('mousedown', (e) => {
        isResizing = true;
        currentResizer = 'bottom';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        if (currentResizer === 'left') {
            const width = e.clientX;
            if (width >= 150 && width <= 400) {
                fileBrowser.style.width = width + 'px';
            }
        } else if (currentResizer === 'bottom') {
            const height = window.innerHeight - e.clientY;
            if (height >= 100 && height <= 400) {
                consolePanel.style.height = height + 'px';
            }
        }
    });
    
    document.addEventListener('mouseup', () => {
        isResizing = false;
        currentResizer = null;
    });
}

// ============================================
// FILE OPERATIONS
// ============================================
async function openFolder() {
    const result = await ipcRenderer.invoke('open-folder-dialog');
    if (result) {
        state.projectPath = result.path;
        state.files = result.files;
        renderFileTree();
        logConsole('[SYSTEM] Opened folder: ' + result.path, 'success');
    }
}

async function refreshFiles() {
    if (state.projectPath) {
        state.files = await ipcRenderer.invoke('scan-project');
        renderFileTree();
        logConsole('[SYSTEM] Files refreshed', 'info');
    }
}

function renderFileTree() {
    if (state.files.length === 0) {
        elements.fileTree.innerHTML = `
            <div class="empty-state">
                <p>No folder open</p>
                <button class="action-btn" id="btn-open-folder">OPEN FOLDER</button>
            </div>
        `;
        document.getElementById('btn-open-folder').onclick = openFolder;
        return;
    }
    
    elements.fileTree.innerHTML = renderFileItems(state.files);
    
    // Add click handlers
    document.querySelectorAll('.file-item').forEach(item => {
        item.onclick = () => {
            const filePath = item.dataset.path;
            const type = item.dataset.type;
            
            if (type === 'folder') {
                item.classList.toggle('expanded');
                const children = item.nextElementSibling;
                if (children && children.classList.contains('folder-children')) {
                    children.classList.toggle('hidden');
                }
            } else {
                openFile(filePath);
            }
        };
    });
}

function renderFileItems(items, depth = 0) {
    let html = '';
    for (const item of items) {
        const icon = item.type === 'folder' ? '📁' : '📄';
        const activeClass = state.activeTab?.path === item.path ? 'active' : '';
        
        html += `<div class="file-item ${item.type} ${activeClass}" data-path="${item.path}" data-type="${item.type}" style="padding-left: ${15 + depth * 15}px">
            <span>${icon}</span>
            <span>${item.name}</span>
        </div>`;
        
        if (item.type === 'folder' && item.children) {
            html += `<div class="folder-children hidden">${renderFileItems(item.children, depth + 1)}</div>`;
        }
    }
    return html;
}

async function openFile(filePath) {
    // Check if already open
    const existingTab = state.openTabs.find(t => t.path === filePath);
    if (existingTab) {
        setActiveTab(existingTab);
        return;
    }
    
    // Read file content
    const result = await ipcRenderer.invoke('read-file', filePath);
    if (result.success) {
        openFileInEditor(filePath, result.content);
    } else {
        logConsole('[ERROR] Failed to open file: ' + result.error, 'error');
    }
}

function openFileInEditor(filePath, content) {
    const tab = {
        path: filePath,
        name: path.basename(filePath),
        content: content,
        originalContent: content
    };
    
    // Check if already open
    const existingIndex = state.openTabs.findIndex(t => t.path === filePath);
    if (existingIndex >= 0) {
        state.openTabs[existingIndex] = tab;
    } else {
        state.openTabs.push(tab);
    }
    
    setActiveTab(tab);
    renderTabs();
    renderFileTree();
    logConsole('[SYSTEM] Opened: ' + tab.name, 'info');
}

function setActiveTab(tab) {
    state.activeTab = tab;
    elements.codeEditor.value = tab.content;
    elements.currentFileTitle.textContent = tab.name;
    updateModifiedIndicator();
    updateLineNumbers();
    renderTabs();
}

function renderTabs() {
    elements.tabsContainer.innerHTML = state.openTabs.map(tab => {
        const activeClass = tab === state.activeTab ? 'active' : '';
        const modifiedClass = state.modified.has(tab.path) ? 'tab-modified' : '';
        return `
            <div class="tab ${activeClass}" data-path="${tab.path}">
                <span>${tab.name}</span>
                <span class="${modifiedClass}">${state.modified.has(tab.path) ? '●' : ''}</span>
                <span class="tab-close" data-path="${tab.path}">✕</span>
            </div>
        `;
    }).join('');
    
    // Add click handlers
    document.querySelectorAll('.tab').forEach(tabEl => {
        tabEl.onclick = (e) => {
            if (e.target.classList.contains('tab-close')) {
                closeTab(e.target.dataset.path);
            } else {
                const tab = state.openTabs.find(t => t.path === tabEl.dataset.path);
                if (tab) setActiveTab(tab);
            }
        };
    });
}

function closeTab(filePath) {
    const index = state.openTabs.findIndex(t => t.path === filePath);
    if (index < 0) return;
    
    // Check if modified
    if (state.modified.has(filePath)) {
        // TODO: Ask to save
    }
    
    state.openTabs.splice(index, 1);
    state.modified.delete(filePath);
    
    if (state.activeTab?.path === filePath) {
        if (state.openTabs.length > 0) {
            setActiveTab(state.openTabs[Math.min(index, state.openTabs.length - 1)]);
        } else {
            state.activeTab = null;
            elements.codeEditor.value = '';
            elements.currentFileTitle.textContent = 'No file open';
        }
    }
    
    renderTabs();
    updateLineNumbers();
}

async function saveCurrentFile() {
    if (!state.activeTab) {
        logConsole('[ERROR] No file to save', 'error');
        return;
    }
    
    const content = elements.codeEditor.value;
    const result = await ipcRenderer.invoke('write-file', state.activeTab.path, content);
    
    if (result.success) {
        state.activeTab.content = content;
        state.activeTab.originalContent = content;
        state.modified.delete(state.activeTab.path);
        updateModifiedIndicator();
        renderTabs();
        logConsole('[SYSTEM] Saved: ' + state.activeTab.name, 'success');
    } else {
        logConsole('[ERROR] Failed to save: ' + result.error, 'error');
    }
}

function showNewFileModal() {
    if (!state.projectPath) {
        logConsole('[ERROR] Open a folder first', 'error');
        return;
    }
    elements.modalOverlay.classList.remove('hidden');
    elements.newFileInput.value = '';
    elements.newFileInput.focus();
}

function hideModal() {
    elements.modalOverlay.classList.add('hidden');
}

async function createNewFile() {
    let fileName = elements.newFileInput.value.trim();
    if (!fileName) {
        logConsole('[ERROR] Please enter a filename', 'error');
        return;
    }
    
    if (!fileName.endsWith('.voxel')) {
        fileName += '.voxel';
    }
    
    const result = await ipcRenderer.invoke('create-file', state.projectPath, fileName);
    
    if (result.success) {
        hideModal();
        await refreshFiles();
        openFile(result.path);
        logConsole('[SYSTEM] Created: ' + fileName, 'success');
    } else {
        logConsole('[ERROR] Failed to create file: ' + result.error, 'error');
    }
}

// ============================================
// EDITOR
// ============================================
function onEditorInput() {
    if (state.activeTab) {
        state.activeTab.content = elements.codeEditor.value;
        
        if (elements.codeEditor.value !== state.activeTab.originalContent) {
            state.modified.add(state.activeTab.path);
        } else {
            state.modified.delete(state.activeTab.path);
        }
        
        updateModifiedIndicator();
        renderTabs();
    }
    updateLineNumbers();
    
    // Update 3D view in separate window with debounce
    debouncedUpdate3DWindow();
}

// Debounced 3D window update
let update3DTimeout = null;
function debouncedUpdate3DWindow() {
    if (update3DTimeout) clearTimeout(update3DTimeout);
    update3DTimeout = setTimeout(() => {
        if (state.show3D) {
            ipcRenderer.send('update-3d-code', elements.codeEditor.value);
        }
    }, 300);
}

function onEditorKeydown(e) {
    // Tab handling
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = elements.codeEditor.selectionStart;
        const end = elements.codeEditor.selectionEnd;
        const value = elements.codeEditor.value;
        
        elements.codeEditor.value = value.substring(0, start) + '    ' + value.substring(end);
        elements.codeEditor.selectionStart = elements.codeEditor.selectionEnd = start + 4;
        onEditorInput();
    }
}

function updateLineNumbers() {
    const lines = elements.codeEditor.value.split('\n');
    elements.lineNumbers.innerHTML = lines.map((_, i) => `<div>${i + 1}</div>`).join('');
}

function syncScroll() {
    elements.lineNumbers.scrollTop = elements.codeEditor.scrollTop;
}

function updateModifiedIndicator() {
    if (state.activeTab && state.modified.has(state.activeTab.path)) {
        elements.fileModified.classList.remove('hidden');
    } else {
        elements.fileModified.classList.add('hidden');
    }
}

// ============================================
// CODE EXECUTION
// ============================================
function runCode() {
    if (state.isRunning) {
        logConsole('[WARNING] Code is already running', 'error');
        return;
    }
    
    const code = elements.codeEditor.value;
    if (!code.trim()) {
        logConsole('[ERROR] No code to run', 'error');
        return;
    }
    
    state.isRunning = true;
    logConsole('═'.repeat(50), 'system');
    logConsole('[EXECUTING] VoxelScript...', 'success');
    logConsole('═'.repeat(50), 'system');
    
    // Start 3D execution animation if 3D view is open
    if (state.show3D && typeof startExecutionAnimation === 'function') {
        startExecutionAnimation();
    }
    
    // Use setTimeout to allow UI to update before blocking execution
    setTimeout(async () => {
        try {
            // Import the interpreter - clear cache first to get fresh requires
            const langPath = path.join(__dirname, '..');
            
            // Clear require cache for hot reloading
            delete require.cache[require.resolve(path.join(langPath, 'lexer.js'))];
            delete require.cache[require.resolve(path.join(langPath, 'parser.js'))];
            delete require.cache[require.resolve(path.join(langPath, 'interpreter.js'))];
            
            const { Lexer } = require(path.join(langPath, 'lexer.js'));
            const { Parser } = require(path.join(langPath, 'parser.js'));
            const { Interpreter } = require(path.join(langPath, 'interpreter.js'));
            
            // Create custom interpreter with console output
            const interpreter = new Interpreter();
            
            // Track which print lines we've executed for 3D
            const executedPrintLines = new Set();
            
            // Override print - output to console
            interpreter.global.define('print', (...args) => {
                const output = args.map(a => {
                    if (a === null) return 'null';
                    if (a === undefined) return 'undefined';
                    if (typeof a === 'object') return JSON.stringify(a, null, 2);
                    return String(a);
                }).join(' ');
                logConsole(output, 'output');
                
                // Animate line in 3D - find next print line
                if (state.show3D && typeof markLineExecuted === 'function') {
                    const lines = code.split('\n');
                    for (let i = 0; i < lines.length; i++) {
                        if (lines[i].includes('print') && !executedPrintLines.has(i)) {
                            executedPrintLines.add(i);
                            markLineExecuted(i + 1);
                            break;
                        }
                    }
                }
            });
            
            // Override input - get from console input
            interpreter.global.define('input', (prompt = '') => {
                return new Promise((resolve) => {
                    if (prompt) {
                        logConsole(prompt, 'output');
                    }
                    state.inputCallback = (value) => {
                        logConsole('> ' + value, 'info');
                        resolve(value);
                    };
                    elements.consoleInput.focus();
                    elements.consoleInput.placeholder = 'Type your answer and press Enter...';
                });
            });
            
            // Parse the code
            logConsole('[PARSING]...', 'system');
            const lexer = new Lexer(code);
            const tokens = lexer.tokenize();
            const parser = new Parser(tokens);
            const ast = parser.parse();
            logConsole('[PARSED] Running...', 'system');
            
            // Execute the AST
            const result = await interpreter.run(ast);
            
            if (result !== undefined && result !== null) {
                logConsole('=> ' + (typeof result === 'object' ? JSON.stringify(result) : result), 'success');
            }
            finishExecution();
            
        } catch (error) {
            logConsole('[ERROR] ' + error.message, 'error');
            console.error(error); // Log to dev console too
            
            // Try to extract line number from error and show in 3D
            let errorLine = 1;
            const lineMatch = error.message.match(/line (\d+)/i);
            if (lineMatch) {
                errorLine = parseInt(lineMatch[1]);
            }
            
            if (state.show3D && typeof show3DError === 'function') {
                show3DError(errorLine, error.message);
            }
            
            finishExecution();
        }
    }, 50);
}

function finishExecution() {
    logConsole('═'.repeat(50), 'system');
    logConsole('[COMPLETE] Execution finished - Press F5 to run again', 'success');
    state.isRunning = false;
    elements.consoleInput.placeholder = 'Enter command or input...';
    
    if (state.show3D && typeof stopExecutionAnimation === 'function') {
        stopExecutionAnimation();
    }
}

function stopCode() {
    if (state.isRunning) {
        state.isRunning = false;
        state.inputCallback = null;
        logConsole('[STOPPED] Execution halted', 'error');
    }
}

// ============================================
// CONSOLE
// ============================================
function logConsole(message, type = 'output') {
    const line = document.createElement('div');
    line.className = 'console-line ' + type;
    line.textContent = message;
    elements.consoleOutput.appendChild(line);
    elements.consoleOutput.scrollTop = elements.consoleOutput.scrollHeight;
}

function clearConsole() {
    elements.consoleOutput.innerHTML = `
        <div class="console-line system">╔══════════════════════════════════════════════════════════════╗</div>
        <div class="console-line system">║  VOXELSCRIPT TERMINAL v1.0 - NEURAL INTERFACE ACTIVE         ║</div>
        <div class="console-line system">╚══════════════════════════════════════════════════════════════╝</div>
        <div class="console-line info">[SYSTEM] Console cleared</div>
    `;
}

function onConsoleInput(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const value = elements.consoleInput.value.trim();
        elements.consoleInput.value = '';
        
        if (!value) return; // Don't process empty input
        
        if (state.inputCallback) {
            // We have a pending input request from the running code
            const callback = state.inputCallback;
            state.inputCallback = null;
            elements.consoleInput.placeholder = 'Enter command or input...';
            callback(value);
        } else {
            // No pending input - just echo the command
            logConsole('voxel> ' + value, 'info');
        }
    }
}

// ============================================
// 3D VIEW
// ============================================
let scene, camera, renderer, fileCubes = [];
let codeCubes = [];
let executionLines = [];
let executionConnections = []; // Store connection data for live updating
let particles = null;
let cameraAngle = 0;
let cameraHeight = 0;
let cameraRadius = 30;
let targetCameraHeight = 0;
let executionHistory = [];
let currentExecutionLine = -1;
let isExecuting = false;
let centerLookAt = null; // Will be initialized when 3D view starts

// NEW: 2D Terminal overlay (not 3D)
let terminal3DElement = null;
let terminalLines = [];
const MAX_TERMINAL_LINES = 50;

// NEW: 3D Error display
let errorCubes = [];

// NEW: 3D Editing
let selectedCube = null;
let editPanel3D = null;
let raycaster = null;
let mouse = null;

// Line spacing - each line goes down by this amount
const LINE_HEIGHT_SPACING = 2.5;
const CODE_START_Y = 20; // Line 1 starts at top

function toggle3DView() {
    state.show3D = !state.show3D;
    
    if (state.show3D) {
        // Open 3D view in separate window
        const code = elements.codeEditor.value || '';
        ipcRenderer.send('open-3d-window', code);
    } else {
        // Close 3D window
        ipcRenderer.send('close-3d-window');
    }
}

// Listen for 3D window closed event
ipcRenderer.on('3d-window-closed', () => {
    state.show3D = false;
});

function init3DView() {
    if (!window.THREE) {
        logConsole('[ERROR] 3D library not loaded', 'error');
        return;
    }
    
    // Initialize centerLookAt
    centerLookAt = new THREE.Vector3(0, 0, 0);
    
    // Clear old scene
    if (scene) {
        while(scene.children.length > 0) { 
            scene.remove(scene.children[0]); 
        }
    }
    
    // Setup scene - PURE BLACK with intense green fog
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.012);
    
    // Camera
    camera = new THREE.PerspectiveCamera(60, elements.threeCanvas.clientWidth / elements.threeCanvas.clientHeight, 0.1, 1000);
    camera.position.set(0, CODE_START_Y, cameraRadius);
    camera.lookAt(0, CODE_START_Y, 0);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas: elements.threeCanvas, antialias: true });
    renderer.setSize(elements.threeCanvas.clientWidth, elements.threeCanvas.clientHeight);
    
    // Simple grid floor
    createSimpleGrid();
    
    // Lights - dramatic green and cyan glow
    const ambientLight = new THREE.AmbientLight(0x001100, 0.3);
    scene.add(ambientLight);
    
    const light1 = new THREE.PointLight(0x00ff00, 3, 150);
    light1.position.set(20, 30, 20);
    scene.add(light1);
    
    const light2 = new THREE.PointLight(0x00ffff, 2, 150);
    light2.position.set(-20, -10, -20);
    scene.add(light2);
    
    // Extra dramatic spotlights
    const spotlight = new THREE.SpotLight(0x00ff00, 5, 200, Math.PI / 6, 0.5);
    spotlight.position.set(0, 50, 0);
    spotlight.target.position.set(0, 0, 0);
    scene.add(spotlight);
    scene.add(spotlight.target);
    
    // Rim lighting for extra glow
    const rimLight = new THREE.PointLight(0x00ff88, 2, 80);
    rimLight.position.set(0, -30, 30);
    scene.add(rimLight);
    
    // Create particles
    createParticles();
    
    // Create code cubes from editor content
    createCodeCubes();
    
    // Initialize 2D terminal overlay
    init2DTerminal();
    
    // Setup 3D editing (click to select, double-click to edit)
    setup3DEditing();
    
    // Animation
    animate3D();
    
    // Mouse controls - scroll to go up/down through code
    elements.threeCanvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        targetCameraHeight -= e.deltaY * 0.3;
        // Clamp to reasonable bounds
        const maxDown = -(codeCubes.length * LINE_HEIGHT_SPACING + 20);
        targetCameraHeight = Math.max(maxDown, Math.min(CODE_START_Y + 30, targetCameraHeight));
    });
    
    // Handle resize
    window.addEventListener('resize', () => {
        if (state.show3D && renderer) {
            camera.aspect = elements.threeCanvas.clientWidth / elements.threeCanvas.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(elements.threeCanvas.clientWidth, elements.threeCanvas.clientHeight);
        }
    });
    
    // Set initial camera position
    targetCameraHeight = CODE_START_Y;
    cameraHeight = CODE_START_Y;
}

function createSimpleGrid() {
    // Sleek horizontal grid - neon green lines on black
    const gridHelper = new THREE.GridHelper(150, 75, 0x00ff00, 0x001a00);
    gridHelper.position.y = -50;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.6;
    scene.add(gridHelper);
    
    // Vertical back wall grid - cyberpunk style
    const backGrid = new THREE.GridHelper(150, 75, 0x00ff00, 0x000800);
    backGrid.rotation.x = Math.PI / 2;
    backGrid.position.z = -40;
    backGrid.material.transparent = true;
    backGrid.material.opacity = 0.3;
    scene.add(backGrid);
    
    // Second back grid for depth
    const backGrid2 = new THREE.GridHelper(200, 100, 0x004400, 0x000400);
    backGrid2.rotation.x = Math.PI / 2;
    backGrid2.position.z = -60;
    backGrid2.material.transparent = true;
    backGrid2.material.opacity = 0.15;
    scene.add(backGrid2);
    
    // Side grids for immersion
    const leftGrid = new THREE.GridHelper(100, 50, 0x002200, 0x000500);
    leftGrid.rotation.z = Math.PI / 2;
    leftGrid.position.x = -40;
    leftGrid.material.transparent = true;
    leftGrid.material.opacity = 0.2;
    scene.add(leftGrid);
    
    const rightGrid = new THREE.GridHelper(100, 50, 0x002200, 0x000500);
    rightGrid.rotation.z = Math.PI / 2;
    rightGrid.position.x = 40;
    rightGrid.material.transparent = true;
    rightGrid.material.opacity = 0.2;
    scene.add(rightGrid);
}

function createParticles() {
    // More particles for denser effect
    const particleCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Random position in a cylinder around the code - wider spread
        const angle = Math.random() * Math.PI * 2;
        const radius = 3 + Math.random() * 35;
        
        positions[i3] = Math.cos(angle) * radius;
        positions[i3 + 1] = (Math.random() - 0.5) * 200; // Spread vertically
        positions[i3 + 2] = Math.sin(angle) * radius;
        
        // Intense green/cyan colors - brighter
        colors[i3] = 0;
        colors[i3 + 1] = 0.7 + Math.random() * 0.3; // Brighter green
        colors[i3 + 2] = Math.random() * 0.6;
        
        sizes[i] = 0.3 + Math.random() * 2;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
        size: 0.6,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    
    particles = new THREE.Points(geometry, material);
    scene.add(particles);
    
    // Create second layer of dimmer background particles
    const bgParticleCount = 200;
    const bgGeometry = new THREE.BufferGeometry();
    const bgPositions = new Float32Array(bgParticleCount * 3);
    
    for (let i = 0; i < bgParticleCount; i++) {
        const i3 = i * 3;
        bgPositions[i3] = (Math.random() - 0.5) * 100;
        bgPositions[i3 + 1] = (Math.random() - 0.5) * 250;
        bgPositions[i3 + 2] = -20 - Math.random() * 40; // Behind everything
    }
    
    bgGeometry.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
    
    const bgMaterial = new THREE.PointsMaterial({
        size: 0.2,
        color: 0x003300,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
    });
    
    const bgParticles = new THREE.Points(bgGeometry, bgMaterial);
    scene.add(bgParticles);
}

function createCodeCubes() {
    // Clear existing
    codeCubes.forEach(cube => scene.remove(cube));
    codeCubes = [];
    executionLines.forEach(line => scene.remove(line));
    executionLines = [];
    executionConnections = [];
    
    // Get code from editor
    const code = elements.codeEditor.value || '// Write some VoxelScript code!\nprint "Hello, Matrix!"';
    const lines = code.split('\n');
    
    // Create a cube for each line
    lines.forEach((lineText, index) => {
        const lineNum = index + 1;
        const y = CODE_START_Y - (index * LINE_HEIGHT_SPACING);
        
        // Create the cube
        const cubeSize = 1.5;
        const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        
        // Color based on content
        let color = 0x00ff00;
        if (lineText.trim().startsWith('//')) {
            color = 0x444444; // Comments gray
        } else if (lineText.includes('fn ')) {
            color = 0x00ffff; // Functions cyan
        } else if (lineText.includes('if ') || lineText.includes('else') || lineText.includes('loop') || lineText.includes('while')) {
            color = 0xffff00; // Control flow yellow
        } else if (lineText.includes('print')) {
            color = 0xff00ff; // Print magenta
        } else if (lineText.trim() === '') {
            color = 0x111111; // Empty lines dark
        }
        
        const material = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.6,
            transparent: true,
            opacity: lineText.trim() === '' ? 0.15 : 0.95,
            shininess: 100,
            specular: 0x00ff00
        });
        
        const cube = new THREE.Mesh(geometry, material);
        
        // Random starting position on the line's Y level
        const randomX = (Math.random() - 0.5) * 10;
        const randomZ = (Math.random() - 0.5) * 10;
        cube.position.set(randomX, y, randomZ);
        
        // Store data for animation
        cube.userData = {
            lineNumber: lineNum,
            lineText: lineText,
            originalY: y,
            originalColor: color,
            isExecuted: false,
            // Random movement parameters
            moveSpeed: 0.3 + Math.random() * 0.7,
            moveAngle: Math.random() * Math.PI * 2,
            moveRadius: 2 + Math.random() * 6,
            rotSpeed: (Math.random() - 0.5) * 0.02
        };
        
        // Glowing neon wireframe
        const wireGeometry = new THREE.EdgesGeometry(geometry);
        const wireMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00ff88, 
            linewidth: 3,
            transparent: true,
            opacity: 0.9
        });
        const wireframe = new THREE.LineSegments(wireGeometry, wireMaterial);
        cube.add(wireframe);
        
        // Add outer glow wireframe
        const glowGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(cubeSize * 1.1, cubeSize * 1.1, cubeSize * 1.1));
        const glowMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00ff00, 
            linewidth: 1,
            transparent: true,
            opacity: 0.3
        });
        const glowFrame = new THREE.LineSegments(glowGeometry, glowMaterial);
        cube.add(glowFrame);
        
        // Line number on the left
        const lineNumSprite = createTextSprite(`${lineNum}`, 0x00ffff);
        lineNumSprite.position.set(-3, 0, 0);
        lineNumSprite.scale.set(4, 0.25, 1);
        cube.add(lineNumSprite);
        
        // Code text on the right
        if (lineText.trim()) {
            const codeSprite = createTextSprite(lineText.substring(0, 40), color, true);
            codeSprite.position.set(6, 0, 0);
            codeSprite.scale.set(10, 0.6, 1);
            cube.add(codeSprite);
        }
        
        scene.add(cube);
        codeCubes.push(cube);
    });
}

function createTextSprite(text, color, isLarge = false) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // Wide canvas for text
    canvas.width = 512;
    canvas.height = 32;
    
    // Clear background (transparent)
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Text settings
    const fontSize = 24;
    context.font = `bold ${fontSize}px Consolas, monospace`;
    context.textBaseline = 'middle';
    
    // Get color components
    const r = (color >> 16) & 255;
    const g = (color >> 8) & 255;
    const b = color & 255;
    
    // Glow
    context.shadowColor = `rgb(${r}, ${g}, ${b})`;
    context.shadowBlur = 4;
    context.fillStyle = `rgb(${r}, ${g}, ${b})`;
    context.fillText(text, 5, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    
    const material = new THREE.SpriteMaterial({ 
        map: texture, 
        transparent: true
    });
    return new THREE.Sprite(material);
}

// Called when code starts running
function startExecutionAnimation() {
    isExecuting = true;
    executionHistory = [];
    currentExecutionLine = -1;
    
    // Clear 3D errors and terminal
    clear3DErrors();
    clear3DTerminal();
    addTo3DTerminal('>>> Running script...', 'system');
    
    // Reset all cubes
    codeCubes.forEach(cube => {
        cube.userData.isExecuted = false;
        cube.material.color.setHex(cube.userData.originalColor);
        cube.material.emissive.setHex(cube.userData.originalColor);
        cube.material.emissiveIntensity = 0.3;
    });
    
    // Clear old execution lines
    executionLines.forEach(line => scene.remove(line));
    executionLines = [];
    executionConnections = [];
}

// Called for each line executed
function markLineExecuted(lineNumber) {
    if (!state.show3D || !isExecuting) return;
    
    const cube = codeCubes[lineNumber - 1];
    if (!cube) return;
    
    // Record execution
    const prevLine = executionHistory.length > 0 ? executionHistory[executionHistory.length - 1] : -1;
    executionHistory.push(lineNumber);
    cube.userData.isExecuted = true;
    
    // Highlight the cube - bright green/white
    cube.material.color.setHex(0x00ff88);
    cube.material.emissive.setHex(0x00ff88);
    cube.material.emissiveIntensity = 1.5;
    
    // Create connection to previous line (will be updated in animate)
    if (prevLine > 0 && prevLine !== lineNumber) {
        const prevCube = codeCubes[prevLine - 1];
        if (prevCube) {
            createExecutionConnection(prevLine, lineNumber);
        }
    }
    
    // Move camera to follow execution
    targetCameraHeight = cube.userData.originalY;
    currentExecutionLine = lineNumber;
}

function createExecutionConnection(fromLineNum, toLineNum) {
    // Store the connection data - lines will be updated in animate loop
    const connection = {
        fromLine: fromLineNum,
        toLine: toLineNum,
        createdAt: Date.now(),
        glowIntensity: 1.0
    };
    
    // Create initial line geometry
    const fromCube = codeCubes[fromLineNum - 1];
    const toCube = codeCubes[toLineNum - 1];
    
    if (!fromCube || !toCube) return;
    
    // Create glowing line
    const points = [fromCube.position.clone(), toCube.position.clone()];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    const material = new THREE.LineBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 1,
        linewidth: 2
    });
    
    const line = new THREE.Line(geometry, material);
    line.userData = connection;
    scene.add(line);
    executionLines.push(line);
    
    // Create glowing tube
    const tubeGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
    const tubeMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.9
    });
    
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tube.userData = { ...connection, isTube: true };
    scene.add(tube);
    executionLines.push(tube);
    
    executionConnections.push(connection);
}

// NEW: Initialize 2D Terminal overlay
function init2DTerminal() {
    terminal3DElement = document.getElementById('terminal-3d-output');
    if (terminal3DElement) {
        terminal3DElement.innerHTML = '<div class="term-line system">⬡ EXECUTION LOG READY</div>';
    }
}

// NEW: Add line to 2D terminal overlay
function addTo3DTerminal(text, type = 'output') {
    if (!terminal3DElement) {
        terminal3DElement = document.getElementById('terminal-3d-output');
    }
    if (!terminal3DElement) return;
    
    const line = document.createElement('div');
    line.className = 'term-line ' + type;
    line.textContent = text;
    terminal3DElement.appendChild(line);
    
    // Auto-scroll to bottom
    terminal3DElement.scrollTop = terminal3DElement.scrollHeight;
    
    // Limit lines for performance
    while (terminal3DElement.children.length > MAX_TERMINAL_LINES) {
        terminal3DElement.removeChild(terminal3DElement.firstChild);
    }
}

// NEW: Clear 2D terminal overlay
function clear3DTerminal() {
    if (!terminal3DElement) {
        terminal3DElement = document.getElementById('terminal-3d-output');
    }
    if (terminal3DElement) {
        terminal3DElement.innerHTML = '';
    }
}

// NEW: Show error in 3D
function show3DError(lineNumber, errorMessage) {
    if (!state.show3D || !scene) return;
    
    const cube = codeCubes[lineNumber - 1];
    if (!cube) return;
    
    // Turn cube red
    cube.material.color.setHex(0xff0000);
    cube.material.emissive.setHex(0xff0000);
    cube.material.emissiveIntensity = 1.5;
    
    // Add error marker
    const errorGeom = new THREE.SphereGeometry(0.8, 16, 16);
    const errorMat = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.8
    });
    const errorSphere = new THREE.Mesh(errorGeom, errorMat);
    errorSphere.position.copy(cube.position);
    errorSphere.position.x += 2;
    errorSphere.userData.errorFor = lineNumber;
    scene.add(errorSphere);
    errorCubes.push(errorSphere);
    
    // Error message sprite
    const errorSprite = createTextSprite(`ERROR: ${errorMessage.substring(0, 30)}`, 0xff0000);
    errorSprite.position.set(10, 0, 0);
    errorSprite.scale.set(10, 1.2, 1);
    cube.add(errorSprite);
    cube.userData.errorSprite = errorSprite;
    
    // Focus camera on error
    targetCameraHeight = cube.userData.originalY;
    
    // Add to 3D terminal
    addTo3DTerminal(`ERROR line ${lineNumber}: ${errorMessage}`, 'error');
}

// NEW: Clear 3D errors
function clear3DErrors() {
    errorCubes.forEach(sphere => scene.remove(sphere));
    errorCubes = [];
    
    codeCubes.forEach(cube => {
        if (cube.userData.errorSprite) {
            cube.remove(cube.userData.errorSprite);
            cube.userData.errorSprite = null;
        }
    });
}

// NEW: Setup 3D editing
function setup3DEditing() {
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    elements.threeCanvas.addEventListener('click', on3DClick);
    elements.threeCanvas.addEventListener('dblclick', on3DDoubleClick);
}

function on3DClick(event) {
    if (!state.show3D || !camera) return;
    
    const rect = elements.threeCanvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObjects(codeCubes);
    
    if (intersects.length > 0) {
        const clickedCube = intersects[0].object;
        // Make sure we have a valid cube with userData
        if (clickedCube && clickedCube.userData && clickedCube.userData.lineNumber) {
            selectCube(clickedCube);
        }
    } else {
        deselectCube();
    }
}

function on3DDoubleClick(event) {
    if (!selectedCube || !selectedCube.userData) return;
    
    // Focus on the line in the 2D editor for editing
    const lineNum = selectedCube.userData.lineNumber;
    if (!lineNum) return;
    
    const lines = elements.codeEditor.value.split('\n');
    if (lineNum < 1 || lineNum > lines.length) return;
    
    // Select the line in editor and focus it for editing
    let charStart = 0;
    for (let i = 0; i < lineNum - 1; i++) {
        charStart += lines[i].length + 1;
    }
    elements.codeEditor.setSelectionRange(charStart, charStart + lines[lineNum - 1].length);
    elements.codeEditor.focus();
    
    logConsole(`[3D] Editing line ${lineNum} - type in the editor`, 'system');
}

function selectCube(cube) {
    // Safety check
    if (!cube || !cube.userData || !cube.userData.lineNumber) {
        return;
    }
    
    // Deselect previous
    if (selectedCube) {
        selectedCube.scale.set(1, 1, 1);
    }
    
    selectedCube = cube;
    selectedCube.scale.set(1.3, 1.3, 1.3);
    
    // Highlight in 2D editor
    const lineNum = cube.userData.lineNumber;
    const editorValue = elements.codeEditor.value || '';
    const lines = editorValue.split('\n');
    
    // Bounds check
    if (lineNum < 1 || lineNum > lines.length) {
        logConsole(`[3D] Selected line ${lineNum}`, 'system');
        return;
    }
    
    let charStart = 0;
    for (let i = 0; i < lineNum - 1; i++) {
        charStart += lines[i].length + 1;
    }
    elements.codeEditor.setSelectionRange(charStart, charStart + lines[lineNum - 1].length);
    
    logConsole(`[3D] Selected line ${lineNum}`, 'system');
}

function deselectCube() {
    if (selectedCube) {
        selectedCube.scale.set(1, 1, 1);
        selectedCube = null;
    }
}

function updateExecutionLines() {
    // Update all execution lines to follow their cubes
    executionLines.forEach(lineObj => {
        const data = lineObj.userData;
        if (!data.fromLine || !data.toLine) return;
        
        const fromCube = codeCubes[data.fromLine - 1];
        const toCube = codeCubes[data.toLine - 1];
        
        if (!fromCube || !toCube) return;
        
        if (data.isTube) {
            // Update tube position and rotation
            const from = fromCube.position;
            const to = toCube.position;
            const direction = new THREE.Vector3().subVectors(to, from);
            const length = direction.length();
            direction.normalize();
            
            // Scale tube to match distance
            lineObj.scale.y = length;
            
            // Position at midpoint
            const midpoint = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
            lineObj.position.copy(midpoint);
            
            // Rotate to align
            lineObj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
            
            // Glow effect - pulse when executing
            const age = (Date.now() - data.createdAt) / 1000;
            const pulse = 0.7 + Math.sin(Date.now() * 0.01) * 0.3;
            lineObj.material.opacity = Math.max(0.4, pulse - age * 0.05);
            
        } else {
            // Update line geometry
            const positions = lineObj.geometry.attributes.position.array;
            positions[0] = fromCube.position.x;
            positions[1] = fromCube.position.y;
            positions[2] = fromCube.position.z;
            positions[3] = toCube.position.x;
            positions[4] = toCube.position.y;
            positions[5] = toCube.position.z;
            lineObj.geometry.attributes.position.needsUpdate = true;
            
            // Glow effect
            const age = (Date.now() - data.createdAt) / 1000;
            const pulse = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
            lineObj.material.opacity = Math.max(0.5, pulse - age * 0.03);
        }
    });
}

function stopExecutionAnimation() {
    isExecuting = false;
}

function getAllFiles(items) {
    let files = [];
    for (const item of items) {
        if (item.type === 'file') {
            files.push(item);
        } else if (item.children) {
            files = files.concat(getAllFiles(item.children));
        }
    }
    return files;
}

function animate3D() {
    if (!state.show3D) return;
    
    requestAnimationFrame(animate3D);
    
    const time = Date.now() * 0.001; // Time in seconds
    
    // Smooth camera height transition
    cameraHeight += (targetCameraHeight - cameraHeight) * 0.08;
    
    // Rotate camera around the vertical axis
    cameraAngle += 0.003;
    camera.position.x = Math.cos(cameraAngle) * cameraRadius;
    camera.position.z = Math.sin(cameraAngle) * cameraRadius;
    camera.position.y = cameraHeight;
    
    // Look at the center at current height
    centerLookAt.y = cameraHeight;
    camera.lookAt(centerLookAt);
    
    // Animate particles - float and swirl
    if (particles) {
        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            // Swirl around
            const x = positions[i];
            const z = positions[i + 2];
            const angle = Math.atan2(z, x) + 0.002;
            const radius = Math.sqrt(x * x + z * z);
            positions[i] = Math.cos(angle) * radius;
            positions[i + 2] = Math.sin(angle) * radius;
            
            // Float up slowly
            positions[i + 1] += 0.05;
            if (positions[i + 1] > cameraHeight + 80) {
                positions[i + 1] = cameraHeight - 80;
            }
        }
        particles.geometry.attributes.position.needsUpdate = true;
    }
    
    // Animate cubes - each moves randomly on its own Y level
    codeCubes.forEach((cube, index) => {
        const data = cube.userData;
        
        // Random circular movement on the cube's Y plane
        const angle = time * data.moveSpeed + data.moveAngle;
        cube.position.x = Math.cos(angle) * data.moveRadius;
        cube.position.z = Math.sin(angle) * data.moveRadius;
        cube.position.y = data.originalY; // Stay on same Y level
        
        // Random rotation
        cube.rotation.y += data.rotSpeed;
        cube.rotation.x = Math.sin(time * 0.5 + index) * 0.1;
        
        // Executed cubes glow brighter and spin faster
        if (data.isExecuted) {
            cube.rotation.y += 0.05;
            const pulse = 1.0 + Math.sin(time * 8) * 0.5;
            cube.material.emissiveIntensity = pulse;
        }
    });
    
    // Animate error spheres - pulsing
    errorCubes.forEach(sphere => {
        const pulse = 0.8 + Math.sin(time * 5) * 0.4;
        sphere.scale.set(pulse, pulse, pulse);
    });
    
    // Update execution lines to follow moving cubes
    updateExecutionLines();
    
    renderer.render(scene, camera);
}

// ============================================
// START
// ============================================
init();


