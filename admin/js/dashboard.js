import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  setDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

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
const auth = getAuth(app);

// Function to fetch and display recent bookings
async function loadRecentBookings() {
  const recentBookingsFeed = document.getElementById("recentBookingsFeed");
  
  try {
    // Create a query to get the 5 most recent bookings, ordered by timestamp
    const bookingsRef = collection(db, "bookings");
    const q = query(bookingsRef, orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    
    // Clear existing content
    recentBookingsFeed.innerHTML = "";
    
    if (querySnapshot.empty) {
      recentBookingsFeed.innerHTML = `
        <div class="activity-item">
          <i class="fas fa-info-circle"></i>
          <div class="activity-content">
            <p><strong>No bookings yet</strong></p>
            <small>New bookings will appear here</small>
          </div>
        </div>`;
      return;
    }

    let count = 0;
    querySnapshot.forEach((doc) => {
      if (count >= 5) return; // Only show 5 most recent bookings
      
      const booking = doc.data();
      const date = new Date(booking.timestamp);
      const timeAgo = getTimeAgo(date);
      
      const statusColor = {
        'pending': '#ffc107',
        'approved': '#28a745',
        'completed': '#17a2b8',
        'cancelled': '#dc3545'
      }[booking.status] || '#6c757d';

      const html = `
        <div class="activity-item">
          <i class="fas fa-user-circle" style="color: ${statusColor}"></i>
          <div class="activity-content">
            <p><strong>${booking.name}</strong> - ${booking.type} Session</p>
            <p class="booking-details">
              <span class="booking-date">${formatDate(booking.date)}</span>
              <span class="booking-time">${booking.timeDisplay || booking.time}</span>
              <span class="booking-status" style="color: ${statusColor}">
                ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </p>
            <small>${timeAgo}</small>
          </div>
        </div>`;
      
      recentBookingsFeed.innerHTML += html;
      count++;
    });

  } catch (error) {
    console.error("Error loading recent bookings:", error);
    recentBookingsFeed.innerHTML = `
      <div class="activity-item">
        <i class="fas fa-exclamation-triangle"></i>
        <div class="activity-content">
          <p><strong>Error loading bookings</strong></p>
          <small>Please try refreshing the page</small>
        </div>
      </div>`;
  }
}

// Helper function to format relative time
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + " year" + (interval === 1 ? "" : "s") + " ago";
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + " month" + (interval === 1 ? "" : "s") + " ago";
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + " day" + (interval === 1 ? "" : "s") + " ago";
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + " hour" + (interval === 1 ? "" : "s") + " ago";
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + " minute" + (interval === 1 ? "" : "s") + " ago";
  
  return "just now";
}

