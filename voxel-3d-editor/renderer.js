const { ipcRenderer } = require('electron');

// Three.js setup
let scene, camera, renderer, cubes = [];
let autoRotate = true;

// Editor state
let currentFilePath = null;
let isModified = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
    initEditor();
    initEventListeners();
    updateLineNumbers();
});

// Three.js 3D View
function initThreeJS() {
    const container = document.getElementById('threeContainer');
    const width = container.clientWidth;
    const height = container.clientHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.02);

    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 30;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Create floating code cubes
    createCodeCubes();

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x00ff00, 0.2);
    scene.add(ambientLight);

    // Add point lights
    const pointLight = new THREE.PointLight(0x00ff00, 1, 100);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Add particles
    createParticles();

    // Start animation
    animate();

    // Handle resize
    window.addEventListener('resize', () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });
}

function createCodeCubes() {
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    
    for (let i = 0; i < 15; i++) {
        const edges = new THREE.EdgesGeometry(geometry);
        const material = new THREE.LineBasicMaterial({ 
            color: 0x00ff00,
            transparent: true,
            opacity: 0.3 + Math.random() * 0.5
        });
        const cube = new THREE.LineSegments(edges, material);
        
        cube.position.x = (Math.random() - 0.5) * 40;
        cube.position.y = (Math.random() - 0.5) * 30;
        cube.position.z = (Math.random() - 0.5) * 20;
        
        cube.rotation.x = Math.random() * Math.PI;
        cube.rotation.y = Math.random() * Math.PI;
        
        cube.userData = {
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.02,
                y: (Math.random() - 0.5) * 0.02
            },
            floatSpeed: 0.5 + Math.random() * 0.5,
            floatOffset: Math.random() * Math.PI * 2
        };
        
        cubes.push(cube);
        scene.add(cube);
    }
}

function createParticles() {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 100;
        positions[i + 1] = (Math.random() - 0.5) * 100;
        positions[i + 2] = (Math.random() - 0.5) * 100;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        color: 0x00ff00,
        size: 0.5,
        transparent: true,
        opacity: 0.6
    });
    
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

function animate() {
    requestAnimationFrame(animate);
    
    const time = Date.now() * 0.001;
    
    cubes.forEach(cube => {
        cube.rotation.x += cube.userData.rotationSpeed.x;
        cube.rotation.y += cube.userData.rotationSpeed.y;
        cube.position.y += Math.sin(time * cube.userData.floatSpeed + cube.userData.floatOffset) * 0.01;
    });
    
    if (autoRotate) {
        camera.position.x = Math.sin(time * 0.1) * 5;
        camera.position.y = Math.cos(time * 0.1) * 3;
        camera.lookAt(scene.position);
    }
    
    renderer.render(scene, camera);
}

function resetCamera() {
    camera.position.set(0, 0, 30);
    camera.lookAt(scene.position);
}

function toggleRotation() {
    autoRotate = !autoRotate;
    logToConsole(autoRotate ? 'Auto-rotation enabled' : 'Auto-rotation disabled', 'info');
}

// Editor Functions
function initEditor() {
    const editor = document.getElementById('codeEditor');
    
    editor.addEventListener('input', () => {
        updateLineNumbers();
        updateCursorPosition();
        setModified(true);
        updateCodeVisualization();
    });
    
    editor.addEventListener('scroll', () => {
        document.getElementById('lineNumbers').scrollTop = editor.scrollTop;
    });
    
    editor.addEventListener('keydown', (e) => {
        // Tab handling
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            editor.value = editor.value.substring(0, start) + '    ' + editor.value.substring(end);
            editor.selectionStart = editor.selectionEnd = start + 4;
            updateLineNumbers();
        }
        
        // Run on F5
        if (e.key === 'F5') {
            e.preventDefault();
            runScript();
        }
        
        // Save on Ctrl+S
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveFile();
        }
    });
    
    editor.addEventListener('click', updateCursorPosition);
    editor.addEventListener('keyup', updateCursorPosition);
}

function updateLineNumbers() {
    const editor = document.getElementById('codeEditor');
    const lineNumbers = document.getElementById('lineNumbers');
    const lines = editor.value.split('\n').length;
    
    let html = '';
    for (let i = 1; i <= lines; i++) {
        html += i + '\n';
    }
    lineNumbers.textContent = html;
}

function updateCursorPosition() {
    const editor = document.getElementById('codeEditor');
    const text = editor.value.substring(0, editor.selectionStart);
    const lines = text.split('\n');
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    document.getElementById('cursorPos').textContent = `Ln ${line}, Col ${col}`;
}

function setModified(modified) {
    isModified = modified;
    const tabName = document.querySelector('.tab-name');
    const fileName = currentFilePath ? currentFilePath.split(/[/\\]/).pop() : 'untitled.voxel';
    tabName.textContent = modified ? fileName + ' •' : fileName;
}

