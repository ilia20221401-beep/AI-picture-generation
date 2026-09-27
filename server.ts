/**
 * AI Virtual Try-On - Full Stack Server
 *
 * Serves the React/Vite development/production preview on port 3000,
 * and provides the server-side Gemini Vision API proxy endpoint.
 *
 * For standalone PHP/XAMPP hosting, see the /ai-virtual-try-on directory.
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// High limits for handling high-resolution fashion images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve standalone PHP files statically so users can view or fetch them
app.use('/ai-virtual-try-on', express.static(path.join(__dirname, 'ai-virtual-try-on')));

// Initialize Google Gemini SDK on the server
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * Server-side Gemini Try-On Endpoint
 */
app.post('/api/tryon', async (req: Request, res: Response) => {
  try {
    const { personImage, clothingImage, garmentType, aspectRatio, instructions } = req.body;

    if (!personImage || !clothingImage) {
      return res.status(400).json({
        success: false,
        error: 'Missing required personImage or clothingImage data.',
      });
    }

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured on the server.',
        hint: 'Please configure GEMINI_API_KEY in the environment or secrets panel.',
      });
    }

    // Helper to extract MIME type and clean base64 data
    const parseBase64 = (dataUri: string) => {
      const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        return { mimeType: match[1], base64: match[2] };
      }
      return { mimeType: 'image/jpeg', base64: dataUri };
    };

    const personParsed = parseBase64(personImage);
    const clothingParsed = parseBase64(clothingImage);

    const garmentDesc = garmentType || 'clothing';
    const aspect = ['3:4', '1:1', '4:3', '9:16', '16:9'].includes(aspectRatio) ? aspectRatio : '3:4';

    const prompt = 
      `You are a professional fashion image editing and virtual try-on engine.\n\n` +
      `IMAGE 1 is the PERSON REFERENCE photo (the model/user).\n` +
      `IMAGE 2 is the CLOTHING REFERENCE photo (the ${garmentDesc} item).\n\n` +
      `TASK:\n` +
      `Generate a photorealistic, high-resolution image of the exact same person from Image 1 wearing the clothing item from Image 2.\n\n` +
      `CRITICAL REQUIREMENTS TO PRESERVE:\n` +
      `1. Person Identity: Strictly preserve the person's face, facial features, eyes, hair style/color, skin tone, body shape, proportions, and natural pose.\n` +
      `2. Garment Fidelity: Accurately transfer the clothing from Image 2 onto the person, matching its exact color, patterns, textile material, cut, collar, sleeves, hems, buttons, zipper, textures, and visible graphics/branding.\n` +
      `3. Realistic Physics & Lighting: The clothing must naturally wrap around the person's body with authentic fabric folds, natural tension creases, shadows, ambient lighting consistent with Image 1's scene, and proper occlusion.\n` +
      `4. Context: Preserve the background and ambient atmosphere of Image 1 wherever possible.\n` +
      `5. Do NOT modify the person's identity, age, or features.\n` +
      (instructions ? `\nADDITIONAL INSTRUCTION: ${instructions}\n` : '');

    // Call Google Gemini image model
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: personParsed.mimeType,
              data: personParsed.base64,
            },
          },
          {
            inlineData: {
              mimeType: clothingParsed.mimeType,
              data: clothingParsed.base64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspect,
        },
      },
    });

    let generatedImageUrl = '';
    let explanationText = '';

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          generatedImageUrl = `data:${mime};base64,${part.inlineData.data}`;
          break;
        }
        if (part.text) {
          explanationText += part.text + ' ';
        }
      }
    }

    if (generatedImageUrl) {
      return res.json({
        success: true,
        result_url: generatedImageUrl,
        message: 'Virtual try-on generated successfully!',
        model: 'gemini-3.1-flash-lite-image',
      });
    }

    return res.status(422).json({
      success: false,
      error: explanationText.trim() || 'The AI model responded without an image for this request.',
      hint: 'Ensure that the uploaded images clearly show a person and a garment item.',
    });
  } catch (error: any) {
    console.error('Try-on generation error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error while generating virtual try-on.',
    });
  }
});

// Start dev or production server
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