// Helper function to format date
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const menuItems = document.querySelectorAll("[data-section]");
  const sections = document.querySelectorAll(".content-section");
  const dropdownItems = document.querySelectorAll(".has-dropdown");
  const logoutSidebar = document.getElementById("logoutSidebar");
  const calendarDates = document.getElementById("calendarDates");
  const monthYear = document.getElementById("monthYear");
  
  // Load recent bookings immediately and set up real-time updates
  loadRecentBookings();
  
  // Set up real-time updates for recent bookings
  const bookingsRef = collection(db, "bookings");
  onSnapshot(query(bookingsRef, orderBy("timestamp", "desc")), () => {
    loadRecentBookings();
  });
  const prevMonthBtn = document.getElementById("prevMonthBtn");
  const nextMonthBtn = document.getElementById("nextMonthBtn");
  const slotPanel = document.getElementById("slotPanel");
  const selectedDateDisplay = document.getElementById("selectedDateDisplay");
  const slotCheckboxes = document.querySelectorAll(".slot-checkbox");
  const markFullyBookedBtn = document.getElementById("markFullyBookedBtn");
  const saveSlotsBtn = document.getElementById("saveSlotsBtn");

  const pendingCountEl = document.getElementById("pendingCount");
  const approvedCountEl = document.getElementById("approvedCount");
  const completedCountEl = document.getElementById("completedCount");
  const pendingTableBody = document.getElementById("pendingBookingsTable");
  const approvedTableBody = document.getElementById("approvedBookingsTable");
  const completedTableBody = document.getElementById("completedBookingsTable");
  
  // Reviews elements
  const totalReviewsCountEl = document.getElementById("totalReviewsCount");
  const averageRatingEl = document.getElementById("averageRating");
  const fiveStarCountEl = document.getElementById("fiveStarCount");
  const reviewsTableBody = document.getElementById("reviewsTableBody");
  
  // Pending reviews elements
  const pendingReviewsCountEl = document.getElementById("pendingReviewsCount");
  const approvedTodayCountEl = document.getElementById("approvedTodayCount");
  const pendingReviewsTableBody = document.getElementById("pendingReviewsTableBody");
  
  // Newsletter elements
  const totalSubscribersCountEl = document.getElementById("totalSubscribersCount");
  const activeSubscribersCountEl = document.getElementById("activeSubscribersCount");
  const monthlySubscribersCountEl = document.getElementById("monthlySubscribersCount");
  const newsletterTableBody = document.getElementById("newsletterTableBody");

  const allSlots = ["9AM-1PM", "2PM-6PM", "7PM-11PM"];
  let currentDate = new Date();
  let selectedDate = null;
  let bookings = {};
  
  const ITEMS_PER_PAGE = 10;
  let currentPages = {
    pending: 1,
    approved: 1,
    completed: 1
  };
  let allBookingsData = [];
  let bookingsMap = new Map();

  function activateSection(sectionId) {
    menuItems.forEach(i => i.classList.remove("active"));
    sections.forEach(s => s.classList.remove("active"));
    
    const menuItem = document.querySelector(`[data-section="${sectionId}"]`);
    const section = document.getElementById(sectionId);
    
    if (menuItem && section) {
      menuItem.classList.add("active");
      section.classList.add("active");
      sessionStorage.setItem('activeAdminSection', sectionId);
      
      const parentDropdown = menuItem.closest('.has-dropdown');
      if (parentDropdown) {
        const parentMenuItem = parentDropdown.querySelector('div');
        if (parentMenuItem) {
          parentMenuItem.parentElement.classList.add("active");
        }
      }
      
      if (sectionId === "spam-control") {
        loadCaptchaSettings();
      }
    }
  }

  menuItems.forEach(item => {
    item.addEventListener("click", () => {
      const sectionId = item.getAttribute("data-section");
      activateSection(sectionId);
    });
  });
  
  setTimeout(() => {
    const savedSection = sessionStorage.getItem('activeAdminSection');
    if (savedSection) {
      const section = document.getElementById(savedSection);
      if (section) {
        activateSection(savedSection);
      }
    }
  }, 100);

  // Handle dropdown clicks
  dropdownItems.forEach(dropdown => {
    dropdown.addEventListener("click", (e) => {
      e.stopPropagation();
      
      // Close other dropdowns
      dropdownItems.forEach(item => {
        if (item !== dropdown) {
          item.classList.remove("open");
        }
      });
      
      // Toggle current dropdown
      dropdown.classList.toggle("open");
    });
  });
  
  // Handle dropdown item clicks (pending, approved, etc.)
  document.querySelectorAll('.dropdown li[data-section]').forEach(dropdownItem => {
    dropdownItem.addEventListener('click', (e) => {
      e.stopPropagation();
      const sectionId = dropdownItem.getAttribute('data-section');
      activateSection(sectionId);
      
      // Close the dropdown
      const parentDropdown = dropdownItem.closest('.has-dropdown');
      if (parentDropdown) {
        parentDropdown.classList.remove('open');
      }
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener("click", () => {
    dropdownItems.forEach(dropdown => {
      dropdown.classList.remove("open");
    });
  });

  if (logoutSidebar) {
    logoutSidebar.addEventListener("click", async (e) => {
      e.preventDefault();
      
      try {
        const { signOut } = await import("https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js");
        await signOut(auth);
        
        sessionStorage.removeItem('adminLoggedIn');
        sessionStorage.removeItem('adminLoginTime');
        
        alert("Logged out successfully!");
        window.location.href = "index.html";
      } catch (error) {
        console.error("Logout error:", error);
        sessionStorage.removeItem('adminLoggedIn');
        sessionStorage.removeItem('adminLoginTime');
        window.location.href = "index.html";
      }
    });
  }

  function formatDateTime(dateStr, timeStr) {
    const date = new Date(dateStr);
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      timeZone: 'Asia/Manila'
    };
    const formattedDate = date.toLocaleDateString('en-PH', options);
    return `${formattedDate} ${timeStr}`;
  }

  function createBookingRow(booking, showActions = false, showCompleteAction = false) {
    const row = document.createElement("tr");
    
    const nameCell = document.createElement("td");
    nameCell.setAttribute('data-full-text', booking.name);
    nameCell.textContent = booking.name;
    
    const contactCell = document.createElement("td");
    contactCell.setAttribute('data-full-text', booking.contact);
    contactCell.textContent = booking.contact;
    
    const photoCell = document.createElement("td");
    if (booking.photo && booking.photo !== 'image_uploaded_locally') {
      photoCell.innerHTML = `<a href="${booking.photo}" target="_blank" style="color: #a855f7; text-decoration: underline; cursor: pointer;">View Design</a>`;
    } else if (booking.photo === 'image_uploaded_locally') {
      photoCell.textContent = 'Image uploaded';
    } else {
      photoCell.textContent = 'No image';
    }
    
    const typeCell = document.createElement("td");
    typeCell.setAttribute('data-full-text', booking.type);
    typeCell.textContent = booking.type;
    
    const paymentCell = document.createElement("td");
    paymentCell.setAttribute('data-full-text', booking.payment);
    paymentCell.textContent = booking.payment;
    
    const refCell = document.createElement("td");
    const refText = booking.referenceNumber || 'N/A';
    refCell.setAttribute('data-full-text', refText);
    refCell.textContent = refText;
    
    const proofCell = document.createElement("td");
    if (booking.paymentProofUrl) {
      proofCell.innerHTML = `<a href="${booking.paymentProofUrl}" target="_blank" style="color: #a855f7; text-decoration: underline; cursor: pointer;">View Proof</a>`;
    } else {
      proofCell.textContent = 'N/A';
    }
    
    const bookingId = booking.id || `booking_${Date.now()}_${Math.random()}`;
    bookingsMap.set(bookingId, booking);
    
    const dateCell = document.createElement("td");
    dateCell.setAttribute('data-full-text', booking.date);
    dateCell.textContent = booking.date;
    
    const timeCell = document.createElement("td");
    const timeText = booking.timeDisplay || booking.time;
    timeCell.setAttribute('data-full-text', timeText);
    timeCell.textContent = timeText;
    
    row.appendChild(nameCell);
    row.appendChild(contactCell);
    row.appendChild(photoCell);
    row.appendChild(typeCell);
    row.appendChild(paymentCell);
    row.appendChild(refCell);
    row.appendChild(proofCell);
    row.appendChild(dateCell);
    row.appendChild(timeCell);
    
    if (showActions) {
      const actionsCell = document.createElement("td");
      actionsCell.className = "actions-cell";
      
      const viewBtn = document.createElement("button");
      viewBtn.className = "view-full-btn";
      viewBtn.innerHTML = '<i class="fas fa-eye"></i> View';
      viewBtn.setAttribute('data-booking-id', bookingId);
      viewBtn.style.marginRight = '4px';
      viewBtn.onclick = function(e) {
        e.preventDefault();
        console.log('View button clicked!');
        const bid = this.getAttribute('data-booking-id');
        console.log('Booking ID:', bid);
        const bookingData = bookingsMap.get(bid);
        console.log('Retrieved booking data:', bookingData);
        if (bookingData) {
          viewFullDetails(bookingData);
        } else {
          console.error('Booking data not found in map!');
        }
      };
      
      const approveBtn = document.createElement("button");
      approveBtn.className = "approve-btn";
      approveBtn.innerHTML = '✓ Approve';
      approveBtn.style.cssText = 'background: #1a1a1a; color: white; border: 1px solid #444; padding: 5px 10px; margin: 2px; border-radius: 4px; cursor: pointer; transition: all 0.3s;';
      approveBtn.onmouseover = () => approveBtn.style.background = '#333';
      approveBtn.onmouseout = () => approveBtn.style.background = '#1a1a1a';
      approveBtn.onclick = () => approveBooking(booking.id, booking.date, booking.time);
      
      const declineBtn = document.createElement("button");
      declineBtn.className = "decline-btn";
      declineBtn.innerHTML = '✗ Decline';
      declineBtn.style.cssText = 'background: #fff; color: #1a1a1a; border: 1px solid #ddd; padding: 5px 10px; margin: 2px; border-radius: 4px; cursor: pointer; transition: all 0.3s;';
      declineBtn.onmouseover = () => { declineBtn.style.background = '#f0f0f0'; declineBtn.style.borderColor = '#999'; };
      declineBtn.onmouseout = () => { declineBtn.style.background = '#fff'; declineBtn.style.borderColor = '#ddd'; };
      declineBtn.onclick = () => declineBooking(booking.id);
      
      actionsCell.appendChild(viewBtn);
      actionsCell.appendChild(approveBtn);
      actionsCell.appendChild(declineBtn);
      
      row.appendChild(actionsCell);
    } else if (showCompleteAction) {
      const actionsCell = document.createElement("td");
      actionsCell.className = "actions-cell";
      
      const viewBtn = document.createElement("button");
      viewBtn.className = "view-full-btn";
      viewBtn.innerHTML = '<i class="fas fa-eye"></i> View';
      viewBtn.setAttribute('data-booking-id', bookingId);
      viewBtn.style.marginRight = '4px';
      viewBtn.onclick = function(e) {
        e.preventDefault();
        console.log('View button clicked (Approved)!');
        const bid = this.getAttribute('data-booking-id');
        console.log('Booking ID:', bid);
        const bookingData = bookingsMap.get(bid);
        console.log('Retrieved booking data:', bookingData);
        if (bookingData) {
          viewFullDetails(bookingData);
        } else {
          console.error('Booking data not found in map!');
        }
      };
      
      const completeBtn = document.createElement("button");
      completeBtn.className = "complete-btn";
      completeBtn.innerHTML = '✓ Mark as Completed';
      completeBtn.style.cssText = 'background: #1a1a1a; color: white; border: 1px solid #444; padding: 8px 15px; margin: 2px; border-radius: 4px; cursor: pointer; font-weight: bold; transition: all 0.3s;';
      completeBtn.onmouseover = () => completeBtn.style.background = '#333';
      completeBtn.onmouseout = () => completeBtn.style.background = '#1a1a1a';
      completeBtn.onclick = () => completeBooking(booking.id);
      
      actionsCell.appendChild(viewBtn);
      actionsCell.appendChild(completeBtn);
      
      row.appendChild(actionsCell);
    }
    
    return row;
  }

  function updateBookingCounts(bookingsData) {
    const pending = bookingsData.filter(b => b.status === 'pending').length;
    const approved = bookingsData.filter(b => b.status === 'approved').length;
    const completed = bookingsData.filter(b => b.status === 'completed').length;

    pendingCountEl.textContent = pending;
    approvedCountEl.textContent = approved;
    completedCountEl.textContent = completed;
  }

  function displayBookings(bookingsData) {
    allBookingsData = bookingsData;
    updateBookingCounts(bookingsData);
    displayPage('pending');
    displayPage('approved');
    displayPage('completed');
  }

  function displayPage(status) {
    const currentPage = currentPages[status];
    const filteredBookings = allBookingsData.filter(b => b.status === status);
    const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
    
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageBookings = filteredBookings.slice(startIndex, endIndex);
    
    let tableBody;
    let showActions = false;
    let showCompleteAction = false;
    
    if (status === 'pending') {
      tableBody = pendingTableBody;
      showActions = true;
    } else if (status === 'approved') {
      tableBody = approvedTableBody;
      showCompleteAction = true;
    } else {
      tableBody = completedTableBody;
    }
    
    tableBody.innerHTML = '';
    pageBookings.forEach(booking => {
      tableBody.appendChild(createBookingRow(booking, showActions, showCompleteAction));
    });
    
    updatePaginationControls(status, currentPage, totalPages);
  }

  function updatePaginationControls(status, currentPage, totalPages) {
    const prevBtn = document.getElementById(`${status}PrevBtn`);
    const nextBtn = document.getElementById(`${status}NextBtn`);
    const pageNumbers = document.getElementById(`${status}PageNumbers`);
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    
    pageNumbers.innerHTML = '';
    
    if (totalPages > 0) {
      const maxPageButtons = 5;
      let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
      let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
      
      if (endPage - startPage < maxPageButtons - 1) {
        startPage = Math.max(1, endPage - maxPageButtons + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = i === currentPage ? 'active' : '';
        pageBtn.onclick = () => goToPage(status, i);
        pageNumbers.appendChild(pageBtn);
      }
    }
  }

  window.changePage = function(status, direction) {
    const filteredBookings = allBookingsData.filter(b => b.status === status);
    const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
    
    currentPages[status] = Math.max(1, Math.min(currentPages[status] + direction, totalPages));
    displayPage(status);
  }

  window.goToPage = function(status, page) {
    currentPages[status] = page;
    displayPage(status);
  }

  window.approveBooking = async (bookingId, date, time) => {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      const bookingDoc = await getDoc(bookingRef);
      
      if (!bookingDoc.exists()) {
        alert("Booking not found!");
        return;
      }

      const bookingData = bookingDoc.data();
      
      await updateDoc(bookingRef, {
        status: "approved",
        approvedAt: new Date().toISOString()
      });

      await addBookedSlotToCalendar(date, time);
      
      const smsResult = await sendApprovalSMS(bookingData);
      
      if (smsResult.success) {
        alert("Booking approved successfully! SMS confirmation sent to client.");
      } else {
        alert("Booking approved successfully! However, SMS notification failed: " + smsResult.error);
      }
      
    } catch (error) {
      console.error("Error approving booking:", error);
      alert("Error approving booking. Please try again.");
    }
  };

  async function sendApprovalSMS(booking) {
    try {
      const clientName = booking.name;
      const bookingDate = booking.date;
      const bookingTime = booking.timeDisplay || booking.time;
      let phoneNumber = booking.contact;
      
      if (!phoneNumber) {
        console.error("No phone number found for booking");
        return { success: false, error: "No phone number provided" };
      }

      phoneNumber = phoneNumber.replace(/\s+/g, '');
      phoneNumber = phoneNumber.replace(/^0/, '+63');
      
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = '+63' + phoneNumber;
      }

      const message = `Real Pain Tattoo Studio

Hi ${clientName}, your booking for ${bookingDate} at ${bookingTime} has been confirmed. We've successfully received your downpayment. Please arrive on time for your appointment.

If you have any questions or inquiries, feel free to message us through our Facebook page.

Thank you for choosing Real Pain Tattoo Studio!

(This is a system-generated message. Please do not call or reply to this number.)`;

      console.log("Sending SMS to:", phoneNumber);

      const response = await fetch('../php/send-sms.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message,
          phoneNumber: phoneNumber
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log("SMS sent successfully:", result);
        return { success: true };
      } else {
        console.error("SMS API error:", result);
        return { success: false, error: result.error || "Unknown error" };
      }
      
    } catch (error) {
      console.error("Error sending SMS:", error);
      return { success: false, error: error.message };
    }
  }

  window.declineBooking = async (bookingId) => {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, {
        status: "declined",
        declinedAt: new Date().toISOString()
      });
      
      alert("Booking declined successfully!");
      
    } catch (error) {
      console.error("Error declining booking:", error);
      alert("Error declining booking. Please try again.");
    }
  };

  // Complete booking function
  window.completeBooking = async (bookingId) => {
    if (!confirm("Mark this booking as completed? This will move it to the Completed tab.")) {
      return;
    }
    
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, {
        status: "completed",
        completedAt: new Date().toISOString()
      });
      
      alert("Booking marked as completed successfully!");
      
    } catch (error) {
      console.error("Error completing booking:", error);
      alert("Error marking booking as completed. Please try again.");
    }
  };

  // Delete review function
  window.deleteReview = async (reviewId) => {
    if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      return;
    }
    
    try {
      console.log("Deleting review:", reviewId);
      await deleteDoc(doc(db, "reviews", reviewId));
      alert("Review deleted successfully!");
      
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Error deleting review. Please try again.");
    }
  };

  // Approve review function
  window.approveReview = async (reviewId) => {
    try {
      console.log("Approving review:", reviewId);
      await updateDoc(doc(db, "reviews", reviewId), {
        status: "approved",
        approvedAt: new Date().toISOString()
      });
      alert("Review approved successfully! It will now appear on the website.");
      
    } catch (error) {
      console.error("Error approving review:", error);
      alert("Error approving review. Please try again.");
    }
  };

  // Reject review function
  window.rejectReview = async (reviewId) => {
    if (!confirm("Are you sure you want to reject this review? It will not appear on the website.")) {
      return;
    }
    
    try {
      console.log("Rejecting review:", reviewId);
      await updateDoc(doc(db, "reviews", reviewId), {
        status: "rejected",
        rejectedAt: new Date().toISOString()
      });
      alert("Review rejected successfully!");
      
    } catch (error) {
      console.error("Error rejecting review:", error);
      alert("Error rejecting review. Please try again.");
    }
  };

  async function addBookedSlotToCalendar(date, time) {
    try {
      const timeSlotMapping = {
        "9:00AM-12:00PM": "9AM-1PM",
        "1:00PM-3:00PM": "2PM-6PM", 
        "4:00PM-6:00PM": "7PM-11PM"
      };
      
      const mappedSlot = timeSlotMapping[time] || time;
      
      const calendarRef = collection(db, "adminCalendar");
      const q = query(calendarRef, where("date", "==", date));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        await addDoc(calendarRef, {
          date: date,
          slots: [mappedSlot]
        });
      } else {
        const docId = snapshot.docs[0].id;
        const existingSlots = snapshot.docs[0].data().slots || [];
        
        if (!existingSlots.includes(mappedSlot)) {
          const updatedSlots = [...existingSlots, mappedSlot];
          await updateDoc(doc(db, "adminCalendar", docId), {
            slots: updatedSlots
          });
        }
      }
    } catch (error) {
      console.error("Error updating calendar:", error);
    }
  }

  function setupBookingsListener() {
    console.log("Setting up bookings listener...");
    const bookingsQuery = query(
      collection(db, "bookings"),
      orderBy("timestamp", "desc")
    );

    onSnapshot(bookingsQuery, (snapshot) => {
      console.log("Received booking updates from Firebase:", snapshot.size, "documents");
      const bookingsData = [];
      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        console.log("Booking document:", data);
        bookingsData.push(data);
      });
      console.log("Total bookings to display:", bookingsData.length);
      displayBookings(bookingsData);
    }, (error) => {
      console.error("Error in bookings listener:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      alert("Error loading bookings: " + error.message + "\n\nPlease make sure you're logged in and have proper permissions.");
    });
  }

  async function loadBookingsFromFirestore() {
    bookings = {};
    const snapshot = await getDocs(collection(db, "adminCalendar"));
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      bookings[data.date] = data.slots || [];
    });
  }

  function renderCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    monthYear.textContent = `${monthNames[month]} ${year}`;
    calendarDates.innerHTML = "";

    for (let i = 0; i < startDay; i++) {
      const emptyCell = document.createElement("div");
      emptyCell.classList.add("empty");
      calendarDates.appendChild(emptyCell);
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dateElement = document.createElement("div");
      dateElement.classList.add("date");
      dateElement.textContent = day;
      dateElement.dataset.date = dateKey;

      const slotsBooked = bookings[dateKey] || [];
      if (slotsBooked.length >= allSlots.length) {
        dateElement.classList.add("fully-booked");
        dateElement.title = "Fully Booked";
      } else if (slotsBooked.length > 0) {
        dateElement.classList.add("partially-booked");
        dateElement.title = "Partially Booked";
      }

      dateElement.addEventListener("click", () => {
        selectedDate = dateKey;
        openSlotPanel(dateKey, slotsBooked);
      });

      calendarDates.appendChild(dateElement);
    }
  }

  function openSlotPanel(dateKey, slotsBooked) {
    slotPanel.style.display = "block";
    selectedDateDisplay.textContent = `Selected Date: ${dateKey}`;
    slotCheckboxes.forEach(cb => {
      cb.checked = slotsBooked.includes(cb.value);
    });
  }

  async function saveSlotsToFirestore(dateKey, selectedSlots) {
    const ref = collection(db, "adminCalendar");
    const q = query(ref, where("date", "==", dateKey));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      await addDoc(ref, { date: dateKey, slots: selectedSlots });
    } else {
      const docId = snapshot.docs[0].id;
      await updateDoc(doc(db, "adminCalendar", docId), {
        slots: selectedSlots
      });
    }
  }

  markFullyBookedBtn.addEventListener("click", async () => {
    if (!selectedDate) return;
    bookings[selectedDate] = [...allSlots];
    await saveSlotsToFirestore(selectedDate, bookings[selectedDate]);
    await loadBookingsFromFirestore();
    renderCalendar(currentDate);
    slotPanel.style.display = "none";
  });

  saveSlotsBtn.addEventListener("click", async () => {
    if (!selectedDate) return;
    const selectedSlots = [];
    slotCheckboxes.forEach(cb => {
      if (cb.checked) selectedSlots.push(cb.value);
    });
    bookings[selectedDate] = selectedSlots;
    await saveSlotsToFirestore(selectedDate, selectedSlots);
    await loadBookingsFromFirestore();
    renderCalendar(currentDate);
    slotPanel.style.display = "none";
  });

  prevMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate);
    slotPanel.style.display = "none";
  });

  nextMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate);
    slotPanel.style.display = "none";
  });

  // Reviews functions
  function setupReviewsListener() {
    console.log("Setting up reviews listener...");
    const reviewsQuery = query(
      collection(db, "reviews"),
      orderBy("timestamp", "desc")
    );

    onSnapshot(reviewsQuery, (snapshot) => {
      console.log("Received review updates from Firebase:", snapshot.size, "reviews");
      const reviewsData = [];
      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        reviewsData.push(data);
      });
      console.log("Total reviews to display:", reviewsData.length);
      displayReviews(reviewsData);
      displayPendingReviews(reviewsData);
    });
  }

  function displayReviews(reviewsData) {
    if (!reviewsTableBody) return;
    
    reviewsTableBody.innerHTML = '';
    
    const approvedReviews = reviewsData.filter(review => review.status !== 'pending');
    
    const totalReviews = approvedReviews.length;
    const averageRating = totalReviews > 0 ? 
      (approvedReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1) : 0;
    const fiveStarReviews = approvedReviews.filter(review => review.rating === 5).length;
    
    if (totalReviewsCountEl) totalReviewsCountEl.textContent = totalReviews;
    if (averageRatingEl) averageRatingEl.textContent = averageRating;
    if (fiveStarCountEl) fiveStarCountEl.textContent = fiveStarReviews;
    
    approvedReviews.forEach(review => {
      const row = document.createElement("tr");
      const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
      const date = new Date(review.timestamp).toLocaleDateString('en-PH');
      const statusColor = review.status === 'approved' ? '#28a745' : '#dc3545';
      
      const photoDisplay = review.photoUrl ? 
        `<a href="${review.photoUrl}" target="_blank" style="color: #a855f7; text-decoration: underline;">
          <img src="${review.photoUrl}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; vertical-align: middle; margin-right: 5px;">
          View Photo
        </a>` : 
        '<span style="color: #999;">No photo</span>';
      
      row.innerHTML = `
        <td>${review.name}</td>
        <td style="color: #ffd700;">${stars} (${review.rating}/5)</td>
        <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${review.message}</td>
        <td>${photoDisplay}</td>
        <td>${date}</td>
        <td>
          <span style="background: ${statusColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-right: 5px;">
            ${review.status.charAt(0).toUpperCase() + review.status.slice(1)}
          </span>
          <button class="delete-review-btn" onclick="deleteReview('${review.id}')" 
                  style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">
            🗑️ Delete
          </button>
        </td>
      `;
      
      reviewsTableBody.appendChild(row);
    });
  }

  function displayPendingReviews(reviewsData) {
    if (!pendingReviewsTableBody) return;
    
    pendingReviewsTableBody.innerHTML = '';
    
    const pendingReviews = reviewsData.filter(review => review.status === 'pending');
    
    const pendingCount = pendingReviews.length;
    
    const today = new Date().toISOString().split('T')[0];
    const approvedToday = reviewsData.filter(review => 
      review.status === 'approved' && 
      review.approvedAt && 
      review.approvedAt.startsWith(today)
    ).length;
    
    if (pendingReviewsCountEl) pendingReviewsCountEl.textContent = pendingCount;
    if (approvedTodayCountEl) approvedTodayCountEl.textContent = approvedToday;
    
    pendingReviews.forEach(review => {
      const row = document.createElement("tr");
      const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
      const date = new Date(review.timestamp).toLocaleDateString('en-PH');
      
      const photoDisplay = review.photoUrl ? 
        `<a href="${review.photoUrl}" target="_blank" style="color: #a855f7; text-decoration: underline;">
          <img src="${review.photoUrl}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; vertical-align: middle; margin-right: 5px;">
          View Photo
        </a>` : 
        '<span style="color: #999;">No photo</span>';
      
      row.innerHTML = `
        <td>${review.name}</td>
        <td style="color: #ffd700;">${stars} (${review.rating}/5)</td>
        <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${review.message}</td>
        <td>${photoDisplay}</td>
        <td>${date}</td>
        <td>
          <button onclick="approveReview('${review.id}')" 
                  style="background: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 5px;">
            ✓ Approve
          </button>
          <button onclick="rejectReview('${review.id}')" 
                  style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">
            ✗ Reject
          </button>
        </td>
      `;
      
      pendingReviewsTableBody.appendChild(row);
    });
  }

  // Newsletter functions
  function setupNewsletterListener() {
    console.log("Setting up newsletter listener...");
    const newsletterQuery = query(
      collection(db, "newsletter"),
      orderBy("subscribedAt", "desc")
    );

    onSnapshot(newsletterQuery, (snapshot) => {
      console.log("Received newsletter updates from Firebase:", snapshot.size, "subscribers");
      const newsletterData = [];
      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        newsletterData.push(data);
      });
      console.log("Total subscribers to display:", newsletterData.length);
      displayNewsletter(newsletterData);
    });
  }

  function displayNewsletter(newsletterData) {
    if (!newsletterTableBody) return;
    
    newsletterTableBody.innerHTML = '';
    
    // Calculate stats
    const totalSubscribers = newsletterData.length;
    const activeSubscribers = newsletterData.filter(sub => sub.status === 'verified' || sub.status === 'active').length;
    
    // Calculate this month's subscribers
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlySubscribers = newsletterData.filter(sub => {
      const subDate = new Date(sub.subscribedAt);
      return subDate.getMonth() === currentMonth && subDate.getFullYear() === currentYear;
    }).length;
    
    // Update stats
    if (totalSubscribersCountEl) totalSubscribersCountEl.textContent = totalSubscribers;
    if (activeSubscribersCountEl) activeSubscribersCountEl.textContent = activeSubscribers;
    if (monthlySubscribersCountEl) monthlySubscribersCountEl.textContent = monthlySubscribers;
    
    // Display subscribers in table
    newsletterData.forEach(subscriber => {
      const row = document.createElement("tr");
      const date = new Date(subscriber.subscribedAt).toLocaleDateString('en-PH');
      let statusColor = '#6c757d';
      let statusText = subscriber.status || 'unverified';
      
      if (subscriber.status === 'verified') {
        statusColor = '#28a745';
        statusText = 'Verified';
      } else if (subscriber.status === 'unverified') {
        statusColor = '#ffc107';
        statusText = 'Pending Verification';
      } else if (subscriber.status === 'active') {
        statusColor = '#28a745';
        statusText = 'Active';
      } else {
        statusColor = '#dc3545';
        statusText = subscriber.status || 'Unknown';
      }
      
      row.innerHTML = `
        <td>${subscriber.email}</td>
        <td>${date}</td>
        <td><span style="background: ${statusColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${statusText}</span></td>
        <td>
          <button class="delete-subscriber-btn" onclick="deleteSubscriber('${subscriber.id}')" 
                  style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">
            🗑️ Remove
          </button>
        </td>
      `;
      
      newsletterTableBody.appendChild(row);
    });
  }

  // Delete subscriber function
  window.deleteSubscriber = async (subscriberId) => {
    if (!confirm("Are you sure you want to remove this subscriber? This action cannot be undone.")) {
      return;
    }
    
    try {
      console.log("Removing subscriber:", subscriberId);
      await deleteDoc(doc(db, "newsletter", subscriberId));
      alert("Subscriber removed successfully!");
      
    } catch (error) {
      console.error("Error removing subscriber:", error);
      alert("Error removing subscriber. Please try again.");
    }
  };

  // AR Feature Functions
  window.openARPreview = function() {
    window.open('../virtual-reality.html', '_blank');
  };

  window.manageARDesigns = function() {
    openARDesignsModal();
  };
  
  function openARDesignsModal() {
    const modalHTML = `
      <div id="arDesignsModal" class="details-modal-overlay active">
        <div class="details-modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
          <button class="details-modal-close" onclick="closeARDesignsModal()">×</button>
          <h2><i class="fas fa-images"></i> Manage AR Designs</h2>
          
          <div style="margin-top: 20px;">
            <h3 style="margin-bottom: 15px;">Upload New Design</h3>
            <div class="upload-area" id="arUploadDropZone" style="border: 2px dashed #ddd; padding: 30px; text-align: center; border-radius: 10px; cursor: pointer; transition: all 0.3s;">
              <input type="file" id="arDesignUploadInput" accept="image/png" hidden>
              <i class="fas fa-cloud-upload-alt" style="font-size: 3rem; color: #999; margin-bottom: 10px;"></i>
              <h4>Drag & Drop PNG Image Here</h4>
              <p style="color: #999;">or click to browse</p>
              <span style="font-size: 0.85rem; color: #999;">PNG with transparent background recommended</span>
            </div>
            
            <div id="arUploadPreview" style="display: none; margin-top: 20px; text-align: center;">
              <img id="arPreviewImg" style="max-width: 200px; max-height: 200px; border-radius: 8px; margin-bottom: 10px;">
              <div>
                <input type="text" id="arDesignName" placeholder="Design Name" style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; margin-bottom: 10px;">
                <button id="uploadARDesignBtn" style="width: 100%; padding: 15px; background: #1a1a1a; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">
                  <i class="fas fa-upload"></i> Upload Design
                </button>
              </div>
            </div>
          </div>
          
          <div style="margin-top: 30px;">
            <h3 style="margin-bottom: 15px;">Current Designs (<span id="arDesignCountModal">0</span>)</h3>
            <div id="arDesignsGridModal" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px;">
              <div style="text-align: center; padding: 20px; color: #999;">
                <i class="fas fa-spinner fa-spin"></i><br>Loading...
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    setupARDesignsModal();
    loadARDesignsToModal();
  }
  
  function setupARDesignsModal() {
    const dropZone = document.getElementById('arUploadDropZone');
    const fileInput = document.getElementById('arDesignUploadInput');
    const preview = document.getElementById('arUploadPreview');
    const previewImg = document.getElementById('arPreviewImg');
    const designName = document.getElementById('arDesignName');
    const uploadBtn = document.getElementById('uploadARDesignBtn');
    
    let selectedFile = null;
    
    dropZone.addEventListener('click', () => fileInput.click());
    
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = '#1a1a1a';
      dropZone.style.background = '#f9f9f9';
    });
    
    dropZone.addEventListener('dragleave', () => {
      dropZone.style.borderColor = '#ddd';
      dropZone.style.background = 'transparent';
    });
    
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = '#ddd';
      dropZone.style.background = 'transparent';
      if (e.dataTransfer.files.length > 0) {
        handleARFileSelect(e.dataTransfer.files[0]);
      }
    });
    
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleARFileSelect(e.target.files[0]);
      }
    });
    
    function handleARFileSelect(file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImg.src = e.target.result;
        dropZone.style.display = 'none';
        preview.style.display = 'block';
        
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        designName.value = nameWithoutExt;
      };
      reader.readAsDataURL(file);
    }
    
    uploadBtn.addEventListener('click', async () => {
      if (!selectedFile || !designName.value.trim()) {
        alert('Please select a file and enter a design name');
        return;
      }
      
      try {
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        
        const CLOUDINARY_CLOUD_NAME = 'dlgborn7e';
        const CLOUDINARY_UPLOAD_PRESET = 'tattoo_uploads';
        
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        
        if (data.secure_url) {
          await addDoc(collection(db, 'arDesigns'), {
            name: designName.value.trim(),
            imageUrl: data.secure_url,
            uploadedAt: new Date().toISOString(),
            enabled: true
          });
          
          alert('AR Design uploaded successfully!');
          
          dropZone.style.display = 'block';
          preview.style.display = 'none';
          fileInput.value = '';
          designName.value = '';
          selectedFile = null;
          
          loadARDesignsToModal();
          updateARDesignCount();
        } else {
          throw new Error('Upload failed');
        }
        
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Design';
        
      } catch (error) {
        console.error('Error uploading AR design:', error);
        alert('Error uploading design. Please try again.');
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Design';
      }
    });
  }
  
  async function loadARDesignsToModal() {
    const grid = document.getElementById('arDesignsGridModal');
    const countEl = document.getElementById('arDesignCountModal');
    
    try {
      const querySnapshot = await getDocs(collection(db, 'arDesigns'));
      const designs = [];
      
      querySnapshot.forEach((doc) => {
        designs.push({ id: doc.id, ...doc.data() });
      });
      
      designs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
      
      if (countEl) countEl.textContent = designs.length;
      
      if (designs.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #999;">
            <i class="fas fa-images" style="font-size: 3rem; margin-bottom: 10px;"></i>
            <p>No AR designs yet. Upload your first design above!</p>
          </div>
        `;
        return;
      }
      
      grid.innerHTML = '';
      
      designs.forEach(design => {
        const designDiv = document.createElement('div');
        designDiv.style.cssText = 'position: relative; border: 2px solid #e0e0e0; border-radius: 10px; padding: 10px; text-align: center; transition: all 0.3s;';
        designDiv.onmouseover = () => designDiv.style.borderColor = '#1a1a1a';
        designDiv.onmouseout = () => designDiv.style.borderColor = '#e0e0e0';
        
        designDiv.innerHTML = `
          <img src="${design.imageUrl}" style="width: 100%; height: 100px; object-fit: contain; margin-bottom: 8px;">
          <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${design.name}</div>
          <button onclick="deleteARDesign('${design.id}')" style="width: 100%; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">
            <i class="fas fa-trash"></i> Delete
          </button>
        `;
        
        grid.appendChild(designDiv);
      });
      
    } catch (error) {
      console.error('Error loading AR designs:', error);
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #dc3545;">
          <i class="fas fa-exclamation-triangle"></i> Error loading designs
        </div>
      `;
    }
  }
  
  window.deleteARDesign = async function(designId) {
    if (!confirm('Are you sure you want to delete this AR design? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'arDesigns', designId));
      alert('AR Design deleted successfully!');
      loadARDesignsToModal();
      updateARDesignCount();
    } catch (error) {
      console.error('Error deleting AR design:', error);
      alert('Error deleting design. Please try again.');
    }
  };
  
  window.closeARDesignsModal = function() {
    const modal = document.getElementById('arDesignsModal');
    if (modal) {
      modal.remove();
    }
  };
  
  async function updateARDesignCount() {
    try {
      const querySnapshot = await getDocs(collection(db, 'arDesigns'));
      const count = querySnapshot.size;
      const countEl = document.getElementById('arDesignCount');
      if (countEl) countEl.textContent = count;
    } catch (error) {
      console.error('Error updating AR design count:', error);
    }
  }

  window.viewARAnalytics = function() {
    alert('AR Analytics feature coming soon!\n\nThis will show you:\n- Number of AR sessions\n- Most popular designs\n- User engagement metrics');
  };

  // AR Toggle functionality
  const arToggle = document.getElementById('arToggle');
  const arStatus = document.getElementById('arStatus');
  
  // Load AR settings on page load
  async function loadARSettings() {
    try {
      const arSettingsRef = doc(db, "settings", "arFeature");
      const docSnap = await getDoc(arSettingsRef);
      
      let arEnabled = true; // Default to enabled
      if (docSnap.exists()) {
        arEnabled = docSnap.data().enabled;
      }
      
      if (arToggle) {
        arToggle.checked = arEnabled;
        updateARStatus(arEnabled);
      }
      
      console.log('AR settings loaded:', arEnabled);
      
    } catch (error) {
      console.error('Error loading AR settings:', error);
    }
  }
  
  function updateARStatus(enabled) {
    if (!arStatus) return;
    
    const statusDot = arStatus.querySelector('.status-dot');
    const statusText = arStatus.childNodes[2]; // Text node after the span
    
    if (enabled) {
      statusDot.classList.add('active');
      statusText.textContent = 'Active';
    } else {
      statusDot.classList.remove('active');
      statusText.textContent = 'Inactive';
    }
  }
  
  if (arToggle && arStatus) {
    arToggle.addEventListener('change', async function() {
      const enabled = this.checked;
      updateARStatus(enabled);
      
      try {
        // Save AR setting to Firebase using setDoc (creates or updates)
        const arSettingsRef = doc(db, "settings", "arFeature");
        await setDoc(arSettingsRef, {
          enabled: enabled,
          updatedAt: new Date().toISOString()
        });
        
        console.log('AR Feature', enabled ? 'enabled' : 'disabled', 'and saved to Firebase successfully');
        alert('AR Feature ' + (enabled ? 'enabled' : 'disabled') + ' successfully!');
        
      } catch (error) {
        console.error('Error saving AR settings:', error);
        console.error('Error details:', error.message, error.code);
        alert('Error saving AR settings: ' + error.message);
        // Revert toggle if save failed
        this.checked = !enabled;
        updateARStatus(!enabled);
      }
    });
  }

  window.viewFullDetails = function(booking) {
    console.log('viewFullDetails called with:', booking);
    const modal = document.getElementById('detailsModal');
    const content = document.getElementById('modalDetailsContent');
    
    if (!modal) {
      console.error('Modal not found!');
      return;
    }
    
    if (!content) {
      console.error('Modal content not found!');
      return;
    }
    
    content.innerHTML = `
      <div class="detail-row">
        <div class="detail-label">Client Name</div>
        <div class="detail-value">${booking.name}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Email</div>
        <div class="detail-value">${booking.email}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Contact Number</div>
        <div class="detail-value">${booking.contact}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Booking Type</div>
        <div class="detail-value">${booking.type}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Payment Method</div>
        <div class="detail-value">${booking.payment}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Reference Number</div>
        <div class="detail-value">${booking.referenceNumber || 'N/A'}</div>
      </div>
      ${booking.paymentProofUrl ? `
      <div class="detail-row">
        <div class="detail-label">Payment Proof</div>
        <div class="detail-value">
          <a href="${booking.paymentProofUrl}" target="_blank" style="color: #fff; text-decoration: underline; transition: opacity 0.3s;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">
            <i class="fas fa-external-link-alt"></i> View Payment Proof
          </a>
        </div>
      </div>
      ` : ''}
      ${booking.photo && booking.photo !== 'image_uploaded_locally' ? `
      <div class="detail-row">
        <div class="detail-label">Design Image</div>
        <div class="detail-value">
          <a href="${booking.photo}" target="_blank" style="color: #fff; text-decoration: underline; transition: opacity 0.3s;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">
            <i class="fas fa-external-link-alt"></i> View Design Image
          </a>
        </div>
      </div>
      ` : ''}
      <div class="detail-row">
        <div class="detail-label">Message / Note</div>
        <div class="detail-value">${booking.message || 'No message provided'}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Booking Date</div>
        <div class="detail-value">${booking.date}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Time Slot</div>
        <div class="detail-value">${booking.timeDisplay || booking.time}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Status</div>
        <div class="detail-value" style="text-transform: capitalize; color: #fff; font-weight: bold;">
          ${booking.status}
        </div>
      </div>
    `;
    
    modal.classList.add('active');
  };

  window.closeDetailsModal = function() {
    const modal = document.getElementById('detailsModal');
    modal.classList.remove('active');
  };

  document.getElementById('detailsModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeDetailsModal();
    }
  });

  const uploadDropZone = document.getElementById('uploadDropZone');
  const galleryUploadInput = document.getElementById('galleryUploadInput');
  const uploadPreview = document.getElementById('uploadPreview');
  const previewImg = document.getElementById('previewImg');
  const uploadBtn = document.getElementById('uploadBtn');
  const imageCategory = document.getElementById('imageCategory');
  const imageDate = document.getElementById('imageDate');
  const imageDescription = document.getElementById('imageDescription');
  const uploadProgress = document.getElementById('uploadProgress');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const galleryManageGrid = document.getElementById('galleryManageGrid');
  const totalImagesEl = document.getElementById('totalImages');
  const categoryFilter = document.getElementById('categoryFilter');

  let selectedFile = null;
  let allGalleryImages = [];

  if (uploadDropZone) {
    uploadDropZone.addEventListener('click', () => {
      galleryUploadInput.click();
    });

    uploadDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadDropZone.classList.add('dragover');
    });

    uploadDropZone.addEventListener('dragleave', () => {
      uploadDropZone.classList.remove('dragover');
    });

    uploadDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadDropZone.classList.remove('dragover');
      
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith('image/')) {
        handleFileSelect(files[0]);
      }
    });
  }

  if (galleryUploadInput) {
    galleryUploadInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
      }
    });
  }

  function handleFileSelect(file) {
    selectedFile = file;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      uploadDropZone.style.display = 'none';
      uploadPreview.style.display = 'block';
      checkUploadFormValidity();
    };
    reader.readAsDataURL(file);
  }

  window.removePreview = function() {
    selectedFile = null;
    uploadDropZone.style.display = 'block';
    uploadPreview.style.display = 'none';
    galleryUploadInput.value = '';
    checkUploadFormValidity();
  };

  function checkUploadFormValidity() {
    const hasFile = selectedFile !== null;
    const hasCategory = imageCategory && imageCategory.value !== '';
    const hasDate = imageDate && imageDate.value !== '';
    
    if (uploadBtn) {
      uploadBtn.disabled = !(hasFile && hasCategory && hasDate);
    }
  }

  if (imageCategory) {
    imageCategory.addEventListener('change', checkUploadFormValidity);
  }

  if (imageDate) {
    imageDate.addEventListener('change', checkUploadFormValidity);
  }

  async function uploadImageToCloudinary(file) {
    const CLOUDINARY_CLOUD_NAME = 'dlgborn7e';
    const CLOUDINARY_UPLOAD_PRESET = 'tattoo_uploads'; // You'll need to create this in Cloudinary dashboard
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

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
  }

  if (uploadBtn) {
    uploadBtn.addEventListener('click', async () => {
      if (!selectedFile || !imageCategory.value || !imageDate.value) {
        alert('Please fill in all required fields');
        return;
      }

      try {
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        uploadProgress.style.display = 'block';
        progressFill.style.width = '30%';
        progressText.textContent = 'Uploading image... 30%';

        const imageUrl = await uploadImageToCloudinary(selectedFile);
        
        progressFill.style.width = '70%';
        progressText.textContent = 'Saving to database... 70%';

        const galleryData = {
          imageUrl: imageUrl,
          category: imageCategory.value,
          date: imageDate.value,
          description: imageDescription.value || '',
          uploadedAt: new Date().toISOString()
        };

        await addDoc(collection(db, 'gallery'), galleryData);
        
        progressFill.style.width = '100%';
        progressText.textContent = 'Upload complete! 100%';

        setTimeout(() => {
          alert('Image uploaded successfully to gallery!');
          
          imageCategory.value = '';
          imageDate.value = '';
          imageDescription.value = '';
          removePreview();
          uploadProgress.style.display = 'none';
          progressFill.style.width = '0%';
          uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload to Gallery';
          uploadBtn.disabled = false;
          
          loadGalleryImages();
        }, 1000);

      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Error uploading image. Please try again.');
        uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload to Gallery';
        uploadBtn.disabled = false;
        uploadProgress.style.display = 'none';
        progressFill.style.width = '0%';
      }
    });
  }

  async function loadGalleryImages() {
    try {
      const querySnapshot = await getDocs(collection(db, 'gallery'));
      allGalleryImages = [];
      
      querySnapshot.forEach((doc) => {
        allGalleryImages.push({
          id: doc.id,
          ...doc.data()
        });
      });

      allGalleryImages.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
      
      if (totalImagesEl) {
        totalImagesEl.textContent = allGalleryImages.length;
      }
      
      displayGalleryImages();

    } catch (error) {
      console.error('Error loading gallery images:', error);
      if (galleryManageGrid) {
        galleryManageGrid.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error Loading Gallery</h3>
            <p>Please try refreshing the page</p>
          </div>
        `;
      }
    }
  }

  function displayGalleryImages(filterCategory = 'all') {
    if (!galleryManageGrid) return;

    let imagesToDisplay = allGalleryImages;
    
    if (filterCategory !== 'all') {
      imagesToDisplay = allGalleryImages.filter(img => img.category === filterCategory);
    }

    if (imagesToDisplay.length === 0) {
      galleryManageGrid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-images"></i>
          <h3>No Images Found</h3>
          <p>Upload your first tattoo image to get started!</p>
        </div>
      `;
      return;
    }

    galleryManageGrid.innerHTML = '';
    
    imagesToDisplay.forEach(image => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'gallery-manage-item';
      
      const formattedDate = new Date(image.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      
      itemDiv.innerHTML = `
        <img src="${image.imageUrl}" alt="${image.category} tattoo">
        <div class="gallery-item-info">
          <span class="gallery-item-category">${image.category}</span>
          <div class="gallery-item-date">${formattedDate}</div>
          ${image.description ? `<p style="font-size: 0.85rem; color: #666; margin: 8px 0;">${image.description}</p>` : ''}
          <div class="gallery-item-actions">
            <button class="gallery-action-btn edit" onclick="editGalleryImage('${image.id}')">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="gallery-action-btn delete" onclick="deleteGalleryImage('${image.id}')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      `;
      
      galleryManageGrid.appendChild(itemDiv);
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
      displayGalleryImages(e.target.value);
    });
  }

  let currentEditImageId = null;

  window.editGalleryImage = function(imageId) {
    const image = allGalleryImages.find(img => img.id === imageId);
    if (!image) return;

    currentEditImageId = imageId;
    
    const editModal = document.getElementById('editGalleryModal');
    const editCategory = document.getElementById('editCategory');
    const editDate = document.getElementById('editDate');
    const editDescription = document.getElementById('editDescription');
    
    editCategory.value = image.category;
    editDate.value = image.date;
    editDescription.value = image.description || '';
    
    editModal.classList.add('active');
  };

  window.closeEditGalleryModal = function() {
    const editModal = document.getElementById('editGalleryModal');
    editModal.classList.remove('active');
    currentEditImageId = null;
  };

  const saveEditBtn = document.getElementById('saveEditBtn');
  if (saveEditBtn) {
    saveEditBtn.addEventListener('click', async () => {
      if (!currentEditImageId) return;

      const editCategory = document.getElementById('editCategory');
      const editDate = document.getElementById('editDate');
      const editDescription = document.getElementById('editDescription');

      try {
        saveEditBtn.disabled = true;
        saveEditBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        await updateDoc(doc(db, 'gallery', currentEditImageId), {
          category: editCategory.value,
          date: editDate.value,
          description: editDescription.value
        });
        
        alert('Gallery image updated successfully!');
        closeEditGalleryModal();
        loadGalleryImages();
        
        saveEditBtn.disabled = false;
        saveEditBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
        
      } catch (error) {
        console.error('Error updating gallery image:', error);
        alert('Error updating image. Please try again.');
        saveEditBtn.disabled = false;
        saveEditBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
      }
    });
  }

  const editGalleryModal = document.getElementById('editGalleryModal');
  if (editGalleryModal) {
    editGalleryModal.addEventListener('click', function(e) {
      if (e.target === this) {
        closeEditGalleryModal();
      }
    });
  }

  window.deleteGalleryImage = async function(imageId) {
    if (!confirm('Are you sure you want to delete this image from the gallery? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'gallery', imageId));
      alert('Gallery image deleted successfully!');
      loadGalleryImages();
      
    } catch (error) {
      console.error('Error deleting gallery image:', error);
      alert('Error deleting image. Please try again.');
    }
  };

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("User authenticated:", user.email);
      await loadBookingsFromFirestore();
      renderCalendar(currentDate);
      setupBookingsListener();
      setupReviewsListener();
      setupNewsletterListener();
      await loadARSettings();
      await loadCaptchaSettings();
      await loadGalleryImages();
      await updateARDesignCount();
    } else {
      console.log("No user authenticated, redirecting to login...");
      sessionStorage.removeItem('adminLoggedIn');
      sessionStorage.removeItem('adminLoginTime');
      window.location.href = 'index.html';
    }
  });
});

