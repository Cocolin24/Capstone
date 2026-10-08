import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
  limit,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

// FIREBASE CONFIG
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

// UI REFERENCES
const reviewForm = document.getElementById('reviewForm');
const reviewPanel = document.getElementById('reviewPanel');
const openReviewBtn = document.getElementById('openReview');
const closeReviewBtn = document.getElementById('closeReview');
const reviewGrid = document.getElementById('reviewGrid');
const newsletterForm = document.getElementById('newsletterForm');

// Load reviews when page loads and set up real-time updates
document.addEventListener('DOMContentLoaded', function() {
  setupReviewsListener();
  checkARFeatureStatus(); // Check if AR feature is enabled
  
  // Review panel controls
  if (openReviewBtn) {
    openReviewBtn.addEventListener('click', function(e) {
      e.preventDefault();
      reviewPanel.style.display = 'block';
    });
  }
  
  if (closeReviewBtn) {
    closeReviewBtn.addEventListener('click', function() {
      reviewPanel.style.display = 'none';
      reviewForm.reset();
    });
  }
  
  // Review form submission
  if (reviewForm) {
    reviewForm.addEventListener('submit', handleReviewSubmission);
  }
  
  // Newsletter form submission
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', handleNewsletterSubmission);
  }
  
  // Check and hide/show reCAPTCHA based on Firebase setting
  checkCaptchaSetting();
});

async function checkCaptchaSetting() {
  try {
    const captchaSettingsRef = doc(db, "settings", "captchaFeature");
    
    const updateCaptchaDisplay = (captchaDoc) => {
      let captchaEnabled = true;
      if (captchaDoc && captchaDoc.exists()) {
        captchaEnabled = captchaDoc.data().enabled;
      }
      
      const recaptchaContainer = document.querySelector('.recaptcha-container');
      if (recaptchaContainer) {
        if (captchaEnabled) {
          recaptchaContainer.style.display = 'flex';
        } else {
          recaptchaContainer.style.display = 'none';
        }
        console.log('reCAPTCHA display updated:', captchaEnabled ? 'shown' : 'hidden');
      } else {
        console.log('reCAPTCHA container not found');
      }
    };
    
    const captchaDoc = await getDoc(captchaSettingsRef);
    updateCaptchaDisplay(captchaDoc);
    
    onSnapshot(captchaSettingsRef, (doc) => {
      updateCaptchaDisplay(doc);
    });
    
  } catch (error) {
    console.error('Error checking captcha setting:', error);
  }
}

function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

function generateVerificationToken() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Date.now().toString(36);
}

function getBasePath() {
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  
  if (isLocalhost) {
    // On localhost, include the capstone_revision folder
    return `${window.location.origin}/capstone_revision`;
  } else {
    // On production (realpaintattoo.ink), use root
    return window.location.origin;
  }
}

function validateEmail(email) {
  if (!email) {
    return 'Please enter your email address.';
  }
  
  if (!email.includes('@')) {
    return 'Email must contain @ symbol.';
  }
  
  if (!email.includes('.')) {
    return 'Email must contain a domain (e.g., @gmail.com).';
  }
  
  if (email.indexOf('@') === 0) {
    return 'Email cannot start with @ symbol.';
  }
  
  if (email.indexOf('@') === email.length - 1) {
    return 'Email cannot end with @ symbol.';
  }
  
  const parts = email.split('@');
  if (parts.length !== 2) {
    return 'Invalid email format.';
  }
  
  const [localPart, domain] = parts;
  
  if (!localPart || localPart.trim() === '') {
    return 'Email must have a local part before @.';
  }
  
  if (!domain || domain.trim() === '') {
    return 'Email must have a domain after @.';
  }
  
  if (!domain.includes('.')) {
    return 'Domain must contain at least one dot (e.g., @gmail.com).';
  }
  
  if (domain.indexOf('.') === 0 || domain.indexOf('.') === domain.length - 1) {
    return 'Invalid domain format.';
  }
  
  if (!isValidEmail(email)) {
    return 'Please enter a valid email address (e.g., example@gmail.com).';
  }
  
  return null;
}

