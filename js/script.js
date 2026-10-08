/* === TOGGLE MENU SECTION === */
function toggleMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const hamburger = document.querySelector('.hamburger-menu');
    
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
}

document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        const navMenu = document.querySelector('.nav-menu');
        const hamburger = document.querySelector('.hamburger-menu');
        
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    });
});
/* === REVIEW SLIDE SECTION === */
document.addEventListener('DOMContentLoaded', function(){
    const openReview = document.getElementById('openReview');
    const reviewPanel = document.getElementById('reviewPanel');
    const closeReview = document.getElementById('closeReview');

    openReview.addEventListener('click', (e) =>{
    e.preventDefault();
    reviewPanel.classList.add('review-visible');
    });

    closeReview.addEventListener('click', () =>{
    reviewPanel.classList.remove('review-visible');
    });
});
/* === CHAT WIDGET SECTION === */
function toggleChat() {
  const chat = document.getElementById("chatPopup");
  chat.style.display = chat.style.display === "flex" ? "none" : "flex";
}

function handleOptionClick(button) {
  const chatBody = document.getElementById("chatBody");

  // Get user question from button
  const question = button.textContent;

  // Add user message bubble
  const userBubble = document.createElement("div");
  userBubble.className = "user-message";
  userBubble.textContent = question;
  chatBody.appendChild(userBubble);

  // Add bot response bubble
  const botBubble = document.createElement("div");
  botBubble.className = "bot-response";
  botBubble.textContent = getBotResponse(question);
  chatBody.appendChild(botBubble);

  // Disable the clicked button
  button.disabled = true;
  button.classList.add("clicked");

  // Scroll to bottom
  chatBody.scrollTop = chatBody.scrollHeight;
}

function getBotResponse(question) {
  switch (question) {
    case "Do you require a deposit to schedule an appointment?":
      return "Yes, we require a deposit to secure your tattoo appointment. This ensures your artist's time is reserved just for you.";
    case "How much is the minimum deposit?":
      return "Our minimum deposit is ₱500, deductible from your total tattoo cost. Amount may vary depending on size.";
    case "Are walk-ins allowed?":
      return "Yes, we accept walk-ins depending on artist availability. It's best to message us in advance!";
    case "Other concerns":
      return "Hello! If you have any other concerns please write a message on our facebook page Real Pain Tattoo Studio and we will reply on your concern right away.";
    default:
      return "Thanks for asking! We'll get back to you shortly.";
  }
}
function sendUserMessage() {
  const input = document.getElementById("userInput");
  const text = input.value.trim();
  if (!text) return;

  const chatBody = document.getElementById("chatBody");

  // User bubble
  const userBubble = document.createElement("div");
  userBubble.className = "user-message";
  userBubble.textContent = text;
  chatBody.appendChild(userBubble);

  // Placeholder bot reply
  const botBubble = document.createElement("div");
  botBubble.className = "bot-response";
  botBubble.textContent = "Thanks for your message! We'll get back to you shortly.";
  chatBody.appendChild(botBubble);

  // Clear input
  input.value = "";

  // Scroll to bottom
  chatBody.scrollTop = chatBody.scrollHeight;
}
/* === AR FLOATING BUTTON SECTION === */
function gotoAR(){
  window.location.href = "virtual-reality.html";
}

/* === REVIEWS TOGGLE SECTION === */
function toggleAllReviews() {
  const hiddenReviews = document.querySelectorAll('.hidden-review');
  const toggleBtn = document.getElementById('viewAllReviewsBtn');
  const isExpanded = hiddenReviews[0]?.classList.contains('show');
  
  if (isExpanded) {
    // Hide extra reviews
    hiddenReviews.forEach(review => {
      review.classList.remove('show');
    });
    toggleBtn.innerHTML = '<i class="fas fa-eye"></i> View All Reviews';
  } else {
    // Show all reviews
    hiddenReviews.forEach((review, index) => {
      setTimeout(() => {
        review.classList.add('show');
      }, index * 100); // Stagger the animation
    });
    toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Show Less Reviews';
  }
}
