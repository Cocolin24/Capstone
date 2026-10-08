/* ALL REVIEWS PAGE FUNCTIONALITY */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot
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

document.addEventListener('DOMContentLoaded', function() {
    setupReviewsPage();
    setupScrollToTop();
});

let allReviews = [];
let currentFilter = 'all';

// Set up reviews page
function setupReviewsPage() {
    console.log('Setting up reviews page...');
    
    // Load static reviews
    loadStaticReviews();
    
    // Set up real-time listener for Firebase reviews
    setupFirebaseReviewsListener();
    
    // Set up filter buttons
    setupFilterButtons();
}

// Load static reviews
function loadStaticReviews() {
    const staticReviews = [
        {
            name: "Cheska Rivera",
            rating: 5,
            message: "First time ko magpa-tattoo and medyo kinakabahan ako pero super accommodating sila. Chill lang yung vibe, at hindi intimidating. Medyo natagalan lang sa sketch pero worth it naman. Thank you Real Pain fam!",
            timestamp: "2024-01-15T10:00:00Z",
            isStatic: true
        },
        {
            name: "Rafael Ramos",
            rating: 5,
            message: "Astig ng unang tattoo ko, medyo kinakabahan pa ako pero yung artist, super chill lang. Hindi ko ramdam ang sakit! Ang ganda ng design ko. Salamat!",
            timestamp: "2024-01-20T14:30:00Z",
            isStatic: true
        },
        {
            name: "Carlos Santos",
            rating: 5,
            message: "Tapos na ang first tattoo ko! Ang sakit pero worth it. Salamat sa awesome service, cool ng mga tao dito",
            timestamp: "2024-02-05T16:45:00Z",
            isStatic: true
        },
        {
            name: "Maria Reyes",
            rating: 5,
            message: "First time ko magpa-tattoo and di ako na-disappoint! Relax lang yung vibe, di intimidating. Sobrang happy ko sa outcome, malupet!",
            timestamp: "2024-02-10T11:20:00Z",
            isStatic: true
        },
        {
            name: "Jacob Dela Cruz",
            rating: 5,
            message: "Happy ako sa tattoo ko! Ang galing ng artist dito, sobrang detailed. Hindi ako nagkamali na dito ko pinagawa. Highly recommended!",
            timestamp: "2024-02-15T13:15:00Z",
            isStatic: true
        },
        {
            name: "Olivia Santos",
            rating: 5,
            message: "Kung gusto niyo ng tattoo na parang obra, si Rovic ang go-to artist nyo! Hindi lang siya magaling, kundi talagang pinag-iisipan niya yung design. Ang linis ng shop at chill sila. Ganda ng vibe. Definitely babalik ako dito!",
            timestamp: "2024-02-20T15:30:00Z",
            isStatic: true
        },
        {
            name: "Samantha R",
            rating: 5,
            message: "Si Rovic talagang magaling! Nagpa-tattoo ako dito sa Real Pain and sobrang saya ko sa ginawa niya. Pinakita ko lang yung idea ko, tapos binigyan niya ng sariling style, kaya sobrang ganda! Lahat ng detalye super crisp. Tapos yung shop, chill lang, hindi ka kabado. Highly recommend!",
            timestamp: "2024-02-25T17:45:00Z",
            isStatic: true
        },
        {
            name: "Kyle Mendoza",
            rating: 5,
            message: "First tattoo ko kaya medyo kinakabahan ako, pero si Rovic, sobrang chill kausap. Tinulungan niya ako magdecide ng design na bagay sa akin. Tapos ang ganda ng kinalabasan, talagang worth it. Hindi lang siya magaling, pati ang vibe ng studio, sobrang welcoming!",
            timestamp: "2024-03-01T12:00:00Z",
            isStatic: true
        }
    ];
    
    allReviews = [...staticReviews];
    displayReviews();
    updateStats();
}

// Set up Firebase reviews listener
function setupFirebaseReviewsListener() {
    try {
        const reviewsQuery = query(
            collection(db, 'reviews'),
            where('status', '==', 'approved')
        );
        
        onSnapshot(reviewsQuery, (snapshot) => {
            console.log('Received Firebase reviews update:', snapshot.size, 'approved reviews');
            
            // Remove existing Firebase reviews and add new ones
            allReviews = allReviews.filter(review => review.isStatic);
            
            snapshot.forEach((doc) => {
                const review = { id: doc.id, ...doc.data(), isStatic: false };
                allReviews.push(review);
            });
            
            // Sort all reviews by timestamp (newest first)
            allReviews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            displayReviews();
            updateStats();
        });
        
    } catch (error) {
        console.error('Error setting up Firebase reviews listener:', error);
    }
}

// Display reviews based on current filter
function displayReviews() {
    const reviewsGrid = document.getElementById('allReviewsGrid');
    const noReviewsMessage = document.getElementById('noReviewsMessage');
    
    if (!reviewsGrid) return;
    
    let filteredReviews = allReviews;
    
    // Apply rating filter
    if (currentFilter !== 'all') {
        filteredReviews = allReviews.filter(review => review.rating === parseInt(currentFilter));
    }
    
    if (filteredReviews.length === 0) {
        reviewsGrid.style.display = 'none';
        noReviewsMessage.style.display = 'block';
        return;
    }
    
    reviewsGrid.style.display = 'grid';
    noReviewsMessage.style.display = 'none';
    
    reviewsGrid.innerHTML = '';
    
    filteredReviews.forEach((review, index) => {
        const reviewCard = document.createElement('div');
        reviewCard.className = `review-card ${!review.isStatic ? 'firebase-review' : ''}`;
        reviewCard.style.animationDelay = `${index * 0.1}s`;
        
        const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        const date = new Date(review.timestamp).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const photoHTML = review.photoUrl ? `
            <div class="review-photo">
                <img src="${review.photoUrl}" alt="${review.name}'s tattoo" loading="lazy">
            </div>
        ` : '';
        
        reviewCard.innerHTML = `
            <p class="name">${review.name}</p>
            <p class="stars">${stars}</p>
            <p class="message">${review.message}</p>
            ${photoHTML}
            <p class="review-date">${date}</p>
        `;
        
        reviewsGrid.appendChild(reviewCard);
    });
    
    console.log('Displayed', filteredReviews.length, 'reviews');
}

// Update statistics
function updateStats() {
    const totalReviewsEl = document.getElementById('totalReviews');
    const averageRatingEl = document.getElementById('averageRating');
    const fiveStarReviewsEl = document.getElementById('fiveStarReviews');
    
    const approvedReviews = allReviews.filter(review => review.rating > 0);
    const totalReviews = approvedReviews.length;
    const averageRating = totalReviews > 0 ? 
        (approvedReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1) : 0;
    const fiveStarReviews = approvedReviews.filter(review => review.rating === 5).length;
    
    if (totalReviewsEl) totalReviewsEl.textContent = totalReviews;
    if (averageRatingEl) averageRatingEl.textContent = averageRating;
    if (fiveStarReviewsEl) fiveStarReviewsEl.textContent = fiveStarReviews;
}

// Set up filter buttons
function setupFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Update current filter
            currentFilter = button.dataset.rating;
            
            // Display filtered reviews
            displayReviews();
            
            console.log('Filter changed to:', currentFilter);
        });
    });
}

// Set up scroll to top functionality
function setupScrollToTop() {
    const backToTopBtn = document.getElementById('backToTopBtn');
    
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });
    }
}

// Scroll to top function
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Make functions available globally
window.scrollToTop = scrollToTop;