async function handleNewsletterSubmission(e) {
  e.preventDefault();
  
  const email = document.getElementById('newsletterEmail').value.trim();
  const emailInput = document.getElementById('newsletterEmail');
  
  if (!email) {
    alert('Please enter your email address.');
    emailInput.style.borderColor = '#dc3545';
    emailInput.style.borderWidth = '2px';
    return;
  }
  
  if (!email.includes('@')) {
    alert('Email must contain @ symbol.');
    emailInput.style.borderColor = '#dc3545';
    emailInput.style.borderWidth = '2px';
    return;
  }
  
  if (!email.includes('.')) {
    alert('Invalid email format. Please enter a valid email with a domain (e.g., example@gmail.com).');
    emailInput.style.borderColor = '#dc3545';
    emailInput.style.borderWidth = '2px';
    return;
  }
  
  const parts = email.split('@');
  if (parts.length !== 2) {
    alert('Invalid email format.');
    emailInput.style.borderColor = '#dc3545';
    emailInput.style.borderWidth = '2px';
    return;
  }
  
  const domain = parts[1];
  if (!domain || !domain.includes('.')) {
    alert('Invalid email format. Domain must contain a dot (e.g., @gmail.com).');
    emailInput.style.borderColor = '#dc3545';
    emailInput.style.borderWidth = '2px';
    return;
  }
  
  const normalizedEmail = email.toLowerCase().trim();
  
  if (!isValidEmail(normalizedEmail)) {
    alert('Invalid email format. Please enter a valid email address (e.g., example@gmail.com).');
    emailInput.style.borderColor = '#dc3545';
    emailInput.style.borderWidth = '2px';
    return;
  }

  let captchaEnabled = true;
  try {
    const captchaSettingsRef = doc(db, "settings", "captchaFeature");
    const captchaDoc = await getDoc(captchaSettingsRef);
    if (captchaDoc.exists()) {
      captchaEnabled = captchaDoc.data().enabled;
    }
  } catch (error) {
    console.error('Error checking captcha setting:', error);
  }

  if (captchaEnabled) {
    if (typeof grecaptcha === 'undefined') {
      alert("reCAPTCHA is still loading. Please wait a moment and try again.");
      return;
    }
    
    const recaptchaResponse = grecaptcha.getResponse();
    const recaptchaError = document.getElementById('recaptchaError');
    
    if (!recaptchaResponse || recaptchaResponse.length === 0) {
      if (recaptchaError) {
        recaptchaError.style.display = 'block';
      }
      alert("Please complete the reCAPTCHA verification before subscribing.");
      return;
    }
    
    if (recaptchaError) {
      recaptchaError.style.display = 'none';
    }
  }
  
  try {
    const existingQuery = query(
      collection(db, 'newsletter'),
      where('email', '==', normalizedEmail)
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      alert('This email is already subscribed to our newsletter!');
      emailInput.style.borderColor = '#dc3545';
      emailInput.style.borderWidth = '2px';
      if (captchaEnabled && typeof grecaptcha !== 'undefined') {
        grecaptcha.reset();
      }
      return;
    }
  } catch (error) {
    console.error('Error checking existing subscription:', error);
    console.error('Error details:', error.message, error.code);
  }
  
  // Get submit button and add loading state
  const submitButton = newsletterForm.querySelector('button[type="submit"]');
  const originalButtonText = submitButton ? submitButton.textContent : 'SUBMIT';
  
  // Set loading state
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
    submitButton.style.opacity = '0.7';
    submitButton.style.cursor = 'not-allowed';
  }
  
  const verificationToken = generateVerificationToken();
  const basePath = getBasePath();
  const verificationLink = `${basePath}/verify-newsletter.html?token=${verificationToken}&email=${encodeURIComponent(normalizedEmail)}`;
  
  const subscriptionData = {
    email: normalizedEmail,
    subscribedAt: new Date().toISOString(),
    status: 'unverified',
    verificationToken: verificationToken,
    verificationSentAt: new Date().toISOString()
  };
  
  try {
    const docRef = await addDoc(collection(db, 'newsletter'), subscriptionData);
    
    const apiURL = `${basePath}/php/newsletter-subscribe.php`;
    
    console.log('Sending verification email to:', apiURL);
    
    const emailResponse = await fetch(apiURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: normalizedEmail,
        name: 'Valued Customer',
        verificationLink: verificationLink
      })
    });
    
    console.log('Response status:', emailResponse.status);
    
    if (!emailResponse.ok) {
      throw new Error(`HTTP error! status: ${emailResponse.status}`);
    }
    
    const result = await emailResponse.json();
    console.log('Response data:', result);
    
    if (result.success) {
      alert('Thank you for subscribing! 📧\n\nPlease check your email to verify your subscription. Click the verification link in the email to complete your subscription.');
    } else {
      alert('Thank you for subscribing! 📧\n\nPlease check your email inbox (and spam folder) for verification link.');
    }
    
    newsletterForm.reset();
    emailInput.style.borderColor = '';
    emailInput.style.borderWidth = '';
    if (captchaEnabled && typeof grecaptcha !== 'undefined') {
      grecaptcha.reset();
    }
    
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    console.error('Error details:', error.message, error.code);
    alert('Sorry, there was an error subscribing to our newsletter. Error: ' + error.message);
    emailInput.style.borderColor = '#dc3545';
    emailInput.style.borderWidth = '2px';
    if (captchaEnabled && typeof grecaptcha !== 'undefined') {
      grecaptcha.reset();
    }
  } finally {
    // Reset button state
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
      submitButton.style.opacity = '1';
      submitButton.style.cursor = 'pointer';
    }
  }
}

