import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  onSnapshot,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";
// Storage imports commented out for now - will add later
// import {
//   getStorage,
//   ref,
//   uploadBytes,
//   getDownloadURL
// } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-storage.js";

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

// const storage = getStorage(app); // Will add storage later

// ✅ UI REFERENCES
const timeSlotContainer = document.getElementById("timeslot-section");
const fileInput = document.getElementById("tattooUpload");
const previewImage = document.getElementById("previewImage");
const newsletterModal = document.getElementById("newsletterModal");
const termsModal = document.getElementById("termsModal");
const termsCheckbox = document.getElementById("termsCheckbox");
const finalSubmitBtn = document.getElementById("finalSubmitBtn");
const newsletterModalBtn = document.getElementById("newsletterModalBtn");

let selectedDate = null;
let selectedTime = null;
let flatpickrInstance = null;

// Test script loading
console.log("Script loaded successfully!");

// Test Firebase connection
async function testFirebaseConnection() {
  try {
    console.log("Testing Firebase connection...");
    const testDoc = await getDoc(doc(db, "test", "connection"));
    console.log("Firebase connection successful!");
    return true;
  } catch (error) {
    console.error("Firebase connection failed:", error);
    return false;
  }
}

// Debug function to check variables
window.debugBooking = function() {
  console.log("DEBUG - selectedDate:", selectedDate);
  console.log("DEBUG - selectedTime:", selectedTime);
  console.log("DEBUG - finalSubmitBtn:", finalSubmitBtn);
  console.log("DEBUG - termsModal:", termsModal);
};

// localStorage functions
function saveFormData() {
  const contactInput = document.getElementById("clientContact");
  let contactValue = contactInput ? contactInput.value : '';
  let contactCountry = 'ph';
  
  if (contactInput && window.contactIti) {
    contactValue = window.contactIti.getNumber();
    const countryData = window.contactIti.getSelectedCountryData();
    contactCountry = countryData.iso2 || 'ph';
  }
  
  const formData = {
    name: document.getElementById("clientName").value,
    email: document.getElementById("clientEmail").value,
    contact: contactValue,
    contactCountry: contactCountry,
    bookingType: document.getElementById("bookingType").value,
    paymentMethod: document.getElementById("paymentMethod").value,
    message: document.getElementById("notes").value,
    selectedDate: selectedDate,
    selectedTime: selectedTime,
    newsletterSubscribe: document.getElementById("newsletterSubscribe").checked
  };
  localStorage.setItem('bookingFormData', JSON.stringify(formData));
  console.log("Form data saved to localStorage");
}

function loadFormData() {
  const savedData = localStorage.getItem('bookingFormData');
  if (savedData) {
    const formData = JSON.parse(savedData);
    
    // Restore form fields
    if (formData.name) {
      const nameInput = document.getElementById("clientName");
      if (nameInput) {
        nameInput.value = formData.name;
        setTimeout(() => {
          const nameValue = nameInput.value;
          const nameError = document.getElementById('nameError');
          if (nameValue.length > 30) {
            nameInput.classList.add('error');
            if (nameError) {
              nameError.classList.add('show');
              nameError.style.display = 'block';
            }
          } else {
            nameInput.classList.remove('error');
            if (nameError) {
              nameError.classList.remove('show');
              nameError.style.display = 'none';
            }
          }
        }, 100);
      }
    }
    if (formData.email) {
      const emailInput = document.getElementById("clientEmail");
      if (emailInput) {
        emailInput.value = formData.email;
        setTimeout(() => {
          const emailValue = emailInput.value.trim();
          const emailError = document.getElementById('emailError');
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (emailValue.length > 0 && !emailRegex.test(emailValue)) {
            emailInput.classList.add('error');
            if (emailError) {
              emailError.classList.add('show');
              emailError.style.display = 'block';
            }
          } else {
            emailInput.classList.remove('error');
            if (emailError) {
              emailError.classList.remove('show');
              emailError.style.display = 'none';
            }
          }
        }, 100);
      }
    }
    if (formData.contact) {
      const contactInput = document.getElementById("clientContact");
      if (contactInput) {
        setTimeout(() => {
          if (window.contactIti) {
            if (formData.contactCountry) {
              window.contactIti.setCountry(formData.contactCountry);
            }
            window.contactIti.setNumber(formData.contact);
            const contactError = document.getElementById('contactError');
            if (contactError) {
              if (window.contactIti.isValidNumber()) {
                contactInput.classList.remove('error');
                contactError.classList.remove('show');
                contactError.style.display = 'none';
              } else {
                contactInput.classList.add('error');
                contactError.classList.add('show');
                contactError.style.display = 'block';
              }
            }
          } else {
            contactInput.value = formData.contact;
          }
        }, 200);
      }
    }
    if (formData.bookingType) document.getElementById("bookingType").value = formData.bookingType;
    if (formData.paymentMethod) document.getElementById("paymentMethod").value = formData.paymentMethod;
    if (formData.message) document.getElementById("notes").value = formData.message;
    if (formData.newsletterSubscribe !== undefined) {
      document.getElementById("newsletterSubscribe").checked = formData.newsletterSubscribe;
    }
    
    // Restore date and time
    if (formData.selectedDate) {
      selectedDate = formData.selectedDate;
      document.getElementById("booking-date").value = formData.selectedDate;
      loadTimeSlots(formData.selectedDate);
      timeSlotContainer.style.display = "block";
    }
    
    if (formData.selectedTime) {
      selectedTime = formData.selectedTime;
      // We'll restore the selected time slot after time slots are loaded
      setTimeout(() => {
        const timeButtons = document.querySelectorAll('.timeslot-btn');
        timeButtons.forEach(btn => {
          if (btn.textContent === formData.selectedTime) {
            btn.classList.add('active');
          }
        });
      }, 100);
    }
    
    console.log("Form data restored from localStorage");
  }
}

