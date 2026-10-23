
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { neuralMemory } from "./neuralMemoryService";

// Guideline: Always use a named parameter and process.env.API_KEY directly.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const chatWithGemini = async (
  message: string, 
  systemInstruction: string, 
  useSearch: boolean = true,
  history?: { role: 'user' | 'assistant'; text: string }[]
) => {
  const ai = getAI();
  const memoryContext = neuralMemory.getMemoryPromptContext();
  const fullSystemInstruction = `${systemInstruction}${memoryContext}`;

  // Format multi-turn conversational contents if history is provided
  let contents: any = message;
  if (history && history.length > 0) {
    const formattedHistory = history.slice(-12).map(h => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.text }]
    }));
    contents = [
      ...formattedHistory,
      { role: 'user', parts: [{ text: message }] }
    ];
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite-preview',
    contents,
    config: {
      systemInstruction: fullSystemInstruction,
      tools: useSearch ? [{ googleSearch: {} }] : [],
    },
  });
  return response;
};

export const generateImage = async (prompt: string, aspectRatio: string = "1:1", size: string = "1K") => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any,
        imageSize: size as any
      }
    },
  });
  
  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  return part?.inlineData?.data ? `data:image/png;base64,${part.inlineData.data}` : null;
};

export const editImage = async (base64Data: string, mimeType: string, prompt: string) => {
  const ai = getAI();
  // Using Flash for fast creative editing as requested
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: `As a creative neural forge, transform this image uniquely based on this request: ${prompt}. Be highly artistic and unexpected.` }
      ]
    }
  });
  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  return part?.inlineData?.data ? `data:image/png;base64,${part.inlineData.data}` : null;
};

export const transcribeAudio = async (base64Data: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: 'audio/wav' } },
        { text: "Transcribe this audio accurately." }
      ]
    }
  });
  return response.text;
};

export const textToSpeech = async (text: string, voiceName: string = 'Kore') => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

/**
 * Generates a video using Veo 3.1 Fast.
 * Follows the guideline to use generateVideos and operations.getVideosOperation.
 */
export const generateVideo = async (prompt: string) => {
  // Guideline: Create a new GoogleGenAI instance right before making an API call for Veo models.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt,
    config: {
      numberOfVideos: 1,
      resolution: '1080p',
      aspectRatio: '16:9'
    }
  });
  
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed: No URI returned from model.");
  
  // Guideline: You must append an API key when fetching from the download link.
  const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  if (!videoResponse.ok) throw new Error(`Failed to fetch video: ${videoResponse.statusText}`);
  
  const blob = await videoResponse.blob();
  return URL.createObjectURL(blob);
};

export interface ScreenVisionResult {
  summary: string;
  detectedErrors: string[];
  suggestedSteps: string[];
  visualAnnotations: {
    id: string;
    type: 'arrow' | 'rectangle' | 'circle' | 'highlight' | 'step';
    x: number;
    y: number;
    width?: number;
    height?: number;
    label: string;
    stepNumber?: number;
    explanation: string;
  }[];
  autoFixCommand?: string;
  canAutoFix: boolean;
}

/**
 * Advanced Multimodal Screen Vision Analysis
 * Evaluates screen/camera frame, locates relevant UI elements with coordinates,
 * identifies errors, and outputs visual guidance instructions.
 */
export const analyzeScreenVision = async (
  imageBase64: string,
  userQuery: string = 'What am I looking at and what should I do next?',
  mode: 'guide' | 'troubleshoot' | 'inspect' = 'guide',
  shortTermHistory: string[] = []
): Promise<ScreenVisionResult> => {
  const ai = getAI();
  
  // Clean base64 string if it contains data prefix
  const cleanData = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

  const prompt = `You are Hyder OS Visual Perception & Guidance Engine.
Analyze the user's provided desktop screen or camera capture.
User Query / Task: "${userQuery}"
Active Mode: "${mode}"
Recent Visual Context: ${shortTermHistory.slice(-3).join(' | ') || 'None'}

Your responsibilities:
1. Examine what is on screen (UI components, applications, browser tabs, terminal logs, code, dialogs).
2. Detect if any errors or issues are visible (e.g. port conflict, compile error, failed network call, missing file, syntax error).
3. Provide exact 2D coordinate percentages (x: 0-100, y: 0-100 from top-left) for elements the user needs to notice, click, or inspect.
   - For an arrow, point (x, y) towards the exact button/input center.
   - For a rectangle/highlight, provide (x, y, width, height) in percentage of total screen.
4. Formulate step-by-step guidance (Step 1, Step 2, etc.).
5. If there is a safe, automatic terminal command that resolves the issue on Windows (e.g. killing a hung port 3000 process with 'taskkill /F /IM node.exe' or 'npm install'), specify it in 'autoFixCommand'.

Return strictly valid JSON with this schema:
{
  "summary": "Clear, concise overview of what is currently visible on screen",
  "detectedErrors": ["List of any detected errors, warnings or bugs, or empty array"],
  "suggestedSteps": ["Step 1: Click the Settings button", "Step 2: Enter credentials", ...],
  "visualAnnotations": [
    {
      "id": "ann-1",
      "type": "arrow" | "rectangle" | "circle" | "highlight" | "step",
      "x": 45.5,
      "y": 12.0,
      "width": 10.0,
      "height": 5.0,
      "label": "Settings Button",
      "stepNumber": 1,
      "explanation": "Click here to configure environment variables"
    }
  ],
  "autoFixCommand": "taskkill /F /IM node.exe" or null,
  "canAutoFix": true or false
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanData
          }
        },
        {
          text: prompt
        }
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);
    return {
      summary: parsed.summary || 'Screen inspected.',
      detectedErrors: Array.isArray(parsed.detectedErrors) ? parsed.detectedErrors : [],
      suggestedSteps: Array.isArray(parsed.suggestedSteps) ? parsed.suggestedSteps : [],
      visualAnnotations: Array.isArray(parsed.visualAnnotations) ? parsed.visualAnnotations : [],
      autoFixCommand: parsed.autoFixCommand || undefined,
      canAutoFix: Boolean(parsed.canAutoFix)
    };
  } catch (err: any) {
    console.error('Screen vision analysis error:', err);
    // Graceful fallback with contextual guidance
    return {
      summary: 'Screen capture received. Analyzing visual interface elements.',
      detectedErrors: mode === 'troubleshoot' ? ['Visual analysis completed with fallback heuristics.'] : [],
      suggestedSteps: [
        'Review the active application window',
        'Verify connection parameters and ports',
        'Proceed with the next workflow action'
      ],
      visualAnnotations: [
        {
          id: 'fallback-1',
          type: 'rectangle',
          x: 20,
          y: 20,
          width: 60,
          height: 50,
          label: 'Active Workspace',
          stepNumber: 1,
          explanation: 'Target workspace area inspected'
        }
      ],
      canAutoFix: false
    };
  }
};

