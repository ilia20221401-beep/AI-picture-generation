/**
 * AI Virtual Try-On - Frontend Logic
 * Vanilla JavaScript (ES6+) - Zero External Dependencies
 */

document.addEventListener('DOMContentLoaded', () => {
  // State
  const state = {
    personFile: null,
    clothingFile: null,
    personPreviewUrl: null,
    clothingPreviewUrl: null,
    resultUrl: null,
    isGenerating: false,
    intervalId: null,
  };

  // Elements
  const personInput = document.getElementById('personInput');
  const clothingInput = document.getElementById('clothingInput');
  const personDropzone = document.getElementById('personDropzone');
  const clothingDropzone = document.getElementById('clothingDropzone');
  const personPromptZone = document.getElementById('personPromptZone');
  const clothingPromptZone = document.getElementById('clothingPromptZone');
  const personPreview = document.getElementById('personPreview');
  const clothingPreview = document.getElementById('clothingPreview');
  const personPreviewImg = document.getElementById('personPreviewImg');
  const clothingPreviewImg = document.getElementById('clothingPreviewImg');
  const removePersonBtn = document.getElementById('removePersonBtn');
  const removeClothingBtn = document.getElementById('removeClothingBtn');

  const garmentTypeSelect = document.getElementById('garmentTypeSelect');
  const aspectRatioSelect = document.getElementById('aspectRatioSelect');
  const customInstructions = document.getElementById('customInstructions');

  const generateBtn = document.getElementById('generateBtn');
  const clearBtn = document.getElementById('clearBtn');
  const loadingSection = document.getElementById('loadingSection');
  const loadingStageText = document.getElementById('loadingStageText');
  const resultSection = document.getElementById('resultSection');

  const resultOriginalImg = document.getElementById('resultOriginalImg');
  const resultGeneratedImg = document.getElementById('resultGeneratedImg');
  const downloadBtn = document.getElementById('downloadBtn');
  const tryAnotherBtn = document.getElementById('tryAnotherBtn');
  const resetAllBtn = document.getElementById('resetAllBtn');
  const toastBox = document.getElementById('toastBox');

  // Preset Buttons
  const personPresets = document.querySelectorAll('.person-preset');
  const clothingPresets = document.querySelectorAll('.clothing-preset');

  // Progress Steps for Animation
  const progressSteps = [
    { text: 'Optimizing and validating input images...', stepId: 'step-1' },
    { text: 'Detecting person silhouette, pose & facial identity...', stepId: 'step-2' },
    { text: 'Segmenting garment texture, collar, and sleeve structure...', stepId: 'step-3' },
    { text: 'Simulating fabric physics, realistic folds & dynamic shadows...', stepId: 'step-4' },
    { text: 'Rendering photorealistic high-fidelity try-on result...', stepId: 'step-5' }
  ];

  // -------------------------------------------------------------
  // File Upload Handlers (Drag & Drop + File Input)
  // -------------------------------------------------------------

  function setupDropzone(dropzone, input, type) {
    // Click triggers hidden input
    dropzone.addEventListener('click', (e) => {
      if (e.target.closest('.btn-remove-preview')) return;
      input.click();
    });

    // Drag events
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('drag-active');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('drag-active');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileSelection(files[0], type);
      }
    });

    input.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileSelection(e.target.files[0], type);
      }
    });
  }

  function handleFileSelection(file, type) {
    // Validate format
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type)) {
      showToast('Invalid file format. Please upload a JPEG, PNG, or WebP image.', true);
      return;
    }

    // Validate size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('File size exceeds the 10 MB limit. Please select a smaller photo.', true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      if (type === 'person') {
        state.personFile = file;
        state.personPreviewUrl = dataUrl;
        personPreviewImg.src = dataUrl;
        personPromptZone.style.display = 'none';
        personPreview.classList.add('active');
        clearPresetPills('.person-preset');
      } else {
        state.clothingFile = file;
        state.clothingPreviewUrl = dataUrl;
        clothingPreviewImg.src = dataUrl;
        clothingPromptZone.style.display = 'none';
        clothingPreview.classList.add('active');
        clearPresetPills('.clothing-preset');
      }
      updateGenerateButtonState();
    };
    reader.readAsDataURL(file);
  }

  function clearPresetPills(selector) {
    document.querySelectorAll(selector).forEach(p => p.classList.remove('active'));
  }

  setupDropzone(personDropzone, personInput, 'person');
  setupDropzone(clothingDropzone, clothingInput, 'clothing');

  // Remove buttons
  removePersonBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    state.personFile = null;
    state.personPreviewUrl = null;
    personInput.value = '';
    personPreview.classList.remove('active');
    personPromptZone.style.display = 'flex';
    clearPresetPills('.person-preset');
    updateGenerateButtonState();
  });

  removeClothingBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    state.clothingFile = null;
    state.clothingPreviewUrl = null;
    clothingInput.value = '';
    clothingPreview.classList.remove('active');
    clothingPromptZone.style.display = 'flex';
    clearPresetPills('.clothing-preset');
    updateGenerateButtonState();
  });

  // -------------------------------------------------------------
  // Built-in Demo Presets (Instant Canvas / SVG Generation)
  // -------------------------------------------------------------

  function createDemoImageBlob(theme, text, type) {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    // Background gradient
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

    // Decorative grid pattern
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

    // Graphical Representation
    if (type === 'person') {
      // Silhouette of person
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
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
      // Clothing shape (Garment silhouette)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      // Collar
      ctx.moveTo(250, 220);
      ctx.lineTo(350, 220);
      ctx.lineTo(390, 260);
      // Right sleeve
      ctx.lineTo(510, 360);
      ctx.lineTo(450, 420);
      ctx.lineTo(390, 360);
      // Torso right
      ctx.lineTo(410, 620);
      // Hem
      ctx.lineTo(190, 620);
      // Torso left
      ctx.lineTo(210, 360);
      // Left sleeve
      ctx.lineTo(150, 420);
      ctx.lineTo(90, 360);
      ctx.lineTo(210, 260);
      ctx.closePath();
      ctx.fill();
    }

    // Label Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, 300, 700);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '20px sans-serif';
    ctx.fillText('Preset Sample Reference', 300, 740);

    return new Promise(resolve => {
      canvas.toBlob(blob => {
        const file = new File([blob], `${theme}.png`, { type: 'image/png' });
        resolve({ file, dataUrl: canvas.toDataURL('image/png') });
      }, 'image/png');
    });
  }

  personPresets.forEach(pill => {
    pill.addEventListener('click', async () => {
      clearPresetPills('.person-preset');
      pill.classList.add('active');
      const theme = pill.dataset.theme;
      const title = pill.dataset.title;
      const { file, dataUrl } = await createDemoImageBlob(theme, title, 'person');
      state.personFile = file;
      state.personPreviewUrl = dataUrl;
      personPreviewImg.src = dataUrl;
      personPromptZone.style.display = 'none';
      personPreview.classList.add('active');
      updateGenerateButtonState();
    });
  });

  clothingPresets.forEach(pill => {
    pill.addEventListener('click', async () => {
      clearPresetPills('.clothing-preset');
      pill.classList.add('active');
      const theme = pill.dataset.theme;
      const title = pill.dataset.title;
      const { file, dataUrl } = await createDemoImageBlob(theme, title, 'clothing');
      state.clothingFile = file;
      state.clothingPreviewUrl = dataUrl;
      clothingPreviewImg.src = dataUrl;
      clothingPromptZone.style.display = 'none';
      clothingPreview.classList.add('active');
      if (pill.dataset.type) {
        garmentTypeSelect.value = pill.dataset.type;
      }
      updateGenerateButtonState();
    });
  });

  function updateGenerateButtonState() {
    const ready = state.personFile !== null && state.clothingFile !== null && !state.isGenerating;
    generateBtn.disabled = !ready;
  }

  // -------------------------------------------------------------
  // Generate Try-On (AJAX to generate.php)
  // -------------------------------------------------------------

  generateBtn.addEventListener('click', async () => {
    if (!state.personFile || !state.clothingFile || state.isGenerating) return;

    state.isGenerating = true;
    updateGenerateButtonState();

    // Hide previous results
    resultSection.classList.remove('active');

    // Show loading animation
    loadingSection.classList.add('active');
    startLoadingAnimation();

    // Prepare FormData
    const formData = new FormData();
    formData.append('person_image', state.personFile);
    formData.append('clothing_image', state.clothingFile);
    formData.append('garment_type', garmentTypeSelect.value);
    formData.append('aspect_ratio', aspectRatioSelect.value);
    formData.append('instructions', customInstructions.value.trim());

    try {
      const response = await fetch('generate.php', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      stopLoadingAnimation();
      loadingSection.classList.remove('active');
      state.isGenerating = false;
      updateGenerateButtonState();

      if (data.success && data.result_url) {
        state.resultUrl = data.result_url;
        showResult(data.result_url);
        showToast('Virtual try-on completed successfully!');
      } else {
        const errorMsg = data.error || 'Failed to generate try-on. Please check your configuration.';
        showToast(errorMsg, true);
        if (data.hint) {
          console.warn('Hint:', data.hint);
        }
      }
    } catch (err) {
      stopLoadingAnimation();
      loadingSection.classList.remove('active');
      state.isGenerating = false;
      updateGenerateButtonState();
      showToast('Network error or server unavailable: ' + err.message, true);
    }
  });

  function startLoadingAnimation() {
    let currentStepIdx = 0;
    renderStepProgress(currentStepIdx);

    state.intervalId = setInterval(() => {
      currentStepIdx = (currentStepIdx + 1) % progressSteps.length;
      renderStepProgress(currentStepIdx);
    }, 4500);
  }

  function renderStepProgress(idx) {
    const step = progressSteps[idx];
    loadingStageText.textContent = step.text;

    const stepElements = document.querySelectorAll('.step-item');
    stepElements.forEach((el, index) => {
      el.classList.remove('active', 'done');
      if (index < idx) {
        el.classList.add('done');
      } else if (index === idx) {
        el.classList.add('active');
      }
    });
  }

  function stopLoadingAnimation() {
    if (state.intervalId) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }
  }

  // -------------------------------------------------------------
  // Display Results & Comparison
  // -------------------------------------------------------------

  function showResult(resultUrl) {
    resultOriginalImg.src = state.personPreviewUrl;
    // Add cache buster to result image URL
    resultGeneratedImg.src = resultUrl + '?t=' + Date.now();
    resultSection.classList.add('active');

    // Smooth scroll down to result
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Download Handler
  downloadBtn.addEventListener('click', () => {
    if (!state.resultUrl) return;
    const a = document.createElement('a');
    a.href = state.resultUrl;
    a.download = `ai-virtual-try-on-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  // Try Another Garment (keeps the person image)
  tryAnotherBtn.addEventListener('click', () => {
    state.clothingFile = null;
    state.clothingPreviewUrl = null;
    clothingInput.value = '';
    clothingPreview.classList.remove('active');
    clothingPromptZone.style.display = 'flex';
    clearPresetPills('.clothing-preset');
    resultSection.classList.remove('active');
    updateGenerateButtonState();

    // Scroll up to clothing card
    clothingDropzone.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // Reset / Clear All
  clearBtn.addEventListener('click', resetAll);
  resetAllBtn.addEventListener('click', resetAll);

  function resetAll() {
    state.personFile = null;
    state.clothingFile = null;
    state.personPreviewUrl = null;
    state.clothingPreviewUrl = null;
    state.resultUrl = null;

    personInput.value = '';
    clothingInput.value = '';

    personPreview.classList.remove('active');
    clothingPreview.classList.remove('active');
    personPromptZone.style.display = 'flex';
    clothingPromptZone.style.display = 'flex';

    clearPresetPills('.person-preset');
    clearPresetPills('.clothing-preset');

    customInstructions.value = '';
    garmentTypeSelect.value = 'T-shirt / Top';
    aspectRatioSelect.value = '3:4';

    loadingSection.classList.remove('active');
    resultSection.classList.remove('active');
    stopLoadingAnimation();

    updateGenerateButtonState();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // -------------------------------------------------------------
  // Toast Notification
  // -------------------------------------------------------------

  function showToast(message, isError = false) {
    toastBox.textContent = message;
    toastBox.className = 'toast-box active' + (isError ? ' error' : '');

    setTimeout(() => {
      toastBox.classList.remove('active');
    }, 5000);
  }
});
