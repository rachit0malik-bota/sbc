const fs = require('fs');
const { execSync } = require('child_process');

const browserPath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const htmlFile = 'file:///C:/Users/Admin/.gemini/antigravity/scratch/section-b-coffee/index.html';

const outDesktopFull = 'C:\\Users\\Admin\\.gemini\\antigravity\\scratch\\section-b-coffee\\screenshot-desktop-full.png';
const outMobileFull = 'C:\\Users\\Admin\\.gemini\\antigravity\\scratch\\section-b-coffee\\screenshot-mobile-full.png';

try {
  console.log('Capturing full desktop long-scroll...');
  execSync(`"${browserPath}" --headless=new --screenshot="${outDesktopFull}" --window-size=1440,6200 --hide-scrollbars "${htmlFile}"`, { stdio: 'inherit' });
  console.log('Desktop full captured:', outDesktopFull);

  console.log('Capturing mobile long-scroll...');
  execSync(`"${browserPath}" --headless=new --screenshot="${outMobileFull}" --window-size=390,7500 --hide-scrollbars "${htmlFile}"`, { stdio: 'inherit' });
  console.log('Mobile full captured:', outMobileFull);
} catch (e) {
  console.error('Error capturing screenshot:', e.message);
}
