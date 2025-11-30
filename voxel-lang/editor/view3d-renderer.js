// VoxelScript 3D View - Lightning Execution Edition ⚡
const { ipcRenderer } = require('electron');

// ============================================
// STATE & GLOBALS
// ============================================
let scene, camera, renderer;
let codeBlocks = [];
let particles;
let lightningBolts = [];
let executionActive = false;
let executionIndex = 0;
let executionSpeed = 150;
let codeContent = '';
let cameraHeight = 15;
let targetCameraHeight = 15;
let cameraRadius = 55;
let cameraAngle = 0;
let targetCameraAngle = 0;
let isDragging = false;
let lastMouseX = 0;
let centerLookAt;
let frameCount = 0;
let lastFpsUpdate = 0;
let autoRotate = true;
let hoveredBlock = null;
let mouse = { x: 0, y: 0 };
let raycaster;
let lastExecutionTime = 0;

const LINE_HEIGHT = 3.2;
const CODE_START_Y = 35;
const LAYER_DEPTH = 20;
const SCATTER_RANGE = 18;

// Color palette
const COLORS = {
    primary: 0x00ff88,
    secondary: 0x00aaff,
    accent: 0xff0088,
    function: 0x00ffff,
    variable: 0xaa88ff,
    control: 0xffaa00,
    comment: 0x446644,
    string: 0xff6688,
    default: 0x00ff66,
    lightning: 0x88ffff,
    lightningCore: 0xffffff
};

// ============================================
// INITIALIZATION
// ============================================
function init() {
    document.getElementById('btn-minimize').onclick = () => ipcRenderer.send('3d-window-minimize');
    document.getElementById('btn-maximize').onclick = () => ipcRenderer.send('3d-window-maximize');
    document.getElementById('btn-close').onclick = () => ipcRenderer.send('3d-window-close');
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') ipcRenderer.send('3d-window-close');
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            startExecution();
        }
    });
    
    ipcRenderer.on('init-code', (event, code) => {
        codeContent = code || '';
        init3DScene();
        hideLoading();
    });
    
    ipcRenderer.on('update-code', (event, code) => {
        codeContent = code || '';
        rebuildCodeBlocks();
    });
    
    // Listen for run command from main editor
    ipcRenderer.on('run-code', () => {
        startExecution();
    });
}

function hideLoading() {
    const loading = document.getElementById('loading');
    loading.style.opacity = '0';
    setTimeout(() => loading.style.display = 'none', 500);
}

// ============================================
// 3D SCENE SETUP
// ============================================
function init3DScene() {
    const canvas = document.getElementById('three-canvas');
    const container = canvas.parentElement;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || (window.innerHeight - 32);
    
    centerLookAt = new THREE.Vector3(0, CODE_START_Y / 2, 0);
    raycaster = new THREE.Raycaster();
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050608);
    scene.fog = new THREE.FogExp2(0x050608, 0.006);
    
    camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);
    camera.position.set(0, CODE_START_Y, cameraRadius);
    
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    
    createEnvironment();
    createLighting();
    createParticleField();
    createCodeBlocks();
    
    setupControls(canvas);
    window.addEventListener('resize', onResize);
    
    animate();
}

// ============================================
// ENVIRONMENT
// ============================================
function createEnvironment() {
    // Floor grid
    const grid = new THREE.GridHelper(250, 50, COLORS.primary, 0x0a1510);
    grid.position.y = -25;
    grid.material.transparent = true;
    grid.material.opacity = 0.25;
    scene.add(grid);
    
    // Concentric rings
    [25, 40, 55].forEach((radius, i) => {
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(radius, 0.15, 16, 100),
            new THREE.MeshBasicMaterial({ 
                color: [COLORS.primary, COLORS.secondary, COLORS.accent][i],
                transparent: true, 
                opacity: 0.35 - i * 0.08
            })
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.y = -24;
        ring.userData = { rotates: true, speed: 0.002 * (i % 2 ? -1 : 1) };
        scene.add(ring);
        codeBlocks.push(ring);
    });
}

