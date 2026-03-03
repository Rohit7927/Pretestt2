// ====================================================================
//  🛡️ SECURITY & ANTI-COPY SYSTEM
// ====================================================================
(function() {
    const authorizedDomain = "www.pretestt.com"; 
    function runSecurity() {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        if (protocol === 'file:' || hostname === '' || hostname === 'localhost' || hostname === '127.0.0.1' || hostname === authorizedDomain) {
            console.log("Security Check Passed");
        } else {
            document.body.innerHTML = `<div style="background:#fff;color:#000;padding:50px;text-align:center;"><h1>⚠️ 403 Forbidden</h1><p>Unauthorized Host:You can not use this website code it is illegal under the IT Law. Contact and see original website www.pretestt.com</p></div>`;
            throw new Error("Unauthorized!");
        }
    }
    document.addEventListener('contextmenu', e => e.preventDefault());
    runSecurity();
})();

// ====================================================================
//  🔥 FIREBASE CONFIGURATION
// ====================================================================
const firebaseConfig = {
  apiKey: "AIzaSyCWICL91LIpowI5UOnoQVM0oKCIu9CjJyI",
  authDomain: "pretestt-3f972.firebaseapp.com",
  databaseURL: "https://pretestt-3f972-default-rtdb.firebaseio.com",
  projectId: "pretestt-3f972",
  storageBucket: "pretestt-3f972.firebasestorage.app",
  messagingSenderId: "399486610102",
  appId: "1:399486610102:web:745aad2ce6072fdc1bd417",
  measurementId: "G-2KD5EQ8WTY"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();
const db = firebase.database(); // Realtime Database Reference

let currentLang = 'en';
let pageHistory = [];
let sliderIndex = 0;
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby7ZQ0QZFP6r32edH9ck8VlQcLWZWGpeHOGh1wq73_h_BcccYCyEoXh3ejXbX0p8G7_Rw/exec"; 

// ====================================================================
//  🔄 AUTO SYNC & LOGIN LOGIC
// ====================================================================
auth.onAuthStateChanged((firebaseUser) => {
    if (firebaseUser) {
        let localProfile = JSON.parse(localStorage.getItem('userProfile'));
        if (!localProfile) {
            localProfile = {
                isLoggedIn: true,
                email: firebaseUser.email,
                name: firebaseUser.displayName,
                photo: firebaseUser.photoURL,
                uid: firebaseUser.uid
            };
            localStorage.setItem('userProfile', JSON.stringify(localProfile));
            loadUser();
        }
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const isReturning = sessionStorage.getItem("isReturningUser");
    if (isReturning) {
        document.getElementById('splash').style.display = 'none';
        checkLoginStatus(); 
    } else {
        let percent = 0;
        const percentEl = document.getElementById('loading-percent');
        const fillEl = document.getElementById('loader-fill');
        const splash = document.getElementById('splash');

        const loadInterval = setInterval(() => {
            percent += 2; if (percent > 100) percent = 100;
            if(percentEl) percentEl.innerText = percent + "%";
            if(fillEl) fillEl.style.width = percent + "%";

            if (percent >= 100) {
                clearInterval(loadInterval);
                setTimeout(() => {
                    if(splash) splash.style.display = 'none';
                    sessionStorage.setItem("isReturningUser", "true"); 
                    checkLoginStatus(); 
                }, 100); 
            }
        }, 30);
    }
});

function checkLoginStatus() {
    const user = JSON.parse(localStorage.getItem('userProfile'));
    if (!user || !user.isLoggedIn) { showPage('login-page'); } 
    else if (!user.phone) { populateProfile(true); showPage('edit-profile-page'); }
    else { loadUser(); showPage('home-page'); renderSlider(); startSliderAuto(); }
}

function handleGoogleLogin() {
    const btn = document.querySelector('.google-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Checking...';
    btn.disabled = true;

    google.accounts.id.initialize({
        client_id: "399486610102-29rsd51aaracfghsh2167sgqdr2dff0i.apps.googleusercontent.com", 
        callback: handleCredentialResponse
    });

    google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            auth.signInWithPopup(provider).then(handleFirebaseLogin).catch(resetBtn);
        }
    });

    function handleCredentialResponse(response) {
        const credential = firebase.auth.GoogleAuthProvider.credential(response.credential);
        firebase.auth().signInWithCredential(credential).then(handleFirebaseLogin).catch(resetBtn);
    }

    function handleFirebaseLogin(result) {
        const user = result.user;
        firebase.database().ref('users/' + user.uid).once('value').then((snapshot) => {
            if (snapshot.exists()) {
                localStorage.setItem('userProfile', JSON.stringify(snapshot.val()));
                showToast("Welcome Again to the PreTestt App!");
                sessionStorage.setItem("isReturningUser", "true");
                loadUser(); showPage('home-page'); renderSlider(); startSliderAuto();
            } else {
                const googleData = { email: user.email, name: user.displayName, photo: user.photoURL, uid: user.uid, isLoggedIn: true };
                localStorage.setItem('tempGoogleData', JSON.stringify(googleData));
                populateProfile(true); showPage('edit-profile-page');
            }
            btn.innerHTML = originalText; btn.disabled = false;
        });
    }

    function resetBtn(error) { showToast("Login Cancelled"); btn.innerHTML = originalText; btn.disabled = false; }
}

