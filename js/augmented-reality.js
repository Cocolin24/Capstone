// === Access Camera ===
const video = document.getElementById("cameraFeed");

let videoReady = false;
let currentStream = null;
let currentFacingMode = "environment"; // Start with back camera


video.addEventListener('loadedmetadata', () => {
  video.play();
});

video.addEventListener('playing', () => {
  videoReady = true;
});

async function initializeCamera(facingMode = "environment") {
  try {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }
    
    // Add fade effect during camera switch
    video.style.opacity = '0';
    
    // Add delay to ensure previous stream is fully stopped
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: {
        facingMode: facingMode,
        width: { exact: 1280 },
        height: { exact: 720 },
        frameRate: { exact: 30 }
      }
    });
    
    currentStream = stream;
    video.srcObject = stream;
    currentFacingMode = facingMode;
    
    // Update camera class for proper mirroring
    const cameraClass = facingMode === "user" ? "front-camera" : "back-camera";
    video.className = cameraClass;
    const tattooOverlay = document.getElementById("tattooOverlay");
    if (tattooOverlay) {
      tattooOverlay.className = cameraClass;
    }
    
    // Reset video ready state
    videoReady = false;
    
    // Wait for video to stabilize
    await new Promise(resolve => {
      const checkStable = () => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          resolve();
        } else {
          setTimeout(checkStable, 50);
        }
      };
      checkStable();
    });
    
    // Additional delay to ensure camera is fully stabilized
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Fade back in after stabilization
    video.style.opacity = '1';
    
  } catch (err) { 
    // If exact constraints fail, try with ideal constraints
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      });
      
      currentStream = stream;
      video.srcObject = stream;
      currentFacingMode = facingMode;
      
      // Update camera class for proper mirroring
      const cameraClass = facingMode === "user" ? "front-camera" : "back-camera";
      video.className = cameraClass;
      const tattooOverlay = document.getElementById("tattooOverlay");
      if (tattooOverlay) {
        tattooOverlay.className = cameraClass;
      }
      videoReady = false;
      
      await new Promise(resolve => {
        const checkStable = () => {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            resolve();
          } else {
            setTimeout(checkStable, 50);
          }
        };
        checkStable();
      });
      
      // Additional delay to ensure camera is fully stabilized
      await new Promise(resolve => setTimeout(resolve, 500));
      
      video.style.opacity = '1';
      
    } catch (err2) {
      alert("Camera access denied or not available. Please check your camera permissions.");
    }
  }
}

// Initialize with back camera by default
initializeCamera("environment");

// === Elements & State ===
const overlay = document.getElementById("tattooOverlay");
const placementSelect = document.getElementById("tattooPlacement");
const sizeSlider = document.getElementById("tattooSize");
const container = document.querySelector(".camera-container");

let selectedTattooSrc = null;   // alin sa thumbnails / upload ang pinili
let overlayShown = false;       // para hindi paulit-ulit mag-set ng src/display
let pendingSize = sizeSlider ? parseInt(sizeSlider.value, 10) : 150;

// === Utility: Map Pose coords -> container-relative DOM coords ===
function mapToContainerCoords(x, y) {
  const vRect = video.getBoundingClientRect();
  const cRect = container.getBoundingClientRect();
  const vw = video.videoWidth || vRect.width;
  const vh = video.videoHeight || vRect.height;
  const scaleX = vRect.width / vw;
  const scaleY = vRect.height / vh;

  // Only flip X coordinate for front camera
  const isFrontCamera = currentFacingMode === "user";
  const adjustedX = isFrontCamera ? (vw - x) : x;
  const relLeft = (adjustedX * scaleX) + (vRect.left - cRect.left);
  const relTop  = (y * scaleY) + (vRect.top  - cRect.top);
  return { x: relLeft, y: relTop };
}

// === Set Tattoo (no render yet until placement + detection ok) ===
function setTattoo(src, targetElement) {
  console.log("Tattoo selected:", src);
  selectedTattooSrc = src;
  overlayShown = false;
  if (overlay) {
    overlay.style.display = "none";
  }
  
  document.querySelectorAll('.filter-item').forEach(item => {
    if (item && item.style) {
      item.style.borderColor = 'transparent';
    }
  });
  
  if (targetElement && targetElement.style) {
    targetElement.style.borderColor = '#fff';
  } else if (window.event && window.event.target && window.event.target.style) {
    window.event.target.style.borderColor = '#fff';
  }
}

// expose for inline onclick in HTML
window.setTattoo = setTattoo;

function addImageToFilterBar(imageDataUrl, imageName) {
  const filterBar = document.getElementById('filterBar');
  if (!filterBar) {
    console.error('Filter bar not found in addImageToFilterBar');
    return;
  }
  
  const img = document.createElement('img');
  img.src = imageDataUrl;
  img.className = 'filter-item';
  img.title = imageName || 'Uploaded Tattoo';
  img.setAttribute('data-uploaded', 'true');
  img.style.display = 'block';
  img.style.width = '60px';
  img.style.height = '60px';
  img.style.objectFit = 'cover';
  img.onclick = function() {
    console.log('Uploaded tattoo clicked:', this.src);
    window.setTattoo(this.src, this);
  };
  
  const uploadBtn = filterBar.querySelector('.upload-btn');
  if (uploadBtn) {
    if (uploadBtn.nextSibling) {
      filterBar.insertBefore(img, uploadBtn.nextSibling);
    } else {
      filterBar.appendChild(img);
    }
  } else {
    filterBar.appendChild(img);
  }
  
  console.log('Image added to filter bar:', imageName);
}

