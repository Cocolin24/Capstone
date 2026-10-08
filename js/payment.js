import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc
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

const qrCodeImg = document.getElementById('qrCode');
const qrLabel = document.getElementById('qrLabel');
const paymentAppSpan = document.getElementById('paymentApp');
const proofUpload = document.getElementById('proofUpload');
const proofPreview = document.getElementById('proofPreview');
const referenceNumber = document.getElementById('referenceNumber');
const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');

const qrCodes = {
  gcash: 'gallery/gcash.jfif',
  maya: 'gallery/maya.jfif',
  bpi: 'gallery/bpi.jfif',
  unionbank: 'gallery/ub.jfif'
};

const paymentAppNames = {
  gcash: 'Gcash',
  maya: 'Maya',
  bpi: 'BPI Mobile/Online Banking',
  unionbank: 'UnionBank Online'
};

function getBookingData() {
  const data = sessionStorage.getItem('bookingData');
  if (!data) {
    alert('No booking data found. Redirecting to booking page.');
    window.location.href = 'book-now.html';
    return null;
  }
  return JSON.parse(data);
}

function displayBookingInfo() {
  const bookingData = getBookingData();
  if (!bookingData) return;

  document.getElementById('clientName').textContent = bookingData.name;
  document.getElementById('bookingDate').textContent = bookingData.date;
  document.getElementById('bookingTime').textContent = bookingData.timeDisplay || bookingData.time;
  document.getElementById('paymentMethod').textContent = bookingData.payment;

  const paymentDetail = bookingData.paymentDetail?.toLowerCase();
  const paymentMethod = bookingData.paymentMethod?.toLowerCase();
  
  if (paymentMethod === 'cash' || paymentMethod === 'debit-card') {
    qrCodeImg.src = qrCodes.gcash;
    qrLabel.textContent = `Scan to pay via ${paymentAppNames.gcash}`;
    paymentAppSpan.textContent = paymentAppNames.gcash;
  } else if (paymentDetail && qrCodes[paymentDetail]) {
    qrCodeImg.src = qrCodes[paymentDetail];
    qrLabel.textContent = `Scan to pay via ${paymentAppNames[paymentDetail]}`;
    paymentAppSpan.textContent = paymentAppNames[paymentDetail];
  } else {
    qrCodeImg.src = qrCodes.gcash;
    qrLabel.textContent = `Scan to pay via ${paymentAppNames.gcash}`;
    paymentAppSpan.textContent = paymentAppNames.gcash;
  }
}

proofUpload.addEventListener('change', () => {
  if (proofUpload.files.length > 0) {
    const reader = new FileReader();
    reader.onload = (e) => {
      proofPreview.src = e.target.result;
      proofPreview.style.display = 'block';
      referenceNumber.value = '';
      checkFormValidity();
    };
    reader.readAsDataURL(proofUpload.files[0]);
  }
});

referenceNumber.addEventListener('input', () => {
  if (referenceNumber.value.trim()) {
    proofUpload.value = '';
    proofPreview.style.display = 'none';
  }
  checkFormValidity();
});

function checkFormValidity() {
  const hasProof = proofUpload.files.length > 0;
  const hasReference = referenceNumber.value.trim().length > 0;
  confirmPaymentBtn.disabled = !(hasProof || hasReference);
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

confirmPaymentBtn.addEventListener('click', async () => {
  const bookingData = getBookingData();
  if (!bookingData) {
    alert('Booking information is missing. Please try booking again.');
    return;
  }

  const hasProof = proofUpload.files.length > 0;
  const hasReference = referenceNumber.value.trim().length > 0;

  if (!hasProof && !hasReference) {
    alert('Please either upload proof of payment or enter a reference number.');
    return;
  }

  try {
    confirmPaymentBtn.disabled = true;
    confirmPaymentBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    const completeBookingData = {
      ...bookingData,
      paymentStatus: 'submitted',
      paymentSubmittedAt: new Date().toISOString()
    };

    if (hasProof) {
      try {
        const imageUrl = await uploadImageToCloudinary(proofUpload.files[0]);
        completeBookingData.paymentProofUrl = imageUrl;
        completeBookingData.paymentVerificationMethod = 'proof_upload';
      } catch (uploadError) {
        alert('Failed to upload payment proof. Please try again.');
        confirmPaymentBtn.disabled = false;
        confirmPaymentBtn.innerHTML = '<i class="fas fa-check-circle"></i> Confirm Payment';
        return;
      }
    }

    if (hasReference) {
      completeBookingData.referenceNumber = referenceNumber.value.trim();
      completeBookingData.paymentVerificationMethod = 'reference_number';
    }

    await addDoc(collection(db, "bookings"), completeBookingData);

    sessionStorage.removeItem('bookingData');

    document.getElementById('successModal').style.display = 'flex';

  } catch (error) {
    console.error('Error saving booking:', error);
    alert('Error submitting booking. Please try again.');
    confirmPaymentBtn.disabled = false;
    confirmPaymentBtn.innerHTML = '<i class="fas fa-check-circle"></i> Confirm Payment';
  }
});

document.getElementById('modalOkBtn').addEventListener('click', () => {
  window.location.href = 'index.html';
});

displayBookingInfo();

