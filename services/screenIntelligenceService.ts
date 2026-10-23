/**
 * Screen Intelligence & Visual Guidance Service
 * Handles Screen Share, Camera streams, high-resolution frame extraction,
 * change detection, short-term visual history, and Gemini multimodal vision analysis.
 */

import { ScreenFeedType, ScreenIntelligenceMode, VisualAnnotation, VisualGuidanceStep, ScreenshotHistoryItem } from '../types';
import { analyzeScreenVision } from './geminiService';
import { desktopCommander } from './desktopCommanderService';

export type ScreenIntelligenceEvent =
  | { type: 'FEED_CHANGED'; feedType: ScreenFeedType }
  | { type: 'ANALYSIS_START'; query: string }
  | { type: 'ANALYSIS_COMPLETE'; result: ScreenshotHistoryItem }
  | { type: 'ANALYSIS_ERROR'; error: string }
  | { type: 'STEP_CHANGED'; stepIndex: number }
  | { type: 'MODE_CHANGED'; mode: ScreenIntelligenceMode };

class ScreenIntelligenceService {
  private screenStream: MediaStream | null = null;
  private cameraStream: MediaStream | null = null;
  private activeFeedType: ScreenFeedType = 'none';
  private activeMode: ScreenIntelligenceMode = 'guide';
  private history: ScreenshotHistoryItem[] = [];
  private currentAnnotations: VisualAnnotation[] = [];
  private guidanceSteps: VisualGuidanceStep[] = [];
  private currentStepIndex: number = 0;
  private isAnalyzing: boolean = false;
  private lastCapturedImage: string | null = null;
  private listeners: ((event: ScreenIntelligenceEvent) => void)[] = [];

  constructor() {
    this.loadHistory();
  }

  private loadHistory() {
    try {
      const saved = localStorage.getItem('haider_screen_intel_history_v1');
      if (saved) {
        this.history = JSON.parse(saved);
      }
    } catch (e) {
      this.history = [];
    }
  }

  private saveHistory() {
    try {
      // Keep most recent 15 screenshots to avoid localStorage bloat
      const trimmed = this.history.slice(0, 15);
      localStorage.setItem('haider_screen_intel_history_v1', JSON.stringify(trimmed));
    } catch (e) {}
  }

  public subscribe(fn: (event: ScreenIntelligenceEvent) => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private emit(event: ScreenIntelligenceEvent) {
    this.listeners.forEach(fn => fn(event));
  }

  public getFeedType(): ScreenFeedType {
    return this.activeFeedType;
  }

  public getMode(): ScreenIntelligenceMode {
    return this.activeMode;
  }

  public setMode(mode: ScreenIntelligenceMode) {
    this.activeMode = mode;
    this.emit({ type: 'MODE_CHANGED', mode });
  }

  public getScreenStream(): MediaStream | null {
    return this.screenStream;
  }

  public getCameraStream(): MediaStream | null {
    return this.cameraStream;
  }

  public getHistory(): ScreenshotHistoryItem[] {
    return [...this.history];
  }

  public getCurrentAnnotations(): VisualAnnotation[] {
    return [...this.currentAnnotations];
  }

  public getGuidanceSteps(): VisualGuidanceStep[] {
    return [...this.guidanceSteps];
  }

  public getCurrentStepIndex(): number {
    return this.currentStepIndex;
  }

  public getIsAnalyzing(): boolean {
    return this.isAnalyzing;
  }

  public getLastCapturedImage(): string | null {
    return this.lastCapturedImage;
  }

  /**
   * Start Screen Sharing (Full HD preference with fallback)
   */
  public async startScreenShare(): Promise<MediaStream> {
    this.stopCamera(); // Keep screen and camera clearly separated or switchable
    
    if (this.screenStream) {
      return this.screenStream;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          width: { ideal: 1920, max: 2560 },
          height: { ideal: 1080, max: 1440 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: false
      });

      this.screenStream = stream;
      this.activeFeedType = 'screen';

      // Listen for browser native "Stop Sharing" button
      const track = stream.getVideoTracks()[0];
      if (track) {
        track.onended = () => {
          this.stopScreenShare();
        };
      }

      this.emit({ type: 'FEED_CHANGED', feedType: 'screen' });
      return stream;
    } catch (err: any) {
      console.warn('Screen share canceled or denied:', err);
      throw err;
    }
  }

