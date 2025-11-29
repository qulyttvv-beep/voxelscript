/**
 * VoxelScript Icon Generator
 * 
 * This script creates icon files from SVG sources.
 * Run: node generate-icons.js
 * 
 * Prerequisites:
 *   npm install sharp png-to-ico
 * 
 * Or use an online converter:
 *   1. Open icon.svg in browser
 *   2. Use https://convertio.co/svg-ico/ to convert
 *   3. Save as icon.ico in assets folder
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
    sharp = require('sharp');
} catch (e) {
    console.log('Sharp not installed. Creating placeholder icons...');
    createPlaceholderIcons();
    process.exit(0);
}

async function generateIcons() {
    const assetsDir = __dirname;
    
    // Generate PNG icons at various sizes
    const sizes = [16, 24, 32, 48, 64, 128, 256, 512];
    
    console.log('Generating icons from SVG...');
    
    for (const size of sizes) {
        try {
            // Main app icon
            await sharp(path.join(assetsDir, 'icon.svg'))
                .resize(size, size)
                .png()
                .toFile(path.join(assetsDir, `icon-${size}.png`));
            
            // File icon
            await sharp(path.join(assetsDir, 'file-icon.svg'))
                .resize(size, size)
                .png()
                .toFile(path.join(assetsDir, `file-icon-${size}.png`));
            
            console.log(`Generated ${size}x${size} icons`);
        } catch (err) {
            console.error(`Error generating ${size}x${size}:`, err.message);
        }
    }
    
    // Create a 256x256 PNG for the main icon
    await sharp(path.join(assetsDir, 'icon.svg'))
        .resize(256, 256)
        .png()
        .toFile(path.join(assetsDir, 'icon.png'));
    
    console.log('\nPNG icons generated!');
    console.log('To create .ico files, use one of these methods:');
    console.log('1. Use https://convertio.co/png-ico/');
    console.log('2. Use https://icoconvert.com/');
    console.log('3. Install png-to-ico: npm install png-to-ico');
}

function createPlaceholderIcons() {
    // Create a simple PNG placeholder using canvas-like approach
    // This creates a basic 256x256 icon with raw pixel data
    
    const size = 256;
    const channels = 4; // RGBA
    const data = Buffer.alloc(size * size * channels);
    
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const idx = (y * size + x) * channels;
            
            // Check if pixel is in cube area
            const cx = size / 2;
            const cy = size / 2;
            const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            
            if (dist < 80) {
                // Green cube area
                data[idx] = 0;       // R
                data[idx + 1] = 255; // G
                data[idx + 2] = 0;   // B
                data[idx + 3] = 255; // A
            } else if (dist < 100) {
                // Glow
                const alpha = Math.floor(255 * (1 - (dist - 80) / 20));
                data[idx] = 0;
                data[idx + 1] = 255;
                data[idx + 2] = 0;
                data[idx + 3] = alpha;
            } else {
                // Black background
                data[idx] = 0;
                data[idx + 1] = 0;
                data[idx + 2] = 0;
                data[idx + 3] = 255;
            }
        }
    }
    
    console.log('Placeholder icon data created.');
    console.log('Please convert icon.svg to icon.ico using an online tool.');
}

// Run the generator
generateIcons().catch(console.error);
