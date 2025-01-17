export class AudioSystem {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private ambientSound: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private dataArray: Uint8Array = new Uint8Array(0);
  private isPlaying: boolean = false;
  private audioBuffer: AudioBuffer | null = null;
  private frequencyBands: { low: number; mid: number; high: number } = { low: 0, mid: 0, high: 0 };
  private smoothingFactor = 0.8;
  private lastReactivity: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudioContext();
    }
  }

  private initAudioContext() {
    try {
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.gainNode = this.audioContext.createGain();
      
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.92;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      this.gainNode.gain.value = 0.2;

      // Generate default audio data if no ambient sound is available
      this.generateDefaultAudioData();
    } catch (error) {
      console.error('Error initializing audio context:', error);
    }
  }

  private generateDefaultAudioData() {
    // Generate some default frequency data for visual interest
    setInterval(() => {
      if (!this.analyser) return;
      
      const time = Date.now() / 1000;
      this.frequencyBands = {
        low: (Math.sin(time * 0.5) + 1) * 0.5,
        mid: (Math.sin(time * 0.8 + 2) + 1) * 0.5,
        high: (Math.sin(time * 1.2 + 4) + 1) * 0.5
      };
      this.lastReactivity = (Math.sin(time) + 1) * 0.5;
    }, 16); // Update at 60fps
  }

  private async loadAndPlayAmbient() {
    try {
      await this.loadAmbientSound('/audio/ambient.wav');
      this.play();
    } catch (error) {
      console.error('Error loading ambient sound:', error);
    }
  }

  async loadAmbientSound(url: string) {
    if (!this.audioContext || !this.gainNode) return;
    
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Don't create the source node yet, we'll do that in play()
    } catch (error) {
      console.error('Error loading ambient sound:', error);
    }
  }

  play() {
    if (!this.audioContext || !this.audioBuffer || this.isPlaying) return;
    
    try {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      // Create a new source node for each playback
      this.ambientSound = this.audioContext.createBufferSource();
      this.ambientSound.buffer = this.audioBuffer;
      this.ambientSound.loop = true;
      
      if (this.gainNode) {
        this.ambientSound.connect(this.gainNode);
      }
      
      this.ambientSound.start();
      this.isPlaying = true;

      // Handle the end of playback
      this.ambientSound.onended = () => {
        this.isPlaying = false;
        this.ambientSound = null;
      };
    } catch (error) {
      console.error('Error playing ambient sound:', error);
      this.isPlaying = false;
      this.ambientSound = null;
    }
  }

  stop() {
    if (!this.ambientSound || !this.isPlaying) return;
    
    try {
      this.ambientSound.stop();
    } catch (error) {
      console.error('Error stopping ambient sound:', error);
    } finally {
      this.isPlaying = false;
      this.ambientSound = null;
    }
  }

  // Get raw frequency data
  getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }

  // Get analyzed frequency bands with smoothing
  getFrequencyBands() {
    if (!this.analyser) return this.frequencyBands;

    const freqData = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(freqData);

    // Calculate frequency bands with reduced sensitivity
    const lowEnd = Math.floor(freqData.length * 0.1);
    const midEnd = Math.floor(freqData.length * 0.5);

    let lowSum = 0, midSum = 0, highSum = 0;
    
    // Low frequencies (bass)
    for (let i = 0; i < lowEnd; i++) {
      lowSum += freqData[i];
    }
    
    // Mid frequencies
    for (let i = lowEnd; i < midEnd; i++) {
      midSum += freqData[i];
    }
    
    // High frequencies
    for (let i = midEnd; i < freqData.length; i++) {
      highSum += freqData[i];
    }

    // Normalize and apply smoothing
    const newBands = {
      low: lowSum / lowEnd / 255,
      mid: midSum / (midEnd - lowEnd) / 255,
      high: highSum / (freqData.length - midEnd) / 255
    };

    // Apply smoothing
    this.frequencyBands = {
      low: this.smoothingFactor * this.frequencyBands.low + (1 - this.smoothingFactor) * newBands.low,
      mid: this.smoothingFactor * this.frequencyBands.mid + (1 - this.smoothingFactor) * newBands.mid,
      high: this.smoothingFactor * this.frequencyBands.high + (1 - this.smoothingFactor) * newBands.high
    };

    return this.frequencyBands;
  }

  setVolume(value: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, value));
    }
  }

  getReactivity(): number {
    if (!this.analyser) return 0;
    
    const frequencyData = this.getFrequencyData();
    const sum = frequencyData.reduce((acc, val) => acc + val, 0);
    const average = sum / frequencyData.length;
    
    // Normalize to 0-1 range and apply smoothing
    const normalizedReactivity = average / 255;
    this.lastReactivity = this.lastReactivity * this.smoothingFactor + 
                         normalizedReactivity * (1 - this.smoothingFactor);
    
    return this.lastReactivity;
  }

  // Alias for getReactivity to maintain consistent naming with Globe component
  getAudioIntensity(): number {
    return this.getReactivity();
  }
}

export const audioSystem = new AudioSystem(); 