function clearFormData() {
  localStorage.removeItem('bookingFormData');
  console.log("Form data cleared from localStorage");
}

// Load admin calendar data for all dates
async function loadAdminCalendarData() {
  try {
    console.log("Loading admin calendar data...");
    const snapshot = await getDocs(collection(db, "adminCalendar"));
    const calendarData = {};
    const fullyBookedDates = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const bookedSlots = data.slots || [];
      
      // Store all calendar data
      calendarData[data.date] = bookedSlots;
      
      // Check if all time slots are booked (fully booked)
      const allTimeSlots = ["9AM-1PM", "2PM-6PM", "7PM-11PM"];
      const isFullyBooked = allTimeSlots.every(slot => bookedSlots.includes(slot));
      
      if (isFullyBooked) {
        fullyBookedDates.push(data.date);
        console.log("Date fully booked:", data.date);
      } else if (bookedSlots.length > 0) {
        console.log("Date partially booked:", data.date, "Booked slots:", bookedSlots);
      }
    });
    
    console.log("Total fully booked dates:", fullyBookedDates.length);
    console.log("Calendar data loaded:", Object.keys(calendarData).length, "dates");
    
    return { calendarData, fullyBookedDates };
    
  } catch (error) {
    console.error("Error loading admin calendar data:", error);
    return { calendarData: {}, fullyBookedDates: [] };
  }
}

// Global variable to store admin calendar data
let adminCalendarData = {};

// Function to refresh calendar with updated disabled dates
async function refreshCalendarDates() {
  if (flatpickrInstance) {
    console.log("Refreshing calendar with updated disabled dates...");
    const { calendarData, fullyBookedDates } = await loadAdminCalendarData();
    adminCalendarData = calendarData;
    flatpickrInstance.set('disable', fullyBookedDates);
    
    // If a date is currently selected, refresh its time slots
    if (selectedDate) {
      loadTimeSlots(selectedDate);
    }
  }
}

// Make refresh function available globally for testing
window.refreshCalendarDates = refreshCalendarDates;


// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async function() {
  console.log("DOM loaded, initializing flatpickr...");
  
  // Check for pre-selected date/time from availability calendar
  const preSelectedDate = sessionStorage.getItem('selectedDate');
  const preSelectedTime = sessionStorage.getItem('selectedTime');
  const preSelectedTimeDisplay = sessionStorage.getItem('selectedTimeDisplay');
  
  if (preSelectedDate) {
    selectedDate = preSelectedDate;
    console.log("Pre-selected date from availability calendar:", preSelectedDate);
  }
  
  if (preSelectedTime) {
    selectedTime = preSelectedTime;
    console.log("Pre-selected time from availability calendar:", preSelectedTime);
  }
  
  // Test Firebase connection
  testFirebaseConnection();
  
  // Load saved form data first (but don't override pre-selected values)
  if (!preSelectedDate && !preSelectedTime) {
    loadFormData();
  }
  
  // Load admin calendar data
  const { calendarData, fullyBookedDates } = await loadAdminCalendarData();
  adminCalendarData = calendarData;
  
  // 📅 Flatpickr Config
  flatpickrInstance = flatpickr("#booking-date", {
  altInput: true,
  altFormat: "F j, Y",
  dateFormat: "Y-m-d",
  minDate: "today",
  maxDate: new Date().fp_incr(61), // Restrict to 2 months ahead
  disable: fullyBookedDates,
  defaultDate: selectedDate || null,
  onChange: function (selectedDates, dateStr) {
    selectedDate = dateStr;
    if (!preSelectedTime) selectedTime = null;
    loadTimeSlots(dateStr);
    timeSlotContainer.style.display = "block";
    saveFormData();
  }
});
  
  // Add event listeners to save data on input changes
  const formInputs = ['clientName', 'clientEmail', 'clientContact', 'bookingType', 'paymentMethod', 'notes'];
  formInputs.forEach(inputId => {
    const element = document.getElementById(inputId);
    if (element) {
      element.addEventListener('input', saveFormData);
      element.addEventListener('change', saveFormData);
    }
  });

  const newsletterCheckbox = document.getElementById("newsletterSubscribe");
  if (newsletterCheckbox) {
    newsletterCheckbox.addEventListener('change', saveFormData);
  }

  const nameInput = document.getElementById('clientName');
  const nameError = document.getElementById('nameError');
  
  if (nameError) {
    nameError.classList.remove('show');
    nameError.style.display = 'none';
  }
  if (nameInput) {
    nameInput.classList.remove('error');
  }
  
  function validateNameLength() {
    if (!nameInput) return;
    const nameValue = nameInput.value || '';
    if (nameValue.length > 30) {
      nameInput.classList.add('error');
      if (nameError) {
        nameError.classList.add('show');
        nameError.style.display = 'block';
      }
    } else {
      nameInput.classList.remove('error');
      if (nameError) {
        nameError.classList.remove('show');
        nameError.style.display = 'none';
      }
    }
  }
  
  if (nameInput) {
    nameInput.addEventListener('keypress', function(e) {
      const char = e.key;
      if (/\d/.test(char) || (char >= '0' && char <= '9')) {
        e.preventDefault();
        return false;
      }
    });

    nameInput.addEventListener('keydown', function(e) {
      const key = e.key;
      const code = e.code;
      if ((key >= '0' && key <= '9') || (code && code.startsWith('Digit')) || (code && code.startsWith('Numpad'))) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    });

    nameInput.addEventListener('paste', function(e) {
      const paste = (e.clipboardData || window.clipboardData).getData('text');
      const filtered = paste.replace(/[0-9]/g, '');
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const value = e.target.value;
      const newValue = value.substring(0, start) + filtered + value.substring(end);
      e.target.value = newValue;
      e.target.setSelectionRange(start + filtered.length, start + filtered.length);
      validateNameLength();
      saveFormData();
    });

    nameInput.addEventListener('input', function(e) {
      const oldValue = e.target.value;
      const newValue = oldValue.replace(/[0-9]/g, '');
      if (oldValue !== newValue) {
        e.target.value = newValue;
        e.target.dispatchEvent(new Event('change'));
      }
      const currentValue = e.target.value;
      if (currentValue.length > 30) {
        nameInput.classList.add('error');
        if (nameError) {
          nameError.classList.add('show');
          nameError.style.display = 'block';
        }
      } else {
        nameInput.classList.remove('error');
        if (nameError) {
          nameError.classList.remove('show');
          nameError.style.display = 'none';
        }
      }
      saveFormData();
    });
    
    nameInput.addEventListener('keyup', function(e) {
      const currentValue = e.target.value;
      if (currentValue.length > 30) {
        nameInput.classList.add('error');
        if (nameError) {
          nameError.classList.add('show');
          nameError.style.display = 'block';
        }
      } else {
        nameInput.classList.remove('error');
        if (nameError) {
          nameError.classList.remove('show');
          nameError.style.display = 'none';
        }
      }
    });
    
    nameInput.addEventListener('blur', validateNameLength);
  }

  const emailInput = document.getElementById('clientEmail');
  const emailError = document.getElementById('emailError');
  
  if (emailError) {
    emailError.classList.remove('show');
    emailError.style.display = 'none';
  }
  if (emailInput) {
    emailInput.classList.remove('error');
  }
  
  function validateEmail() {
    if (!emailInput) return;
    const emailValue = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (emailValue.length === 0) {
      emailInput.classList.remove('error');
      if (emailError) {
        emailError.classList.remove('show');
        emailError.style.display = 'none';
      }
      return;
    }
    
    if (!emailRegex.test(emailValue)) {
      emailInput.classList.add('error');
      if (emailError) {
        emailError.classList.add('show');
        emailError.style.display = 'block';
      }
    } else {
      emailInput.classList.remove('error');
      if (emailError) {
        emailError.classList.remove('show');
        emailError.style.display = 'none';
      }
    }
  }
  
  if (emailInput) {
    emailInput.addEventListener('input', function(e) {
      validateEmail();
      saveFormData();
    });
    
    emailInput.addEventListener('blur', function(e) {
      validateEmail();
    });
    
    emailInput.addEventListener('keyup', function(e) {
      validateEmail();
    });
  }

  const paymentSelect = document.getElementById('paymentMethod');
  const ewalletOptionsEl = document.getElementById('ewalletOptions');
  const bankOptionsEl = document.getElementById('bankOptions');
  let selectedEwallet = '';
  let selectedBank = '';

  function clearChipSelection(groupEl) {
    groupEl.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  }

  function updatePaymentChildren() {
    const val = paymentSelect.value;
    if (val === 'ewallet') {
      ewalletOptionsEl.style.display = 'block';
      bankOptionsEl.style.display = 'none';
      selectedBank = '';
      clearChipSelection(bankOptionsEl);
    } else if (val === 'bank') {
      bankOptionsEl.style.display = 'block';
      ewalletOptionsEl.style.display = 'none';
      selectedEwallet = '';
      clearChipSelection(ewalletOptionsEl);
    } else {
      ewalletOptionsEl.style.display = 'none';
      bankOptionsEl.style.display = 'none';
      selectedEwallet = '';
      selectedBank = '';
      clearChipSelection(ewalletOptionsEl);
      clearChipSelection(bankOptionsEl);
    }
  }

  if (paymentSelect) {
    paymentSelect.addEventListener('change', updatePaymentChildren);
    updatePaymentChildren();
  }

  ewalletOptionsEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('chip')) {
      clearChipSelection(ewalletOptionsEl);
      e.target.classList.add('active');
      selectedEwallet = e.target.getAttribute('data-value');
      saveFormData();
    }
  });

  bankOptionsEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('chip')) {
      clearChipSelection(bankOptionsEl);
      e.target.classList.add('active');
      selectedBank = e.target.getAttribute('data-value');
      saveFormData();
    }
  });

  const contactInput = document.getElementById('clientContact');
  const contactError = document.getElementById('contactError');
  
  if (contactInput) {
    window.contactIti = window.intlTelInput(contactInput, {
      initialCountry: "ph",
      preferredCountries: ["ph", "us", "gb", "au", "ca"],
      separateDialCode: true,
      utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@19.5.6/build/js/utils.js"
    });
    
    if (contactError) {
      contactError.classList.remove('show');
      contactError.style.display = 'none';
    }
    if (contactInput) {
      contactInput.classList.remove('error');
    }
    
    function validateContact() {
      if (!contactInput || !window.contactIti) return;
      const isValid = window.contactIti.isValidNumber();
      const number = window.contactIti.getNumber();
      
      if (contactInput.value.trim().length === 0) {
        contactInput.classList.remove('error');
        if (contactError) {
          contactError.classList.remove('show');
          contactError.style.display = 'none';
        }
        return;
      }
      
      if (!isValid) {
        contactInput.classList.add('error');
        if (contactError) {
          contactError.classList.add('show');
          contactError.style.display = 'block';
        }
      } else {
        contactInput.classList.remove('error');
        if (contactError) {
          contactError.classList.remove('show');
          contactError.style.display = 'none';
        }
      }
    }
    
    contactInput.addEventListener('input', function() {
      const countryData = window.contactIti.getSelectedCountryData();
      let value = contactInput.value.replace(/\D/g, '');
      
      if (countryData.iso2 === 'ph') {
        if (value.startsWith('0')) {
          value = value.substring(1);
        }
        if (value.length > 10) {
          value = value.slice(0, 10);
        }
        contactInput.value = value;
      }
      
      validateContact();
      saveFormData();
    });
    
    contactInput.addEventListener('blur', validateContact);
    contactInput.addEventListener('countrychange', function() {
      validateContact();
      saveFormData();
    });
    
    contactInput.addEventListener('keyup', validateContact);
  }
  
  // If we have a pre-selected date, load its time slots immediately
  if (preSelectedDate) {
    loadTimeSlots(preSelectedDate);
    timeSlotContainer.style.display = "block";
  }
  
  console.log("Flatpickr initialized and form data restoration set up");
  
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

