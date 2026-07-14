// ============================================================
// BuildAI Studio — Web Speech API Wrapper
// Push-to-talk and continuous speech recognition
// ============================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

type OnResultCallback = (result: SpeechRecognitionResult) => void;
type OnErrorCallback = (error: string) => void;

class SpeechRecognitionWrapper {
  private recognition: any = null;
  private isListening = false;
  private onResultCallback: OnResultCallback | null = null;
  private onErrorCallback: OnErrorCallback | null = null;
  private onEndCallback: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const w = window as any;
      const SpeechRecognitionAPI = w.SpeechRecognition || w.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        this.recognition = new SpeechRecognitionAPI();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;

        this.recognition.onresult = (event: any) => {
          const result = event.results[event.results.length - 1];
          if (this.onResultCallback) {
            this.onResultCallback({
              transcript: result[0].transcript,
              isFinal: result.isFinal,
              confidence: result[0].confidence,
            });
          }
        };

        this.recognition.onerror = (event: any) => {
          if (this.onErrorCallback) {
            this.onErrorCallback(event.error);
          }
          this.isListening = false;
        };

        this.recognition.onend = () => {
          this.isListening = false;
          if (this.onEndCallback) {
            this.onEndCallback();
          }
        };
      }
    }
  }

  get isAvailable(): boolean {
    return this.recognition !== null;
  }

  get listening(): boolean {
    return this.isListening;
  }

  onResult(callback: OnResultCallback): void {
    this.onResultCallback = callback;
  }

  onError(callback: OnErrorCallback): void {
    this.onErrorCallback = callback;
  }

  onEnd(callback: () => void): void {
    this.onEndCallback = callback;
  }

  start(continuous = false): void {
    if (!this.recognition || this.isListening) return;
    this.recognition.continuous = continuous;
    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e) {
      // Already started
    }
  }

  stop(): void {
    if (!this.recognition || !this.isListening) return;
    try {
      this.recognition.stop();
    } catch (e) {
      // Already stopped
    }
    this.isListening = false;
  }
}

// Singleton
let instance: SpeechRecognitionWrapper | null = null;

export function getSpeechRecognition(): SpeechRecognitionWrapper {
  if (!instance) {
    instance = new SpeechRecognitionWrapper();
  }
  return instance;
}
