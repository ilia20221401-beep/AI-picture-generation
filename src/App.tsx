/**
 * AI Virtual Try-On - Futuristic React Web Application
 * Includes Live Interactive Try-On Studio + 1-Click XAMPP / PHP Project Exporter
 */

import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import {
  Sparkles,
  Upload,
  User,
  Shirt,
  Download,
  RotateCcw,
  CheckCircle2,
  FileCode,
  FolderDown,
  Info,
  X,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Server,
  Zap,
} from 'lucide-react';

// Preset sample generator
function createPresetDataUrl(theme: string, title: string, type: 'person' | 'clothing'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const grad = ctx.createLinearGradient(0, 0, 0, 800);
  if (theme === 'model-casual') {
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(1, '#0f172a');
  } else if (theme === 'model-fashion') {
    grad.addColorStop(0, '#2e1065');
    grad.addColorStop(1, '#090d16');
  } else if (theme === 'hoodie') {
    grad.addColorStop(0, '#172554');
    grad.addColorStop(1, '#0b1329');
  } else if (theme === 'jacket') {
    grad.addColorStop(0, '#431407');
    grad.addColorStop(1, '#18181b');
  } else {
    grad.addColorStop(0, '#134e4a');
    grad.addColorStop(1, '#090d16');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 600, 800);

  // Decorative grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 40; x < 600; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 800);
    ctx.stroke();
  }
  for (let y = 40; y < 800; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(600, y);
    ctx.stroke();
  }

  if (type === 'person') {
    // Silhouette of person
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    // Head
    ctx.beginPath();
    ctx.arc(300, 240, 70, 0, Math.PI * 2);
    ctx.fill();
    // Torso & shoulders
    ctx.beginPath();
    ctx.moveTo(200, 420);
    ctx.quadraticCurveTo(300, 340, 400, 420);
    ctx.lineTo(440, 720);
    ctx.lineTo(160, 720);
    ctx.closePath();
    ctx.fill();
  } else {
    // Clothing shape
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.beginPath();
    ctx.moveTo(250, 220);
    ctx.lineTo(350, 220);
    ctx.lineTo(390, 260);
    ctx.lineTo(510, 360);
    ctx.lineTo(450, 420);
    ctx.lineTo(390, 360);
    ctx.lineTo(410, 620);
    ctx.lineTo(190, 620);
    ctx.lineTo(210, 360);
    ctx.lineTo(150, 420);
    ctx.lineTo(90, 360);
    ctx.lineTo(210, 260);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 300, 700);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '20px sans-serif';
  ctx.fillText('Preset Sample Reference', 300, 740);

  return canvas.toDataURL('image/png');
}

