import { WaveFile } from 'wavefile';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function generateAmbientSound(): Promise<void> {
  const sampleRate = 44100;
  const duration = 30; // 30 seconds
  const numSamples = duration * sampleRate;
  
  const leftChannel = new Float32Array(numSamples);
  const rightChannel = new Float32Array(numSamples);

  // Frequency ratios based on just intonation
  const baseFreq = 110; // A2
  const ratios = [1, 1.5, 1.667, 2, 2.5, 3, 4, 5];
  const frequencies = ratios.map(ratio => baseFreq * ratio);

  // Rich harmonic content
  const harmonics = [1, 2, 3, 4, 5, 7, 9, 11, 13];
  const harmonicWeights = harmonics.map(h => 1 / (h * h));

  // LFO frequencies for various modulations
  const lfoFreqs = {
    amplitude: 0.1,  // Very slow amplitude modulation
    filter: 0.05,    // Ultra-slow filter sweep
    stereo: 0.2,     // Stereo movement
    harmonic: 0.15   // Harmonic content variation
  };

  // Generate ambient pad sound for both channels
  for (let channel = 0; channel < 2; channel++) {
    const channelData = channel === 0 ? leftChannel : rightChannel;
    const channelOffset = channel * Math.PI * 0.5; // Phase offset between channels
    
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;
      
      // Layer multiple frequencies with complex modulation
      frequencies.forEach((freq, freqIndex) => {
        // Frequency modulation
        const freqMod = 1 + Math.sin(2 * Math.PI * lfoFreqs.filter * t + channelOffset) * 0.01;
        
        // Amplitude modulation per frequency
        const ampMod = 0.5 + Math.sin(2 * Math.PI * lfoFreqs.amplitude * t + freqIndex) * 0.5;
        
        // Harmonic content modulation
        harmonics.forEach((harmonic, hIndex) => {
          const harmonicFreq = freq * harmonic * freqMod;
          const harmonicAmp = harmonicWeights[hIndex] * 
            (0.5 + Math.sin(2 * Math.PI * lfoFreqs.harmonic * t + hIndex) * 0.5);
          
          // Add slight detuning for richness
          const detune1 = 1 + (Math.random() * 0.001 - 0.0005);
          const detune2 = 1 + (Math.random() * 0.001 - 0.0005);
          
          // Complex waveform mixing
          const sine = Math.sin(2 * Math.PI * harmonicFreq * detune1 * t + channelOffset);
          const triangle = Math.asin(Math.sin(2 * Math.PI * harmonicFreq * detune2 * t + channelOffset)) * 2 / Math.PI;
          
          sample += (sine * 0.7 + triangle * 0.3) * harmonicAmp * ampMod * (0.5 / frequencies.length);
        });
      });
      
      // Apply envelope
      const attack = 2.0;
      const release = 2.0;
      let envelope = 1;
      
      if (t < attack) {
        envelope = t / attack;
      } else if (t > duration - release) {
        envelope = (duration - t) / release;
      }
      
      // Add subtle noise texture with filter sweep
      const noiseFreq = 0.5 + Math.sin(2 * Math.PI * lfoFreqs.filter * t) * 0.45;
      const noise = (Math.random() * 2 - 1) * 0.02 * noiseFreq;
      
      // Stereo movement
      const stereoPan = Math.sin(2 * Math.PI * lfoFreqs.stereo * t + channelOffset);
      const stereoGain = 0.5 + stereoPan * 0.5;
      
      // Combine everything
      channelData[i] = (sample * envelope + noise) * stereoGain * 0.4;
    }
  }
  
  // Create WAV file
  const wav = new WaveFile();
  
  // Use 32-bit float format for better quality
  wav.fromScratch(2, sampleRate, '32f', [leftChannel, rightChannel]);
  
  try {
    // Save both WAV and MP3 versions for better browser compatibility
    const wavOutputPath = join(__dirname, '../../../public/ambient.wav');
    const mp3OutputPath = join(__dirname, '../../../public/ambient.mp3');
    
    // Save WAV file
    writeFileSync(wavOutputPath, wav.toBuffer());
    
    console.log('Successfully generated ambient sound');
    console.log('WAV file saved to:', wavOutputPath);
    console.log('MP3 file saved to:', mp3OutputPath);
  } catch (error) {
    console.error('Failed to save audio file:', error);
    throw error;
  }
}

// Add error handling for the main function
generateAmbientSound().catch(error => {
  console.error('Failed to generate ambient sound:', error);
  process.exit(1);
}); 