// ============================================
// LIGHTING
// ============================================
function createLighting() {
    scene.add(new THREE.AmbientLight(0x101520, 1));
    
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.3);
    keyLight.position.set(20, 50, 30);
    scene.add(keyLight);
    
    const colors = [COLORS.primary, COLORS.secondary, COLORS.accent];
    const positions = [[30, 20, 30], [-30, 10, -20], [0, -15, 40]];
    
    positions.forEach((pos, i) => {
        const light = new THREE.PointLight(colors[i], 1.2, 100);
        light.position.set(...pos);
        scene.add(light);
    });
}

// ============================================
// PARTICLES
// ============================================
function createParticleField() {
    const count = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const radius = 20 + Math.random() * 60;
        const theta = Math.random() * Math.PI * 2;
        
        positions[i3] = Math.cos(theta) * radius;
        positions[i3 + 1] = (Math.random() - 0.5) * 100;
        positions[i3 + 2] = Math.sin(theta) * radius;
        
        const t = Math.random();
        colors[i3] = 0.1;
        colors[i3 + 1] = 0.6 + t * 0.4;
        colors[i3 + 2] = 0.4 + t * 0.5;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    particles = new THREE.Points(geometry, new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
    }));
    scene.add(particles);
}

// ============================================
// CODE BLOCKS - FLOATING LAYERS
// ============================================
function createCodeBlocks() {
    if (!codeContent) return;
    
    const lines = codeContent.split('\n');
    document.getElementById('line-count').textContent = lines.length;
    
    lines.forEach((line, index) => {
        if (line.trim() === '') return;
        createCodeLine(line, index, lines.length);
    });
}

function createCodeLine(line, index, totalLines) {
    const y = CODE_START_Y - (index * LINE_HEIGHT) + (Math.random() - 0.5) * 2;
    const color = getLineColor(line);
    const width = Math.max(line.length * 0.18, 1.5);
    const indent = (line.length - line.trimStart().length) * 0.15;
    
    // Much more random positioning - scattered in 3D space
    const zLayer = (Math.random() - 0.5) * LAYER_DEPTH;
    const xOffset = (Math.random() - 0.5) * SCATTER_RANGE;
    const yOffset = (Math.random() - 0.5) * 1.5;
    
    // Random rotation for each block
    const rotX = (Math.random() - 0.5) * 0.3;
    const rotY = (Math.random() - 0.5) * 0.4;
    const rotZ = (Math.random() - 0.5) * 0.2;
    
    // Main code block
    const geometry = new THREE.BoxGeometry(width, 0.45, 0.25);
    const material = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.25,
        transparent: true,
        opacity: 0.9,
        shininess: 120
    });
    
    const block = new THREE.Mesh(geometry, material);
    const baseX = indent - 4 + width / 2 + xOffset;
    const baseY = y + yOffset;
    block.position.set(baseX, baseY, zLayer);
    block.rotation.set(rotX, rotY, rotZ);
    
    // Movement parameters - highly varied per block
        block.userData = {
            type: 'code',
            line: index,
            content: line,
            baseY: baseY,
            baseX: baseX,
            baseZ: zLayer,
            baseRotX: rotX,
            baseRotY: rotY,
            baseRotZ: rotZ,
            color: color,
            // Random float parameters - chaotic movement
            floatSpeedX: 0.3 + Math.random() * 1.5,
            floatSpeedY: 0.4 + Math.random() * 2.0,
            floatSpeedZ: 0.2 + Math.random() * 1.2,
            floatAmplitudeX: 1.0 + Math.random() * 3.0,
            floatAmplitudeY: 0.5 + Math.random() * 1.5,
            floatAmplitudeZ: 0.8 + Math.random() * 2.5,
            // Rotation animation - more varied
            rotSpeedX: (Math.random() - 0.5) * 0.04,
            rotSpeedY: (Math.random() - 0.5) * 0.06,
            rotSpeedZ: (Math.random() - 0.5) * 0.03,
            phaseX: Math.random() * Math.PI * 2,
            phaseY: Math.random() * Math.PI * 2,
            phaseZ: Math.random() * Math.PI * 2,
            // Orbit parameters - more blocks orbit
            orbits: Math.random() > 0.5,
            orbitRadius: 2 + Math.random() * 5,
            orbitSpeed: 0.3 + Math.random() * 2.0,
            orbitPhase: Math.random() * Math.PI * 2,
            // Execution state
            executed: false,
            executing: false,
            glowIntensity: 0.25
        };    scene.add(block);
    codeBlocks.push(block);
    
    // Edge glow
    const glowGeom = new THREE.PlaneGeometry(0.1, 0.6);
    const glowMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    const glow = new THREE.Mesh(glowGeom, glowMat);
    glow.position.set(indent - 6.2 + xOffset, y, zLayer + 0.2);
    glow.userData = { isGlow: true, parent: block };
    scene.add(glow);
    codeBlocks.push(glow);
}