// ====================================================================
//  📱 UI & NAVIGATION LOGIC
// ====================================================================
function showPage(pageId) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
    window.scrollTo(0,0);
    
    const header = document.getElementById('main-header');
    const nav = document.getElementById('bottom-nav');
    const backBtn = document.getElementById('header-back-btn');
    const logoGroup = document.getElementById('header-logo-group');
    const greeting = document.getElementById('greeting-section');

    const user = JSON.parse(localStorage.getItem('userProfile'));
    const isFirstTimeSetup = (pageId === 'edit-profile-page' && user && !user.phone);

    if (pageId === 'login-page' || isFirstTimeSetup || pageId === 'splash') {
        if(header) header.classList.add('hidden');
        if(nav) nav.classList.add('hidden');
        if(greeting) greeting.classList.add('hidden');
    } else {
        if(header) header.classList.remove('hidden');
        if(nav) nav.classList.remove('hidden');
        
        if(pageId === 'home-page' || pageId === 'tests-page') {
            if(backBtn) backBtn.classList.add('hidden');
            if(logoGroup) logoGroup.classList.remove('hidden');
            if(greeting) greeting.classList.remove('hidden'); 
            pageHistory = [];
        } else {
            if(backBtn) backBtn.classList.remove('hidden');
            if(greeting) greeting.classList.add('hidden');
            pageHistory.push(pageId);
        }
    } 
    if(pageId === 'profile-menu-page') populateProfile(false);
}

function goBack() {
    if(pageHistory.length > 1) { pageHistory.pop(); const prevPage = pageHistory.pop(); showPage(prevPage); } 
    else { showPage('home-page'); }
}
function updateNav(el) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if(!el.classList.contains('nav-center')) el.classList.add('active');
}
function removeActiveNav() { document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active')); }

// ====================================================================
//  🖼️ SLIDER LOGIC
// ====================================================================
const sliderImages = [
    { img: "slide_1.jpg", link: "👉 LINK_1", txt: "Welcome" },
    { img: "slide_2.jpg", link: "👉 LINK_2", txt: "Free Notes" },
    { img: "slide_3.jpg", link: "👉 LINK_3", txt: "Mock Tests" },
    { img: "slide_4.jpg", link: "👉 LINK_4", txt: "Live Classes" }
];
let sliderInterval;

function renderSlider() {
    const track = document.getElementById('slider-track');
    if (!track) return;
    let html = '';
    sliderImages.forEach(s => {
        html += `<div class="slide" onclick="handleSliderClick('${s.link}')">
                    <img src="${s.img}"><div class="slide-caption">${s.txt}</div>
                 </div>`;
    });
    track.innerHTML = html;
    addSwipeSupport(track);
}
function updateSliderPosition() {
    const track = document.getElementById('slider-track');
    if(track) track.style.transform = `translateX(${sliderIndex * -100}%)`;
}
function startSliderAuto() {
    if (sliderInterval) clearInterval(sliderInterval);
    sliderInterval = setInterval(() => { sliderIndex = (sliderIndex + 1) % sliderImages.length; updateSliderPosition(); }, 3000);
}
function addSwipeSupport(track) {
    let touchStartX = 0, touchEndX = 0;
    track.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; clearInterval(sliderInterval); }, {passive: true});
    track.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchEndX < touchStartX - 50) sliderIndex = (sliderIndex + 1) % sliderImages.length;
        else if (touchEndX > touchStartX + 50) sliderIndex = (sliderIndex - 1 + sliderImages.length) % sliderImages.length;
        updateSliderPosition(); startSliderAuto(); 
    }, {passive: true});
}
function handleSliderClick(link) {
    if (!navigator.onLine) { showToast("No Internet! ⚠️"); return; }
    if(link) checkUniversalSubscription(link); // Will handle via dynamic logic later
}

