
/* REAL-TIME AVAILABILITY CALENDAR CONNECTED TO ADMIN DASHBOARD */

// Firebase configuration (same as admin dashboard)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
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

document.addEventListener("DOMContentLoaded", () => {
    const monthYear = document.querySelector('.month-year');
    const grid = document.querySelector('.calendar-grid');
    const prevBtn = document.querySelector('.prev-month');
    const nextBtn = document.querySelector('.next-month');
    const selectedDateElement = document.querySelector('.selected-date');
    const slotsContainer = document.querySelector('.slots-container');
    const bookBtn = document.querySelector('.book-now-btn');

    let currentDate = new Date();
    let selectedDate = null;
    let selectedSlot = null;
    let adminCalendarData = {}; // Store admin calendar data

    // Time slots matching admin dashboard
    const allTimeSlots = ["9AM-1PM", "2PM-6PM", "7PM-11PM"];
    const timeSlotDisplayNames = {
        "9AM-1PM": "9:00 AM - 1:00 PM",
        "2PM-6PM": "2:00 PM - 6:00 PM", 
        "7PM-11PM": "7:00 PM - 11:00 PM"
    };

    // Load admin calendar data from Firebase
    async function loadAdminCalendarData() {
        try {
            const snapshot = await getDocs(collection(db, "adminCalendar"));
            adminCalendarData = {};
            snapshot.forEach(doc => {
                const data = doc.data();
                adminCalendarData[data.date] = data.slots || [];
                console.log("Admin calendar data loaded:", data.date, "slots:", data.slots);
            });
            console.log("Full admin calendar data:", adminCalendarData);
            renderCalendar(currentDate);
        } catch (error) {
            console.error("Error loading admin calendar data:", error);
        }
    }

    // Set up real-time listener for admin calendar changes
    function setupAdminCalendarListener() {
        const adminCalendarRef = collection(db, "adminCalendar");
        onSnapshot(adminCalendarRef, (snapshot) => {
            adminCalendarData = {};
            snapshot.forEach(doc => {
                const data = doc.data();
                adminCalendarData[data.date] = data.slots || [];
            });
            renderCalendar(currentDate);
        });
    }

    function getAvailabilityStatus(date) {
        // Use the same date format as admin dashboard
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        
        const bookedSlots = adminCalendarData[dateKey] || [];
        console.log(`Checking availability for ${dateKey}: found ${bookedSlots.length} booked slots:`, bookedSlots);
        
        // Check if all slots are booked
        if (bookedSlots.length >= allTimeSlots.length) {
            console.log(`Date ${dateKey} is FULLY BOOKED`);
            return 'booked'; // Fully booked
        } else if (bookedSlots.length > 0) {
            console.log(`Date ${dateKey} is PARTIALLY BOOKED`);
            return 'partially-booked'; // Some slots booked
        } else {
            console.log(`Date ${dateKey} is AVAILABLE`);
            return 'available'; // All slots available
        }
    }

    function getAvailableSlots(date) {
        // Use the same date format as admin dashboard
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        
        const bookedSlots = adminCalendarData[dateKey] || [];
        return allTimeSlots.filter(slot => !bookedSlots.includes(slot));
    }

    function renderCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();

        monthYear.textContent = `${date.toLocaleString('default', { month: 'long' })} ${year}`;
        grid.innerHTML = '';

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            grid.innerHTML += '<div></div>';
        }

        // Calendar days
        for (let d = 1; d <= lastDate; d++) {
            const cellDate = new Date(year, month, d);
            cellDate.setHours(0, 0, 0, 0);

            // Use the same date format as admin dashboard
            const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

            let classes = [];
            
            if (cellDate < today) {
                classes.push('past-date');
            } else {
                const status = getAvailabilityStatus(cellDate);
                classes.push(status);
            }

            const dayElement = document.createElement('div');
            dayElement.className = classes.join(' ');
            dayElement.textContent = d;
            dayElement.dataset.date = dateKey;

            // Add click event for non-past dates
            if (!classes.includes('past-date')) {
                dayElement.addEventListener('click', () => selectDate(cellDate, dayElement));
            }

            grid.appendChild(dayElement);
        }
    }

    function selectDate(date, element) {
        // Remove previous selection
        document.querySelectorAll('.calendar-grid div.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // Add selection to clicked date
        element.classList.add('selected');
        selectedDate = date;

        // Update selected date display
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        selectedDateElement.textContent = date.toLocaleDateString('en-US', options);

        // Generate time slots for selected date
        generateTimeSlots(date);
    }

    function generateTimeSlots(date) {
        slotsContainer.innerHTML = '';
        const availableSlots = getAvailableSlots(date);

        if (availableSlots.length === 0) {
            slotsContainer.innerHTML = '<div class="no-slots">No available slots for this date</div>';
            return;
        }

        availableSlots.forEach(slot => {
            const slotElement = document.createElement('div');
            slotElement.className = 'time-slot';
            slotElement.textContent = timeSlotDisplayNames[slot];
            slotElement.dataset.slot = slot;
            slotElement.addEventListener('click', () => selectSlot(slot, slotElement));
            slotsContainer.appendChild(slotElement);
        });
    }

    function selectSlot(slot, element) {
        // Remove previous slot selection
        document.querySelectorAll('.time-slot.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // Select new slot
        element.classList.add('selected');
        selectedSlot = slot;

        // Enable book button
        bookBtn.disabled = false;
        bookBtn.style.opacity = '1';
    }

    // Event listeners
    prevBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate);
    });

    nextBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate);
    });

    bookBtn.addEventListener('click', () => {
        if (selectedDate && selectedSlot) {
            const confirmation = confirm(`Book appointment for ${selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })} at ${timeSlotDisplayNames[selectedSlot]}?`);
            
            if (confirmation) {
                // Store selected date and time in sessionStorage for the booking form
                // Use consistent date format
                const year = selectedDate.getFullYear();
                const month = selectedDate.getMonth();
                const day = selectedDate.getDate();
                const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                sessionStorage.setItem('selectedDate', dateKey);
                sessionStorage.setItem('selectedTime', selectedSlot);
                sessionStorage.setItem('selectedTimeDisplay', timeSlotDisplayNames[selectedSlot]);
                
                alert('Redirecting to booking form with your selected time slot!');
                window.location.href = 'book-now.html';
            }
        }
    });

    // Initialize calendar
    loadAdminCalendarData().then(() => {
        setupAdminCalendarListener();
    });
    
    // Disable book button initially
    bookBtn.disabled = true;
    bookBtn.style.opacity = '0.6';
});

// Smooth scroll to availability section
function scrollToAvailability() {
    const availabilitySection = document.querySelector('.availability-main');
    if (availabilitySection) {
        availabilitySection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}