function getLineColor(line) {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('#')) return COLORS.comment;
    if (trimmed.startsWith('fn ') || trimmed.startsWith('function')) return COLORS.function;
    if (trimmed.startsWith('let ') || trimmed.startsWith('const ')) return COLORS.variable;
    if (trimmed.startsWith('class ')) return COLORS.accent;
    if (/^(if|else|while|loop|for|switch|case)/.test(trimmed)) return COLORS.control;
    if (trimmed.startsWith('return')) return COLORS.secondary;
    if (trimmed.includes('print') || trimmed.includes('log')) return COLORS.primary;
    if (trimmed.includes('"') || trimmed.includes("'") || trimmed.includes('`')) return COLORS.string;
    return COLORS.default;
}

function rebuildCodeBlocks() {
    codeBlocks = codeBlocks.filter(obj => {
        if (obj.userData && (obj.userData.type === 'code' || obj.userData.isGlow)) {
            scene.remove(obj);
            return false;
        }
        return true;
    });
    
    clearLightning();
    createCodeBlocks();
}

// ============================================
// LIGHTNING SYSTEM
// ============================================
function createLightningBolt(startPos, endPos, color, intensity = 1) {
    const points = generateLightningPath(startPos, endPos, 12);
    
    // Main bolt - thick glowing core
    const coreGeom = new THREE.BufferGeometry().setFromPoints(points);
    const coreMat = new THREE.LineBasicMaterial({
        color: COLORS.lightningCore,
        transparent: true,
        opacity: intensity,
        linewidth: 3
    });
    const core = new THREE.Line(coreGeom, coreMat);
    core.userData = { isLightning: true, life: 1, decay: 0.02 };
    scene.add(core);
    lightningBolts.push(core);
    
    // Outer glow
    const glowMat = new THREE.LineBasicMaterial({
        color: color || COLORS.lightning,
        transparent: true,
        opacity: intensity * 0.6,
        linewidth: 2
    });
    const glow = new THREE.Line(coreGeom.clone(), glowMat);
    glow.userData = { isLightning: true, life: 1, decay: 0.025 };
    scene.add(glow);
    lightningBolts.push(glow);
    
    // Particle burst at connection points
    createLightningBurst(endPos, color);
    
    // Branch bolts for extra detail
    if (Math.random() > 0.3) {
        const midPoint = points[Math.floor(points.length / 2)];
        const branchEnd = new THREE.Vector3(
            midPoint.x + (Math.random() - 0.5) * 6,
            midPoint.y + (Math.random() - 0.5) * 3,
            midPoint.z + (Math.random() - 0.5) * 4
        );
        createLightningBranch(midPoint, branchEnd, color, intensity * 0.5);
    }
}

function createLightningBranch(start, end, color, intensity) {
    const points = generateLightningPath(start, end, 6);
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
        color: color || COLORS.lightning,
        transparent: true,
        opacity: intensity,
        linewidth: 1
    });
    const branch = new THREE.Line(geom, mat);
    branch.userData = { isLightning: true, life: 0.8, decay: 0.04 };
    scene.add(branch);
    lightningBolts.push(branch);
}