// ====================================================================
//  👤 PROFILE LOGIC
// ====================================================================
function populateProfile(isNew) {
    let u = JSON.parse(localStorage.getItem('userProfile'));
    let t = JSON.parse(localStorage.getItem('tempGoogleData'));
    if(isNew && t) {
        document.getElementById('reg-email').value = t.email;
        document.getElementById('reg-name').value = t.name;
        document.getElementById('preview-img').src = t.photo;
        document.getElementById('save-btn').innerText = "Save & Continue";
    } else if(u) {
        if(document.getElementById('reg-phone')) {
            document.getElementById('reg-email').value = u.email || '';
            document.getElementById('reg-phone').value = u.phone || '';
            document.getElementById('reg-name').value = u.name || '';
            document.getElementById('reg-village').value = u.village || '';
            document.getElementById('reg-tehsil').value = u.tehsil || '';
            document.getElementById('reg-district').value = u.district || '';
            document.getElementById('reg-state').value = u.state || '';
            if(u.photo) document.getElementById('preview-img').src = u.photo;
            document.getElementById('save-btn').innerText = "Update Profile";
        }
        if(document.getElementById('menu-name')) document.getElementById('menu-name').innerText = u.name;
        if(document.getElementById('menu-email')) document.getElementById('menu-email').innerText = u.email;
        if(document.getElementById('menu-photo') && u.photo) document.getElementById('menu-photo').src = u.photo;
    }
}

function saveProfile() {
    if (!navigator.onLine) { showToast("Need Internet to save profile!"); return; }
    const email = document.getElementById('reg-email').value;
    const phone = document.getElementById('reg-phone').value;
    const name = document.getElementById('reg-name').value;
    const village = document.getElementById('reg-village').value;
    const tehsil = document.getElementById('reg-tehsil').value;
    const district = document.getElementById('reg-district').value;
    const state = document.getElementById('reg-state').value;
    const photo = document.getElementById('preview-img').src;

    if (!/^[6-9]\d{9}$/.test(phone) || phone.length !== 10) { showToast("Invalid 10-digit Mobile Number!"); return; }

    const btn = document.getElementById('save-btn');
    btn.innerText = "Saving..."; btn.disabled = true;

    const userData = { isLoggedIn: true, email, phone, name, village, tehsil, district, state, photo };
    localStorage.setItem('userProfile', JSON.stringify(userData));
    localStorage.removeItem('tempGoogleData');
    sessionStorage.setItem("isReturningUser", "true");

    const user = auth.currentUser;
    if(user) firebase.database().ref('users/' + user.uid).update(userData);

    const fd = new FormData();
    fd.append("Email", email); fd.append("Mobile", phone); fd.append("Name", name);
    fd.append("Village", village); fd.append("Tehsil", tehsil);
    fd.append("District", district); fd.append("State", state); fd.append("Timestamp", new Date());
    fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: fd }).catch(e=>console.log(e));

    setTimeout(() => { btn.disabled = false; btn.innerText = "Update Profile"; showToast("Profile Saved!"); loadUser(); showPage('home-page'); renderSlider(); startSliderAuto(); }, 500);
}