// ========== CAPTCHA TOGGLE FUNCTIONALITY ==========
async function loadCaptchaSettings() {
  try {
    console.log('Loading captcha settings...');
    const captchaToggle = document.getElementById('captchaToggle');
    const captchaStatus = document.getElementById('captchaStatus');
    
    console.log('captchaToggle:', captchaToggle);
    console.log('captchaStatus:', captchaStatus);
    
    if (!captchaToggle || !captchaStatus) {
      console.log('Captcha elements not found, skipping...');
      return;
    }
    
    const captchaSettingsRef = doc(db, "settings", "captchaFeature");
    const docSnap = await getDoc(captchaSettingsRef);
    
    let captchaEnabled = true;
    if (docSnap.exists()) {
      captchaEnabled = docSnap.data().enabled;
      console.log('Found existing captcha setting:', captchaEnabled);
    } else {
      console.log('No existing captcha setting, using default: true');
    }
    
    captchaToggle.checked = captchaEnabled;
    updateCaptchaStatus(captchaEnabled);
    
    if (!captchaToggle._captchaChangeHandler) {
      let isProcessing = false;
      captchaToggle._captchaChangeHandler = async function(e) {
        if (isProcessing) {
          console.log('Already processing toggle change, skipping...');
          return;
        }
        isProcessing = true;
        
        console.log('=== CAPTCHA TOGGLE CLICKED ===');
        console.log('Toggle checked:', this.checked);
        const enabled = this.checked;
        
        updateCaptchaStatus(enabled);
        
        try {
          console.log('Saving to Firebase...');
          const captchaSettingsRef = doc(db, "settings", "captchaFeature");
          await setDoc(captchaSettingsRef, {
            enabled: enabled,
            updatedAt: new Date().toISOString()
          });
          
          console.log('✅ Captcha feature setting saved to Firebase:', enabled);
          alert(enabled ? 'reCAPTCHA verification has been enabled on all forms!' : 'reCAPTCHA verification has been disabled on all forms!');
        } catch (error) {
          console.error('❌ Error saving Captcha setting:', error);
          console.error('Error details:', error.message, error.code);
          alert('Error saving reCAPTCHA setting: ' + error.message);
          this.checked = !enabled;
          updateCaptchaStatus(!enabled);
        } finally {
          setTimeout(() => {
            isProcessing = false;
          }, 500);
        }
      };
      
      captchaToggle.addEventListener('change', captchaToggle._captchaChangeHandler);
      console.log('✅ Event listener attached to captcha toggle');
    } else {
      console.log('Event listener already attached, skipping...');
    }
    
    console.log('Captcha settings loaded successfully:', captchaEnabled);
    
  } catch (error) {
    console.error('Error loading Captcha settings:', error);
  }
}

