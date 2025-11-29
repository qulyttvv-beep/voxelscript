// VoxelScript 3D View - Separate Window Renderer
const { ipcRenderer } = require('electron');

// ============================================
// STATE & GLOBALS
// ============================================
let scene, camera, renderer;
let codeCubes = [];
let particles;
let codeContent = '';
let cameraHeight = 20;
let targetCameraHeight = 20;
let cameraRadius = 40;
let cameraAngle = 0;
let targetCameraAngle = 0;
let isDragging = false;
let lastMouseX = 0;
let centerLookAt;
let frameCount = 0;
let lastFpsUpdate = 0;

const LINE_HEIGHT_SPACING = 2.5;
const CODE_START_Y = 20;

// ============================================
// INITIALIZATION
// ============================================
function init() {
    // Window controls
    document.getElementById('btn-minimize').onclick = () => ipcRenderer.send('3d-window-minimize');
    document.getElementById('btn-maximize').onclick = () => ipcRenderer.send('3d-window-maximize');
    document.getElementById('btn-close').onclick = () => ipcRenderer.send('3d-window-close');
    
    // ESC to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            ipcRenderer.send('3d-window-close');
        }
    });
    
    // IPC listeners
    ipcRenderer.on('init-code', (event, code) => {
        codeContent = code || '';
        init3DScene();
        hideLoading();
    });
    
    ipcRenderer.on('update-code', (event, code) => {
        codeContent = code || '';
        updateCodeCubes();
    });
}

function hideLoading() {
    const loading = document.getElementById('loading');
    loading.style.opacity = '0';
    loading.style.transition = 'opacity 0.5s';
    setTimeout(() => {
        loading.style.display = 'none';
    }, 500);
}

// ============================================
// 3D SCENE SETUP
// ============================================
function init3DScene() {
    const canvas = document.getElementById('three-canvas');
    
    // Initialize centerLookAt
    centerLookAt = new THREE.Vector3(0, 0, 0);
    
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.012);
    
    // Camera
    camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.set(0, CODE_START_Y, cameraRadius);
    camera.lookAt(0, CODE_START_Y, 0);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    
    // Grid
    createGrid();
    
    // Lights
    createLights();
    
    // Particles
    createParticles();
    
    // Code cubes
    createCodeCubes();
    
    // Mouse controls
    setupMouseControls(canvas);
    
    // Resize handler
    window.addEventListener('resize', onResize);
    
    // Start animation
    animate();
}

function createGrid() {
    // Floor grid
    const gridHelper = new THREE.GridHelper(150, 75, 0x00ff00, 0x001a00);
    gridHelper.position.y = -50;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.6;
    scene.add(gridHelper);
    
    // Back wall grid
    const backGrid = new THREE.GridHelper(150, 75, 0x00ff00, 0x000800);
    backGrid.rotation.x = Math.PI / 2;
    backGrid.position.z = -40;
    backGrid.material.transparent = true;
    backGrid.material.opacity = 0.3;
    scene.add(backGrid);
    
    // Depth grid
    const backGrid2 = new THREE.GridHelper(200, 100, 0x004400, 0x000400);
    backGrid2.rotation.x = Math.PI / 2;
    backGrid2.position.z = -60;
    backGrid2.material.transparent = true;
    backGrid2.material.opacity = 0.15;
    scene.add(backGrid2);
    
    // Side grids
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

function createLights() {
    const ambientLight = new THREE.AmbientLight(0x001100, 0.3);
    scene.add(ambientLight);
    
    const light1 = new THREE.PointLight(0x00ff00, 3, 150);
    light1.position.set(20, 30, 20);
    scene.add(light1);
    
    const light2 = new THREE.PointLight(0x00ffff, 2, 150);
    light2.position.set(-20, -10, -20);
    scene.add(light2);
    
    const spotlight = new THREE.SpotLight(0x00ff00, 5, 200, Math.PI / 6, 0.5);
    spotlight.position.set(0, 50, 0);
    spotlight.target.position.set(0, 0, 0);
    scene.add(spotlight);
    scene.add(spotlight.target);
    
    const rimLight = new THREE.PointLight(0x00ff88, 2, 80);
    rimLight.position.set(0, -30, 30);
    scene.add(rimLight);
}

function createParticles() {
    const particleCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const angle = Math.random() * Math.PI * 2;
        const radius = 3 + Math.random() * 35;
        
        positions[i3] = Math.cos(angle) * radius;
        positions[i3 + 1] = (Math.random() - 0.5) * 200;
        positions[i3 + 2] = Math.sin(angle) * radius;
        
        colors[i3] = 0;
        colors[i3 + 1] = 0.7 + Math.random() * 0.3;
        colors[i3 + 2] = Math.random() * 0.6;
        
        sizes[i] = 0.3 + Math.random() * 2;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    
    particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

function createCodeCubes() {
    // Clear existing cubes
    codeCubes.forEach(cube => scene.remove(cube));
    codeCubes = [];
    
    if (!codeContent) return;
    
    const lines = codeContent.split('\n');
    document.getElementById('line-count').textContent = lines.length;
    
    // Syntax highlighting colors
    const getColor = (line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('#')) return 0x006600; // Comment
        if (trimmed.startsWith('fn ') || trimmed.startsWith('function')) return 0x00ffff; // Function
        if (trimmed.startsWith('let ') || trimmed.startsWith('const ') || trimmed.startsWith('var ')) return 0xff00ff; // Variable
        if (trimmed.startsWith('if ') || trimmed.startsWith('else') || trimmed.startsWith('while') || trimmed.startsWith('loop')) return 0xffff00; // Control
        if (trimmed.startsWith('return')) return 0xff8800; // Return
        if (trimmed.includes('print') || trimmed.includes('log')) return 0x88ff00; // Output
        return 0x00ff00; // Default green
    };
    
    lines.forEach((line, index) => {
        if (line.trim() === '') return;
        
        const y = CODE_START_Y - (index * LINE_HEIGHT_SPACING);
        const lineWidth = Math.min(line.length * 0.3, 25);
        const color = getColor(line);
        
        // Main cube
        const geometry = new THREE.BoxGeometry(lineWidth, 0.8, 0.8);
        const material = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.9
        });
        
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(-lineWidth / 2 - 5, y, 0);
        cube.userData = { line: index, content: line };
        
        scene.add(cube);
        codeCubes.push(cube);
        
        // Glow effect
        const glowGeometry = new THREE.BoxGeometry(lineWidth + 0.4, 1.2, 1.2);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(cube.position);
        scene.add(glow);
        codeCubes.push(glow);
    });
}

