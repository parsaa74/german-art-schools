import { generateAmbientSound } from '../src/components/audio/generateAmbient.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  console.log('Generating ambient sound...');
  const audioBuffer = await generateAmbientSound();
  
  const outputPath = join(__dirname, '..', 'public', 'audio', 'ambient.wav');
  await fs.writeFile(outputPath, audioBuffer);
  
  console.log(`Ambient sound saved to ${outputPath}`);
}

main().catch(console.error); 