function loadUser() {
    const u = JSON.parse(localStorage.getItem('userProfile'));
    const vipBadgeHTML = ' <img src="vip.png" style="height: 40px !important; width: auto !important; display: inline-block !important; vertical-align: middle !important; margin-left: 6px !important;" alt="VIP">';

    if (u) {
        if (document.getElementById('greeting-name')) document.getElementById('greeting-name').innerText = u.name.split(' ')[0];
        if (document.getElementById('sb-name')) document.getElementById('sb-name').innerText = u.name;
        if (document.getElementById('sb-phone')) document.getElementById('sb-phone').innerText = u.phone;
        if (document.getElementById('sb-photo')) document.getElementById('sb-photo').src = u.photo;
        
        if (u.isPremium === true) addBadgeSafe(vipBadgeHTML);

        const user = auth.currentUser;
        if (user) {
            firebase.database().ref('users/' + user.uid + '/subscription/isActive').once('value').then(s => {
                const isVipOnline = s.val() === true;
                if (isVipOnline) {
                    if (!u.isPremium) { u.isPremium = true; localStorage.setItem('userProfile', JSON.stringify(u)); addBadgeSafe(vipBadgeHTML); }
                } else {
                    if (u.isPremium) { u.isPremium = false; localStorage.setItem('userProfile', JSON.stringify(u)); }
                }
            });
        }
    }
}
function addBadgeSafe(badgeCode) {
    const greeting = document.getElementById('greeting-name');
    const sidebar = document.getElementById('sb-name');
    if (greeting && !greeting.innerHTML.includes('<img')) greeting.innerHTML += badgeCode;
    if (sidebar && !sidebar.innerHTML.includes('<img')) sidebar.innerHTML += badgeCode;
}
function validateMobile(i) { i.value = i.value.replace(/[^0-9]/g, ''); if (i.value.length > 10) i.value = i.value.slice(0, 10); }
function handleImage(i) { 
    const f = i.files[0]; if(f.size > 2621440) { alert("File too big (Max 2.5MB)"); i.value=""; return;}
    const r = new FileReader(); r.onload = e => document.getElementById('preview-img').src = e.target.result; r.readAsDataURL(f);
}

// ====================================================================
//  🛠️ UTILITIES & PAYMENT (Razorpay)
// ====================================================================
function showToast(msg) {
    const t = document.getElementById("toast");
    if(t) { document.getElementById("toast-text").innerText = msg; t.className = "show"; setTimeout(() => t.className = t.className.replace("show", ""), 3000); }
}
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode')?'dark':'light');
    const isDark = document.body.classList.contains('dark-mode');
    const icon = document.getElementById('theme-icon'), text = document.getElementById('theme-text');
    if (icon && text) {
        if (isDark) { icon.className = 'fas fa-sun'; icon.style.color = '#facc15'; text.innerText = "Light Mode"; }
        else { icon.className = 'fas fa-moon'; icon.style.color = '#6366f1'; text.innerText = "Dark Mode"; }
    }
    const metaTag = document.getElementById("theme-color-meta");
    if (metaTag) metaTag.setAttribute("content", isDark ? "#48DBFB" : "#7dd3fc");
}
function checkNetForImage(e) { if (!navigator.onLine) { e.preventDefault(); showToast("Need Internet to upload a photo!"); return false; } return true; }
function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'hi' : 'en';
    document.getElementById('lang-display').innerText = currentLang === 'en' ? 'EN' : 'HI';
    document.querySelectorAll('.lang').forEach(el => { el.innerText = el.getAttribute(`data-${currentLang}`); });
}
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('active'); document.getElementById('overlay').classList.toggle('active'); }
function signOut() { if(confirm("Sign Out?")) { auth.signOut(); localStorage.clear(); window.location.reload(); } }

// Payment Variables
const RAZORPAY_KEY_ID = "rzp_live_S63ikyjEQE7Z0m"; 
const PRICE_YEARLY = 999; const PRICE_HALF = 599; // Updated with real prices from your HTML
let basePrice = PRICE_YEARLY, finalAmount = PRICE_YEARLY, pendingTestId = null, pendingTestType = null, currentPlanName = 'Yearly';

function selectPlan(type) {
    const cardHalf = document.getElementById('plan-half'), cardYearly = document.getElementById('plan-yearly');
    cardHalf.style.borderColor = "#e2e8f0"; cardHalf.style.background = "white";
    cardHalf.innerHTML = `<h4 style="color: #64748b; margin-bottom: 5px;">6 Months</h4><div style="font-size: 20px; font-weight: 800; color: #1e293b;">₹${PRICE_HALF}</div>`;
    cardYearly.style.borderColor = "#e2e8f0"; cardYearly.style.background = "white";
    cardYearly.innerHTML = `<h4 style="color: #64748b; margin-bottom: 5px;">1 Year</h4><div style="font-size: 20px; font-weight: 800; color: #1e293b;">₹${PRICE_YEARLY}</div>`;

    if (type === 'half') {
        currentPlanName = 'Half-Yearly'; basePrice = PRICE_HALF;
        cardHalf.style.borderColor = "#2563eb"; cardHalf.style.background = "#eff6ff";
        cardHalf.innerHTML += `<div class="tick-mark" style="position:absolute;top:-10px;right:-10px;background:#2563eb;color:white;width:25px;height:25px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid white;"><i class="fas fa-check"></i></div>`;
    } else {
        currentPlanName = 'Yearly'; basePrice = PRICE_YEARLY;
        cardYearly.style.borderColor = "#2563eb"; cardYearly.style.background = "#eff6ff";
        cardYearly.innerHTML += `<div class="tick-mark" style="position:absolute;top:-10px;right:-10px;background:#2563eb;color:white;width:25px;height:25px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid white;"><i class="fas fa-check"></i></div>`;
    }
    finalAmount = basePrice; document.getElementById('final-price').innerText = "₹" + finalAmount;
}

