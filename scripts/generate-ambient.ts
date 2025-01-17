import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the generateAmbient function
import('../src/components/audio/generateAmbient.js').then(async ({ generateAmbientSound }) => {
  const buffer = await generateAmbientSound();
  
  // Create public/audio directory if it doesn't exist
  const audioDir = path.join(__dirname, '../public/audio');
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }
  
  // Write the WAV file
  fs.writeFileSync(path.join(audioDir, 'ambient.wav'), buffer);
  console.log('Generated ambient.wav in public/audio directory');
}); 