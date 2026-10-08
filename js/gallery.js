import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC5OGf8nc85I9cw1SQW65oJbSJDAtLLoW4",
  authDomain: "realpainbooking.firebaseapp.com",
  projectId: "realpainbooking",
  storageBucket: "realpainbooking.firebasestorage.app",
  messagingSenderId: "584949331159",
  appId: "1:584949331159:web:8ea35b28ab22388871ec92"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentLightboxIndex = 0;
let currentCategory = 'all';
let allGalleryItems = [];
let galleryData = [];

document.addEventListener('DOMContentLoaded', async function() {
    await loadGalleryFromFirebase();
    setupGalleryFilters();
    setupLightbox();
    setupGalleryAnimations();
});

async function loadGalleryFromFirebase() {
    const galleryGrid = document.getElementById('galleryGrid');
    
    if (!galleryGrid) return;
    
    galleryGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 60px;"><i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #1a1a1a;"></i><p style="margin-top: 20px; color: #666;">Loading gallery...</p></div>';
    
    try {
        const q = query(collection(db, 'gallery'), orderBy('uploadedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        galleryData = [];
        querySnapshot.forEach((doc) => {
            galleryData.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        if (galleryData.length === 0) {
            galleryGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 80px;"><i class="fas fa-images" style="font-size: 4rem; color: #ddd;"></i><h3 style="margin-top: 20px; color: #333;">No images in gallery yet</h3><p style="color: #666;">Check back soon for amazing tattoo art!</p></div>';
            return;
        }
        
        galleryGrid.innerHTML = '';
        
        galleryData.forEach((image) => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            galleryItem.setAttribute('data-category', image.category);
            galleryItem.setAttribute('data-date', image.date);
            
            const formattedDate = new Date(image.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            
            galleryItem.innerHTML = `
                <img src="${image.imageUrl}" alt="${image.category} Tattoo" onclick="openLightbox(this)">
                <div class="item-overlay">
                    <div class="overlay-content">
                        <p>${formattedDate}</p>
                        <i class="fas fa-search-plus"></i>
                    </div>
                </div>
            `;
            
            galleryGrid.appendChild(galleryItem);
        });
        
        allGalleryItems = Array.from(document.querySelectorAll('.gallery-item'));
        
        const statsNumber = document.querySelector('.hero-stats .stat .stat-number');
        if (statsNumber) {
            statsNumber.textContent = galleryData.length + '+';
        }
        
    } catch (error) {
        console.error('Error loading gallery from Firebase:', error);
        galleryGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 60px;"><i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #dc3545;"></i><p style="margin-top: 20px; color: #666;">Error loading gallery. Please refresh the page.</p></div>';
    }
}

// Set up gallery filters
function setupGalleryFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    allGalleryItems = Array.from(document.querySelectorAll('.gallery-item'));
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Get category
            currentCategory = button.dataset.category;
            
            // Filter gallery items
            filterGallery(currentCategory);
            
            console.log('Gallery filtered by:', currentCategory);
        });
    });
}

// Filter gallery items
function filterGallery(category) {
    allGalleryItems.forEach((item, index) => {
        const itemCategory = item.dataset.category;
        
        if (category === 'all' || itemCategory === category) {
            item.style.display = 'block';
            // Add staggered animation
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 100);
        } else {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            setTimeout(() => {
                item.style.display = 'none';
            }, 300);
        }
    });
}

// Set up gallery animations
function setupGalleryAnimations() {
    // Animate gallery items on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    allGalleryItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(30px)';
        item.style.transition = 'all 0.6s ease';
        observer.observe(item);
    });
}

// Enhanced lightbox functionality
function setupLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxDate = document.getElementById('lightbox-date');
    
    // Close lightbox when clicking outside
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (lightbox.style.display === 'flex') {
            switch(e.key) {
                case 'Escape':
                    closeLightbox();
                    break;
                case 'ArrowLeft':
                    previousImage();
                    break;
                case 'ArrowRight':
                    nextImage();
                    break;
            }
        }
    });
}

// Open lightbox
function openLightbox(imgElement) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxDate = document.getElementById('lightbox-date');
    
    // Find current image index
    const galleryItem = imgElement.closest('.gallery-item');
    const visibleItems = allGalleryItems.filter(item => 
        item.style.display !== 'none' && 
        (currentCategory === 'all' || item.dataset.category === currentCategory)
    );
    
    currentLightboxIndex = visibleItems.indexOf(galleryItem);
    
    // Set lightbox content
    lightboxImg.src = imgElement.src;
    lightboxDate.textContent = galleryItem.querySelector('p').textContent;
    
    // Show lightbox
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    console.log('Lightbox opened for image:', currentLightboxIndex);
}

// Close lightbox
function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
}

// Navigate to previous image
function previousImage() {
    const visibleItems = allGalleryItems.filter(item => 
        item.style.display !== 'none' && 
        (currentCategory === 'all' || item.dataset.category === currentCategory)
    );
    
    currentLightboxIndex = (currentLightboxIndex - 1 + visibleItems.length) % visibleItems.length;
    updateLightboxImage(visibleItems[currentLightboxIndex]);
}

// Navigate to next image
function nextImage() {
    const visibleItems = allGalleryItems.filter(item => 
        item.style.display !== 'none' && 
        (currentCategory === 'all' || item.dataset.category === currentCategory)
    );
    
    currentLightboxIndex = (currentLightboxIndex + 1) % visibleItems.length;
    updateLightboxImage(visibleItems[currentLightboxIndex]);
}

// Update lightbox image
function updateLightboxImage(galleryItem) {
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxDate = document.getElementById('lightbox-date');
    
    const img = galleryItem.querySelector('img');
    const date = galleryItem.querySelector('p');
    
    lightboxImg.src = img.src;
    lightboxDate.textContent = date.textContent;
}

// Share tattoo functionality
function shareTattoo() {
    const lightboxDate = document.getElementById('lightbox-date');
    const date = lightboxDate.textContent;
    
    if (navigator.share) {
        navigator.share({
            title: `Tattoo from ${date} - Real Pain Tattoo Studio`,
            text: `Check out this amazing tattoo from ${date}`,
            url: window.location.href
        });
    } else {
        // Fallback for browsers that don't support Web Share API
        const shareUrl = window.location.href;
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('Gallery link copied to clipboard!');
        }).catch(() => {
            alert('Share feature not supported in this browser.');
        });
    }
}

// Book similar tattoo
function bookSimilar() {
    const lightboxDate = document.getElementById('lightbox-date');
    const date = lightboxDate.textContent;
    
    // Store the reference tattoo in session storage
    sessionStorage.setItem('referenceTattoo', `Tattoo from ${date}`);
    sessionStorage.setItem('referenceImage', document.getElementById('lightbox-img').src);
    
    alert(`Great choice! This tattoo from ${date} will be used as reference for your booking.`);
    window.location.href = 'book-now.html';
}

// Make functions available globally
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.previousImage = previousImage;
window.nextImage = nextImage;
window.shareTattoo = shareTattoo;
window.bookSimilar = bookSimilar;