function openPaymentModal(testId, type) {
    pendingTestId = testId; pendingTestType = type;
    selectPlan('yearly'); document.getElementById('payment-modal').classList.add('active');
}
function closePaymentModal() { document.getElementById('payment-modal').classList.remove('active'); }

async function processRazorpayPayment() {
    const user = JSON.parse(localStorage.getItem('userProfile'));
    if (!user || !auth.currentUser) { showToast("Please Login First"); showPage('login-page'); return; }
    
    const btn = document.getElementById('main-pay-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...'; btn.disabled = true;

    try {
        const response = await fetch('/api/create-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: currentPlanName === 'Half-Yearly' ? 'half' : 'yearly' }) });
        const orderData = await response.json();
        if (orderData.error) { alert("Error: " + orderData.error); btn.innerHTML = originalText; btn.disabled = false; return; }

        var options = {
            "key": RAZORPAY_KEY_ID, "amount": orderData.amount, "currency": orderData.currency,
            "name": "PreTestt Premium", "description": currentPlanName + " Subscription",
            "image": "logo/512.png", "order_id": orderData.id, 
            "handler": function (response) { verifyAndActivate(response, orderData.amount); },
            "prefill": { "name": user.name, "email": user.email, "contact": user.phone },
            "theme": { "color": "#2563eb" }
        };
        var rzp1 = new Razorpay(options);
        rzp1.on('payment.failed', function (response){ alert("Payment Failed"); btn.innerHTML = originalText; btn.disabled = false; });
        rzp1.open(); closePaymentModal(); btn.innerHTML = originalText; btn.disabled = false;
    } catch (err) { console.error(err); showToast("Server Error!"); btn.innerHTML = originalText; btn.disabled = false; }
}

async function verifyAndActivate(razorpayResponse, amountInPaise) {
    showToast("Verifying Payment... ⏳"); const user = auth.currentUser;
    try {
        const res = await fetch('/api/verify-payment', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ razorpay_order_id: razorpayResponse.razorpay_order_id, razorpay_payment_id: razorpayResponse.razorpay_payment_id, razorpay_signature: razorpayResponse.razorpay_signature, user_uid: user.uid, plan_name: currentPlanName, amount_paid: amountInPaise / 100 })
        });
        const result = await res.json();
        if (result.status === "success") {
            showToast("Payment Successful! Premium Activated 👑");
            let localProfile = JSON.parse(localStorage.getItem('userProfile'));
            if(localProfile) { localProfile.isPremium = true; localStorage.setItem('userProfile', JSON.stringify(localProfile)); loadUser(); }
            
            // Redirect to Dynamic Master Test File after payment
            if(pendingTestId) {
                const targetFile = pendingTestType === 'csat' ? 'master-csat.html' : 'master-gs1.html';
                window.location.href = `${targetFile}?id=${pendingTestId}`;
            } else { setTimeout(() => showPage('home-page'), 2000); }
        } else { alert("Payment failed verification!"); }
    } catch (error) { alert("Network Error during verification."); }
}