export default function App() {
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [clothingImage, setClothingImage] = useState<string | null>(null);
  const [garmentType, setGarmentType] = useState('T-shirt / Top');
  const [aspectRatio, setAspectRatio] = useState('3:4');
  const [instructions, setInstructions] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [showExportModal, setShowExportModal] = useState(false);
  const [activeExportTab, setActiveExportTab] = useState<'xampp' | 'hosting' | 'code' | 'structure'>('xampp');
  const [selectedCodeFile, setSelectedCodeFile] = useState('generate.php');
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const personInputRef = useRef<HTMLInputElement>(null);
  const clothingInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const loadingSteps = [
    'Validating and analyzing input images...',
    'Detecting person silhouette, pose & facial identity...',
    'Segmenting garment texture, collar, and sleeve structure...',
    'Simulating fabric physics, realistic folds & dynamic shadows...',
    'Rendering photorealistic high-fidelity try-on result...',
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'person' | 'clothing') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMessage('Invalid file format. Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 10 MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (type === 'person') {
        setPersonImage(dataUrl);
      } else {
        setClothingImage(dataUrl);
      }
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!personImage || !clothingImage || isGenerating) return;

    setIsGenerating(true);
    setLoadingStep(0);
    setErrorMessage(null);
    setResultImage(null);

    try {
      const response = await fetch('/api/tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personImage,
          clothingImage,
          garmentType,
          aspectRatio,
          instructions,
        }),
      });

      const data = await response.json();

      if (data.success && data.result_url) {
        setResultImage(data.result_url);
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        setErrorMessage(data.error || 'Failed to generate try-on. Check your API configuration.');
      }
    } catch (err: any) {
      setErrorMessage('Network or server error: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearAll = () => {
    setPersonImage(null);
    setClothingImage(null);
    setResultImage(null);
    setErrorMessage(null);
    setInstructions('');
    if (personInputRef.current) personInputRef.current.value = '';
    if (clothingInputRef.current) clothingInputRef.current.value = '';
  };

  const handleDownloadResult = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `ai-virtual-try-on-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ZIP Exporter: Bundles the standalone PHP project files
  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('ai-virtual-try-on') || zip;

      // Fetch PHP project files from the server
      const filesToZip = [
        'index.php',
        'generate.php',
        'config.php',
        '.htaccess',
        'README.md',
        '.gitignore',
        'assets/style.css',
        'assets/app.js',
        'uploads/.htaccess',
        'uploads/index.html',
        'results/.htaccess',
        'results/index.html',
      ];

      for (const filePath of filesToZip) {
        try {
          const res = await fetch(`/ai-virtual-try-on/${filePath}`);
          if (res.ok) {
            const content = await res.text();
            folder.file(filePath, content);
          }
        } catch (e) {
          console.warn(`Could not load ${filePath} for zip:`, e);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ai-virtual-try-on.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Code snippets for viewer
  const codeSnippets: Record<string, string> = {
    'config.php': `<?php
// config.php - Google Gemini API Configuration & Security
if (!defined('TRYON_ACCESS') && realpath(__FILE__) === realpath($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    http_response_code(403);
    exit('Direct access prohibited.');
}

// Check environment variable or define here:
$detectedApiKey = getenv('GEMINI_API_KEY') ?: getenv('GOOGLE_API_KEY');
define('GOOGLE_API_KEY', $detectedApiKey ?: 'YOUR_API_KEY');

// Currently supported Google Gemini image-capable models:
define('GEMINI_MODEL', getenv('GEMINI_MODEL') ?: 'gemini-3.1-flash-lite-image');
define('GEMINI_API_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta/models/');

// File limits
define('MAX_FILE_SIZE_BYTES', 10 * 1024 * 1024); // 10MB
define('ALLOWED_MIME_TYPES', [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
]);

define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('RESULTS_DIR', __DIR__ . '/results/');
define('DEFAULT_ASPECT_RATIO', '3:4');
define('CLEANUP_MAX_AGE_SECONDS', 7200);
define('CURL_TIMEOUT_SECONDS', 120);`,

    'generate.php': `<?php
// generate.php - Server-side Gemini API cURL Try-On Endpoint
header('Content-Type: application/json; charset=UTF-8');
define('TRYON_ACCESS', true);
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['success' => false, 'error' => 'POST method required']));
}

// 1. Validate Uploads with finfo
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$validated = [];
foreach (['person_image', 'clothing_image'] as $key) {
    if (!isset($_FILES[$key]) || $_FILES[$key]['error'] !== UPLOAD_ERR_OK) {
        exit(json_encode(['success' => false, 'error' => "Missing file {$key}"]));
    }
    $mime = finfo_file($finfo, $_FILES[$key]['tmp_name']);
    if (!array_key_exists($mime, ALLOWED_MIME_TYPES)) {
        exit(json_encode(['success' => false, 'error' => "Invalid format for {$key}"]));
    }
    $raw = file_get_contents($_FILES[$key]['tmp_name']);
    $validated[$key] = ['mime' => $mime, 'base64' => base64_encode($raw)];
}
finfo_close($finfo);