function updateCaptchaStatus(enabled) {
  const captchaStatus = document.getElementById('captchaStatus');
  const bookingFormBadge = document.getElementById('bookingFormBadge');
  const newsletterFormBadge = document.getElementById('newsletterFormBadge');
  
  if (!captchaStatus) {
    console.log('captchaStatus element not found');
    return;
  }
  
  const statusDot = captchaStatus.querySelector('.status-dot');
  
  if (enabled) {
    if (statusDot) statusDot.classList.add('active');
    captchaStatus.innerHTML = '<span class="status-dot active"></span> Enabled';
    if (bookingFormBadge) {
      bookingFormBadge.classList.remove('inactive');
      bookingFormBadge.classList.add('active');
      bookingFormBadge.textContent = 'Protected';
    }
    if (newsletterFormBadge) {
      newsletterFormBadge.classList.remove('inactive');
      newsletterFormBadge.classList.add('active');
      newsletterFormBadge.textContent = 'Protected';
    }
  } else {
    if (statusDot) statusDot.classList.remove('active');
    captchaStatus.innerHTML = '<span class="status-dot"></span> Disabled';
    if (bookingFormBadge) {
      bookingFormBadge.classList.remove('active');
      bookingFormBadge.classList.add('inactive');
      bookingFormBadge.textContent = 'Not Protected';
    }
    if (newsletterFormBadge) {
      newsletterFormBadge.classList.remove('active');
      newsletterFormBadge.classList.add('inactive');
      newsletterFormBadge.textContent = 'Not Protected';
    }
  }
}