function saveImageToLocalStorage(imageDataUrl, imageName) {
  try {
    const imageData = {
      dataUrl: imageDataUrl,
      name: imageName || `Uploaded ${new Date().toLocaleString()}`,
      uploadedAt: new Date().toISOString()
    };
    localStorage.setItem('arUploadedImages', JSON.stringify([imageData]));
    console.log('Image saved to localStorage (replaced old upload)');
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

function loadSavedImages() {
  try {
    const savedImages = JSON.parse(localStorage.getItem('arUploadedImages') || '[]');
    if (savedImages.length > 0) {
      const mostRecent = savedImages[savedImages.length - 1];
      addImageToFilterBar(mostRecent.dataUrl, mostRecent.name);
    }
  } catch (error) {
    console.error('Error loading saved images:', error);
  }
}

window.loadSavedImages = loadSavedImages;

async function removeBackground(file) {
  const API_KEY = (window.CLIPDROP_API_KEY || '').trim();

  if (!API_KEY) {
    throw new Error('Clipdrop API key is not configured. Set window.CLIPDROP_API_KEY or use a server-side proxy.');
  }

  try {
    console.log('Sending image to Clipdrop API for background removal...');

    const form = new FormData();
    form.append('image_file', file);

    const response = await fetch('https://clipdrop-api.co/remove-background/v1', {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
      },
      body: form,
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    console.log('Received processed image from API');
    
    const blob = new Blob([arrayBuffer], { type: 'image/png' });
    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
    
    console.log('Background removal complete via Clipdrop API');
    return dataUrl;
    
  } catch (error) {
    console.error('Clipdrop API error:', error);
    throw error;
  }
}

function uploadTattoo() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.style.display = "none";
  
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('File found:', file.name, file.type);
      const reader = new FileReader();
      reader.onload = async (ev) => {
        console.log('File loaded');
        const imageName = file.name || `Uploaded ${new Date().toLocaleString()}`;
        
        const filterBar = document.getElementById('filterBar');
        console.log('Filter bar found:', filterBar);
        
        if (!filterBar) {
          console.error('Filter bar not found!');
          alert('Error: Filter bar not found. Please refresh the page.');
          return;
        }
        
        const previouslyUploaded = filterBar.querySelectorAll('[data-uploaded="true"]');
        console.log('Found previously uploaded images:', previouslyUploaded.length);
        previouslyUploaded.forEach(oldImg => {
          console.log('Removing old uploaded image');
          oldImg.remove();
        });
        
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'bgRemovalLoading';
        loadingIndicator.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.9); color: white; padding: 30px 40px; border-radius: 15px; z-index: 10000; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.5);';
        loadingIndicator.innerHTML = '<div style="font-size: 48px; margin-bottom: 15px; animation: spin 1s linear infinite;">🔄</div><div style="font-size: 16px; font-weight: 600;">Removing background...</div><div style="font-size: 12px; margin-top: 10px; opacity: 0.7;">Please wait</div><style>@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }</style>';
        document.body.appendChild(loadingIndicator);
        
        console.log('Loading indicator added, starting background removal...');
        
        let imageDataUrl = ev.target.result;
        
        try {
          const startTime = Date.now();
          imageDataUrl = await removeBackground(file);
          const endTime = Date.now();
          console.log(`Background removal completed in ${endTime - startTime}ms`);
        } catch (error) {
          console.error('Background removal error:', error);
          alert('Background removal failed. Using original image.');
          imageDataUrl = ev.target.result;
        } finally {
          console.log('Removing loading indicator');
          const indicator = document.getElementById('bgRemovalLoading');
          if (indicator) {
            indicator.remove();
          }
        }
        
        const img = document.createElement('img');
        img.src = imageDataUrl;
        img.className = 'filter-item';
        img.title = imageName;
        img.alt = imageName;
        img.setAttribute('data-uploaded', 'true');
        img.setAttribute('data-upload-time', Date.now().toString());
        img.onclick = function() {
          console.log('Uploaded tattoo clicked:', this.src);
          window.setTattoo(this.src, this);
        };
        
        img.onload = function() {
          console.log('Image loaded successfully, dimensions:', this.width, 'x', this.height);
        };
        
        img.onerror = function() {
          console.error('Image failed to load!');
          alert('Failed to load image. Please try again.');
        };
        
        const uploadBtn = filterBar.querySelector('.upload-btn');
        
        if (!uploadBtn) {
          console.error('Upload button not found in filter bar!');
          return;
        }
        
        if (uploadBtn.nextSibling) {
          filterBar.insertBefore(img, uploadBtn.nextSibling);
        } else {
          filterBar.appendChild(img);
        }
        
        if (!filterBar.contains(img)) {
          filterBar.appendChild(img);
        }
        
        setTimeout(() => {
          img.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          setTattoo(imageDataUrl, img);
        }, 100);
        
        saveImageToLocalStorage(imageDataUrl, imageName);
      };
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        alert('Error reading file. Please try again.');
      };
      reader.readAsDataURL(file);
    } else {
      console.log('No file selected');
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    }
  };
  
  input.oncancel = () => {
    console.log('File selection cancelled');
    setTimeout(() => {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    }, 100);
  };
  
  document.body.appendChild(input);
  input.click();
  
  setTimeout(() => {
    if (document.body.contains(input) && !input.files.length) {
      document.body.removeChild(input);
    }
  }, 1000);
}
window.uploadTattoo = uploadTattoo;

document.addEventListener('DOMContentLoaded', () => {
  const uploadBtn = document.getElementById('uploadBtn');
  if (uploadBtn) {
    uploadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadTattoo();
    });
  }
});

if (document.readyState !== 'loading') {
  const uploadBtn = document.getElementById('uploadBtn');
  if (uploadBtn) {
    uploadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadTattoo();
    });
  }
}

