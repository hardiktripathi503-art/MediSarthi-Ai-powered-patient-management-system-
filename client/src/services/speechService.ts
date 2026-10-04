import { LanguageCode } from '@shared/types';

export interface SpeechRecognitionHandlers {
  onResult: (transcript: string, isFinal: boolean) => void;
  onInterim?: (interimTranscript: string) => void;
  onError: (error: string) => void;
  onEnd: () => void;
  onStart: () => void;
}

export interface AudioAnalysisData {
  volume: number; // 0 to 100
  frequencies: number[]; // 8 normalized frequency bands (0 to 100)
}

export class SpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  private shouldKeepListening: boolean = false;
  private activeLanguage: LanguageCode = 'en';
  private activeHandlers: SpeechRecognitionHandlers | null = null;

  // Web Audio API properties for audio visualization
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private isAnalyzing: boolean = false;

  // TTS Properties
  private activeUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    // Defer initialization to avoid SSR/top-level crashes
  }

  public isSupported(): boolean {
    try {
      if (typeof window === 'undefined') return false;
      return Boolean(
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      );
    } catch {
      return false;
    }
  }

  public isTtsSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  private getRecognitionInstance(): any {
    if (this.recognition) return this.recognition;
    if (typeof window === 'undefined') return null;

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const instance = new SpeechRecognition();
        instance.continuous = true;
        instance.interimResults = true;
        instance.maxAlternatives = 1;
        this.recognition = instance;
        return this.recognition;
      }
    } catch (err) {
      console.warn('[SpeechService] Recognition instantiation error:', err);
    }
    return null;
  }

  /**
   * Start listening with real-time streaming interim results
   */
  public startListening(
    language: LanguageCode,
    handlers: SpeechRecognitionHandlers,
    options?: { continuous?: boolean }
  ): void {
    const recognition = this.getRecognitionInstance();
    if (!recognition) {
      handlers.onError('Browser speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.activeLanguage = language;
    this.activeHandlers = handlers;
    this.shouldKeepListening = options?.continuous ?? true;

    // Set BCP-47 language tag
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.continuous = this.shouldKeepListening;

    recognition.onstart = () => {
      this.isListening = true;
      handlers.onStart();
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0].transcript;
        } else {
          interimTranscript += item[0].transcript;
        }
      }

      if (interimTranscript && handlers.onInterim) {
        handlers.onInterim(interimTranscript.trim());
      }

      if (finalTranscript) {
        handlers.onResult(finalTranscript.trim(), true);
      } else if (interimTranscript) {
        handlers.onResult(interimTranscript.trim(), false);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('[SpeechService] Recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Normal silence timeout; if continuous, let onend handle restart
        return;
      }
      this.isListening = false;
      handlers.onError(event.error || 'Speech recognition encountered an issue.');
    };

    recognition.onend = () => {
      this.isListening = false;
      // If continuous mode is enabled and user hasn't called stopListening, auto-restart
      if (this.shouldKeepListening && this.activeHandlers) {
        try {
          recognition.start();
          return;
        } catch {
          // Restart failed, trigger onEnd
        }
      }
      handlers.onEnd();
    };

    try {
      recognition.start();
    } catch (err: any) {
      console.warn('[SpeechService] Failed to start recognition:', err);
      this.isListening = false;
      handlers.onError(err.message || 'Could not access microphone');
    }
  }

  /**
   * Stop active speech recognition
   */
  public stopListening(): void {
    this.shouldKeepListening = false;
    this.activeHandlers = null;
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        // Ignore
      }
      this.isListening = false;
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  // =========================================================================
  // Web Audio API Analyser for Live Waveform / Visualizer
  // =========================================================================

  /**
   * Starts capturing microphone audio to calculate real-time volume and frequency data
   */
  public async startAudioAnalysis(
    onAudioData: (data: AudioAnalysisData) => void
  ): Promise<boolean> {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }

    try {
      this.stopAudioAnalysis();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.mediaStream = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();

      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;
      source.connect(this.analyser);

      this.isAnalyzing = true;
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const render = () => {
        if (!this.isAnalyzing || !this.analyser) return;

        this.analyser.getByteFrequencyData(dataArray);

        // Compute RMS volume (0 to 100)
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const volume = Math.min(100, Math.round((avg / 128) * 100));

        // Group into 8 normalized frequency bins for multi-bar wave
        const bandsCount = 8;
        const binSize = Math.floor(bufferLength / bandsCount) || 1;
        const frequencies: number[] = [];

        for (let b = 0; b < bandsCount; b++) {
          let bandSum = 0;
          for (let k = 0; k < binSize; k++) {
            bandSum += dataArray[b * binSize + k] || 0;
          }
          const bandAvg = bandSum / binSize;
          frequencies.push(Math.min(100, Math.round((bandAvg / 255) * 100)));
        }

        onAudioData({ volume, frequencies });
        this.animationFrameId = requestAnimationFrame(render);
      };

      this.animationFrameId = requestAnimationFrame(render);
      return true;
    } catch (err) {
      console.warn('[SpeechService] Audio analysis initialization error:', err);
      return false;
    }
  }

  /**
   * Stops microphone audio stream analysis
   */
  public stopAudioAnalysis(): void {
    this.isAnalyzing = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {
        // Ignore
      }
      this.audioContext = null;
    }
    this.analyser = null;
  }

  // =========================================================================
  // Text-To-Speech (TTS) Voice Synthesis
  // =========================================================================

  /**
   * Sanitizes markdown, asterisks, symbols and parenthetical translations for clean TTS speech
   */
  private sanitizeForSpeech(text: string): string {
    return text
      .replace(/###/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/•/g, '')
      .replace(/Dr\.\s*Saarthi/gi, 'Doctor Saarthi')
      .replace(/Dr\./gi, 'Doctor')
      .replace(/BP/gi, 'Blood Pressure')
      .replace(/Rx/gi, 'Prescription')
      .replace(/Ayush/gi, 'Aayush')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Speaks clinical questions or explanations aloud in Hindi or English
   */
  public speak(
    text: string,
    language: LanguageCode,
    options?: {
      rate?: number;
      pitch?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: () => void;
    }
  ): void {
    if (!this.isTtsSupported()) {
      options?.onError?.();
      return;
    }

    this.stopSpeaking();

    const cleanText = this.sanitizeForSpeech(text);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    this.activeUtterance = utterance;

    const isHindi = language === 'hi' || /[\u0900-\u097F]/.test(cleanText);
    utterance.lang = isHindi ? 'hi-IN' : 'en-IN';
    utterance.rate = options?.rate ?? (isHindi ? 0.95 : 1.0);
    utterance.pitch = options?.pitch ?? 1.0;

    // Pick best available matching voice
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      if (isHindi) {
        const hindiVoice = voices.find(
          (v) => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('lekha')
        );
        if (hindiVoice) utterance.voice = hindiVoice;
      } else {
        const indianEngVoice = voices.find(
          (v) => v.lang.includes('en-IN') || v.name.toLowerCase().includes('india') || v.name.toLowerCase().includes('rishi')
        );
        const englishVoice = indianEngVoice || voices.find((v) => v.lang.startsWith('en'));
        if (englishVoice) utterance.voice = englishVoice;
      }
    }

    utterance.onstart = () => {
      options?.onStart?.();
    };

    utterance.onend = () => {
      this.activeUtterance = null;
      options?.onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn('[SpeechService] TTS error:', e);
      this.activeUtterance = null;
      options?.onError?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Stop active speech playback
   */
  public stopSpeaking(): void {
    if (this.isTtsSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
      this.activeUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    return Boolean(this.isTtsSupported() && window.speechSynthesis.speaking);
  }
}

export const speechService = new SpeechService();