async function uploadImageToCloudinary(file) {
  const CLOUDINARY_CLOUD_NAME = 'dlgborn7e';
  const CLOUDINARY_UPLOAD_PRESET = 'tattoo_uploads';
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    
    if (data.secure_url) {
      return data.secure_url;
    } else {
      throw new Error('Image upload failed');
    }
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}

async function handleReviewSubmission(e) {
  e.preventDefault();
  
  try {
    const nameElement = document.getElementById('reviewerName');
    const ratingElement = document.querySelector('input[name="rating"]:checked');
    const messageElement = document.getElementById('reviewMessage');
    const photoElement = document.getElementById('tattooPhoto');
    
    if (!nameElement || !messageElement) {
      console.error('Form elements not found');
      alert('Form elements not found. Please refresh the page and try again.');
      return;
    }
    
    const name = nameElement.value.trim();
    const rating = ratingElement?.value;
    const message = messageElement.value.trim();
    
    if (!name || !rating || !message) {
      alert('Please fill in all required fields and select a rating.');
      return;
    }

    const reviewData = {
      name: name,
      rating: parseInt(rating),
      message: message,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    if (photoElement && photoElement.files.length > 0) {
      try {
        const imageUrl = await uploadImageToCloudinary(photoElement.files[0]);
        reviewData.photoUrl = imageUrl;
      } catch (uploadError) {
        console.error('Failed to upload photo:', uploadError);
        if (!confirm('Failed to upload photo. Submit review without photo?')) {
          return;
        }
      }
    }
    
    const docRef = await addDoc(collection(db, 'reviews'), reviewData);
    
    alert('Thank you for your review! It has been submitted and is awaiting admin approval before appearing on the website.');
    
    if (reviewForm) {
      reviewForm.reset();
    }
    if (reviewPanel) {
      reviewPanel.style.display = 'none';
    }
    
  } catch (error) {
    console.error('Error in review submission process:', error);
    console.error('Error details:', error.message, error.code);
    alert('Sorry, there was an error submitting your review. Please try again.');
  }
}

// Set up real-time reviews listener
function setupReviewsListener() {
  try {
    // Simple query for approved reviews (without ordering to avoid index issues)
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('status', '==', 'approved')
    );
    
    // Set up real-time listener
    onSnapshot(reviewsQuery, (snapshot) => {
      displayReviewsOnHomepage(snapshot);
    });
    
  } catch (error) {
    console.error('Error setting up reviews listener:', error);
    // Fallback: try to load all reviews and filter client-side
    setupFallbackReviewsListener();
  }
}

// Fallback reviews listener without complex queries
function setupFallbackReviewsListener() {
  try {
    const reviewsQuery = collection(db, 'reviews');
    
    onSnapshot(reviewsQuery, (snapshot) => {
      const approvedReviews = [];
      
      snapshot.forEach((doc) => {
        const review = doc.data();
        if (review.status === 'approved') {
          approvedReviews.push({ id: doc.id, ...review });
        }
      });
      
      // Sort by timestamp on client side
      approvedReviews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      displayReviewsOnHomepage({ forEach: (callback) => approvedReviews.forEach(callback) });
    });
    
  } catch (error) {
    console.error('Fallback reviews listener also failed:', error);
  }
}