// === Camera Toggle ===
async function toggleCamera() {
  const newFacingMode = currentFacingMode === "environment" ? "user" : "environment";
  
  // Show loading indicator
  const loadingDiv = document.createElement('div');
  loadingDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 10000;
  `;
  document.body.appendChild(loadingDiv);
  
  // Hide overlay during camera switch
  if (overlay) {
    overlay.style.display = "none";
    overlayShown = false;
  }
  
  // Stop current stream
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }
  
  // Switch camera with smooth transition
  await initializeCamera(newFacingMode);
  
  // Remove loading indicator
  loadingDiv.remove();
}
window.toggleCamera = toggleCamera;

// === Back to homepage ===
function goBack() { window.location.href = "index.html"; }
window.goBack = goBack;

let screenshotBlob = null;

function takeScreenshot() {
  console.log('takeScreenshot called');
  const canvas = document.createElement('canvas');
  const video = document.getElementById('cameraFeed');
  const overlay = document.getElementById('tattooOverlay');
  
  console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
  console.log('Overlay display:', overlay.style.display);
  console.log('Overlay src:', overlay.src);
  
  if (!video.videoWidth || !video.videoHeight) {
    alert('Camera not ready. Please wait a moment and try again.');
    return;
  }
  
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  const ctx = canvas.getContext('2d');
  
  // Only flip for front camera
  const isFrontCamera = currentFacingMode === "user";
  
  ctx.save();
  if (isFrontCamera) {
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
  } else {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  }
  ctx.restore();
  
  if (overlay.style.display !== 'none') {
    const overlayRect = overlay.getBoundingClientRect();
    const videoRect = video.getBoundingClientRect();
    
    const scaleX = canvas.width / videoRect.width;
    const scaleY = canvas.height / videoRect.height;
    
    let overlayX = (overlayRect.left - videoRect.left) * scaleX;
    const overlayY = (overlayRect.top - videoRect.top) * scaleY;
    const overlayWidth = overlayRect.width * scaleX;
    const overlayHeight = overlayRect.height * scaleY;
    
    console.log('Original overlay position:', overlayX, overlayY);
    console.log('Overlay size:', overlayWidth, overlayHeight);
    
    ctx.globalAlpha = parseFloat(window.getComputedStyle(overlay).opacity) || 0.9;
    
    ctx.save();
    
    if (isFrontCamera) {
      // For front camera:
      // The overlay position we get is from the FLIPPED view on screen
      // But we just drew the flipped video to canvas
      // So we just need to flip the tattoo image itself, keeping the same position
      console.log('Drawing front camera tattoo at:', overlayX, overlayY);
      
      // Draw the tattoo flipped at the same screen position
      ctx.translate(overlayX + overlayWidth, overlayY);
      ctx.scale(-1, 1);
      ctx.drawImage(overlay, 0, 0, overlayWidth, overlayHeight);
    } else {
      // For back camera, just draw normally (tattoo is not flipped in CSS)
      console.log('Drawing back camera tattoo at:', overlayX, overlayY);
      ctx.drawImage(overlay, overlayX, overlayY, overlayWidth, overlayHeight);
    }
    
    ctx.restore();
    ctx.globalAlpha = 1.0;
  }
  
  const flashDiv = document.createElement('div');
  flashDiv.className = 'flash-effect';
  document.body.appendChild(flashDiv);
  setTimeout(() => flashDiv.remove(), 300);
  
  canvas.toBlob((blob) => {
    if (!blob) {
      console.error('Failed to create screenshot blob');
      alert('Failed to take screenshot. Please try again.');
      return;
    }
    
    screenshotBlob = blob;
    const url = URL.createObjectURL(blob);
    
    const modal = document.getElementById('screenshotModal');
    const preview = document.getElementById('screenshotPreview');
    
    console.log('Modal:', modal);
    console.log('Preview:', preview);
    
    if (!modal || !preview) {
      console.error('Modal or preview element not found');
      alert('Screenshot modal not found. Please refresh the page.');
      return;
    }
    
    preview.src = url;
    modal.classList.add('active');
    console.log('Screenshot modal should be visible now');
  }, 'image/jpeg', 0.95);
}
window.takeScreenshot = takeScreenshot;

function saveScreenshot() {
  if (screenshotBlob) {
    const url = URL.createObjectURL(screenshotBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tattoo-preview-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  discardScreenshot();
}
window.saveScreenshot = saveScreenshot;

function discardScreenshot() {
  const modal = document.getElementById('screenshotModal');
  const preview = document.getElementById('screenshotPreview');
  
  modal.classList.remove('active');
  preview.src = '';
  screenshotBlob = null;
}
window.discardScreenshot = discardScreenshot;

// === Drag to move ===
let isDragging = false;
let offsetX = 0, offsetY = 0;

function startDrag(e) {
  e.preventDefault();
  if (overlay.style.display === "none") return; // walang gagalawin kung nakatago
  isDragging = true;
  const rect = overlay.getBoundingClientRect();
  const startX = e.type.includes("mouse") ? e.clientX : e.touches[0].clientX;
  const startY = e.type.includes("mouse") ? e.clientY : e.touches[0].clientY;
  offsetX = startX - rect.left - rect.width / 2;
  offsetY = startY - rect.top  - rect.height / 2;

  document.addEventListener("mousemove", onDrag, { passive: false });
  document.addEventListener("mouseup", stopDrag);
  document.addEventListener("touchmove", onDrag, { passive: false });
  document.addEventListener("touchend", stopDrag);
}

function onDrag(e) {
  if (!isDragging) return;
  const moveX = e.type.includes("mouse") ? e.clientX : e.touches[0].clientX;
  const moveY = e.type.includes("mouse") ? e.clientY : e.touches[0].clientY;
  overlay.style.left = `${moveX - offsetX}px`;
  overlay.style.top  = `${moveY - offsetY}px`;
  const isFrontCamera = currentFacingMode === "user";
  const scaleX = isFrontCamera ? -1 : 1;
  overlay.style.transform = `translate3d(-50%, -50%, 0) scaleX(${scaleX})`;
}

function stopDrag() {
  isDragging = false;
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", stopDrag);
  document.removeEventListener("touchmove", onDrag);
  document.removeEventListener("touchend", stopDrag);
}

overlay.addEventListener("mousedown", startDrag);
overlay.addEventListener("touchstart", startDrag, { passive: false });

// === Manual Resize: slider + wheel + pinch (dynamic max) ===
const MIN_SIZE = 50;

function getMaxSize() {
  // Max size scales with current video box (up to 4x of larger dimension)
  const vRect = video.getBoundingClientRect();
  const base = Math.max(vRect.width, vRect.height) || 500;
  return Math.round(base * 4); // adjust multiplier if you want even larger
}

function setOverlayWidth(px) {
  const max = getMaxSize();
  const clamped = Math.max(MIN_SIZE, Math.min(Math.round(px), max));
  overlay.style.width = `${clamped}px`;
  pendingSize = clamped;
  if (sizeSlider) sizeSlider.value = clamped;
}

// Initialize slider bounds after video metadata is ready
video.addEventListener('loadedmetadata', () => {
  if (sizeSlider) {
    sizeSlider.min = String(MIN_SIZE);
    sizeSlider.max = String(getMaxSize());
    setOverlayWidth(pendingSize || parseInt(sizeSlider.value, 10) || 150);
  }
});

// Recompute bounds on resize/orientation change
window.addEventListener('resize', () => {
  if (!sizeSlider) return;
  const current = overlay.offsetWidth || pendingSize || parseInt(sizeSlider.value, 10) || 150;
  sizeSlider.max = String(getMaxSize());
  // Keep current size within new bounds
  setOverlayWidth(current);
});

if (sizeSlider) {
  sizeSlider.addEventListener("input", (e) => {
    setOverlayWidth(parseInt(e.target.value, 10));
  });
}

// Mouse wheel zoom (desktop)
overlay.addEventListener("wheel", (e) => {
  e.preventDefault();
  if (overlay.style.display === "none") return;
  const current = overlay.offsetWidth || pendingSize || 150;
  const next = e.deltaY < 0 ? current + 20 : current - 20;
  setOverlayWidth(next);
}, { passive: false });

// Pinch-to-zoom (mobile)
let initialDistance = null;
overlay.addEventListener("touchmove", (e) => {
  if (overlay.style.display === "none") return;
  if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const distance = Math.hypot(dx, dy);
    if (initialDistance === null) {
      initialDistance = distance;
    } else {
      const scale = distance / initialDistance;
      setOverlayWidth((overlay.offsetWidth || pendingSize || 150) * scale);
      initialDistance = distance;
    }
  }
}, { passive: false });

overlay.addEventListener("touchend", () => { initialDistance = null; });

// === Placement change: reset gating ===
placementSelect.addEventListener("change", () => {
  overlayShown = false;
  overlay.style.display = "none";
  prevPerspectiveTransform = { rotateX: 0, rotateY: 0, rotateZ: 0, scaleX: 1, scaleY: 1, perspective: 1000 };
});

// === MoveNet (position only; no auto width/rotate) ===
async function initMoveNet() {
  let detector;
  
  try {
    detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.PoseNet,
      {
        architecture: 'MobileNetV1',
        outputStride: 16,
        inputResolution: { width: 640, height: 480 },
        multiplier: 0.75
      }
    );
  } catch (error) {
    try {
      detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { 
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
        }
      );
    } catch (error2) {
      alert("Failed to load pose detection model. Please check your internet connection and refresh the page.");
      return;
    }
  }

  const CONF = 0.3;
  let prevX = null, prevY = null;
  const alpha = 0.35;
  const MIN_MOVEMENT_THRESHOLD = 2;
  let framesNoDet = 0;
  const MAX_MISS = 8;
  let frameCount = 0;
  let consecutiveErrors = 0;
  let prevPerspectiveTransform = { rotateX: 0, rotateY: 0, rotateZ: 0, scaleX: 1, scaleY: 1, perspective: 1000 };
  const perspectiveAlpha = 0.25;

  function coordsForPlacement(kpts, placement) {
    const by = (n) => kpts.find(p => p.name === n);
    switch (placement) {
      case "face": {
        const N = by("nose"), LE = by("left_eye"), RE = by("right_eye");
        const FACE_CONF = 0.2;
        
        if (N && N.score > FACE_CONF) {
          return mapToContainerCoords(N.x, N.y);
        } else if (LE && RE && LE.score > FACE_CONF && RE.score > FACE_CONF) {
          const midX = (LE.x + RE.x) / 2, midY = (LE.y + RE.y) / 2;
          return mapToContainerCoords(midX, midY);
        } else if (N) {
          return mapToContainerCoords(N.x, N.y);
        } else if (LE && RE) {
          const midX = (LE.x + RE.x) / 2, midY = (LE.y + RE.y) / 2;
          return mapToContainerCoords(midX, midY);
        }
        break;
      }
      case "left-cheek": {
        const LE = by("left_eye"), LEar = by("left_ear"), N = by("nose");
        const FACE_CONF = 0.2;
        
        if (LE && LEar && LE.score > FACE_CONF && LEar.score > FACE_CONF) {
          const cheekX = LE.x + (LEar.x - LE.x) * 0.4;
          const cheekY = LE.y + 20;
          return mapToContainerCoords(cheekX, cheekY);
        } else if (LE && N && LE.score > FACE_CONF && N.score > FACE_CONF) {
          const cheekX = LE.x + (N.x - LE.x) * 0.3;
          const cheekY = LE.y + 25;
          return mapToContainerCoords(cheekX, cheekY);
        } else if (LE) {
          return mapToContainerCoords(LE.x + 30, LE.y + 20);
        }
        break;
      }
      case "right-cheek": {
        const RE = by("right_eye"), REar = by("right_ear"), N = by("nose");
        const FACE_CONF = 0.2;
        
        if (RE && REar && RE.score > FACE_CONF && REar.score > FACE_CONF) {
          const cheekX = RE.x + (REar.x - RE.x) * 0.4;
          const cheekY = RE.y + 20;
          return mapToContainerCoords(cheekX, cheekY);
        } else if (RE && N && RE.score > FACE_CONF && N.score > FACE_CONF) {
          const cheekX = RE.x + (N.x - RE.x) * 0.3;
          const cheekY = RE.y + 25;
          return mapToContainerCoords(cheekX, cheekY);
        } else if (RE) {
          return mapToContainerCoords(RE.x - 30, RE.y + 20);
        }
        break;
      }
      case "neck": {
        const L = by("left_shoulder"), R = by("right_shoulder");
        if (L && R && L.score > CONF && R.score > CONF) {
          const midX = (L.x + R.x) / 2, midY = (L.y + R.y) / 2;
          const { x, y } = mapToContainerCoords(midX, midY);
          return { x, y: y - 40 };
        }
        break;
      }
      case "chest": {
        const L = by("left_shoulder"), R = by("right_shoulder");
        if (L && R && L.score > CONF && R.score > CONF) {
          const midX = (L.x + R.x) / 2, midY = (L.y + R.y) / 2;
          const { x, y } = mapToContainerCoords(midX, midY);
          return { x, y: y + 50 };
        }
        break;
      }
      case "stomach": {
        const LH = by("left_hip"), RH = by("right_hip");
        if (LH && RH && LH.score > CONF && RH.score > CONF) {
          const midX = (LH.x + RH.x) / 2, midY = (LH.y + RH.y) / 2;
          const { x, y } = mapToContainerCoords(midX, midY);
          return { x, y: y - 30 };
        }
        break;
      }
      case "back": {
        const L = by("left_shoulder"), R = by("right_shoulder");
        if (L && R && L.score > CONF && R.score > CONF) {
          const midX = (L.x + R.x) / 2, midY = (L.y + R.y) / 2;
          const { x, y } = mapToContainerCoords(midX, midY);
          return { x, y: y + 80 };
        }
        break;
      }
      case "left-shoulder": {
        const S = by("left_shoulder");
        if (S && S.score > CONF) {
          return mapToContainerCoords(S.x, S.y);
        }
        break;
      }
      case "right-shoulder": {
        const S = by("right_shoulder");
        if (S && S.score > CONF) {
          return mapToContainerCoords(S.x, S.y);
        }
        break;
      }
      case "left-arm": {
        const S = by("left_shoulder"), E = by("left_elbow");
        if (S && E && S.score > CONF && E.score > CONF) {
          const midX = (S.x + E.x) / 2, midY = (S.y + E.y) / 2;
          return mapToContainerCoords(midX, midY);
        }
        break;
      }
      case "right-arm": {
        const S = by("right_shoulder"), E = by("right_elbow");
        if (S && E && S.score > CONF && E.score > CONF) {
          const midX = (S.x + E.x) / 2, midY = (S.y + E.y) / 2;
          return mapToContainerCoords(midX, midY);
        }
        break;
      }
      case "left-forearm": {
        const E = by("left_elbow"), W = by("left_wrist");
        if (E && W && E.score > CONF && W.score > CONF) {
          const midX = (E.x + W.x) / 2, midY = (E.y + W.y) / 2;
          return mapToContainerCoords(midX, midY);
        }
        break;
      }
      case "right-forearm": {
        const E = by("right_elbow"), W = by("right_wrist");
        if (E && W && E.score > CONF && W.score > CONF) {
          const midX = (E.x + W.x) / 2, midY = (E.y + W.y) / 2;
          return mapToContainerCoords(midX, midY);
        }
        break;
      }
      case "left-wrist": {
        const W = by("left_wrist");
        if (W && W.score > CONF) {
          return mapToContainerCoords(W.x, W.y);
        }
        break;
      }
      case "right-wrist": {
        const W = by("right_wrist");
        if (W && W.score > CONF) {
          return mapToContainerCoords(W.x, W.y);
        }
        break;
      }
      case "left-hand": {
        const W = by("left_wrist");
        if (W && W.score > CONF) {
          const { x, y } = mapToContainerCoords(W.x, W.y);
          return { x, y: y + 30 };
        }
        break;
      }
      case "right-hand": {
        const W = by("right_wrist");
        if (W && W.score > CONF) {
          const { x, y } = mapToContainerCoords(W.x, W.y);
          return { x, y: y + 30 };
        }
        break;
      }
      case "left-thigh": {
        const H = by("left_hip"), K = by("left_knee");
        if (H && K && H.score > CONF && K.score > CONF) {
          const midX = (H.x + K.x) / 2, midY = (H.y + K.y) / 2;
          return mapToContainerCoords(midX, midY);
        }
        break;
      }
      case "right-thigh": {
        const H = by("right_hip"), K = by("right_knee");
        if (H && K && H.score > CONF && K.score > CONF) {
          const midX = (H.x + K.x) / 2, midY = (H.y + K.y) / 2;
          return mapToContainerCoords(midX, midY);
        }
        break;
      }
      case "left-calf": {
        const K = by("left_knee"), A = by("left_ankle");
        if (K && A && K.score > CONF && A.score > CONF) {
          const midX = (K.x + A.x) / 2, midY = (K.y + A.y) / 2;
          return mapToContainerCoords(midX, midY);
        }
        break;
      }
      case "right-calf": {
        const K = by("right_knee"), A = by("right_ankle");
        if (K && A && K.score > CONF && A.score > CONF) {
          const midX = (K.x + A.x) / 2, midY = (K.y + A.y) / 2;
          return mapToContainerCoords(midX, midY);
        }
        break;
      }
      case "left-ankle": {
        const A = by("left_ankle");
        if (A && A.score > CONF) {
          return mapToContainerCoords(A.x, A.y);
        }
        break;
      }
      case "right-ankle": {
        const A = by("right_ankle");
        if (A && A.score > CONF) {
          return mapToContainerCoords(A.x, A.y);
        }
        break;
      }
    }
    return null;
  }

  const detectionCanvas = document.createElement('canvas');
  const detectionCtx = detectionCanvas.getContext('2d');

  let skinColorCache = null;
  let cameraQualityCache = null;
  let lastSkinColorUpdate = 0;
  const SKIN_COLOR_UPDATE_INTERVAL = 30;

  function sampleSkinColor(x, y, width, height) {
    try {
      if (x < 0 || y < 0 || x >= detectionCanvas.width || y >= detectionCanvas.height) {
        return null;
      }
      
      const sampleSize = 50;
      const halfSize = sampleSize / 2;
      const sampleX = Math.max(0, Math.min(Math.round(x - halfSize), detectionCanvas.width - sampleSize));
      const sampleY = Math.max(0, Math.min(Math.round(y - halfSize), detectionCanvas.height - sampleSize));
      const actualWidth = Math.min(sampleSize, detectionCanvas.width - sampleX);
      const actualHeight = Math.min(sampleSize, detectionCanvas.height - sampleY);
      
      if (actualWidth <= 0 || actualHeight <= 0) {
        return null;
      }
      
      const imageData = detectionCtx.getImageData(sampleX, sampleY, actualWidth, actualHeight);
      const data = imageData.data;
      
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;
        const saturation = Math.max(r, g, b) - Math.min(r, g, b);
        
        if (brightness > 40 && brightness < 220 && saturation < 80) {
          rSum += r;
          gSum += g;
          bSum += b;
          count++;
        }
      }
      
      if (count > 10) {
        return {
          r: Math.round(rSum / count),
          g: Math.round(gSum / count),
          b: Math.round(bSum / count)
        };
      }
    } catch (error) {
      console.error('Error sampling skin color:', error);
    }
    return null;
  }

  function analyzeCameraQuality() {
    try {
      const imageData = detectionCtx.getImageData(0, 0, Math.min(200, detectionCanvas.width), Math.min(200, detectionCanvas.height));
      const data = imageData.data;
      
      let brightnessSum = 0;
      let contrastSum = 0;
      let pixelCount = 0;
      const brightnessValues = [];
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;
        
        brightnessValues.push(brightness);
        brightnessSum += brightness;
        pixelCount++;
      }
      
      const avgBrightness = brightnessSum / pixelCount;
      
      let variance = 0;
      for (let i = 0; i < brightnessValues.length; i++) {
        variance += Math.pow(brightnessValues[i] - avgBrightness, 2);
      }
      variance /= pixelCount;
      const contrast = Math.sqrt(variance);
      
      const quality = {
        brightness: avgBrightness,
        contrast: contrast,
        isLowLight: avgBrightness < 80,
        isHighLight: avgBrightness > 180,
        isLowContrast: contrast < 20
      };
      
      return quality;
    } catch (error) {
      console.error('Error analyzing camera quality:', error);
      return {
        brightness: 128,
        contrast: 30,
        isLowLight: false,
        isHighLight: false,
        isLowContrast: false
      };
    }
  }

  function calculateSkinToneCategory(skinColor) {
    if (!skinColor) return 'medium';
    
    const lightness = (skinColor.r + skinColor.g + skinColor.b) / 3;
    
    if (lightness < 80) return 'dark';
    if (lightness < 140) return 'medium';
    if (lightness < 200) return 'light';
    return 'very-light';
  }

  function calculatePerspectiveTransform(kpts, placement, targetCoords) {
    const by = (n) => kpts.find(p => p.name === n);
    let rotateX = 0;
    let rotateY = 0;
    let rotateZ = 0;
    let scaleX = 1;
    let scaleY = 1;
    let perspective = 1000;
    
    switch (placement) {
      case "face": {
        const N = by("nose");
        const LE = by("left_eye");
        const RE = by("right_eye");
        const LEar = by("left_ear");
        const REar = by("right_ear");
        
        if (LE && RE && N) {
          const eyeDistance = Math.sqrt(Math.pow(RE.x - LE.x, 2) + Math.pow(RE.y - LE.y, 2));
          const eyeMidX = (LE.x + RE.x) / 2;
          const eyeMidY = (LE.y + RE.y) / 2;
          
          const headYaw = Math.atan2(RE.y - LE.y, RE.x - LE.x) * 180 / Math.PI;
          rotateY = (headYaw - 90) * 0.3;
          
          if (N) {
            const noseOffsetY = N.y - eyeMidY;
            const noseOffsetX = N.x - eyeMidX;
            rotateX = (noseOffsetY / eyeDistance) * 15;
            rotateZ = (noseOffsetX / eyeDistance) * 10;
          }
          
          if (LEar && REar) {
            const earDistance = Math.sqrt(Math.pow(REar.x - LEar.x, 2) + Math.pow(REar.y - LEar.y, 2));
            const depthRatio = eyeDistance / (earDistance + 1);
            scaleX = 0.95 + (depthRatio - 1) * 0.1;
            scaleY = 0.95 + (depthRatio - 1) * 0.1;
          }
          
          perspective = 800 + eyeDistance * 2;
        }
        break;
      }
      case "left-cheek":
      case "right-cheek": {
        const LE = by("left_eye");
        const RE = by("right_eye");
        const N = by("nose");
        
        if (LE && RE && N) {
          const eyeDistance = Math.sqrt(Math.pow(RE.x - LE.x, 2) + Math.pow(RE.y - LE.y, 2));
          const headYaw = Math.atan2(RE.y - LE.y, RE.x - LE.x) * 180 / Math.PI;
          
          if (placement === "left-cheek") {
            rotateY = (headYaw - 90) * 0.5 + 15;
            rotateX = 5;
          } else {
            rotateY = (headYaw - 90) * 0.5 - 15;
            rotateX = 5;
          }
          
          scaleX = 0.92;
          scaleY = 0.92;
          perspective = 700 + eyeDistance * 1.5;
        }
        break;
      }
      case "chest":
      case "neck":
      case "back": {
        const LS = by("left_shoulder");
        const RS = by("right_shoulder");
        
        if (LS && RS) {
          const shoulderDistance = Math.sqrt(Math.pow(RS.x - LS.x, 2) + Math.pow(RS.y - LS.y, 2));
          const shoulderAngle = Math.atan2(RS.y - LS.y, RS.x - LS.x) * 180 / Math.PI;
          
          rotateZ = (shoulderAngle - 90) * 0.4;
          
          if (placement === "chest") {
            rotateX = -8;
            scaleY = 0.94;
          } else if (placement === "back") {
            rotateX = 8;
            scaleY = 0.94;
          }
          
          perspective = 600 + shoulderDistance * 2;
        }
        break;
      }
      case "left-shoulder":
      case "right-shoulder": {
        const LS = by("left_shoulder");
        const RS = by("right_shoulder");
        const LE = by("left_elbow");
        const RE = by("right_elbow");
        
        if (placement === "left-shoulder" && LS && LE) {
          const armAngle = Math.atan2(LE.y - LS.y, LE.x - LS.x) * 180 / Math.PI;
          rotateZ = (armAngle - 90) * 0.3;
          rotateX = -10;
          scaleX = 0.90;
          scaleY = 0.90;
        } else if (placement === "right-shoulder" && RS && RE) {
          const armAngle = Math.atan2(RE.y - RS.y, RE.x - RS.x) * 180 / Math.PI;
          rotateZ = (armAngle - 90) * 0.3;
          rotateX = -10;
          scaleX = 0.90;
          scaleY = 0.90;
        }
        break;
      }
    }
    
    return {
      rotateX: Math.max(-25, Math.min(25, rotateX)),
      rotateY: Math.max(-25, Math.min(25, rotateY)),
      rotateZ: Math.max(-15, Math.min(15, rotateZ)),
      scaleX: Math.max(0.85, Math.min(1.1, scaleX)),
      scaleY: Math.max(0.85, Math.min(1.1, scaleY)),
      perspective: Math.max(500, Math.min(1500, perspective))
    };
  }

  function applyRealisticBlending(skinColor, cameraQuality, overlayElement) {
    if (!overlayElement || !skinColor || !cameraQuality) {
      overlayElement.style.opacity = '0.65';
      overlayElement.style.mixBlendMode = 'darken';
      overlayElement.style.filter = 'contrast(110%) brightness(103%) saturate(105%)';
      return;
    }
    
    const skinTone = calculateSkinToneCategory(skinColor);
    const skinLightness = (skinColor.r + skinColor.g + skinColor.b) / 3;
    const maxColor = Math.max(skinColor.r, skinColor.g, skinColor.b);
    const minColor = Math.min(skinColor.r, skinColor.g, skinColor.b);
    
    let opacity = 0.55;
    let blendMode = 'darken';
    let brightness = 0;
    let contrast = 0;
    let saturation = 0;
    let sepia = 0;
    
    const skinSaturation = maxColor > 0 ? (maxColor - minColor) / maxColor : 0;
    
    if (cameraQuality.isLowLight) {
      opacity = 0.50;
      brightness = 10;
      contrast = 10;
      saturation += 5;
    } else if (cameraQuality.isHighLight) {
      opacity = 0.60;
      brightness = -8;
      contrast = 8;
      saturation -= 3;
    }
    
    if (cameraQuality.isLowContrast) {
      contrast += 15;
      saturation += 10;
    }
    
    switch (skinTone) {
      case 'dark':
        opacity = 0.60;
        blendMode = 'darken';
        brightness += 8;
        contrast += 12;
        saturation += 12;
        sepia = 8;
        break;
      case 'medium':
        opacity = 0.55;
        blendMode = 'darken';
        brightness += 5;
        contrast += 10;
        saturation += 8;
        sepia = 5;
        break;
      case 'light':
        opacity = 0.52;
        blendMode = 'multiply';
        brightness += 2;
        contrast += 8;
        saturation += 5;
        sepia = 3;
        break;
      case 'very-light':
        opacity = 0.48;
        blendMode = 'multiply';
        brightness -= 3;
        contrast += 6;
        saturation += 3;
        sepia = 2;
        break;
    }
    
    const skinTintOpacity = Math.min(0.25, Math.max(0, skinSaturation * 0.3));
    const skinTint = `rgba(${Math.round(Math.max(0, Math.min(255, skinColor.r)))}, ${Math.round(Math.max(0, Math.min(255, skinColor.g)))}, ${Math.round(Math.max(0, Math.min(255, skinColor.b)))}, ${skinTintOpacity})`;
    
    overlayElement.style.opacity = Math.max(0.4, Math.min(0.7, opacity)).toString();
    overlayElement.style.mixBlendMode = blendMode;
    
    const filters = [];
    if (brightness !== 0) filters.push(`brightness(${100 + brightness}%)`);
    if (contrast !== 0) filters.push(`contrast(${100 + contrast}%)`);
    if (saturation !== 0) filters.push(`saturate(${100 + saturation}%)`);
    if (sepia > 0) filters.push(`sepia(${sepia}%)`);
    
    overlayElement.style.filter = filters.length > 0 ? filters.join(' ') : 'contrast(110%) brightness(103%) saturate(105%)';
    
    const shadowBlur = Math.max(2, Math.min(8, skinLightness / 30));
    const shadowSpread = Math.max(1, Math.round(shadowBlur / 4));
    overlayElement.style.boxShadow = `inset 0 0 ${shadowBlur}px ${shadowSpread}px ${skinTint}`;
  }

  async function detect() {
    if (!videoReady || video.videoWidth === 0 || video.videoHeight === 0) {
      requestAnimationFrame(detect);
      return;
    }

    detectionCanvas.width = video.videoWidth;
    detectionCanvas.height = video.videoHeight;
    detectionCtx.drawImage(video, 0, 0);

    frameCount++;
    
    if (frameCount % 60 === 0) {
      cameraQualityCache = analyzeCameraQuality();
    }

    let poses = [];
    try {
      poses = await detector.estimatePoses(detectionCanvas);
      consecutiveErrors = 0;
    } catch (error) {
      consecutiveErrors++;
      
      if (consecutiveErrors >= 10) {
        alert("AI detection failed. The tattoo feature will work in manual mode. Click a tattoo and drag it to position it.");
        return;
      }
      
      requestAnimationFrame(detect);
      return;
    }

    const placement = placementSelect.value;
    const haveBasics = !!selectedTattooSrc && !!placement;

    let target = null;
    if (poses.length > 0 && haveBasics) {
      target = coordsForPlacement(poses[0].keypoints, placement);
      
      if (target && frameCount - lastSkinColorUpdate >= SKIN_COLOR_UPDATE_INTERVAL) {
        const placementKpts = poses[0].keypoints;
        const by = (n) => placementKpts.find(p => p.name === n);
        let videoX = null, videoY = null;
        
        const placement = placementSelect.value;
        switch (placement) {
          case "face": {
            const N = by("nose");
            if (N) { videoX = N.x; videoY = N.y; }
            break;
          }
          case "chest": case "neck": case "back": {
            const L = by("left_shoulder"), R = by("right_shoulder");
            if (L && R) { videoX = (L.x + R.x) / 2; videoY = (L.y + R.y) / 2; }
            break;
          }
          default: {
            const keypoint = by(placement.replace("-", "_"));
            if (keypoint) { videoX = keypoint.x; videoY = keypoint.y; }
            break;
          }
        }
        
        if (videoX !== null && videoY !== null) {
          const sampledColor = sampleSkinColor(videoX, videoY, 0, 0);
          if (sampledColor) {
            skinColorCache = sampledColor;
            lastSkinColorUpdate = frameCount;
          }
        }
      }
    }

    if (haveBasics && target) {
      let x, y;
      
      if (prevX == null || prevY == null) {
        x = target.x;
        y = target.y;
      } else {
        const rawX = prevX + alpha * (target.x - prevX);
        const rawY = prevY + alpha * (target.y - prevY);
        
        const dx = Math.abs(rawX - prevX);
        const dy = Math.abs(rawY - prevY);
        
        if (dx < MIN_MOVEMENT_THRESHOLD && dy < MIN_MOVEMENT_THRESHOLD) {
          x = prevX;
          y = prevY;
        } else {
          x = rawX;
          y = rawY;
        }
      }

      if (!overlayShown) {
        overlay.src = selectedTattooSrc;
        overlay.style.display = "block";
        setOverlayWidth(pendingSize);
        overlayShown = true;
      }

      overlay.style.left = `${x}px`;
      overlay.style.top  = `${y}px`;
      
      const isFrontCamera = currentFacingMode === "user";
      const mirrorScaleX = isFrontCamera ? -1 : 1;
      
      let perspectiveTransform = { rotateX: 0, rotateY: 0, rotateZ: 0, scaleX: 1, scaleY: 1, perspective: 1000 };
      
      if (poses.length > 0) {
        const placement = placementSelect.value;
        const rawTransform = calculatePerspectiveTransform(poses[0].keypoints, placement, target);
        
        perspectiveTransform = {
          rotateX: prevPerspectiveTransform.rotateX + perspectiveAlpha * (rawTransform.rotateX - prevPerspectiveTransform.rotateX),
          rotateY: prevPerspectiveTransform.rotateY + perspectiveAlpha * (rawTransform.rotateY - prevPerspectiveTransform.rotateY),
          rotateZ: prevPerspectiveTransform.rotateZ + perspectiveAlpha * (rawTransform.rotateZ - prevPerspectiveTransform.rotateZ),
          scaleX: prevPerspectiveTransform.scaleX + perspectiveAlpha * (rawTransform.scaleX - prevPerspectiveTransform.scaleX),
          scaleY: prevPerspectiveTransform.scaleY + perspectiveAlpha * (rawTransform.scaleY - prevPerspectiveTransform.scaleY),
          perspective: prevPerspectiveTransform.perspective + perspectiveAlpha * (rawTransform.perspective - prevPerspectiveTransform.perspective)
        };
        
        prevPerspectiveTransform = perspectiveTransform;
      } else {
        perspectiveTransform = prevPerspectiveTransform;
      }
      
      const transformParts = [
        `translate3d(-50%, -50%, 0)`,
        `scaleX(${mirrorScaleX * perspectiveTransform.scaleX})`,
        `scaleY(${perspectiveTransform.scaleY})`,
        `rotateX(${perspectiveTransform.rotateX}deg)`,
        `rotateY(${perspectiveTransform.rotateY}deg)`,
        `rotateZ(${perspectiveTransform.rotateZ}deg)`
      ];
      
      overlay.style.transform = transformParts.join(' ');
      overlay.style.perspective = `${perspectiveTransform.perspective}px`;
      overlay.style.transformStyle = 'preserve-3d';

      try {
        if (skinColorCache && cameraQualityCache) {
          applyRealisticBlending(skinColorCache, cameraQualityCache, overlay);
        } else if (cameraQualityCache) {
          applyRealisticBlending({ r: 128, g: 128, b: 128 }, cameraQualityCache, overlay);
        } else {
          overlay.style.opacity = '0.65';
          overlay.style.mixBlendMode = 'darken';
          overlay.style.filter = 'contrast(110%) brightness(103%) saturate(105%)';
        }
      } catch (error) {
        console.error('Error applying blending:', error);
        overlay.style.opacity = '0.65';
        overlay.style.mixBlendMode = 'darken';
        overlay.style.filter = 'contrast(110%) brightness(103%) saturate(105%)';
      }

      prevX = x; 
      prevY = y;
      framesNoDet = 0;
    } else {
      framesNoDet++;
      if (framesNoDet >= MAX_MISS) {
        overlay.style.display = "none";
        overlayShown = false;
        prevX = prevY = null;
        prevPerspectiveTransform = { rotateX: 0, rotateY: 0, rotateZ: 0, scaleX: 1, scaleY: 1, perspective: 1000 };
      }
    }

    requestAnimationFrame(detect);
  }

  async function startDetectionWhenReady() {
    let attempts = 0;
    while ((!videoReady || video.videoWidth === 0 || video.readyState < 3) && attempts < 100) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (attempts >= 100) {
      alert("Camera failed to start properly. Please refresh the page.");
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    detectionCanvas.width = video.videoWidth;
    detectionCanvas.height = video.videoHeight;
    detectionCtx.drawImage(video, 0, 0);
    cameraQualityCache = analyzeCameraQuality();
    
    detect();
  }
  
  startDetectionWhenReady();
}

initMoveNet();