// ========== LOAD TIME SLOTS ==========
async function loadTimeSlots(dateStr) {
  console.log("Loading time slots for date:", dateStr);
  
  const timeSlotMapping = {
    "9:00 AM - 1:00 PM": "9AM-1PM",
    "2:00 PM - 6:00 PM": "2PM-6PM", 
    "7:00 PM - 11:00 PM": "7PM-11PM"
  };
  
  const displaySlots = ["9:00 AM - 1:00 PM", "2:00 PM - 6:00 PM", "7:00 PM - 11:00 PM"];
  
  // Get booked slots from admin calendar data
  const bookedFirebaseSlots = adminCalendarData[dateStr] || [];
  console.log("Found booked Firebase slots for", dateStr, ":", bookedFirebaseSlots);
  
  console.log("Creating time slot buttons");
  timeSlotContainer.innerHTML = "<p>Select a Time Slot:</p>";

  displaySlots.forEach((displaySlot) => {
    console.log("Creating button for slot:", displaySlot);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = displaySlot;
    btn.classList.add("timeslot-btn");

    // Check if this slot is booked in Firebase
    const firebaseSlot = timeSlotMapping[displaySlot];
    const isBooked = bookedFirebaseSlots.includes(firebaseSlot);
    
    if (isBooked) {
      btn.disabled = true;
      btn.style.opacity = 0.4;
      btn.style.cursor = "not-allowed";
      btn.style.filter = "blur(1px)"; // Add blur effect
      btn.textContent = displaySlot + " (Booked)";
      console.log("Slot", displaySlot, "is booked (Firebase:", firebaseSlot, ")");
    } else {
      console.log("Slot", displaySlot, "is available (Firebase:", firebaseSlot, ")");
    }

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (!isBooked) {
        console.log("Time slot button clicked:", displaySlot);
        document.querySelectorAll(".timeslot-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedTime = displaySlot;
        console.log("Selected time set to:", selectedTime);
        saveFormData(); // Save form data when time slot is selected
        checkFormReadiness();
      }
    });

    timeSlotContainer.appendChild(btn);
  });
  
  // Check if we have a pre-selected time from availability calendar
  const preSelectedTime = sessionStorage.getItem('selectedTime');
  if (preSelectedTime && dateStr === sessionStorage.getItem('selectedDate')) {
    const reverseMapping = {
      "9AM-1PM": "9:00 AM - 1:00 PM",
      "2PM-6PM": "2:00 PM - 6:00 PM", 
      "7PM-11PM": "7:00 PM - 11:00 PM"
    };
    
    const displaySlot = reverseMapping[preSelectedTime];
    if (displaySlot) {
      // Find and select the corresponding button
      const buttons = timeSlotContainer.querySelectorAll('.timeslot-btn');
      buttons.forEach(btn => {
        if (btn.textContent === displaySlot && !btn.disabled) {
          btn.classList.add('active');
          selectedTime = displaySlot;
          console.log("Auto-selected time slot from availability calendar:", displaySlot);
          
          // Clear the session storage after use
          sessionStorage.removeItem('selectedDate');
          sessionStorage.removeItem('selectedTime');
          sessionStorage.removeItem('selectedTimeDisplay');
          
          // Show a confirmation message
          setTimeout(() => {
            alert(`Your selected time slot (${displaySlot}) has been automatically set!`);
          }, 500);
        }
      });
    }
  }
  
  console.log("Time slot buttons created, container contents:", timeSlotContainer.innerHTML);
}