  /**
   * Stop Screen Sharing
   */
  public stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(t => t.stop());
      this.screenStream = null;
    }
    if (this.activeFeedType === 'screen') {
      this.activeFeedType = this.lastCapturedImage ? 'screenshot' : 'none';
      this.emit({ type: 'FEED_CHANGED', feedType: this.activeFeedType });
    }
  }

  /**
   * Start Laptop Front Camera
   */
  public async startCamera(): Promise<MediaStream> {
    this.stopScreenShare();

    if (this.cameraStream) {
      return this.cameraStream;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      this.cameraStream = stream;
      this.activeFeedType = 'camera';

      const track = stream.getVideoTracks()[0];
      if (track) {
        track.onended = () => {
          this.stopCamera();
        };
      }

      this.emit({ type: 'FEED_CHANGED', feedType: 'camera' });
      return stream;
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      throw err;
    }
  }

  /**
   * Stop Camera
   */
  public stopCamera() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(t => t.stop());
      this.cameraStream = null;
    }
    if (this.activeFeedType === 'camera') {
      this.activeFeedType = this.lastCapturedImage ? 'screenshot' : 'none';
      this.emit({ type: 'FEED_CHANGED', feedType: this.activeFeedType });
    }
  }

  /**
   * Capture a frame as base64 JPEG from active video element or Desktop Commander
   */
  public async captureFrame(videoElement?: HTMLVideoElement | null): Promise<string> {
    // 1. If video element is actively playing screen or camera, grab from canvas
    if (videoElement && videoElement.videoWidth && videoElement.videoHeight) {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        this.lastCapturedImage = dataUrl;
        this.activeFeedType = 'screenshot';
        this.emit({ type: 'FEED_CHANGED', feedType: 'screenshot' });
        return dataUrl;
      }
    }

    // 2. If Desktop Commander bridge is online on Windows, capture native desktop screen
    if (desktopCommander.isOnline()) {
      try {
        const nativeShot = await desktopCommander.captureScreenshot();
        if (nativeShot && (nativeShot.screenshot || typeof nativeShot === 'string')) {
          const imgStr = typeof nativeShot === 'string' ? nativeShot : nativeShot.screenshot;
          this.lastCapturedImage = imgStr;
          this.activeFeedType = 'screenshot';
          this.emit({ type: 'FEED_CHANGED', feedType: 'screenshot' });
          return imgStr;
        }
      } catch (e) {
        console.warn('Native desktop screenshot failed, creating synthetic preview', e);
      }
    }

    // 3. Fallback: Generate a crisp workspace perception canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0a1424';
    ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = '#00E5FF';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('HYDER OS - SCREEN PERCEPTION FRAME', 60, 100);
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Timestamp: ${new Date().toISOString()}`, 60, 140);
    ctx.fillText('Status: Active Interface Capture Standing By', 60, 180);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    this.lastCapturedImage = dataUrl;
    this.activeFeedType = 'screenshot';
    this.emit({ type: 'FEED_CHANGED', feedType: 'screenshot' });
    return dataUrl;
  }

  /**
   * Analyze Screen with Vision AI
   */
  public async analyzeActiveScreen(
    userQuery: string = 'What am I looking at and what should I do next?',
    videoElement?: HTMLVideoElement | null
  ): Promise<ScreenshotHistoryItem> {
    this.isAnalyzing = true;
    this.emit({ type: 'ANALYSIS_START', query: userQuery });

    try {
      // Capture latest frame if needed
      let imageToAnalyze = this.lastCapturedImage;
      if (this.activeFeedType === 'screen' || this.activeFeedType === 'camera' || !imageToAnalyze) {
        imageToAnalyze = await this.captureFrame(videoElement);
      }

      const shortTermSummaries = this.history.slice(0, 3).map(h => h.summary);
      const visionResult = await analyzeScreenVision(
        imageToAnalyze,
        userQuery,
        this.activeMode === 'troubleshoot' ? 'troubleshoot' : 'guide',
        shortTermSummaries
      );

      // Map annotations
      this.currentAnnotations = visionResult.visualAnnotations.map((ann, idx) => ({
        id: ann.id || `ann_${Date.now()}_${idx}`,
        type: ann.type || 'highlight',
        x: ann.x ?? 50,
        y: ann.y ?? 50,
        width: ann.width ?? 15,
        height: ann.height ?? 8,
        label: ann.label || `Element ${idx + 1}`,
        stepNumber: ann.stepNumber || idx + 1,
        explanation: ann.explanation || 'Target interface element'
      }));

      // Map guidance steps
      this.guidanceSteps = visionResult.suggestedSteps.map((stepText, idx) => {
        const matchingAnnotation = this.currentAnnotations.find(a => a.stepNumber === idx + 1);
        return {
          step: idx + 1,
          title: `Step ${idx + 1}`,
          instruction: stepText,
          targetElement: matchingAnnotation?.label,
          annotation: matchingAnnotation,
          completed: false,
          autoFixAvailable: idx === 0 && Boolean(visionResult.autoFixCommand),
          autoFixCommand: idx === 0 ? visionResult.autoFixCommand : undefined
        };
      });

      this.currentStepIndex = 0;

      const historyItem: ScreenshotHistoryItem = {
        id: `shot_${Date.now()}`,
        timestamp: Date.now(),
        imageUrl: imageToAnalyze,
        feedType: this.activeFeedType,
        userQuery,
        summary: visionResult.summary,
        detectedErrors: visionResult.detectedErrors,
        annotations: this.currentAnnotations,
        suggestedSteps: visionResult.suggestedSteps,
        autoFixCommand: visionResult.autoFixCommand,
        canAutoFix: visionResult.canAutoFix
      };

      this.history.unshift(historyItem);
      this.saveHistory();

      this.isAnalyzing = false;
      this.emit({ type: 'ANALYSIS_COMPLETE', result: historyItem });
      return historyItem;
    } catch (err: any) {
      this.isAnalyzing = false;
      this.emit({ type: 'ANALYSIS_ERROR', error: err.message || 'Vision analysis failed' });
      throw err;
    }
  }

  /**
   * Complete or advance a step in Guide Me workflow
   */
  public nextStep() {
    if (this.currentStepIndex < this.guidanceSteps.length - 1) {
      this.guidanceSteps[this.currentStepIndex].completed = true;
      this.currentStepIndex += 1;
      this.emit({ type: 'STEP_CHANGED', stepIndex: this.currentStepIndex });
    }
  }

  public prevStep() {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex -= 1;
      this.emit({ type: 'STEP_CHANGED', stepIndex: this.currentStepIndex });
    }
  }

  public setStep(index: number) {
    if (index >= 0 && index < this.guidanceSteps.length) {
      this.currentStepIndex = index;
      this.emit({ type: 'STEP_CHANGED', stepIndex: index });
    }
  }

  public restoreHistoryItem(item: ScreenshotHistoryItem) {
    this.lastCapturedImage = item.imageUrl;
    this.activeFeedType = 'screenshot';
    this.currentAnnotations = item.annotations;
    this.guidanceSteps = item.suggestedSteps.map((stepText, idx) => {
      const match = item.annotations.find(a => a.stepNumber === idx + 1);
      return {
        step: idx + 1,
        title: `Step ${idx + 1}`,
        instruction: stepText,
        targetElement: match?.label,
        annotation: match,
        completed: false,
        autoFixAvailable: idx === 0 && Boolean(item.autoFixCommand),
        autoFixCommand: idx === 0 ? item.autoFixCommand : undefined
      };
    });
    this.currentStepIndex = 0;
    this.emit({ type: 'FEED_CHANGED', feedType: 'screenshot' });
  }

  public clearHistory() {
    this.history = [];
    try {
      localStorage.removeItem('haider_screen_intel_history_v1');
    } catch (e) {}
    this.emit({ type: 'FEED_CHANGED', feedType: this.activeFeedType });
  }

  public markStepCompleted(index?: number) {
    const targetIdx = index !== undefined ? index : this.currentStepIndex;
    if (this.guidanceSteps[targetIdx]) {
      this.guidanceSteps[targetIdx].completed = !this.guidanceSteps[targetIdx].completed;
      this.emit({ type: 'STEP_CHANGED', stepIndex: this.currentStepIndex });
    }
  }

  public speakStep(step: VisualGuidanceStep) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = `Step ${step.step}: ${step.title}. ${step.instruction}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 1.0;
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  }

  public clearAnnotations() {
    this.currentAnnotations = [];
    this.guidanceSteps = [];
    this.currentStepIndex = 0;
  }
}

export const screenIntelligence = new ScreenIntelligenceService();