// TOPPER SLIDER LOGIC 
document.addEventListener('DOMContentLoaded', initTopperSlider);
function initTopperSlider() {
    const track = document.getElementById('topperTrack'); if (!track) return;
    let slides = Array.from(track.children); if (slides.length === 0 || track.querySelector('.clone-slide')) return;
    track.appendChild(slides[0].cloneNode(true)).classList.add('clone-slide');
    track.insertBefore(slides[slides.length - 1].cloneNode(true), slides[0]).classList.add('clone-slide');
    let counter = 1, autoPlayInterval;
    function updateDims() { const w = document.querySelector('.topper-track-container').offsetWidth; Array.from(track.children).forEach(s => { s.style.width = w+'px'; s.style.minWidth = w+'px'; }); track.style.transition='none'; track.style.transform=`translateX(${-w * counter}px)`; }
    updateDims(); window.addEventListener('resize', updateDims);
    function slideNext() { if (counter >= track.children.length - 1) return; counter++; track.style.transition = 'transform 0.5s ease-in-out'; track.style.transform = `translateX(${-track.children[0].offsetWidth * counter}px)`; }
    track.addEventListener('transitionend', () => {
        if (counter >= track.children.length - 1) { track.style.transition = 'none'; counter = 1; track.style.transform = `translateX(${-track.children[0].offsetWidth * counter}px)`; }
        if (counter <= 0) { track.style.transition = 'none'; counter = track.children.length - 2; track.style.transform = `translateX(${-track.children[0].offsetWidth * counter}px)`; }
    });
    setInterval(() => { if(document.visibilityState==='visible') slideNext(); }, 3000);
}

// ====================================================================
//  🔥 DYNAMIC DATA FETCHING (PREMIUM TESTS)
// ====================================================================

// यह केवल हेडर और टाइटल दिखाने के लिए है
const examData = {
    'upsc': { title: 'UPSC CSE', t1: 'GS Paper 1', t2: 'CSAT Paper 2' },
    'polity': { title: 'Indian Polity', t1: 'Year-wise PYQ', t2: 'Chapter-wise Test' },
    'history': { title: 'Indian History', t1: 'Year-wise PYQ', t2: 'Chapter-wise Test' },
    'geography': { title: 'Geography', t1: 'Year-wise PYQ', t2: 'Chapter-wise Test' },
    'economy': { title: 'Indian Economy', t1: 'Year-wise PYQ', t2: 'Chapter-wise Test' },
    'environment': { title: 'Environment', t1: 'Year-wise PYQ', t2: 'Chapter-wise Test' },
    'science': { title: 'Science & Tech', t1: 'Year-wise PYQ', t2: 'Chapter-wise Test' }, 
    'current': { title: 'Current Affairs', t1: 'Monthly', t2: 'Mocks' },
    'csat_math': { title: 'CSAT Mathematics', t1: 'Topic Wise', t2: 'Full Length Mocks' },
    'csat_reasoning': { title: 'CSAT Reasoning', t1: 'Topic Wise', t2: 'Full Length Mocks' }
};

// 1. ओपन एग्जाम (टैब सेट करना)
function openExam(examId) {
    const data = examData[examId];
    if(!data) { showToast("Exam data not found!"); return; }
    
    document.getElementById('exam-title').innerText = data.title;
    document.getElementById('btn-tab1').innerText = data.t1;
    document.getElementById('btn-tab2').innerText = data.t2;
    showPage('exam-papers-page');
    switchTab('tab1');

    // फायरबेस से लाइव डेटा मंगाना शुरू करें
    fetchAndRenderPremium(examId, 'tab1', data.t1);
    fetchAndRenderPremium(examId, 'tab2', data.t2);
}