// ========== FILE UPLOAD ==========
// Temporarily disabled - will add Firebase Storage later
// async function uploadFileAndGetURL(file) {
//   const storageRef = ref(storage, "uploads/" + Date.now() + "-" + file.name);
//   await uploadBytes(storageRef, file);
//   return await getDownloadURL(storageRef);
// }

// ✅ Show preview when selecting image
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

fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      previewImage.style.display = "block";
    };
    reader.readAsDataURL(fileInput.files[0]);
  }
});

// ========== HANDLE FORM SUBMIT (SHOW TERMS MODAL) ==========
document.getElementById("clientBookingForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("clientName").value.trim();
  const email = document.getElementById("clientEmail").value.trim();
  const contactInput = document.getElementById("clientContact");
  let contact = '';
  let isValidContact = false;
  
  if (contactInput && window.contactIti) {
    isValidContact = window.contactIti.isValidNumber();
    contact = window.contactIti.getNumber();
  } else {
    contact = contactInput ? contactInput.value.trim() : '';
  }
  
  const bookingType = document.getElementById("bookingType").value;
  const paymentMethod = document.getElementById("paymentMethod").value;
  const ewalletChoice = document.querySelector('#ewalletOptions .chip.active')?.getAttribute('data-value') || '';
  const bankChoice = document.querySelector('#bankOptions .chip.active')?.getAttribute('data-value') || '';

  const nameInput = document.getElementById("clientName");
  const emailInput = document.getElementById("clientEmail");
  
  // Re-validate all fields before submission
  if (nameInput) {
    const nameValue = nameInput.value || '';
    if (nameValue.length > 30) {
      nameInput.classList.add('error');
      const nameError = document.getElementById('nameError');
      if (nameError) {
        nameError.classList.add('show');
        nameError.style.display = 'block';
      }
    } else {
      nameInput.classList.remove('error');
      const nameError = document.getElementById('nameError');
      if (nameError) {
        nameError.classList.remove('show');
        nameError.style.display = 'none';
      }
    }
  }
  
  if (emailInput) {
    const emailValue = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailValue.length > 0 && !emailRegex.test(emailValue)) {
      emailInput.classList.add('error');
      const emailError = document.getElementById('emailError');
      if (emailError) {
        emailError.classList.add('show');
        emailError.style.display = 'block';
      }
    } else if (emailValue.length === 0) {
      emailInput.classList.remove('error');
      const emailError = document.getElementById('emailError');
      if (emailError) {
        emailError.classList.remove('show');
        emailError.style.display = 'none';
      }
    } else {
      emailInput.classList.remove('error');
      const emailError = document.getElementById('emailError');
      if (emailError) {
        emailError.classList.remove('show');
        emailError.style.display = 'none';
      }
    }
  }
  
  if (contactInput && window.contactIti) {
    const isValid = window.contactIti.isValidNumber();
    const contactValue = contactInput.value.trim();
    if (contactValue.length > 0 && !isValid) {
      contactInput.classList.add('error');
      const contactError = document.getElementById('contactError');
      if (contactError) {
        contactError.classList.add('show');
        contactError.style.display = 'block';
      }
    } else if (contactValue.length === 0) {
      contactInput.classList.remove('error');
      const contactError = document.getElementById('contactError');
      if (contactError) {
        contactError.classList.remove('show');
        contactError.style.display = 'none';
      }
    } else {
      contactInput.classList.remove('error');
      const contactError = document.getElementById('contactError');
      if (contactError) {
        contactError.classList.remove('show');
        contactError.style.display = 'none';
      }
    }
  }
  
  // Check for errors and prevent submission
  if (nameInput && nameInput.classList.contains('error')) {
    alert("Please fix the name field error before proceeding.");
    nameInput.focus();
    return;
  }
  
  if (emailInput && emailInput.classList.contains('error')) {
    alert("Please fix the email field error before proceeding.");
    emailInput.focus();
    return;
  }
  
  if (contactInput && contactInput.classList.contains('error')) {
    alert("Please fix the phone number error before proceeding.");
    contactInput.focus();
    return;
  }
  
  // Validation
  if (!name || !email || !contact || !bookingType || !paymentMethod) {
    alert("Please complete all fields.");
    return;
  }
  
  if (name.length > 30) {
    alert("Name must be 30 characters or less.");
    if (nameInput) {
      nameInput.classList.add('error');
      nameInput.focus();
      const nameError = document.getElementById('nameError');
      if (nameError) {
        nameError.classList.add('show');
        nameError.style.display = 'block';
      }
    }
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("Please enter a valid email address.");
    if (emailInput) {
      emailInput.classList.add('error');
      emailInput.focus();
      const emailError = document.getElementById('emailError');
      if (emailError) {
        emailError.classList.add('show');
        emailError.style.display = 'block';
      }
    }
    return;
  }
  
  if (contactInput && window.contactIti && !window.contactIti.isValidNumber()) {
    alert("Please enter a valid phone number.");
    contactInput.classList.add('error');
    contactInput.focus();
    const contactError = document.getElementById('contactError');
    if (contactError) {
      contactError.classList.add('show');
      contactError.style.display = 'block';
    }
    return;
  }

  if (paymentMethod === 'ewallet' && !ewalletChoice) {
    alert('Please select an e-wallet option.');
    return;
  }

  if (paymentMethod === 'bank' && !bankChoice) {
    alert('Please select a bank option.');
    return;
  }


  console.log("Form validation - selectedDate:", selectedDate, "selectedTime:", selectedTime);
  if (!selectedDate || !selectedTime) {
    alert("Please select a date and time slot.");
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
      alert("Please complete the reCAPTCHA verification before proceeding.");
      return;
    }
    
    if (recaptchaError) {
      recaptchaError.style.display = 'none';
    }
  }
  // Check if newsletter subscription is checked
  const newsletterSubscribe = document.getElementById("newsletterSubscribe").checked;
  
  if (newsletterSubscribe) {
    // Show newsletter notification modal first
    newsletterModal.style.display = "flex";
  } else {
    // Show terms modal directly
    resetModalState(); // Reset modal state before showing
    termsModal.style.display = "flex";
  }
});

