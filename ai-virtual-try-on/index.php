<?php
/**
 * AI Virtual Try-On - Main Interface
 *
 * Runs on standard PHP 8.1+ (XAMPP / Apache / Shared Web Hosting)
 * No Node.js, Express, or React required.
 */
define('TRYON_ACCESS', true);
require_once __DIR__ . '/config.php';

$isApiKeyConfigured = !empty(GOOGLE_API_KEY) && GOOGLE_API_KEY !== 'YOUR_API_KEY';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Virtual Try-On</title>
  <meta name="description" content="Upload your photo and a clothing photo to create a realistic virtual try-on.">
  <link rel="stylesheet" href="assets/style.css">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>✨</text></svg>">
</head>
<body>

  <div class="container">

    <!-- Header Section -->
    <header class="app-header">
      <div class="badge-tag">
        <span class="badge-dot"></span>
        <span>Google Gemini Vision Engine</span>
      </div>
      <h1 class="app-title">AI Virtual Try-On</h1>
      <p class="app-subtitle">Upload your photo and a clothing photo to create a realistic virtual try-on.</p>
    </header>

    <?php if (!$isApiKeyConfigured): ?>
    <!-- Notice Banner when API Key is not set -->
    <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 14px; padding: 14px 20px; margin-bottom: 28px; display: flex; align-items: center; justify-content: space-between; gap: 16px;">
      <div style="display: flex; align-items: center; gap: 12px; color: #fde68a; font-size: 0.92rem;">
        <span style="font-size: 1.4rem;">🔑</span>
        <div>
          <strong>Gemini API Key Required:</strong> To enable generation, add your API key in <code>config.php</code> or set the <code>GEMINI_API_KEY</code> environment variable.
        </div>
      </div>
      <a href="README.md" target="_blank" style="background: rgba(245, 158, 11, 0.25); color: #fff; padding: 6px 14px; border-radius: 8px; text-decoration: none; font-size: 0.82rem; font-weight: 600; white-space: nowrap;">View Setup Guide</a>
    </div>
    <?php endif; ?>

    <!-- Dual Upload Cards -->
    <main class="upload-grid">

      <!-- 1. Person Card -->
      <section class="card">
        <div class="card-header">
          <div class="card-title-group">
            <div class="card-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div>
              <h2 class="card-title">1. Your Photo</h2>
              <p class="card-desc">Front-facing, full or half body portrait</p>
            </div>
          </div>
        </div>

        <div class="dropzone" id="personDropzone">
          <input type="file" id="personInput" class="file-input" accept="image/jpeg,image/png,image/webp">
          
          <div id="personPromptZone">
            <svg class="dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
              <circle cx="9" cy="9" r="2"></circle>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
            </svg>
            <div class="dropzone-label">Drop your photo here, or browse</div>
            <div class="dropzone-sub">Supports JPEG, PNG, WebP (up to 10MB)</div>
            <button type="button" class="btn-browse">Select Photo</button>
          </div>

          <div class="preview-container" id="personPreview">
            <img id="personPreviewImg" class="preview-img" alt="Person Preview">
            <div class="preview-overlay">
              <span class="preview-badge">Person Reference</span>
              <button type="button" class="btn-remove-preview" id="removePersonBtn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                Change
              </button>
            </div>
          </div>
        </div>

        <!-- Sample Model Presets -->
        <div class="presets-group">
          <div class="presets-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            Quick Model Presets:
          </div>
          <div class="preset-pills">
            <button type="button" class="preset-pill person-preset" data-theme="model-casual" data-title="Casual Standing Model">Casual Male</button>
            <button type="button" class="preset-pill person-preset" data-theme="model-fashion" data-title="Studio Fashion Model">Fashion Female</button>
          </div>
        </div>
      </section>

      <!-- 2. Clothing Card -->
      <section class="card">
        <div class="card-header">
          <div class="card-title-group">
            <div class="card-icon purple">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"></path>
              </svg>
            </div>
            <div>
              <h2 class="card-title">2. Clothing Photo</h2>
              <p class="card-desc">Garment, jacket, hoodie, or outfit to wear</p>
            </div>
          </div>
        </div>

        <div class="dropzone" id="clothingDropzone">
          <input type="file" id="clothingInput" class="file-input" accept="image/jpeg,image/png,image/webp">
          
          <div id="clothingPromptZone">
            <svg class="dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.29 7 12 12 20.71 7"></polyline>
              <line x1="12" y1="22" x2="12" y2="12"></line>
            </svg>
            <div class="dropzone-label">Drop clothing photo here, or browse</div>
            <div class="dropzone-sub">Flat lay, mannequin, or product catalog image</div>
            <button type="button" class="btn-browse">Select Garment</button>
          </div>

          <div class="preview-container" id="clothingPreview">
            <img id="clothingPreviewImg" class="preview-img" alt="Clothing Preview">
            <div class="preview-overlay">
              <span class="preview-badge" style="color: #c084fc; border-color: rgba(192, 132, 252, 0.3);">Clothing Item</span>
              <button type="button" class="btn-remove-preview" id="removeClothingBtn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                Change
              </button>
            </div>
          </div>
        </div>

        <!-- Sample Clothing Presets -->
        <div class="presets-group">
          <div class="presets-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            Quick Clothing Presets:
          </div>
          <div class="preset-pills">
            <button type="button" class="preset-pill clothing-preset" data-theme="hoodie" data-type="Hoodie / Sweatshirt" data-title="Deep Blue Streetwear Hoodie">Street Hoodie</button>
            <button type="button" class="preset-pill clothing-preset" data-theme="jacket" data-type="Jacket / Coat" data-title="Vintage Leather Bomber Jacket">Leather Jacket</button>
            <button type="button" class="preset-pill clothing-preset" data-theme="blazer" data-type="Suit / Blazer" data-title="Teal Slim-Fit Tailored Blazer">Modern Blazer</button>
          </div>
        </div>
      </section>

    </main>

    <!-- Options & Style Customization -->
    <section class="options-panel">
      <div class="option-group">
        <label for="garmentTypeSelect" class="option-label">Garment Category:</label>
        <select id="garmentTypeSelect" class="select-control">
          <option value="T-shirt / Top">T-shirt / Top</option>
          <option value="Hoodie / Sweatshirt">Hoodie / Sweatshirt</option>
          <option value="Jacket / Coat">Jacket / Coat</option>
          <option value="Suit / Blazer">Suit / Blazer</option>
          <option value="Dress / Gown">Dress / Gown</option>
          <option value="Pants / Bottoms">Pants / Bottoms</option>
          <option value="Full Outfit">Full Outfit</option>
        </select>
      </div>

      <div class="option-group">
        <label for="aspectRatioSelect" class="option-label">Aspect Ratio:</label>
        <select id="aspectRatioSelect" class="select-control">
          <option value="3:4" selected>3:4 (Portrait)</option>
          <option value="1:1">1:1 (Square)</option>
          <option value="9:16">9:16 (Story/Mobile)</option>
          <option value="4:3">4:3 (Classic)</option>
        </select>
      </div>

      <div class="option-group" style="flex: 1; min-width: 260px;">
        <label for="customInstructions" class="option-label">Custom Fit Instructions (Optional):</label>
        <input type="text" id="customInstructions" class="input-control" placeholder="e.g. Sleeves rolled up, casual relaxed fit..." style="width: 100%;">
      </div>
    </section>

    <!-- Action Buttons -->
    <div class="actions-container">
      <button type="button" id="generateBtn" class="btn-generate" disabled>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
          <path d="M5 3v4M3 5h4M19 17v4M17 19h4"/>
        </svg>
        Generate Try-On
      </button>

      <button type="button" id="clearBtn" class="btn-clear">
        Clear All
      </button>
    </div>

    <!-- Futuristic Loading Section -->
    <section class="loading-section" id="loadingSection">
      <div class="scanner-beam"></div>
      <div class="loading-spinner"></div>
      <h2 class="loading-title">AI Virtual Try-On In Progress</h2>
      <p class="loading-stage" id="loadingStageText">Initializing neural rendering engine...</p>
      
      <div class="progress-steps">
        <div class="step-item" id="step-1">
          <svg class="step-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Step 1: Validating and analyzing image dimensions</span>
        </div>
        <div class="step-item" id="step-2">
          <svg class="step-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Step 2: Detecting pose, silhouette, and face identity</span>
        </div>
        <div class="step-item" id="step-3">
          <svg class="step-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Step 3: Extracting textile fabric, stitching, and folds</span>
        </div>
        <div class="step-item" id="step-4">
          <svg class="step-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Step 4: Simulating drape physics and dynamic lighting</span>
        </div>
        <div class="step-item" id="step-5">
          <svg class="step-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Step 5: Rendering photorealistic virtual try-on</span>
        </div>
      </div>
    </section>

    <!-- Generated Result Output Section -->
    <section class="result-section" id="resultSection">
      <div class="result-header">
        <div class="result-title-group">
          <h2>Virtual Try-On Result</h2>
          <p>Generated with Google Gemini Multi-Modal Image Synthesis</p>
        </div>
        <div class="result-view-toggle">
          <button type="button" class="toggle-btn active">Comparison View</button>
        </div>
      </div>

      <!-- Side-by-side Comparison -->
      <div class="comparison-grid">
        <div class="result-display-card">
          <span class="result-display-label">Original Person</span>
          <div class="result-image-box">
            <img id="resultOriginalImg" class="result-image" alt="Original Person">
          </div>
        </div>

        <div class="result-display-card">
          <span class="result-display-label glow">AI Try-On Result</span>
          <div class="result-image-box">
            <img id="resultGeneratedImg" class="result-image" alt="Virtual Try-On Output">
          </div>
        </div>
      </div>

      <!-- Action Toolbar -->
      <div class="result-actions-bar">
        <button type="button" id="downloadBtn" class="btn-download">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Download Try-On Image
        </button>

        <button type="button" id="tryAnotherBtn" class="btn-secondary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
          Try Another Garment
        </button>

        <button type="button" id="resetAllBtn" class="btn-secondary">
          Reset All
        </button>
      </div>
    </section>

    <!-- Toast Notification Banner -->
    <div id="toastBox" class="toast-box"></div>

    <!-- Footer Information -->
    <footer class="footer-info">
      <p>AI Virtual Try-On &bull; Standalone Portable Architecture (PHP 8.1+ &bull; Vanilla JS &bull; CSS3)</p>
      <p style="margin-top: 6px;">Compatible with XAMPP (<code>localhost/ai-virtual-try-on/</code>) and standard shared PHP web hosting.</p>
    </footer>

  </div>

  <script src="assets/app.js"></script>
</body>
</html>
