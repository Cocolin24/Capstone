/* UNIVERSAL LOADING SCREEN FUNCTIONALITY */

// Create and show loading screen
function showLoadingScreen() {
    // Create loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.id = 'loadingOverlay';
    
    const isInAdminFolder = window.location.pathname.includes('/admin/');
    const logoPath = isInAdminFolder ? 'image/rplogo.png' : 'admin/image/rplogo.png';
    
    loadingOverlay.innerHTML = `
        <!-- Ink Drops Background -->
        <div class="ink-drops">
            <div class="ink-drop"></div>
            <div class="ink-drop"></div>
            <div class="ink-drop"></div>
            <div class="ink-drop"></div>
            <div class="ink-drop"></div>
            <div class="ink-drop"></div>
            <div class="ink-drop"></div>
            <div class="ink-drop"></div>
        </div>
        
        <!-- Loading Content -->
        <div class="loading-content">
            <img src="${logoPath}" alt="Real Pain Logo" class="loading-logo">
            <div class="loading-title">REAL PAIN</div>
            <div class="loading-subtitle">TATTOO STUDIO</div>
            
            <div class="loading-progress">
                <div class="loading-progress-bar"></div>
            </div>
            
            <div class="loading-text">Loading your experience...</div>
        </div>
        
        <!-- Tattoo Needle Animation -->
        <div class="needle-animation">
            <div class="needle"></div>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(loadingOverlay);
    
    // Hide loading screen after 1.5 seconds
    setTimeout(() => {
        hideLoadingScreen();
    }, 1500);
}

// Hide loading screen with smooth transition
function hideLoadingScreen() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
        
        // Remove from DOM after transition
        setTimeout(() => {
            if (loadingOverlay.parentNode) {
                loadingOverlay.parentNode.removeChild(loadingOverlay);
            }
        }, 500);
    }
}

// Initialize loading screen immediately
document.addEventListener('DOMContentLoaded', function() {
    // Only show loading if not already shown (prevents double loading)
    if (!sessionStorage.getItem('loadingShown')) {
        showLoadingScreen();
        sessionStorage.setItem('loadingShown', 'true');
        
        // Clear the flag after a short time so it shows on next visit
        setTimeout(() => {
            sessionStorage.removeItem('loadingShown');
        }, 3000);
    }
});

// Show loading on page navigation (when coming from other pages)
window.addEventListener('beforeunload', function() {
    sessionStorage.removeItem('loadingShown');
});

// Show loading when navigating from other pages
window.addEventListener('pageshow', function(event) {
    // If page is loaded from cache (back/forward navigation)
    if (event.persisted) {
        showLoadingScreen();
    }
});

// Make functions available globally
window.showLoadingScreen = showLoadingScreen;
window.hideLoadingScreen = hideLoadingScreen;