function updateCodeCubes() {
    createCodeCubes();
}

// ============================================
// MOUSE CONTROLS
// ============================================
function setupMouseControls(canvas) {
    // Scroll to navigate code
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        targetCameraHeight -= e.deltaY * 0.3;
        const maxDown = -(codeCubes.length / 2 * LINE_HEIGHT_SPACING + 20);
        targetCameraHeight = Math.max(maxDown, Math.min(CODE_START_Y + 30, targetCameraHeight));
    });
    
    // Drag to rotate
    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        lastMouseX = e.clientX;
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - lastMouseX;
            targetCameraAngle += deltaX * 0.01;
            lastMouseX = e.clientX;
        }
    });
    
    canvas.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    canvas.addEventListener('mouseleave', () => {
        isDragging = false;
    });
}

// ============================================
// RESIZE
// ============================================
function onResize() {
    const canvas = document.getElementById('three-canvas');
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
}

// ============================================
// ANIMATION LOOP
// ============================================
function animate() {
    requestAnimationFrame(animate);
    
    // Smooth camera movement
    cameraHeight += (targetCameraHeight - cameraHeight) * 0.08;
    cameraAngle += (targetCameraAngle - cameraAngle) * 0.08;
    
    // Update camera position
    camera.position.x = Math.sin(cameraAngle) * cameraRadius;
    camera.position.z = Math.cos(cameraAngle) * cameraRadius;
    camera.position.y = cameraHeight;
    
    // Look at center
    centerLookAt.y = cameraHeight;
    camera.lookAt(centerLookAt);
    
    // Animate particles
    if (particles) {
        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] -= 0.1;
            if (positions[i + 1] < -100) {
                positions[i + 1] = 100;
            }
        }
        particles.geometry.attributes.position.needsUpdate = true;
    }
    
    // Animate code cubes
    const time = Date.now() * 0.001;
    codeCubes.forEach((cube, i) => {
        if (cube.userData && cube.userData.line !== undefined) {
            cube.rotation.y = Math.sin(time + i * 0.1) * 0.05;
        }
    });
    
    // FPS counter
    frameCount++;
    const now = performance.now();
    if (now - lastFpsUpdate > 1000) {
        document.getElementById('fps-counter').textContent = frameCount;
        frameCount = 0;
        lastFpsUpdate = now;
    }
    
    renderer.render(scene, camera);
}

// ============================================
// START
// ============================================
document.addEventListener('DOMContentLoaded', init);
