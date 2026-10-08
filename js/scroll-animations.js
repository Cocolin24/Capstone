/* ========== SCROLL ANIMATIONS HANDLER ========== */

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const element = entry.target;
            const delay = element.dataset.delay || 0;
            
            setTimeout(() => {
                element.classList.add('animate');
            }, delay * 1000);
            
            // Stop observing once animated
            observer.unobserve(element);
        }
    });
}, observerOptions);

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Observe all scroll-animate elements
    const animatedElements = document.querySelectorAll('.scroll-animate');
    animatedElements.forEach(el => {
        observer.observe(el);
    });
    
    // Add floating animation to some elements
    const floatingElements = document.querySelectorAll('.fa-location-dot, .book-btn');
    floatingElements.forEach(el => {
        el.classList.add('floating');
    });
    
    // Enhanced hover effects for buttons
    const buttons = document.querySelectorAll('.book-btn, .team-btn, .gallery-btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1) translateY(-2px)';
            this.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) translateY(0)';
            this.style.boxShadow = 'none';
        });
    });
    
    // Parallax effect for hero section
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        if (hero) {
            const speed = scrolled * 0.5;
            hero.style.backgroundPosition = `center ${speed}px`;
        }
    });
    
    // Add stagger animation to gallery items
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach((item, index) => {
        item.addEventListener('mouseenter', function() {
            // Animate neighboring items slightly
            if (galleryItems[index - 1]) {
                galleryItems[index - 1].style.transform = 'scale(1.02)';
            }
            if (galleryItems[index + 1]) {
                galleryItems[index + 1].style.transform = 'scale(1.02)';
            }
        });
        
        item.addEventListener('mouseleave', function() {
            // Reset neighboring items
            if (galleryItems[index - 1]) {
                galleryItems[index - 1].style.transform = 'scale(1)';
            }
            if (galleryItems[index + 1]) {
                galleryItems[index + 1].style.transform = 'scale(1)';
            }
        });
    });
    
    // Add ripple effect to clickable elements
    const clickableElements = document.querySelectorAll('.gallery-item, .studio-item');
    clickableElements.forEach(element => {
        element.addEventListener('click', function(e) {
            const ripple = document.createElement('div');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
                z-index: 1000;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
});

// Add ripple animation CSS
const rippleCSS = `
@keyframes ripple {
    to {
        transform: scale(2);
        opacity: 0;
    }
}
`;

const style = document.createElement('style');
style.textContent = rippleCSS;
document.head.appendChild(style);

// Smooth scroll behavior for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Back to Top Button Functionality
window.addEventListener('scroll', function() {
    const backToTopBtn = document.getElementById('backToTopBtn');
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Show button after scrolling 300px
    if (scrollTop > 300) {
        if (!backToTopBtn.classList.contains('show')) {
            backToTopBtn.classList.add('show');
        }
    } else {
        backToTopBtn.classList.remove('show');
    }
    
    // Parallax effect for hero section (existing code)
    const hero = document.querySelector('.hero');
    if (hero) {
        const speed = scrollTop * 0.5;
        hero.style.backgroundPosition = `center ${speed}px`;
    }
});

// Smooth scroll to top function
window.scrollToTop = function() {
    const backToTopBtn = document.getElementById('backToTopBtn');
    
    // Add click animation
    backToTopBtn.style.transform = 'scale(0.9)';
    setTimeout(() => {
        backToTopBtn.style.transform = '';
    }, 150);
    
    // Smooth scroll to top
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    
    // Add a little celebration effect
    const celebration = document.createElement('div');
    celebration.innerHTML = '✨';
    celebration.style.cssText = `
        position: fixed;
        bottom: 215px;
        right: 45px;
        font-size: 20px;
        pointer-events: none;
        z-index: 1001;
        animation: celebrate 1s ease-out forwards;
    `;
    
    document.body.appendChild(celebration);
    
    setTimeout(() => {
        celebration.remove();
    }, 1000);
};

// Add celebration animation CSS
const celebrationCSS = `
@keyframes celebrate {
    0% {
        transform: scale(0) rotate(0deg);
        opacity: 1;
    }
    50% {
        transform: scale(1.5) rotate(180deg);
        opacity: 1;
    }
    100% {
        transform: scale(0) rotate(360deg);
        opacity: 0;
    }
}
`;

const celebrationStyle = document.createElement('style');
celebrationStyle.textContent = celebrationCSS;
document.head.appendChild(celebrationStyle);

/* ========== IMAGE POPUP FUNCTIONALITY ========== */

// Open image popup
window.openImagePopup = function(imgElement) {
    const popup = document.getElementById('imagePopup');
    const popupImage = document.getElementById('popupImage');
    const popupTitle = document.getElementById('popupTitle');
    const popupDesc = document.getElementById('popupDescription');
    const popupButtons = document.querySelector('.popup-buttons');
    
    // Set image source and alt text
    popupImage.src = imgElement.src;
    popupImage.alt = imgElement.alt;
    // Decide UI based on image type (gallery vs studio)
    const isStudioPhoto = imgElement.classList.contains('studio-item');
    popupTitle.textContent = isStudioPhoto ? (imgElement.alt || 'Studio Photo') : (imgElement.alt || 'Tattoo Artwork');

    // For studio photos, hide action buttons (you can’t tattoo the studio!)
    if (isStudioPhoto) {
        if (popupButtons) popupButtons.style.display = 'none';
        if (popupDesc) popupDesc.textContent = '';
    } else {
        if (popupButtons) popupButtons.style.display = 'flex';
        if (popupDesc) popupDesc.textContent = 'Click the buttons below to take action';
    }
    
    // Show popup with animation
    popup.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    // Add click outside to close
    popup.addEventListener('click', function(e) {
        if (e.target === popup) {
            closeImagePopup();
        }
    });
    
    // Add escape key to close
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeImagePopup();
        }
    });
};

// Close image popup
window.closeImagePopup = function() {
    const popup = document.getElementById('imagePopup');
    popup.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
};

// Book with reference image
window.bookWithReference = function() {
    const popupImage = document.getElementById('popupImage');
    
    // Store reference image in session storage
    sessionStorage.setItem('referenceTattoo', 'Homepage Gallery');
    sessionStorage.setItem('referenceImage', popupImage.src);
    
    // Show confirmation
    const confirmation = document.createElement('div');
    confirmation.innerHTML = '✨ Reference saved! Redirecting to booking...';
    confirmation.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(45deg, #666, #999);
        color: white;
        padding: 15px 30px;
        border-radius: 15px;
        font-weight: bold;
        z-index: 10002;
        animation: bounceIn 0.5s ease-out;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    `;
    
    document.body.appendChild(confirmation);
    
    setTimeout(() => {
        confirmation.remove();
        closeImagePopup();
        window.location.href = 'book-now.html';
    }, 2000);
};

// View full gallery
window.viewFullGallery = function() {
    closeImagePopup();
    window.location.href = 'gallery.html';
};

// Add swipe gestures for mobile
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchend', function(e) {
    if (!document.getElementById('imagePopup').style.display === 'block') return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchStartX - touchEndX;
    const deltaY = touchStartY - touchEndY;
    
    // Swipe down to close popup
    if (deltaY < -50 && Math.abs(deltaX) < 100) {
        closeImagePopup();
    }
});

// Export functions for use in other scripts
window.ScrollAnimations = {
    observer: observer,
    observerOptions: observerOptions,
    scrollToTop: window.scrollToTop,
    openImagePopup: window.openImagePopup,
    closeImagePopup: window.closeImagePopup,
    bookWithReference: window.bookWithReference,
    viewFullGallery: window.viewFullGallery
};