// ========== HANDLE FINAL SUBMIT FROM MODAL ==========
finalSubmitBtn.addEventListener("click", async () => {
  if (!termsCheckbox.checked) {
    alert("Please read and agree to the Terms and Conditions before proceeding.");
    return;
  }

  finalSubmitBtn.disabled = true;
  finalSubmitBtn.textContent = "Uploading...";

  const name = document.getElementById("clientName").value.trim();
  const email = document.getElementById("clientEmail").value.trim();
  const contactInput = document.getElementById("clientContact");
  let contact = '';
  
  if (contactInput && window.contactIti) {
    contact = window.contactIti.getNumber();
  } else {
    contact = contactInput ? contactInput.value.trim() : '';
  }
  const bookingType = document.getElementById("bookingType").value;
  const paymentMethod = document.getElementById("paymentMethod").value;
  const message = document.getElementById("notes").value;
  const ewalletChoice = document.querySelector('#ewalletOptions .chip.active')?.getAttribute('data-value') || '';
  const bankChoice = document.querySelector('#bankOptions .chip.active')?.getAttribute('data-value') || '';

  let photoURL = null;
  if (fileInput && fileInput.files.length > 0) {
    try {
      photoURL = await uploadImageToCloudinary(fileInput.files[0]);
    } catch (uploadError) {
      alert('Failed to upload design image. Please try again.');
      finalSubmitBtn.disabled = false;
      finalSubmitBtn.textContent = "Confirm Booking";
      return;
    }
  }

  const timeSlotMapping = {
    "9:00 AM - 1:00 PM": "9AM-1PM",
    "2:00 PM - 6:00 PM": "2PM-6PM", 
    "7:00 PM - 11:00 PM": "7PM-11PM"
  };
  
  const firebaseTimeFormat = timeSlotMapping[selectedTime] || selectedTime;

  const paymentMethodLabels = {
    'cash': 'Cash',
    'ewallet': 'E-Wallet',
    'bank': 'Bank Transfer',
    'debit-card': 'Debit/Credit Card'
  };

  const paymentDetailLabels = {
    'gcash': 'Gcash',
    'maya': 'Maya',
    'bpi': 'BPI',
    'unionbank': 'UnionBank'
  };

  let paymentDisplay = paymentMethodLabels[paymentMethod] || paymentMethod;
  if (paymentMethod === 'ewallet' && ewalletChoice) {
    paymentDisplay += ` (${paymentDetailLabels[ewalletChoice] || ewalletChoice})`;
  } else if (paymentMethod === 'bank' && bankChoice) {
    paymentDisplay += ` (${paymentDetailLabels[bankChoice] || bankChoice})`;
  }

  const bookingTypeLabels = {
    'studio': 'Studio',
    'home-service': 'Home Service'
  };

  const bookingTypeDisplay = bookingTypeLabels[bookingType] || bookingType;

  const newsletterSubscribe = document.getElementById("newsletterSubscribe").checked;

  const bookingData = {
    name,
    email,
    contact,
    type: bookingTypeDisplay,
    payment: paymentDisplay,
    paymentMethod: paymentMethod,
    paymentDetail: paymentMethod === 'ewallet' ? ewalletChoice : paymentMethod === 'bank' ? bankChoice : '',
    message,
    date: selectedDate,
    time: firebaseTimeFormat,
    timeDisplay: selectedTime,
    photo: photoURL || null,
    newsletterSubscribe: newsletterSubscribe,
    status: "pending",
    timestamp: new Date().toISOString(),
  };

  console.log("Booking data:", bookingData);

  if (newsletterSubscribe) {
    try {
      const existingSubs = await getDocs(
        query(collection(db, 'newsletter'), where('email', '==', email))
      );
      
      if (existingSubs.empty) {
        const verificationToken = generateVerificationToken();
        const basePath = getBasePath();
        const verificationLink = `${basePath}/verify-newsletter.html?token=${verificationToken}&email=${encodeURIComponent(email)}`;
        
        const subscriptionData = {
          email: email,
          subscribedAt: new Date().toISOString(),
          status: 'unverified',
          verificationToken: verificationToken,
          verificationSentAt: new Date().toISOString()
        };
        
        await addDoc(collection(db, 'newsletter'), subscriptionData);
        
        const response = await fetch(`${basePath}/php/newsletter-subscribe.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            name: name,
            verificationLink: verificationLink
          })
        });

        const result = await response.json();
        if (result.success) {
          console.log('Newsletter subscription successful:', result.message);
        } else {
          console.error('Newsletter subscription failed:', result.message);
        }
      } else {
        console.log('Email already subscribed to newsletter');
      }
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
    }
  }
  
  clearFormData();
  
  sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
  
  termsModal.style.display = "none";
  window.location.href = "payment.html";
});

// ✅ Enable button if ready
function checkFormReadiness() {
  console.log("Checking form readiness - Date:", selectedDate, "Time:", selectedTime);
  if (selectedDate && selectedTime) {
    finalSubmitBtn.classList.add("enabled");
    finalSubmitBtn.disabled = false;
    console.log("Form is ready!");
  } else {
    finalSubmitBtn.classList.remove("enabled");
    finalSubmitBtn.disabled = true;
    console.log("Form not ready yet");
  }
}

// ✅ Modal & Terms
// Reset modal state when opened
function resetModalState() {
  termsCheckbox.checked = false;
  termsCheckbox.disabled = false;
  finalSubmitBtn.disabled = true;
  finalSubmitBtn.classList.remove("enabled");
  finalSubmitBtn.textContent = "Confirm Booking";
}

termsCheckbox.addEventListener("change", () => {
  finalSubmitBtn.disabled = !termsCheckbox.checked;
  if (termsCheckbox.checked) {
    finalSubmitBtn.classList.add("enabled");
  } else {
    finalSubmitBtn.classList.remove("enabled");
  }
});

// ========== HANDLE NEWSLETTER MODAL BUTTON ==========
if (newsletterModalBtn) {
  newsletterModalBtn.addEventListener("click", () => {
    // Close newsletter modal
    newsletterModal.style.display = "none";
    // Show terms modal
    resetModalState(); // Reset modal state before showing
    termsModal.style.display = "flex";
  });
}

// Close modal if clicked outside
termsModal.addEventListener("click", (e) => {
  if (e.target === termsModal) {
    termsModal.style.display = "none";
  }
});

newsletterModal.addEventListener("click", (e) => {
  if (e.target === newsletterModal) {
    newsletterModal.style.display = "none";
  }
});

// Add close button functionality
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (termsModal.style.display === 'flex') {
      termsModal.style.display = 'none';
    }
    if (newsletterModal.style.display === 'flex') {
      newsletterModal.style.display = 'none';
    }
  }
});

// Function to manually create time slots for testing
window.testTimeSlots = function() {
  console.log("Testing time slot creation...");
  const allSlots = ["9:00AM-12:00PM", "1:00PM-3:00PM", "4:00PM-6:00PM"];
  
  timeSlotContainer.innerHTML = "<p>Select a Time Slot:</p>";
  timeSlotContainer.style.display = "block";
  
  allSlots.forEach((slot) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = slot;
    btn.classList.add("timeslot-btn");
    
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Time slot clicked:", slot);
      document.querySelectorAll(".timeslot-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedTime = slot;
      console.log("Selected time:", selectedTime);
      saveFormData(); // Save form data when time slot is selected
      checkFormReadiness();
    });
    
    timeSlotContainer.appendChild(btn);
  });
};