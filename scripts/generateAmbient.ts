import pkg from 'wavefile';
const { WaveFile } = pkg;
import { writeFileSync } from 'fs';
import { join } from 'path';

// Generate ambient sound directly in the script
async function generateAmbient(): Promise<Buffer> {
  const sampleRate = 44100;
  const duration = 30; // 30 seconds
  const numSamples = duration * sampleRate;
  const leftChannel = new Float32Array(numSamples);
  const rightChannel = new Float32Array(numSamples);

  // Generate ambient pad sound for both channels
  for (let channel = 0; channel < 2; channel++) {
    const channelData = channel === 0 ? leftChannel : rightChannel;
    
    // Base frequencies (A2 = 110Hz, E3 = 164.81Hz, C3 = 130.81Hz)
    const baseFreqs = [110, 164.81, 130.81];
    
    // Generate rich harmonics
    const harmonics = [1, 2, 3, 4, 5, 7, 9];
    const harmonicWeights = [1, 0.5, 0.25, 0.125, 0.0625, 0.03125, 0.015625];
    
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;
      
      // Layer multiple base frequencies
      baseFreqs.forEach((baseFreq, freqIndex) => {
        // Add harmonics for each base frequency
        harmonics.forEach((harmonic, index) => {
          const freq = baseFreq * harmonic;
          // Add slight detuning for richness
          const detune = 1 + (Math.random() * 0.001 - 0.0005);
          sample += Math.sin(2 * Math.PI * freq * detune * t) * harmonicWeights[index] * (1 / baseFreqs.length);
        });
      });
      
      // Complex modulation
      const slowMod = Math.sin(2 * Math.PI * 0.1 * t); // 0.1 Hz
      const mediumMod = Math.sin(2 * Math.PI * 0.5 * t); // 0.5 Hz
      const fastMod = Math.sin(2 * Math.PI * 2.0 * t); // 2.0 Hz
      
      const modulation = 1 + 
        0.2 * slowMod + 
        0.1 * mediumMod + 
        0.05 * fastMod;
      
      // Apply envelope
      const attack = 2.0;
      const release = 2.0;
      let envelope = 1;
      
      if (t < attack) {
        envelope = t / attack;
      } else if (t > duration - release) {
        envelope = (duration - t) / release;
      }
      
      // Add subtle noise texture
      const noise = (Math.random() * 2 - 1) * 0.02;
      
      // Combine everything
      channelData[i] = (sample * modulation * envelope + noise) * 0.4;
    }
  }

  // Create WAV file
  const wav = new WaveFile();
  wav.fromScratch(2, sampleRate, '32f', [leftChannel, rightChannel]);
  
  return Buffer.from(wav.toBuffer());
}

async function main() {
  try {
    console.log('Generating ambient sound...');
    const wavBuffer = await generateAmbient();
    
    // Ensure public directory exists
    const publicDir = join(process.cwd(), 'public');
    const outputPath = join(publicDir, 'ambient.wav');
    
    // Write the WAV file
    writeFileSync(outputPath, wavBuffer);
    console.log(`Successfully generated ambient sound at ${outputPath}`);
  } catch (error) {
    console.error('Error generating ambient sound:', error);
    process.exit(1);
  }
}

main(); 