function displayReviewsOnHomepage(snapshot) {
  if (!reviewGrid) {
    console.error('Review grid element not found');
    return;
  }
  
  const staticReviews = [
    {
      name: "Cheska Rivera",
      rating: 5,
      message: "First time ko magpa-tattoo and medyo kinakabahan ako pero super accommodating sila. Chill lang yung vibe, at hindi intimidating. Medyo natagalan lang sa sketch pero worth it naman. Thank you Real Pain fam!",
      timestamp: "2024-01-15T10:00:00Z"
    },
    {
      name: "Rafael Ramos",
      rating: 5,
      message: "Astig ng unang tattoo ko, medyo kinakabahan pa ako pero yung artist, super chill lang. Hindi ko ramdam ang sakit! Ang ganda ng design ko. Salamat!",
      timestamp: "2024-01-20T14:30:00Z"
    },
    {
      name: "Carlos Santos",
      rating: 5,
      message: "Tapos na ang first tattoo ko! Ang sakit pero worth it. Salamat sa awesome service, cool ng mga tao dito",
      timestamp: "2024-02-05T16:45:00Z"
    },
    {
      name: "Maria Reyes",
      rating: 5,
      message: "First time ko magpa-tattoo and di ako na-disappoint! Relax lang yung vibe, di intimidating. Sobrang happy ko sa outcome, malupet!",
      timestamp: "2024-02-10T11:20:00Z"
    }
  ];
  
  let allReviews = [...staticReviews];
  
  if (snapshot && !snapshot.empty) {
    snapshot.forEach((doc) => {
      const review = doc.data();
      allReviews.push({
        name: review.name,
        rating: review.rating,
        message: review.message,
        timestamp: review.timestamp,
        photoUrl: review.photoUrl
      });
    });
  }
  
  allReviews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  const latestFourReviews = allReviews.slice(0, 4);
  
  reviewGrid.innerHTML = '';
  
  latestFourReviews.forEach(review => {
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    
    const photoHTML = review.photoUrl ? `
      <div class="review-photo">
        <img src="${review.photoUrl}" alt="${review.name}'s tattoo" loading="lazy">
      </div>
    ` : '';
    
    const reviewHTML = `
      <div class="review-card">
        <p class="name">${review.name}</p>
        <p class="stars">${stars}</p>
        <p class="message">${review.message}</p>
        ${photoHTML}
      </div>
    `;
    
    reviewGrid.innerHTML += reviewHTML;
  });
}

// Check AR feature status and show/hide AR button accordingly
async function checkARFeatureStatus() {
  try {
    const arSettingsRef = doc(db, "settings", "arFeature");
    const docSnap = await getDoc(arSettingsRef);
    
    let arEnabled = true; // Default to enabled if no setting found
    if (docSnap.exists()) {
      arEnabled = docSnap.data().enabled;
    }
    
    // Find AR button and show/hide it
    const arButton = document.querySelector('.ar-button');
    if (arButton) {
      if (arEnabled) {
        arButton.classList.remove('disabled');
        arButton.style.display = 'block';
        arButton.onclick = function() { window.location.href = 'augmented-reality.html'; };
      } else {
        arButton.classList.add('disabled');
        arButton.style.display = 'none';
        arButton.onclick = function(e) { 
          e.preventDefault(); 
          alert('AR Try-On feature is currently disabled.');
          return false;
        };
      }
    }
    
    // Set up real-time listener for AR settings changes
    onSnapshot(arSettingsRef, (doc) => {
      let arEnabled = true;
      if (doc.exists()) {
        arEnabled = doc.data().enabled;
      }
      
      const arButton = document.querySelector('.ar-button');
      if (arButton) {
        if (arEnabled) {
          arButton.classList.remove('disabled');
          arButton.style.display = 'block';
          arButton.onclick = function() { window.location.href = 'augmented-reality.html'; };
        } else {
          arButton.classList.add('disabled');
          arButton.style.display = 'none';
          arButton.onclick = function(e) { 
            e.preventDefault(); 
            alert('AR Try-On feature is currently disabled.');
            return false;
          };
        }
      }
    });
    
  } catch (error) {
    console.error('Error checking AR feature status:', error);
  }
}

// Make functions available globally for debugging
window.setupReviewsListener = setupReviewsListener;
window.checkARFeatureStatus = checkARFeatureStatus;
window.debugReviews = function() {
  // Debug function removed
};