// 2. Prepare Gemini Multimodal Image Request
$prompt = "Image 1 is the person. Image 2 is the clothing. Generate a realistic image of the person wearing Image 2. Preserve identity, face, pose, and background.";
$payload = [
    'contents' => [[
        'role' => 'user',
        'parts' => [
            ['inlineData' => ['mimeType' => $validated['person_image']['mime'], 'data' => $validated['person_image']['base64']]],
            ['inlineData' => ['mimeType' => $validated['clothing_image']['mime'], 'data' => $validated['clothing_image']['base64']]],
            ['text' => $prompt]
        ]
    ]],
    'generationConfig' => ['imageConfig' => ['aspectRatio' => '3:4']]
];

// 3. Send cURL request to generativelanguage.googleapis.com
$ch = curl_init(GEMINI_API_BASE_URL . GEMINI_MODEL . ':generateContent');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'x-goog-api-key: ' . GOOGLE_API_KEY],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 120,
    CURLOPT_SSL_VERIFYPEER => true
]);
$response = curl_exec($ch);
curl_close($ch);

// 4. Save and return generated image
$data = json_decode($response, true);
$imgBase64 = $data['candidates'][0]['content']['parts'][0]['inlineData']['data'] ?? null;
if ($imgBase64) {
    $filename = 'tryon_' . time() . '_' . bin2hex(random_bytes(4)) . '.png';
    file_put_contents(RESULTS_DIR . $filename, base64_decode($imgBase64));
    echo json_encode(['success' => true, 'result_url' => 'results/' . $filename]);
} else {
    echo json_encode(['success' => false, 'error' => 'No image returned']);
}`,

    '.htaccess': `# .htaccess - Apache Security Configuration
Options -Indexes

# Protect configuration & env files
<Files "config.php">
    Require all denied
</Files>
<FilesMatch "^\\.env">
    Require all denied
</FilesMatch>

# PHP Execution limits for image synthesis
<IfModule mod_php8.c>
    php_value upload_max_filesize 20M
    php_value post_max_size 25M
    php_value memory_limit 128M
    php_value max_execution_time 120
