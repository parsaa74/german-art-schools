import { generateAmbientSound } from '../src/components/audio/generateAmbient';
import { promises as fs } from 'fs';
import { join } from 'path';

async function main() {
  console.log('Generating ambient sound...');
  const audioBuffer = await generateAmbientSound();
  
  const outputPath = join(process.cwd(), 'public', 'audio', 'ambient.wav');
  await fs.writeFile(outputPath, audioBuffer);
  
  console.log(`Ambient sound saved to ${outputPath}`);
}

main().catch(console.error); 