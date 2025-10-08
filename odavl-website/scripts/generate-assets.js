/* eslint-env node */
// ODAVL Asset Generator - Production Critical Assets
// Generates favicon.ico, og-image.png, logo.png, apple-touch-icon.png

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ODAVL Brand Colors
const NAVY = '#0f3460';
const CYAN = '#00d4ff';
const WHITE = '#ffffff';

async function generateFavicon() {
  const svg = `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" fill="${NAVY}" rx="4"/>
      <path d="M8 16L16 8L24 16L16 24L8 16Z" fill="${CYAN}"/>
      <circle cx="16" cy="16" r="3" fill="${WHITE}"/>
    </svg>
  `;
  
  // Generate favicon as PNG first, then convert to ICO manually or use as fallback
  await sharp(Buffer.from(svg))
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, '../public/favicon-32x32.png'));
  
  await sharp(Buffer.from(svg))
    .resize(16, 16)
    .png()
    .toFile(path.join(__dirname, '../public/favicon-16x16.png'));
  
  console.log('✅ favicon PNG files generated (32x32, 16x16)');
}

async function generateLogo() {
  const svg = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" fill="${NAVY}" rx="64"/>
      <path d="M128 256L256 128L384 256L256 384L128 256Z" fill="${CYAN}"/>
      <circle cx="256" cy="256" r="48" fill="${WHITE}"/>
      <text x="256" y="420" font-family="Arial, sans-serif" font-size="48" 
            fill="${WHITE}" text-anchor="middle" font-weight="bold">ODAVL</text>
    </svg>
  `;
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(__dirname, '../public/logo.png'));
  
  console.log('✅ logo.png generated');
}

async function generateAppleTouchIcon() {
  const svg = `
    <svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
      <rect width="180" height="180" fill="${NAVY}" rx="32"/>
      <path d="M45 90L90 45L135 90L90 135L45 90Z" fill="${CYAN}"/>
      <circle cx="90" cy="90" r="18" fill="${WHITE}"/>
    </svg>
  `;
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(__dirname, '../public/apple-touch-icon.png'));
  
  console.log('✅ apple-touch-icon.png generated');
}

async function generateOGImage() {
  const svg = `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="${NAVY}"/>
      <path d="M300 315L450 165L600 315L450 465L300 315Z" fill="${CYAN}"/>
      <circle cx="450" cy="315" r="36" fill="${WHITE}"/>
      <text x="750" y="280" font-family="Arial, sans-serif" font-size="72" 
            fill="${WHITE}" font-weight="bold">ODAVL</text>
      <text x="750" y="340" font-family="Arial, sans-serif" font-size="32" 
            fill="${CYAN}">Autonomous Code Quality Platform</text>
      <text x="750" y="420" font-family="Arial, sans-serif" font-size="24" 
            fill="${WHITE}">Transform your codebase with intelligent,</text>
      <text x="750" y="450" font-family="Arial, sans-serif" font-size="24" 
            fill="${WHITE}">autonomous quality improvements</text>
    </svg>
  `;
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(__dirname, '../public/og-image.png'));
  
  console.log('✅ og-image.png generated');
}

// Execute all generators
(async () => {
  await generateFavicon();
  await generateLogo();
  await generateAppleTouchIcon();
  await generateOGImage();
  console.log('🎉 All assets generated successfully!');
})();