function generateLightningPath(start, end, segments) {
    const points = [start.clone()];
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    direction.normalize();
    
    // Create perpendicular vectors for displacement
    const perpX = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
    const perpY = new THREE.Vector3(0, 1, 0);
    
    for (let i = 1; i < segments; i++) {
        const t = i / segments;
        const point = new THREE.Vector3().lerpVectors(start, end, t);
        
        // Add jagged displacement - more in the middle
        const displacement = Math.sin(t * Math.PI) * 1.5;
        const jitterX = (Math.random() - 0.5) * displacement;
        const jitterY = (Math.random() - 0.5) * displacement * 0.5;
        const jitterZ = (Math.random() - 0.5) * displacement;
        
        point.add(perpX.clone().multiplyScalar(jitterX));
        point.y += jitterY;
        point.add(new THREE.Vector3(0, 0, 1).multiplyScalar(jitterZ));
        
        points.push(point);
    }
    
    points.push(end.clone());
    return points;
}

function createLightningBurst(position, color) {
    const burstCount = 20;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(burstCount * 3);
    const velocities = [];
    
    for (let i = 0; i < burstCount; i++) {
        positions[i * 3] = position.x;
        positions[i * 3 + 1] = position.y;
        positions[i * 3 + 2] = position.z;
        
        velocities.push(new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5
        ));
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        color: color || COLORS.lightning,
        size: 0.8,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
    });
    
    const burst = new THREE.Points(geometry, material);
    burst.userData = { 
        isLightning: true, 
        isBurst: true,
        life: 1, 
        decay: 0.05,
        velocities: velocities
    };
    scene.add(burst);
    lightningBolts.push(burst);
}

function clearLightning() {
    lightningBolts.forEach(bolt => scene.remove(bolt));
    lightningBolts = [];
}

// ============================================
// EXECUTION VISUALIZATION
// ============================================
function startExecution() {
    if (executionActive) return;
    
    // Reset all blocks
    codeBlocks.forEach(obj => {
        if (obj.userData && obj.userData.type === 'code') {
            obj.userData.executed = false;
            obj.userData.executing = false;
            obj.userData.glowIntensity = 0.2;
        }
    });
    
    clearLightning();
    executionActive = true;
    executionIndex = 0;
    lastExecutionTime = performance.now();
}

function updateExecution() {
    if (!executionActive) return;
    
    const now = performance.now();
    if (now - lastExecutionTime < executionSpeed) return;
    lastExecutionTime = now;
    
    // Get code blocks sorted by line number
    const sortedBlocks = codeBlocks
        .filter(b => b.userData && b.userData.type === 'code')
        .sort((a, b) => a.userData.line - b.userData.line);
    
    if (executionIndex >= sortedBlocks.length) {
        executionActive = false;
        return;
    }
    
    const currentBlock = sortedBlocks[executionIndex];
    const prevBlock = executionIndex > 0 ? sortedBlocks[executionIndex - 1] : null;
    
    // Mark current as executing
    currentBlock.userData.executing = true;
    currentBlock.userData.glowIntensity = 1.5;
    
    // Mark previous as executed
    if (prevBlock) {
        prevBlock.userData.executing = false;
        prevBlock.userData.executed = true;
        prevBlock.userData.glowIntensity = 0.6;
    }
    
    // Create lightning between blocks
    if (prevBlock) {
        const startPos = prevBlock.position.clone();
        const endPos = currentBlock.position.clone();
        createLightningBolt(startPos, endPos, currentBlock.userData.color);
    } else {
        // First block - lightning from above
        const startPos = new THREE.Vector3(
            currentBlock.position.x,
            currentBlock.position.y + 15,
            currentBlock.position.z - 5
        );
        createLightningBolt(startPos, currentBlock.position.clone(), COLORS.lightning);
    }
    
    executionIndex++;
}