function updateCodeVisualization() {
    // Update cube colors based on code content
    const code = document.getElementById('codeEditor').value;
    const hasError = code.includes('error') || code.includes('Error');
    const lineCount = code.split('\n').length;
    
    cubes.forEach((cube, i) => {
        const hue = hasError ? 0 : 0.33; // Red for errors, green otherwise
        cube.material.color.setHSL(hue, 1, 0.5);
        
        // Scale based on line count
        const scale = 0.5 + (lineCount / 100);
        cube.scale.setScalar(Math.min(scale, 2));
    });
}

// Event Listeners
function initEventListeners() {
    // Window controls
    document.getElementById('minimizeBtn').addEventListener('click', () => ipcRenderer.send('minimize'));
    document.getElementById('maximizeBtn').addEventListener('click', () => ipcRenderer.send('maximize'));
    document.getElementById('closeBtn').addEventListener('click', () => ipcRenderer.send('close'));
    
    // Run button
    document.getElementById('runBtn').addEventListener('click', runScript);
    
    // Console input
    document.getElementById('consoleInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const input = e.target.value.trim();
            if (input) {
                logToConsole('❯ ' + input, 'info');
                ipcRenderer.send('run-voxel', input);
                e.target.value = '';
            }
        }
    });
    
    // IPC events
    ipcRenderer.on('file-opened', (event, data) => {
        document.getElementById('codeEditor').value = data.content;
        currentFilePath = data.path;
        updateFileName();
        updateLineNumbers();
        setModified(false);
        logToConsole('Opened: ' + data.path, 'success');
    });
    
    ipcRenderer.on('file-saved', (event, path) => {
        setModified(false);
        logToConsole('Saved: ' + path, 'success');
    });
    
    ipcRenderer.on('get-content-for-save', () => {
        ipcRenderer.send('save-content', document.getElementById('codeEditor').value);
    });
    
    ipcRenderer.on('script-output', (event, output) => {
        logToConsole(output.trim(), 'success');
    });
    
    ipcRenderer.on('script-error', (event, error) => {
        logToConsole(error.trim(), 'error');
    });
    
    ipcRenderer.on('script-done', (event, data) => {
        if (data.code === 0) {
            logToConsole('✓ Script completed successfully', 'success');
        } else {
            logToConsole('✗ Script exited with code ' + data.code, 'error');
        }
        document.getElementById('status').textContent = 'Ready';
    });
    
    ipcRenderer.on('new-file', () => newFile());
    ipcRenderer.on('run-script', () => runScript());
    ipcRenderer.on('toggle-3d', () => togglePanel('viewPanel'));
    ipcRenderer.on('toggle-console', () => toggleConsole());
}

// File Operations
function newFile() {
    document.getElementById('codeEditor').value = '';
    currentFilePath = null;
    updateFileName();
    updateLineNumbers();
    setModified(false);
    logToConsole('New file created', 'info');
}

function openFile() {
    ipcRenderer.send('open-file');
}

function saveFile() {
    ipcRenderer.send('save-file');
}

function updateFileName() {
    const fileName = currentFilePath ? currentFilePath.split(/[/\\]/).pop() : 'untitled.voxel';
    document.getElementById('fileName').textContent = fileName;
    document.querySelector('.tab-name').textContent = fileName;
    document.getElementById('currentTab').querySelector('.tab-name').textContent = fileName;
}

// Run Script
function runScript() {
    const code = document.getElementById('codeEditor').value;
    if (!code.trim()) {
        logToConsole('No code to run', 'warning');
        return;
    }
    
    clearConsole();
    logToConsole('Running script...', 'info');
    document.getElementById('status').textContent = 'Running...';
    
    // Flash the cubes
    cubes.forEach(cube => {
        cube.material.opacity = 1;
        setTimeout(() => { cube.material.opacity = 0.5; }, 200);
    });
    
    if (currentFilePath) {
        ipcRenderer.send('run-voxel-file', currentFilePath);
    } else {
        ipcRenderer.send('run-voxel', code);
    }
}

// Console Functions
function logToConsole(message, type = '') {
    const console = document.getElementById('consoleContent');
    const line = document.createElement('div');
    line.className = 'console-line ' + type;
    line.textContent = message;
    console.appendChild(line);
    console.scrollTop = console.scrollHeight;
}

function clearConsole() {
    document.getElementById('consoleContent').innerHTML = '';
}

function toggleConsole() {
    document.getElementById('consolePanel').classList.toggle('collapsed');
}

// Panel Functions
function togglePanel(panelId) {
    document.getElementById(panelId).classList.toggle('collapsed');
}

// Make functions globally available
window.newFile = newFile;
window.openFile = openFile;
window.resetCamera = resetCamera;
window.toggleRotation = toggleRotation;
window.clearConsole = clearConsole;
window.toggleConsole = toggleConsole;
window.togglePanel = togglePanel;