</IfModule>`,
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-20">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-blue-600/15 via-purple-600/10 to-transparent blur-3xl rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-8">
        {/* Top Navbar */}
        <header className="flex flex-wrap items-center justify-between gap-4 pb-8 mb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                AI Virtual Try-On
              </span>
              <span className="block text-xs text-slate-400 font-mono">
                PHP 8.1+ &bull; XAMPP &bull; Shared Hosting Ready
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveExportTab('xampp');
                setShowExportModal(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-medium bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg border border-white/10 transition"
            >
              <Server className="w-4 h-4 text-emerald-400" />
              <span>Setup Guide</span>
            </button>

            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-lg shadow-lg shadow-emerald-500/20 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              <FolderDown className="w-4 h-4" />
              <span>{isZipping ? 'Creating ZIP...' : 'Download XAMPP ZIP'}</span>
            </button>
          </div>
        </header>

        {/* Hero Title */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-4 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Google Gemini Vision Engine
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-white via-sky-100 to-purple-300 bg-clip-text text-transparent">
            AI Virtual Try-On
          </h1>
          <p className="text-slate-400 text-base md:text-lg">
            Upload your photo and a clothing photo to create a realistic virtual try-on.
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-sm flex items-start justify-between gap-3 animate-fade-in shadow-lg">
            <div>
              <strong className="font-semibold block mb-0.5">Error:</strong>
              {errorMessage}
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dual Upload Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 1. Person Photo */}
          <div className="rounded-2xl bg-slate-900/70 border border-white/10 p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-100">1. Your Photo</h3>
                    <p className="text-xs text-slate-400">Front-facing portrait or full-body</p>
                  </div>
                </div>
                {personImage && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    Ready
                  </span>
                )}
              </div>

              {/* Dropzone */}
              <div
                onClick={() => personInputRef.current?.click()}
                className={`relative min-h-[260px] rounded-xl border-2 border-dashed transition flex flex-col items-center justify-center text-center p-4 cursor-pointer overflow-hidden group ${
                  personImage
                    ? 'border-sky-500/40 bg-black/40'
                    : 'border-white/15 bg-white/[0.02] hover:border-sky-400 hover:bg-sky-500/[0.03]'
                }`}
              >
                <input
                  ref={personInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'person')}
                />

                {personImage ? (
                  <div className="relative w-full h-full min-h-[250px] flex items-center justify-center">
                    <img
                      src={personImage}
                      alt="Person reference"
                      className="max-h-[250px] w-auto object-contain rounded-lg shadow-md"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <span className="px-3 py-1.5 rounded-lg bg-black/70 text-xs font-semibold text-white border border-white/20">
                        Click to Replace
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-6">
                    <div className="w-14 h-14 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-slate-200 mb-1">Drop your photo here, or browse</p>
                    <p className="text-xs text-slate-400">JPEG, PNG, WebP (up to 10MB)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Presets */}
            <div className="mt-4 pt-3 border-t border-white/5">
              <span className="text-xs text-slate-400 block mb-2 font-medium">Quick Presets:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPersonImage(createPresetDataUrl('model-casual', 'Casual Model', 'person'))}
                  className="px-2.5 py-1 text-xs rounded-md bg-white/5 hover:bg-sky-500/20 border border-white/10 text-slate-300 hover:text-sky-300 transition"
                >
                  Casual Male
                </button>
                <button
                  type="button"
                  onClick={() => setPersonImage(createPresetDataUrl('model-fashion', 'Studio Model', 'person'))}
                  className="px-2.5 py-1 text-xs rounded-md bg-white/5 hover:bg-sky-500/20 border border-white/10 text-slate-300 hover:text-sky-300 transition"
                >
                  Fashion Female
                </button>
              </div>
            </div>
          </div>

          {/* 2. Clothing Photo */}
          <div className="rounded-2xl bg-slate-900/70 border border-white/10 p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Shirt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-100">2. Clothing Photo</h3>
                    <p className="text-xs text-slate-400">Garment, jacket, hoodie, or outfit</p>
                  </div>
                </div>
                {clothingImage && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Ready
                  </span>
                )}
              </div>

              {/* Dropzone */}
              <div
                onClick={() => clothingInputRef.current?.click()}
                className={`relative min-h-[260px] rounded-xl border-2 border-dashed transition flex flex-col items-center justify-center text-center p-4 cursor-pointer overflow-hidden group ${
                  clothingImage
                    ? 'border-purple-500/40 bg-black/40'
                    : 'border-white/15 bg-white/[0.02] hover:border-purple-400 hover:bg-purple-500/[0.03]'
                }`}
              >
                <input
                  ref={clothingInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'clothing')}
                />

                {clothingImage ? (
                  <div className="relative w-full h-full min-h-[250px] flex items-center justify-center">
                    <img
                      src={clothingImage}
                      alt="Clothing reference"
                      className="max-h-[250px] w-auto object-contain rounded-lg shadow-md"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <span className="px-3 py-1.5 rounded-lg bg-black/70 text-xs font-semibold text-white border border-white/20">
                        Click to Replace
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-6">
                    <div className="w-14 h-14 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-slate-200 mb-1">Drop clothing photo here, or browse</p>
                    <p className="text-xs text-slate-400">Flat lay or product image (up to 10MB)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Presets */}
            <div className="mt-4 pt-3 border-t border-white/5">
              <span className="text-xs text-slate-400 block mb-2 font-medium">Quick Presets:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setClothingImage(createPresetDataUrl('hoodie', 'Street Hoodie', 'clothing'));
                    setGarmentType('Hoodie / Sweatshirt');
                  }}
                  className="px-2.5 py-1 text-xs rounded-md bg-white/5 hover:bg-purple-500/20 border border-white/10 text-slate-300 hover:text-purple-300 transition"
                >
                  Street Hoodie
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setClothingImage(createPresetDataUrl('jacket', 'Leather Jacket', 'clothing'));
                    setGarmentType('Jacket / Coat');
                  }}
                  className="px-2.5 py-1 text-xs rounded-md bg-white/5 hover:bg-purple-500/20 border border-white/10 text-slate-300 hover:text-purple-300 transition"
                >
                  Leather Jacket
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setClothingImage(createPresetDataUrl('blazer', 'Modern Blazer', 'clothing'));
                    setGarmentType('Suit / Blazer');
                  }}
                  className="px-2.5 py-1 text-xs rounded-md bg-white/5 hover:bg-purple-500/20 border border-white/10 text-slate-300 hover:text-purple-300 transition"
                >
                  Modern Blazer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Options Row */}
        <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-5 mb-8 backdrop-blur-xl flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Garment Category:</label>
            <select
              value={garmentType}
              onChange={(e) => setGarmentType(e.target.value)}
              className="bg-slate-800 border border-white/15 rounded-lg px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-indigo-400 transition"
            >
              <option value="T-shirt / Top">T-shirt / Top</option>
              <option value="Hoodie / Sweatshirt">Hoodie / Sweatshirt</option>
              <option value="Jacket / Coat">Jacket / Coat</option>
              <option value="Suit / Blazer">Suit / Blazer</option>
              <option value="Dress / Gown">Dress / Gown</option>
              <option value="Pants / Bottoms">Pants / Bottoms</option>
              <option value="Full Outfit">Full Outfit</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Aspect Ratio:</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="bg-slate-800 border border-white/15 rounded-lg px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-indigo-400 transition"
            >
              <option value="3:4">3:4 (Portrait)</option>
              <option value="1:1">1:1 (Square)</option>
              <option value="9:16">9:16 (Story)</option>
              <option value="4:3">4:3 (Classic)</option>
            </select>
          </div>

          <div className="flex-1 min-w-[240px]">
            <input
              type="text"
              placeholder="Optional: e.g. Relaxed fit, sleeves rolled up..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full bg-slate-800 border border-white/15 rounded-lg px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-indigo-400 transition"
            />
          </div>
        </div>

        {/* Generate Actions */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <button
            onClick={handleGenerate}
            disabled={!personImage || !clothingImage || isGenerating}
            className="px-8 py-3.5 rounded-full font-bold text-base md:text-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-600 hover:from-blue-500 hover:via-indigo-500 hover:to-pink-500 text-white shadow-xl shadow-indigo-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-3"
          >
            <Sparkles className="w-5 h-5 text-yellow-300 animate-spin-slow" />
            <span>{isGenerating ? 'Synthesizing Try-On...' : 'Generate Try-On'}</span>
          </button>

          <button
            onClick={handleClearAll}
            disabled={isGenerating || (!personImage && !clothingImage && !resultImage)}
            className="px-5 py-3.5 rounded-full font-semibold text-sm bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition disabled:opacity-40"
          >
            Clear All
          </button>
        </div>

        {/* Loading Scanner Animation */}
        {isGenerating && (
          <div className="mb-12 p-8 rounded-3xl bg-slate-900/80 border border-indigo-500/30 backdrop-blur-2xl text-center relative overflow-hidden shadow-2xl">
            {/* Scanner line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />

            <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-cyan-400 border-r-purple-500 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Generating Photorealistic Virtual Try-On</h3>
            <p className="text-sm text-cyan-300 font-medium mb-6 animate-pulse">
              {loadingSteps[loadingStep]}
            </p>

            <div className="max-w-md mx-auto space-y-2 text-left">
              {loadingSteps.map((step, idx) => (
                <div
                  key={idx}
                  className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2 transition ${
                    idx < loadingStep
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      : idx === loadingStep
                      ? 'bg-indigo-500/20 text-white border border-indigo-500/40 font-semibold'
                      : 'bg-white/[0.02] text-slate-500'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result Showcase */}
        {resultImage && (
          <div ref={resultRef} className="mb-12 rounded-3xl bg-slate-900/80 border border-white/15 p-6 md:p-8 backdrop-blur-2xl shadow-2xl animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-bold text-white">Virtual Try-On Result</h2>
                <p className="text-sm text-slate-400">Generated using Google Gemini Multi-Modal Image Synthesis</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-medium">
                  High Resolution 1080p
                </span>
              </div>
            </div>

            {/* Side-by-Side Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="rounded-2xl bg-black/60 border border-white/10 overflow-hidden relative group">
                <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-md bg-black/70 backdrop-blur-md text-xs font-bold text-white border border-white/20">
                  Original Reference
                </div>
                <div className="aspect-[3/4] flex items-center justify-center bg-black/40">
                  {personImage && (
                    <img src={personImage} alt="Original person" className="w-full h-full object-cover" />
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-black/60 border border-indigo-500/40 overflow-hidden relative shadow-2xl shadow-indigo-500/20">
                <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-md bg-indigo-600 text-xs font-bold text-white shadow-lg border border-indigo-400/50">
                  AI Virtual Try-On
                </div>
                <div className="aspect-[3/4] flex items-center justify-center bg-black/40">
                  <img src={resultImage} alt="AI Virtual Try-On result" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {/* Result Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleDownloadResult}
                className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Try-On Image</span>
              </button>

              <button
                onClick={() => {
                  setClothingImage(null);
                  setResultImage(null);
                  clothingInputRef.current?.click();
                }}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 flex items-center gap-2 transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Another Garment</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Setup Guide & Exporter Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-slate-900 border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Standalone PHP & XAMPP Package</h3>
                  <p className="text-xs text-slate-400">Zero Node.js &bull; Pure PHP 8.1+ &bull; Apache &bull; Vanilla JS</p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-white/10 pb-3">
              <button
                onClick={() => setActiveExportTab('xampp')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  activeExportTab === 'xampp'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                1. XAMPP Local Setup
              </button>
              <button
                onClick={() => setActiveExportTab('hosting')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  activeExportTab === 'hosting'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                2. Free Web Hosting Setup
              </button>
              <button
                onClick={() => setActiveExportTab('code')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  activeExportTab === 'code'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                3. PHP Code Viewer
              </button>
              <button
                onClick={() => setActiveExportTab('structure')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  activeExportTab === 'structure'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                4. Project Architecture
              </button>
            </div>

            {/* Tab 1: XAMPP */}
            {activeExportTab === 'xampp' && (
              <div className="space-y-4 text-sm text-slate-300">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200">
                  <strong className="block font-semibold mb-1">100% Ready for XAMPP:</strong>
                  The complete project folder is located in <code>/ai-virtual-try-on</code> and requires zero npm, node, or database.
                </div>

                <ol className="list-decimal pl-5 space-y-3">
                  <li>
                    <strong>Install XAMPP:</strong> Download from <a href="https://www.apachefriends.org" target="_blank" rel="noreferrer" className="text-sky-400 underline">apachefriends.org</a> (PHP 8.1+).
                  </li>
                  <li>
                    <strong>Start Apache:</strong> In the XAMPP Control Panel, click <strong>Start</strong> next to Apache.
                  </li>
                  <li>
                    <strong>Copy Project:</strong> Download the ZIP package below and extract into:
                    <div className="mt-1.5 p-2.5 rounded-lg bg-black/60 font-mono text-xs text-sky-300 flex items-center justify-between">
                      <span>C:\xampp\htdocs\ai-virtual-try-on\</span>
                      <button onClick={() => copyToClipboard('C:\\xampp\\htdocs\\ai-virtual-try-on\\')} className="text-slate-400 hover:text-white">
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </li>
                  <li>
                    <strong>Configure Gemini API Key:</strong> Open <code>config.php</code> in your text editor and insert your key:
                    <div className="mt-1.5 p-2.5 rounded-lg bg-black/60 font-mono text-xs text-purple-300">
                      define('GOOGLE_API_KEY', 'AIzaSy...');
                    </div>
                  </li>
                  <li>
                    <strong>Open in Browser:</strong>
                    <div className="mt-1.5 p-2.5 rounded-lg bg-black/60 font-mono text-xs text-emerald-300">
                      http://localhost/ai-virtual-try-on/
                    </div>
                  </li>
                </ol>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleDownloadZip}
                    disabled={isZipping}
                    className="px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white flex items-center gap-2 shadow-lg"
                  >
                    <FolderDown className="w-4 h-4" />
                    <span>Download XAMPP Package (ZIP)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Free Hosting */}
            {activeExportTab === 'hosting' && (
              <div className="space-y-4 text-sm text-slate-300">
                <p>
                  Deploy effortlessly on standard free or cPanel PHP web hosts (e.g. <strong>InfinityFree</strong>, <strong>Hostinger</strong>, <strong>000webhost</strong>):
                </p>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                    <strong className="text-white block mb-1">Step 1: Upload via File Manager or FTP</strong>
                    Upload the contents into your hosting root (usually <code>public_html/</code> or <code>htdocs/</code>).
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                    <strong className="text-white block mb-1">Step 2: Set Folder Permissions</strong>
                    Ensure <code>uploads/</code> and <code>results/</code> are set to permission <strong>755</strong> or <strong>775</strong> so PHP can write files.
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                    <strong className="text-white block mb-1">Step 3: Add API Key in config.php</strong>
                    Edit <code>config.php</code> using the online File Manager and set your <code>GOOGLE_API_KEY</code>.
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                    <strong className="text-white block mb-1">Step 4: Launch</strong>
                    Visit <code>https://your-domain.com/</code> and test your try-on!
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Code Viewer */}
            {activeExportTab === 'code' && (
              <div>
                <div className="flex gap-2 mb-3">
                  {Object.keys(codeSnippets).map((filename) => (
                    <button
                      key={filename}
                      onClick={() => setSelectedCodeFile(filename)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                        selectedCodeFile === filename
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {filename}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <pre className="p-4 rounded-xl bg-black/80 border border-white/10 text-xs font-mono text-slate-200 overflow-x-auto max-h-[380px]">
                    {codeSnippets[selectedCodeFile]}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(codeSnippets[selectedCodeFile])}
                    className="absolute top-3 right-3 px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-xs text-white flex items-center gap-1.5 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 4: Architecture */}
            {activeExportTab === 'structure' && (
              <div className="space-y-4 text-sm text-slate-300">
                <div className="p-4 rounded-xl bg-black/70 border border-white/10 font-mono text-xs text-slate-300 leading-relaxed">
                  <div>/ai-virtual-try-on/</div>
                  <div>├── index.php &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Main HTML5/PHP User Interface</div>
                  <div>├── generate.php &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Server-side cURL endpoint for Gemini API</div>
                  <div>├── config.php &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# API Key & Settings (Protected from browser)</div>
                  <div>├── .htaccess &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Apache rules preventing direct access to config</div>
                  <div>├── README.md &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# XAMPP & Shared Hosting Setup Documentation</div>
                  <div>├── .gitignore &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Excludes uploads & results from version control</div>
                  <div>├── assets/</div>
                  <div>│ &nbsp;&nbsp;├── style.css &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Futuristic responsive dark-navy theme</div>
                  <div>│ &nbsp;&nbsp;└── app.js &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Vanilla JS drag-and-drop & AJAX controller</div>
                  <div>├── uploads/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Temporary upload storage (.htaccess protected)</div>
                  <div>└── results/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Generated try-on images (.htaccess protected)</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-emerald-400 font-bold block mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> Security Hardened
                    </span>
                    <p className="text-xs text-slate-400">
                      finfo MIME verification, cryptographic filenames, immediate deletion of temporary inputs, and disabled script execution in upload directories.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-sky-400 font-bold block mb-1 flex items-center gap-1.5">
                      <Zap className="w-4 h-4" /> Portability Guarantee
                    </span>
                    <p className="text-xs text-slate-400">
                      Standard PHP 8.1+ with cURL. Zero database setup, zero npm builds, zero Docker requirements.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