// ============================================
// CONTROLS
// ============================================
function setupControls(canvas) {
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        targetCameraHeight -= e.deltaY * 0.05;
        const lines = codeContent.split('\n').length;
        const minY = CODE_START_Y - (lines * LINE_HEIGHT) - 15;
        targetCameraHeight = Math.max(minY, Math.min(CODE_START_Y + 20, targetCameraHeight));
    });
    
    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        autoRotate = false;
        lastMouseX = e.clientX;
    });
    
    canvas.addEventListener('mousemove', (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        
        if (isDragging) {
            const deltaX = e.clientX - lastMouseX;
            targetCameraAngle += deltaX * 0.008;
            lastMouseX = e.clientX;
        }
    });
    
    canvas.addEventListener('mouseup', () => {
        isDragging = false;
        setTimeout(() => { if (!isDragging) autoRotate = true; }, 2000);
    });
    
    canvas.addEventListener('mouseleave', () => isDragging = false);
    
    // Click to run
    canvas.addEventListener('dblclick', () => startExecution());
}

// ============================================
// RESIZE
// ============================================
function onResize() {
    const canvas = document.getElementById('three-canvas');
    const container = canvas.parentElement;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || (window.innerHeight - 32);
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
}

// ============================================
// ANIMATION
// ============================================
function animate() {
    requestAnimationFrame(animate);
    
    const time = performance.now() * 0.001;
    
    // Auto-rotate
    if (autoRotate) {
        targetCameraAngle += 0.0012;
    }
    
    // Smooth camera
    cameraHeight += (targetCameraHeight - cameraHeight) * 0.04;
    cameraAngle += (targetCameraAngle - cameraAngle) * 0.04;
    
    camera.position.x = Math.sin(cameraAngle) * cameraRadius;
    camera.position.z = Math.cos(cameraAngle) * cameraRadius;
    camera.position.y = cameraHeight;
    centerLookAt.y = cameraHeight * 0.6;
    camera.lookAt(centerLookAt);
    
    // Particles
    if (particles) {
        particles.rotation.y = time * 0.01;
    }
    
    // Hover detection
    raycaster.setFromCamera(mouse, camera);
    const codeOnly = codeBlocks.filter(b => b.userData && b.userData.type === 'code');
    const intersects = raycaster.intersectObjects(codeOnly);
    
    if (hoveredBlock && (!intersects.length || intersects[0].object !== hoveredBlock)) {
        if (!hoveredBlock.userData.executing) {
            hoveredBlock.scale.set(1, 1, 1);
        }
        hoveredBlock = null;
    }
    
    if (intersects.length > 0 && intersects[0].object !== hoveredBlock) {
        hoveredBlock = intersects[0].object;
        hoveredBlock.scale.set(1.1, 1.4, 1.6);
    }
    
    // Animate code blocks - chaotic floating with sudden shifts
    codeBlocks.forEach((obj, i) => {
        if (obj.userData && obj.userData.type === 'code') {
            const ud = obj.userData;
            
            // Random drift - occasionally shift base position
            if (!ud.driftTarget || Math.random() < 0.002) {
                ud.driftTarget = {
                    x: ud.baseX + (Math.random() - 0.5) * 8,
                    y: ud.baseY + (Math.random() - 0.5) * 4,
                    z: ud.baseZ + (Math.random() - 0.5) * 6
                };
            }
            
            // Smooth drift towards target
            ud.currentBase = ud.currentBase || { x: ud.baseX, y: ud.baseY, z: ud.baseZ };
            ud.currentBase.x += (ud.driftTarget.x - ud.currentBase.x) * 0.008;
            ud.currentBase.y += (ud.driftTarget.y - ud.currentBase.y) * 0.008;
            ud.currentBase.z += (ud.driftTarget.z - ud.currentBase.z) * 0.008;
            
            // Independent floating motion with rotation
            if (!ud.executing && obj !== hoveredBlock) {
                // Multi-layered oscillation for organic movement
                let offsetX = Math.sin(time * ud.floatSpeedX + ud.phaseX) * ud.floatAmplitudeX;
                offsetX += Math.sin(time * ud.floatSpeedX * 2.7 + ud.phaseY) * ud.floatAmplitudeX * 0.3;
                
                let offsetZ = Math.sin(time * ud.floatSpeedZ + ud.phaseZ) * ud.floatAmplitudeZ;
                offsetZ += Math.cos(time * ud.floatSpeedZ * 1.3 + ud.phaseX) * ud.floatAmplitudeZ * 0.4;
                
                let offsetY = Math.sin(time * ud.floatSpeedY + ud.phaseY) * ud.floatAmplitudeY;
                offsetY += Math.sin(time * ud.floatSpeedY * 3.1 + ud.phaseZ) * ud.floatAmplitudeY * 0.25;
                
                // Orbital motion for some blocks
                if (ud.orbits) {
                    offsetX += Math.cos(time * ud.orbitSpeed + ud.orbitPhase) * ud.orbitRadius;
                    offsetZ += Math.sin(time * ud.orbitSpeed + ud.orbitPhase) * ud.orbitRadius;
                    offsetY += Math.sin(time * ud.orbitSpeed * 0.7 + ud.orbitPhase) * ud.orbitRadius * 0.3;
                }
                
                // Random jitter for extra chaos
                if (Math.random() < 0.02) {
                    offsetX += (Math.random() - 0.5) * 0.5;
                    offsetZ += (Math.random() - 0.5) * 0.5;
                }
                
                obj.position.x = ud.currentBase.x + offsetX;
                obj.position.y = ud.currentBase.y + offsetY;
                obj.position.z = ud.currentBase.z + offsetZ;
                
                // Chaotic rotation animation
                obj.rotation.x = ud.baseRotX + Math.sin(time * 0.5 + ud.phaseX) * 0.15 + Math.sin(time * 1.7 + ud.phaseY) * 0.08;
                obj.rotation.y = ud.baseRotY + time * ud.rotSpeedY + Math.sin(time * 0.3 + ud.phaseZ) * 0.1;
                obj.rotation.z = ud.baseRotZ + Math.sin(time * 0.7 + ud.phaseZ) * 0.12 + Math.cos(time * 2.1 + ud.phaseX) * 0.05;
            }
            
            // Glow based on execution state
            let targetGlow = ud.glowIntensity;
            if (ud.executing) {
                targetGlow = 2.0 + Math.sin(time * 15) * 0.6;
                obj.scale.set(1.3, 1.8, 2.2);
                // Rapid chaotic spin when executing
                obj.rotation.y += 0.15;
                obj.rotation.x += Math.sin(time * 20) * 0.05;
            } else if (ud.executed) {
                targetGlow = 0.7;
                // Gentle pulse on executed blocks
                obj.material.emissiveIntensity = 0.7 + Math.sin(time * 2 + ud.phaseX) * 0.15;
            }
            
            obj.material.emissiveIntensity += (targetGlow - obj.material.emissiveIntensity) * 0.12;
        }
        
        // Rotating rings
        if (obj.userData && obj.userData.rotates) {
            obj.rotation.z += obj.userData.speed;
        }
        
        // Glows follow parents
        if (obj.userData && obj.userData.isGlow && obj.userData.parent) {
            const parent = obj.userData.parent;
            obj.position.x = parent.position.x - (parent.geometry.parameters.width / 2) - 0.15;
            obj.position.y = parent.position.y;
            obj.position.z = parent.position.z + 0.2;
            obj.material.opacity = 0.5 + parent.material.emissiveIntensity * 0.4;
        }
    });
    
    // Update lightning
    lightningBolts = lightningBolts.filter(bolt => {
        bolt.userData.life -= bolt.userData.decay;
        bolt.material.opacity = bolt.userData.life;
        
        // Update burst particles
        if (bolt.userData.isBurst && bolt.userData.velocities) {
            const positions = bolt.geometry.attributes.position.array;
            for (let i = 0; i < bolt.userData.velocities.length; i++) {
                positions[i * 3] += bolt.userData.velocities[i].x;
                positions[i * 3 + 1] += bolt.userData.velocities[i].y;
                positions[i * 3 + 2] += bolt.userData.velocities[i].z;
                bolt.userData.velocities[i].multiplyScalar(0.95);
            }
            bolt.geometry.attributes.position.needsUpdate = true;
        }
        
        if (bolt.userData.life <= 0) {
            scene.remove(bolt);
            return false;
        }
        return true;
    });
    
    // Update execution
    updateExecution();
    
    // FPS
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