// 2. फायरबेस से प्रीमियम टेस्ट की लिस्ट मंगाना
function fetchAndRenderPremium(examId, tabId, paperName) {
    const container = document.getElementById('list-' + tabId);
    if(!container) return;
    
    // लोडिंग एनीमेशन
    container.innerHTML = '<div style="padding:40px; text-align:center; color:var(--primary);"><i class="fas fa-spinner fa-spin" style="font-size:24px;"></i><p style="margin-top:10px; font-size:12px;">Loading Tests from Server...</p></div>';

    // Firebase Database Query (मान लीजिये डेटाबेस में 'premium_tests_meta' नाम का नोड है)
    db.ref(`premium_tests_meta/${examId}/${tabId}`).once('value').then(snap => {
        const papers = snap.val();
        
        if(!papers) {
            container.innerHTML = '<div style="padding:40px;text-align:center;opacity:0.6;"><i class="fas fa-box-open" style="font-size: 30px; margin-bottom: 10px;"></i><p>No Tests Uploaded Yet.</p></div>';
            return;
        }

        let html = '';
        // हर टेस्ट का कार्ड बनाना
        Object.keys(papers).forEach(testId => {
            const test = papers[testId];
            const rowId = `${examId}-${tabId}-${testId}`;
            const isLiked = localStorage.getItem('like_' + rowId) === 'true';

            // 🌟 जादू यहाँ है: GS1 और CSAT के आधार पर मास्टर फाइल तय करना
            const targetFile = (test.type === 'csat') ? 'master-csat.html' : 'master-gs1.html';
            const redirectUrl = `${targetFile}?id=${testId}`; // URL में ID पास करना

            html += `<div class="paper-row">
                <div class="paper-info">
                    <span style="font-weight:700; font-size: 15px;">${test.title}</span>
                    <span style="font-size:12px;opacity:0.7;display:block; margin-top:2px;">${paperName}</span>
                </div>
                <div class="action-group">
                    <button class="like-btn ${isLiked?'liked':''}" onclick="toggleLike(this,'${rowId}')">
                        <i class="${isLiked?'fas':'far'} fa-heart"></i>
                    </button>
                    <button class="attempt-btn" onclick="checkPremiumAccess('${redirectUrl}', '${testId}', '${test.type}')">Start</button>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    }).catch(err => {
        console.error("Firebase Fetch Error: ", err);
        container.innerHTML = '<div style="padding:40px;text-align:center;color:red;">Failed to load tests. Check your internet.</div>';
    });
}

// टैब स्विच करने का फंक्शन
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + tab).classList.add('active');
    document.getElementById('list-tab1').classList.toggle('hidden', tab !== 'tab1');
    document.getElementById('list-tab2').classList.toggle('hidden', tab !== 'tab2');
}

// लाइक बटन का फंक्शन
function toggleLike(btn, id) {
    const isLiked = btn.classList.contains('liked');
    const icon = btn.querySelector('i');
    if(isLiked) {
        btn.classList.remove('liked'); icon.className = 'far fa-heart'; localStorage.setItem('like_'+id, 'false');
    } else {
        btn.classList.add('liked'); icon.className = 'fas fa-heart'; localStorage.setItem('like_'+id, 'true');
        if(typeof confetti === "function") confetti({ origin: { y: 0.7 } });
    }
}


// ====================================================================
//  🎁 DYNAMIC DATA FETCHING (FREE TESTS)
// ====================================================================

document.addEventListener("DOMContentLoaded", () => {
    // पेज लोड होते ही फ्री टेस्ट के कार्ड्स मंगाना शुरू करें
    if(document.getElementById("freeSubjectGrid")) {
        renderFreeTestsDynamic();
    }
});

function renderFreeTestsDynamic() {
    const grid = document.getElementById("freeSubjectGrid");
    if(!grid) return; 

    grid.innerHTML = '<div style="text-align:center; grid-column:1/-1; padding:30px;"><i class="fas fa-spinner fa-spin" style="font-size:24px; color:#2563eb;"></i><p>Loading Free Subjects...</p></div>';

    // Firebase से फ्री सब्जेक्ट्स मंगाना (जैसे History, Geography)
    db.ref('free_tests_meta/subjects').once('value').then(snap => {
        const subjects = snap.val();
        grid.innerHTML = "";
        
        if(!subjects) {
            grid.innerHTML = '<div style="text-align:center; grid-column:1/-1; opacity:0.6;">No Free Tests Available right now.</div>';
            return;
        }

        Object.keys(subjects).forEach(key => {
            const sub = subjects[key];
            const card = document.createElement("div");
            card.className = "subject-card";
            card.innerHTML = `
                <i class="${sub.icon}" style="font-size: 28px; color: ${sub.color}; margin-bottom: 10px;"></i>
                <h4 style="margin: 0; font-size: 15px;">${sub.name}</h4>
                <p style="font-size: 10px; color: #666; margin-top: 5px;">Click to view Chapters</p>
            `;
            // क्लिक करने पर उस सब्जेक्ट के चैप्टर्स खुलेंगे
            card.onclick = function() { openDynamicSubjectDetail(key, sub.name, sub.color); };
            grid.appendChild(card);
        });
    });
}

function openDynamicSubjectDetail(subjectKey, subjectName, subjectColor) {
    const container = document.getElementById("chapter-container");
    const titleEl = document.getElementById("detail-title");
    
    if(titleEl) {
        titleEl.innerText = subjectName;
        titleEl.style.color = subjectColor;
    }

    container.innerHTML = '<div style="text-align:center; margin-top: 50px;"><i class="fas fa-spinner fa-spin" style="font-size:30px; color:'+subjectColor+';"></i></div>';
    document.getElementById("main-subject-list").style.display = "none";
    document.getElementById("subject-detail-view").style.display = "block";
    window.scrollTo(0, 0);

    // Firebase से उस सब्जेक्ट के अंदर के सारे चैप्टर और टेस्ट मंगाना
    db.ref(`free_tests_meta/sections/${subjectKey}`).once('value').then(snap => {
        const sections = snap.val();
        let htmlContent = "";

        if (sections) {
            Object.keys(sections).forEach(secKey => {
                const section = sections[secKey];
                htmlContent += `
                    <div style="margin-top: 20px; margin-bottom: 10px;">
                        <h4 style="margin: 0; color: #444; font-size: 14px; border-left: 4px solid ${subjectColor}; padding-left: 10px;">
                            ${section.title}
                        </h4>
                    </div>
                `;

                if(section.tests) {
                    Object.keys(section.tests).forEach(testId => {
                        const test = section.tests[testId];
                        
                        // 🌟 मास्टर फाइल का लिंक (यहाँ पेमेंट चेक की जरूरत नहीं, सीधा लिंक)
                        const targetFile = (test.type === 'csat') ? 'master-csat.html' : 'master-gs1.html';
                        const fullLink = `${targetFile}?id=${testId}`;

                        htmlContent += `
                            <a href="${fullLink}" class="chapter-item" style="padding: 12px; margin-bottom: 10px; background: white; border: 1px solid #f1f5f9; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; text-decoration: none; box-shadow: 0 2px 5px rgba(0,0,0,0.03);">
                                <div style="display:flex; align-items:center;">
                                    <div style="width: 8px; height: 8px; background: ${subjectColor}; border-radius: 50%; margin-right: 12px;"></div>
                                    <span style="font-size: 13px; font-weight: 500; color: #333;">${test.title}</span>
                                </div>
                                <span style="background: ${subjectColor}15; color: ${subjectColor}; padding: 5px 15px; border-radius: 20px; font-size: 11px; font-weight: 700; border: 1px solid ${subjectColor}30;">START</span>
                            </a>
                        `;
                    });
                } else {
                    htmlContent += `<p style="font-size:11px; color: #999; margin-left: 20px;">No tests added yet.</p>`;
                }
            });
        } else {
            htmlContent = `<div style="text-align:center; margin-top: 50px; opacity: 0.6;"><i class="fas fa-box-open" style="font-size: 40px; margin-bottom: 10px;"></i><p>Tests Coming Soon...</p></div>`;
        }
        container.innerHTML = htmlContent;
    });
}

function closeSubjectDetail() {
    document.getElementById("subject-detail-view").style.display = "none";
    document.getElementById("main-subject-list").style.display = "block";
}


// ====================================================================
//  👑 NEW: PREMIUM ACCESS CHECKER (Dynamic System)
// ====================================================================
// यह फंक्शन Part 1 वाले पुराने फंक्शन को रिप्लेस करेगा और पेमेंट पॉपअप दिखाएगा
function checkPremiumAccess(linkToOpen, testId, testType) {
    if (!navigator.onLine) { showToast("No Internet Connection! ⚠️"); return; }
    
    const user = auth.currentUser;
    if (!user) { 
        showToast("Login first to attempt Premium Tests! 🔒"); 
        showPage('login-page'); 
        return; 
    }

    // Firebase में चेक करें कि यूजर का प्लान एक्टिव है या नहीं
    db.ref('users/' + user.uid + '/subscription').once('value').then((snap) => {
        const sub = snap.val();
        if (sub && sub.isActive === true) {
            const now = new Date();
            const expiryDate = new Date(sub.expiry);
            
            if (now < expiryDate) {
                // प्लान एक्टिव है, टेस्ट खोल दें
                window.location.href = linkToOpen;
            } else {
                // प्लान एक्सपायर हो गया
                openPaymentModal(testId, testType);
            }
        } else {
            // यूजर ने कभी प्लान नहीं खरीदा
            openPaymentModal(testId, testType); 
        }
    }).catch(() => {
        // अगर कोई एरर आये, तो भी पेमेंट पेज दिखाएं
        openPaymentModal(testId, testType);
    });
}
