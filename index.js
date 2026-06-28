document.addEventListener('DOMContentLoaded', () => {
    let lecOptions = "";
    for (let i = 1; i <= 20; i++) lecOptions += `<option value="${i}">المحاضرة ${i}</option>`;
    const lec = document.getElementById('lecture');
    if (lec) lec.innerHTML = lecOptions;
});

// ==================== SECTION ====================
// Added global gotoView for unified sidebar navigation
          function gotoView(page, view) {
            localStorage.setItem('savedView', view);
            if (window.location.pathname.endsWith(page)) {
              switchView(view);
              toggleSidebar();
            } else {
              window.location.href = page;
            }
          }

// ==================== SECTION ====================
const CENTRAL_LINKS_API = "https://script.google.com/macros/s/AKfycbxFT_0yMGQMp2tK_F3G_ndN-b5URC-PQOxaT63rLPExzCNyV6p9-UKGpKELVnJbc2LA/exec";

    let ATTENDANCE_API_URL = "https://script.google.com/macros/s/AKfycbw6v50o3s8mR5_D4-L9wE8j6D7eM8lO7fE2zK_O5I8S71577H3T4F9M49D6B8o/exec";
    let LOGIN_API_URL = "https://script.google.com/macros/s/AKfycbw-oytOWrgERm2yXu-NagMlyS14HlUGeAlsWqrZl2SwRJIi0IDL1AH2VduQvsmIIkNgFA/exec";

    // 🔗 دالة اختيار الـ API المناسب المخصص للجروب
    function getEffectiveApi(originalUrl) {
      const currentGroup = localStorage.getItem('userGroup') || "Group A";
      const groupOverride = localStorage.getItem(`GROUP_API_${currentGroup}`);
      return groupOverride || originalUrl;
    }

    let html5QrCode; let allAttendees = []; let lastScannedCode = ""; let lastScanTime = 0;
    let currentView = localStorage.getItem('savedView') || 'login';
    let attendanceChartInstance = null;
    let lastSyncTime = 0; const SYNC_COOLDOWN = 60000;

    let offlineQueue = JSON.parse(localStorage.getItem('offlineQueue')) || [];

    function convertNumerals(str) {
      if (!str) return "";
      const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
      return str.toString().replace(/[٠-٩]/g, w => arabicNumbers.indexOf(w));
    }

    let loaderInterval;
    function showProgress(message = "جاري العمل...") {
      const l = document.getElementById('electricLoader');
      document.getElementById('loaderMessage').innerText = message;
      l.style.display = 'flex';
      let p = 0; document.getElementById('loaderPercent').innerText = p + '%'; document.getElementById('progressBarFill').style.width = p + '%';
      clearInterval(loaderInterval);
      loaderInterval = setInterval(() => { p += Math.floor(Math.random() * 10) + 1; if (p > 90) p = 90; document.getElementById('progressBarFill').style.width = p + '%'; document.getElementById('loaderPercent').innerText = p + '%'; }, 100);
    }

    function completeProgress() {
      clearInterval(loaderInterval);
      document.getElementById('progressBarFill').style.width = '100%'; document.getElementById('loaderPercent').innerText = '100%';
      setTimeout(() => { document.getElementById('electricLoader').style.display = 'none'; document.getElementById('progressBarFill').style.width = '0%'; }, 300);
    }

    function showCustomAlert(message, title = "تنبيه النظام", iconType = "info") {
      return new Promise((resolve) => {
        const existing = document.querySelector('.custom-modal-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'custom-modal-overlay';
        
        const icon = iconType === "warning" ? "⚠️" : "⚡";
        const iconClass = iconType === "warning" ? "warning" : "";

        overlay.innerHTML = `
          <div class="custom-modal-card">
            <div class="custom-modal-icon-container ${iconClass}">${icon}</div>
            <h3 class="custom-modal-title">${title}</h3>
            <p class="custom-modal-message">${message}</p>
            <div class="custom-modal-actions">
              <button class="custom-modal-btn custom-modal-btn-confirm" id="custom-modal-ok">حسناً 👍</button>
            </div>
          </div>
        `;

        document.body.appendChild(overlay);
        overlay.offsetHeight;
        overlay.classList.add('active');

        const okBtn = overlay.querySelector('#custom-modal-ok');
        if (okBtn) okBtn.focus();

        let resolved = false;

        function closeAlert() {
          if (resolved) return;
          resolved = true;
          
          overlay.style.pointerEvents = 'none';
          resolve(true);

          overlay.classList.remove('active');
          document.removeEventListener('keydown', handleKeyDown);

          setTimeout(() => {
            overlay.remove();
          }, 200);
        }

        function handleKeyDown(e) {
          if (e.key === 'Enter' || e.key === 'Escape') {
            e.preventDefault();
            closeAlert();
          }
        }

        if (okBtn) okBtn.addEventListener('click', closeAlert);
        document.addEventListener('keydown', handleKeyDown);
      });
    }

    function showCustomConfirm(message, title = "تأكيد الإجراء", iconType = "warning") {
      return new Promise((resolve) => {
        const existing = document.querySelector('.custom-modal-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'custom-modal-overlay';

        const icon = iconType === "warning" ? "⚠️" : "⚡";
        const iconClass = iconType === "warning" ? "warning" : "";

        overlay.innerHTML = `
          <div class="custom-modal-card">
            <div class="custom-modal-icon-container ${iconClass}">${icon}</div>
            <h3 class="custom-modal-title">${title}</h3>
            <p class="custom-modal-message">${message}</p>
            <div class="custom-modal-actions">
              <button class="custom-modal-btn custom-modal-btn-cancel" id="custom-modal-cancel">إلغاء ✖️</button>
              <button class="custom-modal-btn custom-modal-btn-confirm" id="custom-modal-confirm">تأكيد 📥</button>
            </div>
          </div>
        `;

        document.body.appendChild(overlay);
        overlay.offsetHeight;
        overlay.classList.add('active');

        const confirmBtn = overlay.querySelector('#custom-modal-confirm');
        const cancelBtn = overlay.querySelector('#custom-modal-cancel');
        if (confirmBtn) confirmBtn.focus();

        let resolved = false;

        function handleDecision(decision) {
          if (resolved) return;
          resolved = true;

          overlay.style.pointerEvents = 'none';
          resolve(decision);

          overlay.classList.remove('active');
          document.removeEventListener('keydown', handleKeyDown);

          setTimeout(() => {
            overlay.remove();
          }, 200);
        }

        function handleKeyDown(e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleDecision(true);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            handleDecision(false);
          }
        }

        if (confirmBtn) confirmBtn.addEventListener('click', () => handleDecision(true));
        if (cancelBtn) cancelBtn.addEventListener('click', () => handleDecision(false));
        document.addEventListener('keydown', handleKeyDown);
      });
    }

    function showToast(text, type = "success") {
      const t = document.getElementById('toast'); t.innerText = text;
      t.style.background = type === "success" ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #ef4444, #dc2626)";
      t.style.display = 'block'; setTimeout(() => { t.style.display = 'none'; }, 4000);
    }

    function playBeep(type) {
      if (navigator.vibrate) { if (type === 'success') navigator.vibrate(150); else navigator.vibrate([100, 50, 100, 50, 200]); }
      const ctx = new (window.AudioContext || window.webkitAudioContext)(); const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      if (type === 'success') { osc.type = 'sine'; osc.frequency.value = 800; gain.gain.value = 0.1; osc.start(); osc.stop(ctx.currentTime + 0.15); }
      else { osc.type = 'sawtooth'; osc.frequency.value = 300; gain.gain.value = 0.1; osc.start(); osc.stop(ctx.currentTime + 0.3); }
    }

    function getAuthParams() {
      return `&email=${encodeURIComponent(localStorage.getItem('userEmail'))}&token=${encodeURIComponent(localStorage.getItem('sessionToken'))}`;
    }

    function fillGroupSelects() {
      let options = ''; const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      for (let i = 0; i < letters.length; i++) { let g = 'Group ' + letters[i]; options += `<option value="${g}">${g}</option>`; }
      const newUg = document.getElementById('newUserGroup'); const ggs = document.getElementById('globalGroupSelect');
      if (newUg) newUg.innerHTML = options;
      if (ggs) { ggs.innerHTML = options; ggs.value = localStorage.getItem('userGroup') || 'Group A'; }
    }

    function toggleDarkMode() {
      document.body.classList.toggle('dark-mode'); const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('darkMode', isDark);
      document.getElementById('themeToggle').innerText = isDark ? '🌙' : '☀️';
      if (currentView === 'analytics' && attendanceChartInstance) { loadAnalytics('group'); }
    }

    function updateOfflineBadge() {
      const badge = document.getElementById('offlineBadge'); const countSpan = document.getElementById('offlineCount');
      if (offlineQueue.length > 0) {
        badge.style.display = 'block'; countSpan.innerText = offlineQueue.length;
        if (navigator.onLine) badge.style.backgroundColor = '#f39c12';
        else badge.style.backgroundColor = '#ef4444';
      } else { badge.style.display = 'none'; }
    }

    async function syncOfflineData() {
      if (!navigator.onLine) return showCustomAlert("الإنترنت ما زال مقطوعاً. تأكد من الاتصال أولاً.", "انقطاع الاتصال", "warning");
      if (offlineQueue.length === 0) return;

      showProgress("جاري رفع البيانات المتأخرة للسيرفر...");
      let successCount = 0;
      function uploadNext(index) {
        if (index >= offlineQueue.length) {
          offlineQueue = []; localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue)); updateOfflineBadge(); completeProgress(); showToast(`✅ تمت مزامنة ${successCount} سجلات بنجاح!`, "success"); return;
        }
        let record = offlineQueue[index];
        fetch(`${getEffectiveApi(ATTENDANCE_API_URL)}?action=scan&qrCode=${encodeURIComponent(record.code)}&lectureNum=${encodeURIComponent(record.lecture)}&group=${encodeURIComponent(record.group)}${getAuthParams()}`)
          .then(res => res.json()).then(data => {
            if (data.status === "success" || data.status === "already") successCount++; uploadNext(index + 1);
          }).catch(err => {
            offlineQueue = offlineQueue.slice(index); localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue)); updateOfflineBadge(); completeProgress(); showToast("❌ انقطع الاتصال أثناء المزامنة. حاول مجدداً.", "error");
          });
      }
      uploadNext(0);
    }
    
    // Auto-sync when back online
    function setupAutoSync() {
      window.addEventListener('online', () => {
        if (offlineQueue.length > 0) {
          showToast("🔄 جاري المزامنة التلقائية...", "info");
          setTimeout(syncOfflineData, 2000);
        }
      });
    }

    window.onload = function () {
      try {
        if (localStorage.getItem('darkMode') === 'true') { document.body.classList.add('dark-mode'); document.getElementById('themeToggle').innerText = '🌙'; }
        updateOfflineBadge(); 
        
        // Setup auto-sync when network returns
        setupAutoSync();
        window.addEventListener('online', updateOfflineBadge);
        window.addEventListener('offline', updateOfflineBadge);

        fillGroupSelects();

        // Fetch Central Links DB once async to ensure system has overrides
        fetch(`${CENTRAL_LINKS_API}?action=getAllLinks`).then(r => r.json()).then(data => {
          if (data.status === "success") {
            for (let g in data.groups) localStorage.setItem(`GROUP_API_${g}`, data.groups[g]);
            localStorage.setItem('PERSONAL_LINKS_MAP', JSON.stringify(data.individuals));
          }
        }).catch(e => console.log("Central link grab error", e));

        let savedLecture = localStorage.getItem('savedLecture') || '1';
        let lectureElement = document.getElementById('lecture');
        if (lectureElement) {
          lectureElement.value = savedLecture;
          lectureElement.addEventListener('change', function () { 
            localStorage.setItem('savedLecture', this.value); 
            if (currentView === 'dashboard') loadDashboard(false); 
          });
        }

        if (localStorage.getItem('isLoggedIn') === 'true' && !localStorage.getItem('sessionToken')) { logout(); }
        else { checkAuth(); }

        if (typeof Html5Qrcode !== 'undefined') {
          Html5Qrcode.getCameras().then(devices => {
            const cameraSelect = document.getElementById('cameraSelection');
            if (cameraSelect && devices && devices.length > 0) {
              cameraSelect.innerHTML = "";
              devices.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.id; option.text = device.label || `كاميرا ${index + 1}`;
                if (option.text.toLowerCase().includes('back') || option.text.toLowerCase().includes('خلفية')) option.selected = true;
                cameraSelect.appendChild(option);
              });
            }
          }).catch(err => console.log("Cam warning:", err));
        }

        if (typeof google !== 'undefined' && google.accounts) {
          // Dynamic Client ID selection based on hostname
          const oldClientId = "199540075185-0s74k90bdpodvtnao1ce7euec2o0vr31.apps.googleusercontent.com";
          const newClientId = "199540075185-0s74k90bdpodvtnao1ce7euec2o0vr31.apps.googleusercontent.com";
          
          const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
          const activeClientId = isLocalhost ? oldClientId : newClientId;

          console.log("[Google Sign-In] Using Client ID:", activeClientId);

          google.accounts.id.initialize({
            client_id: activeClientId,
            callback: handleGoogleLogin,
            cancel_on_tap_outside: false,
            use_fedcm: true
          });
          google.accounts.id.renderButton(
            document.getElementById("googleBtnWrapper"),
            { theme: "filled_black", size: "large", shape: "pill", text: "signin_with" }
          );
        }

        // ⌨️ Enter key support
        document.getElementById('loginPassword')?.addEventListener('keydown', e => { if (e.key === 'Enter') handleManualLogin(); });
        document.getElementById('loginEmail')?.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('loginPassword').focus(); });
        document.getElementById('manualCode')?.addEventListener('keydown', e => { if (e.key === 'Enter') submitManualCode(); });

      } catch (error) {
        console.error("System Error:", error);
        document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
        const loginView = document.getElementById('view-login'); if (loginView) loginView.classList.add('active');
        showToast("❌ حدث خطأ أثناء تهيئة النظام.", "error");
      }
    };
    
    // Global error handler for uncaught errors
    window.onerror = function(msg, url, lineNo, columnNo, error) {
      console.error('Global Error:', msg, url, lineNo, columnNo, error);
      try {
        showToast("⚠️ حدث خطأ غير متوقع", "warning");
      } catch(e) {}
      return false;
    };
    
    // Global unhandled promise rejection handler
    window.addEventListener('unhandledrejection', function(event) {
      console.error('Unhandled Promise Rejection:', event.reason);
      try {
        showToast("⚠️ خطأ في الاتصال", "warning");
      } catch(e) {}
    });
    async function handleManualLogin() {
      const email = document.getElementById('loginEmail').value; const pass = document.getElementById('loginPassword').value;
      if (!email || !pass) return showCustomAlert("الرجاء إدخال الإيميل وكلمة المرور.", "تنبيه", "warning");
      showProgress("جاري التحقق من الهوية وفتح قناة اتصال مشفرة 🔐...");
      fetch(`${LOGIN_API_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(pass)}`)
        .then(r => r.json()).then(d => {
          completeProgress();
          if (d.status === 'success') {
            localStorage.setItem('isLoggedIn', 'true'); localStorage.setItem('userName', d.userName);
            localStorage.setItem('userRole', d.role); localStorage.setItem('userGroup', d.group);
            localStorage.setItem('userEmail', email); localStorage.setItem('sessionToken', d.sessionToken);
            showToast(`✅ أهلاً بك في منصة Eduneers، ${d.userName}`, "success");
            setTimeout(() => { document.getElementById('loginEmail').value = ''; document.getElementById('loginPassword').value = ''; checkAuth(); }, 1000);
          } else showToast(d.message, "error");
        }).catch(e => { completeProgress(); showToast("❌ خطأ في الاتصال بالسيرفر المركزي.", "error") });
    }

    function parseJwt(token) { var b = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'); return JSON.parse(decodeURIComponent(atob(b).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))); }
    function handleGoogleLogin(res) {
      const payload = parseJwt(res.credential); showProgress("جاري المصادقة السريعة مع خوادم Google ⚡...");
      fetch(`${LOGIN_API_URL}?action=googleLogin&email=${encodeURIComponent(payload.email)}`).then(r => r.json()).then(d => {
        completeProgress();
        if (d.status === 'success') {
          localStorage.setItem('isLoggedIn', 'true'); localStorage.setItem('userName', d.userName || payload.name);
          localStorage.setItem('userRole', d.role); localStorage.setItem('userGroup', d.group);
          localStorage.setItem('userEmail', payload.email); localStorage.setItem('sessionToken', d.sessionToken);
          showToast(`✅ أهلاً بك في منصة Eduneers، ${d.userName || payload.name}`, "success");
          setTimeout(checkAuth, 1000);
        } else showToast(d.message, "error");
      }).catch(e => { completeProgress(); showToast("❌ خطأ في الاتصال.", "error") });
    }

    async function syncRole() {
      if (localStorage.getItem('isLoggedIn') !== 'true') return;
      fetch(`${LOGIN_API_URL}?action=checkMyRole${getAuthParams()}`)
        .then(res => res.json()).then(async data => {
          if (data.status === "unauthorized" || data.status === "deleted") { 
            await showCustomAlert("انتهت صلاحية الجلسة أو تم إلغاء حسابك. يرجى تسجيل الدخول مجدداً.", "انتهت الجلسة", "warning"); 
            logout(); 
          }
          else if (data.status === "success") {
            const currentSavedRole = localStorage.getItem('userRole'); const currentSavedGroup = localStorage.getItem('userGroup');
            if (currentSavedRole !== data.role || (currentSavedGroup !== data.group && data.role !== 'Owner' && data.role !== 'CO-Founder' && data.role !== 'Team Manager' && data.role !== 'Admin' && data.role !== 'QUALITY CONTROL' && data.role !== 'QC')) {
              localStorage.setItem('userRole', data.role);
              if (data.role !== 'Owner' && data.role !== 'CO-Founder' && data.role !== 'Team Manager' && data.role !== 'Admin' && data.role !== 'QUALITY CONTROL' && data.role !== 'QC') localStorage.setItem('userGroup', data.group);
              applyRolesToUI();
              if (currentView === 'users' && data.role !== 'Team Manager' && data.role !== 'Admin' && data.role !== 'Owner' && data.role !== 'CO-Founder' && data.role !== 'QUALITY CONTROL' && data.role !== 'QC') switchView('scanner');
            }
          }
        }).catch(err => console.log("Sync error"));
    }

    function applyRolesToUI() {
      const userRole = localStorage.getItem('userRole'); const userGroup = localStorage.getItem('userGroup');
      const roleBadge = document.getElementById('roleBadge'); const groupBadge = document.getElementById('groupBadge');

      if (roleBadge) {
        roleBadge.innerText = (userRole === 'Owner') ? 'المالك 👑' : 
                             (userRole === 'CO-Founder') ? 'CO-Founder ✨' : 
                             (userRole === 'Team Manager' || userRole === 'Admin') ? 'Team Manager' : 
                             (userRole === 'Cadre Leader') ? 'Cadre Leader 🌟' : 
                             (userRole === 'Quality Control') ? 'Quality Control 👁️' :
                             (userRole === 'Coordinator' || userRole === 'Manager') ? 'Coordinator' : 'Cadre';
        roleBadge.style.display = 'flex';
      }
      if (groupBadge) { groupBadge.innerText = userGroup; groupBadge.style.display = 'flex'; }

      document.body.className = document.body.classList.contains('dark-mode') ? 'dark-mode ' : '';

      if (userRole === 'Owner') { document.body.classList.add('role-owner'); }
      else if (userRole === 'CO-Founder') { document.body.classList.add('role-co-founder'); }
      else if (userRole === 'Team Manager' || userRole === 'Admin') { document.body.classList.add('role-admin'); }
      else if (userRole === 'Cadre Leader') { document.body.classList.add('role-cadre-leader'); }
      else if (userRole === 'Quality Control') { document.body.classList.add('role-qc'); }
      else if (userRole === 'Coordinator' || userRole === 'Manager') { document.body.classList.add('role-manager'); }
      else { document.body.classList.add('role-user'); }

      const ggs = document.getElementById('globalGroupSelect'); if (ggs) ggs.value = userGroup;
    }

    function checkAuth() {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'; const userName = localStorage.getItem('userName');
      if (isLoggedIn) {
        const mBtn = document.getElementById('menuBtn'); if (mBtn) mBtn.style.display = 'flex';
        const appTabs = document.getElementById('appTabs'); if (appTabs) appTabs.style.display = 'flex';
        const wName = document.getElementById('welcomeName'); if (wName) wName.innerText = `| ${userName}`;

        applyRolesToUI();
        if (currentView === 'login' || !document.getElementById(`view-${currentView}`)) currentView = 'scanner';
        switchView(currentView); syncRole(true);
      } else {
        const mBtn = document.getElementById('menuBtn'); if (mBtn) mBtn.style.display = 'none';
        const appTabs = document.getElementById('appTabs'); if (appTabs) appTabs.style.display = 'none';
        const lCont = document.getElementById('lectureContainer'); if (lCont) lCont.style.display = 'none';
        const wName = document.getElementById('welcomeName'); if (wName) wName.innerText = "";
        const rBadge = document.getElementById('roleBadge'); if (rBadge) rBadge.style.display = 'none';
        const gBadge = document.getElementById('groupBadge'); if (gBadge) gBadge.style.display = 'none';
        const clockBadge = document.getElementById('liveClockBadge'); if (clockBadge) clockBadge.style.display = 'none';
        switchView('login');
      }
    }

    function logout() { localStorage.clear(); toggleSidebar(); checkAuth(); location.reload(); }
    function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('overlay').classList.toggle('show'); }

    function switchView(viewId, tabElement = null) {
      if (currentView === 'scanner' && viewId !== 'scanner') stopLiveCamera();

      document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
      document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
      document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));

      let targetView = document.getElementById(`view-${viewId}`);
      if (!targetView) { viewId = 'scanner'; targetView = document.getElementById(`view-${viewId}`); }

      targetView.classList.add('active');
      const navItem = document.getElementById(`nav-${viewId}`); if (navItem) navItem.classList.add('active');
      if (tabElement) {
        tabElement.classList.add('active');
        localStorage.setItem('lastActiveTab', tabElement.id);
      } else {
        const t = document.getElementById(`tab-${viewId}`); if (t) t.classList.add('active');
      }

      currentView = viewId; localStorage.setItem('savedView', viewId);
      document.getElementById('sidebar').classList.remove('open'); document.getElementById('overlay').classList.remove('show');

      // 🔍 Auto-focus on manual code input
      if (viewId === 'manual') { setTimeout(() => { const mc = document.getElementById('manualCode'); if (mc) mc.focus(); }, 400); }

      const lecContainer = document.getElementById('lectureContainer');
      const cgo = document.querySelector('#lectureContainer .cross-group-only');

      if (viewId === 'users' || viewId === 'login') {
        lecContainer.style.setProperty('display', 'none', 'important');
      } else {
        if (document.body.classList.contains('role-admin') || document.body.classList.contains('role-owner') || document.body.classList.contains('role-co-founder')) {
          lecContainer.style.setProperty('display', 'block', 'important');
          if (cgo) cgo.style.setProperty('display', 'block', 'important');
        } else if (viewId === 'scanner' || viewId === 'manual' || viewId === 'dashboard') {
          lecContainer.style.setProperty('display', 'block', 'important');
          if (cgo) cgo.style.setProperty('display', 'none', 'important');
        } else {
          lecContainer.style.setProperty('display', 'none', 'important');
        }
      }

      if (viewId === 'dashboard') loadDashboard(); if (viewId === 'users') loadUsers();
      if (viewId === 'analytics') { fetchAnalyticsData(); }
      if (viewId === 'mail') {
        loadMailTargetList();
      }
    }

    function changeGlobalGroup(newGroup) {
      localStorage.setItem('userGroup', newGroup);
      const gBadge = document.getElementById('groupBadge');
      if (gBadge) gBadge.innerText = newGroup;
      if (currentView === 'dashboard') loadDashboard(); if (currentView === 'analytics') fetchAnalyticsData();
    }

    function startLiveCamera() {
      const camId = document.getElementById('cameraSelection').value; if (!camId) return showToast("❌ اختر الكاميرا", "error");
      document.getElementById('reader').style.display = 'block'; document.getElementById('stopCamBtn').style.display = 'block';
      if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
      html5QrCode.start(camId, { fps: 10, qrbox: { width: 250, height: 250 } }, (code) => { 
        const isContinuous = document.getElementById('continuousScan')?.checked;
        if (isContinuous) {
          const now = Date.now();
          if (code === lastScannedCode && (now - lastScanTime < 3000)) {
            // Ignore repetitive scans of the same student within 3 seconds
            return;
          }
          lastScannedCode = code;
          lastScanTime = now;
          sendDataToAPI(code);
        } else {
          stopLiveCamera(); 
          sendDataToAPI(code); 
        }
      }, (err) => { }).catch(e => showToast("❌ فشل تشغيل الكاميرا", "error"));
    }
    function stopLiveCamera() { if (html5QrCode && html5QrCode.isScanning) { html5QrCode.stop().then(() => { document.getElementById('reader').style.display = 'none'; document.getElementById('stopCamBtn').style.display = 'none'; }); } }

    document.getElementById('qr-input-file').addEventListener('change', e => {
      if (e.target.files.length == 0) return; stopLiveCamera();
      showProgress("جاري تحليل الصورة...");
      if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
      html5QrCode.scanFile(e.target.files[0], true).then(decodedText => {
        completeProgress(); sendDataToAPI(decodedText); e.target.value = "";
      }).catch(err => { completeProgress(); showToast("❌ لم يتم التعرف على الكود.", "error"); e.target.value = ""; });
    });

    async function submitManualCode() {
      let rawCode = document.getElementById('manualCode').value.trim();
      if (rawCode === "") return showToast("❌ برجاء كتابة الكود", "error");

      let code = convertNumerals(rawCode);

      if (/^\d+$/.test(code)) {
        const userRole = localStorage.getItem('userRole').toUpperCase();
        if ((userRole === 'OWNER' || userRole === 'CO-FOUNDER' || userRole === 'TEAM MANAGER' || userRole === 'ADMIN') && !document.getElementById('globalGroupSelect').value) {
          return showCustomAlert("برجاء تحديد الجروب من الأعلى قبل كتابة الأرقام.", "تنبيه الجروب", "warning");
        }
        const group = localStorage.getItem('userGroup') || "Group A";
        const groupLetter = group.replace("Group ", "").trim();
        code = groupLetter + code;
      } else {
        code = code.toUpperCase();
      }
      sendDataToAPI(code);
      document.getElementById('manualCode').value = "";
    }

    function sendDataToAPI(studentCode) {
      if (!studentCode) return;
      studentCode = studentCode.toUpperCase();
      if (!studentCode.endsWith("EDUR9")) { studentCode = studentCode + "EDUR9"; }

      const role = localStorage.getItem('userRole').toUpperCase();
      if (role === 'OWNER' || role === 'CO-FOUNDER' || role === 'TEAM MANAGER' || role === 'CADRE LEADER' || role === 'ADMIN') {
        const match = studentCode.match(/^[A-Z]+/);
        if (match) {
          const detectedGroup = "Group " + match[0]; changeGlobalGroup(detectedGroup);
          const ggs = document.getElementById('globalGroupSelect'); if (ggs) ggs.value = detectedGroup;
        }
      } else {
        const currentGroupLetter = (localStorage.getItem('userGroup') || "Group A").replace("Group ", "").trim();
        if (!studentCode.startsWith(currentGroupLetter)) {
          showToast("❌ غير مسموح لك بتسجيل حضور لمتدرب من جروب آخر!", "error");
          return playBeep('error');
        }
      }

      const lec = document.getElementById('lecture').value; const group = localStorage.getItem('userGroup') || "Group A";

      if (!navigator.onLine) {
        offlineQueue.push({ code: studentCode, lecture: lec, group: group, time: new Date().toISOString() });
        localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
        updateOfflineBadge(); showToast("⚠️ تم الحفظ محلياً لعدم توفر إنترنت", "warning"); playBeep('success'); return;
      }

      // 1️⃣ إرسال الحضور إلى الشيت المركزي (Diploma Sheets) - Optimistic Sound & Visual feedback ⚡
      playBeep('success');
      showToast(`⚡ جاري إرسال حضور (${studentCode})...`, "success");

      fetch(`${getEffectiveApi(ATTENDANCE_API_URL)}?action=scan&qrCode=${encodeURIComponent(studentCode)}&lectureNum=${encodeURIComponent(lec)}&group=${encodeURIComponent(group)}${getAuthParams()}`)
        .then(res => res.json()).then(data => {
          if (data.status === "success") {
            let studentName = data.name || data.studentName || data.student_name;
            const timeNow = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
            let successMsg = studentName
              ? `✅ تم تسجيل حضور ${studentName} (${studentCode}) — ${timeNow}`
              : `✅ تم تسجيل الحضور (${studentCode}) — ${timeNow}`;
            showToast(successMsg, "success");
          }
          else { 
            showToast(data.message, "error"); 
            playBeep('error'); 
          }
        }).catch(err => {
          offlineQueue.push({ code: studentCode, lecture: lec, group: group, time: new Date().toISOString() });
          localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
          updateOfflineBadge(); 
          showToast("⚠️ تم الحفظ محلياً لضعف الشبكة.", "warning");
        });

      // 2️⃣ إرسال 15 درجة حضور إلى شيت الطالب الفردي في نفس اللحظة ⚡
      let linksMap = JSON.parse(localStorage.getItem('PERSONAL_LINKS_MAP') || '{}');
      let personalApi = linksMap[studentCode];

      if (personalApi) {
        let taskName = "TASK " + lec; // تحويل رقم المحاضرة لاسم التاسك
        console.log("Syncing attendance to personal sheet:", personalApi);

        // نستخدم نفس طريقة رصد الدرجات لضمان توافقها 100% مع شيت الطالب
        fetch(`${personalApi}?action=update&qrCode=${encodeURIComponent(studentCode)}&taskName=${encodeURIComponent(taskName)}&category=${encodeURIComponent('attendance .15')}&val=15`)
          .then(r => r.json())
          .then(res => console.log("Personal Sheet Synced:", res))
          .catch(e => console.error("Personal Sheet Sync Error:", e));
      } else {
        console.log("No personal API linked for student:", studentCode);
      }
    }
    function loadDashboard() {
      const lec = document.getElementById('lecture').value; const group = localStorage.getItem('userGroup') || "Group A";
      const tbody = document.getElementById('attendeesList'); tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 30px;">⏳ المزامنة...</td></tr>`;
      showProgress("سحب بيانات الحضور...");
      fetch(`${getEffectiveApi(ATTENDANCE_API_URL)}?action=getDashboard&lectureNum=${encodeURIComponent(lec)}&group=${encodeURIComponent(group)}${getAuthParams()}`)
        .then(res => res.json()).then(data => {
          completeProgress(); document.getElementById('dashCount').innerText = data.count || 0;
          if (data.status === "success" && data.attendees.length > 0) { allAttendees = data.attendees.map((d, i) => ({ ...d, _originalIdx: i })); renderTable(allAttendees); }
          else { allAttendees = []; tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 30px; color:var(--text-muted);">لا توجد سجلات حالياً</td></tr>`; }
        }).catch(err => { completeProgress(); tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#ef4444; padding: 30px;">❌ خطأ</td></tr>`; });
    }

    function renderTable(dataArray) {
      const tbody = document.getElementById('attendeesList');
      if (dataArray.length === 0) { tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 30px;">لا نتائج</td></tr>`; return; }
      tbody.innerHTML = dataArray.map(a => `<tr id="row-${a.id}"><td style="font-weight: 800; color: var(--electric-blue); font-family: monospace;">${a.id}</td> <td style="font-weight:600;">${a.name}</td> <td><span class="status-badge">${a.time}</span></td><td><button class="btn-danger btn-small" id="btn-del-${a.id}" onclick="deleteAttendance('${a.id}')" style="transition: 0.3s;">إلغاء 🗑️</button></td></tr>`).join('');
    }

    function filterDashboard() { const query = document.getElementById('searchInput').value.toLowerCase(); renderTable(allAttendees.filter(a => (a.name || "").toLowerCase().includes(query) || (a.id || "").toString().toLowerCase().includes(query))); }

    let currentSortCol = null;
    let currentSortAsc = true;
    function sortDashboard(col) {
      if (currentSortCol === col) { currentSortAsc = !currentSortAsc; }
      else { currentSortCol = col; currentSortAsc = true; }

      document.querySelectorAll('th span[id^="sort-"]').forEach(el => el.innerText = "⇕");
      const indicator = document.getElementById('sort-' + col);
      if (indicator) indicator.innerText = currentSortAsc ? " ▼" : " ▲";

      allAttendees.sort((a, b) => {
        if (col === 'time') {
          return currentSortAsc ? a._originalIdx - b._originalIdx : b._originalIdx - a._originalIdx;
        }
        let valA = (a[col] || "").toString().toLowerCase();
        let valB = (b[col] || "").toString().toLowerCase();
        if (valA < valB) return currentSortAsc ? -1 : 1;
        if (valA > valB) return currentSortAsc ? 1 : -1;
        return 0;
      });
      filterDashboard();
    }

    let deleteConfirmations = {};
    function deleteAttendance(studentCode) {
      if (!deleteConfirmations[studentCode]) {
        let btn = document.getElementById('btn-del-' + studentCode);
        if (btn) {
          btn.innerText = "تأكيد الحذف؟ ⚠️";
          btn.style.background = "#be123c";
          deleteConfirmations[studentCode] = true;
          setTimeout(() => {
            if (btn && deleteConfirmations[studentCode]) {
              btn.innerText = "إلغاء 🗑️";
              btn.style.background = "";
              deleteConfirmations[studentCode] = false;
            }
          }, 3500);
        }
        return;
      }

      deleteConfirmations[studentCode] = false;
      let row = document.getElementById('row-' + studentCode);
      if (row) {
        row.style.transition = "all 0.4s ease";
        row.style.opacity = "0";
        row.style.transform = "scale(0.95) translateX(30px)";
        setTimeout(() => row.remove(), 400);
      }

      const dashCountEl = document.getElementById('dashCount');
      if (dashCountEl) dashCountEl.innerText = Math.max(0, parseInt(dashCountEl.innerText) - 1);

      const lec = document.getElementById('lecture').value; const group = localStorage.getItem('userGroup') || "Group A";

      fetch(`${getEffectiveApi(ATTENDANCE_API_URL)}?action=deleteAttendance&qrCode=${encodeURIComponent(studentCode)}&lectureNum=${encodeURIComponent(lec)}&group=${encodeURIComponent(group)}${getAuthParams()}`)
        .then(res => res.json()).then(data => {
          if (data.status === 'success') {
            showToast("✅ تمت إزالة السجل نهائياً", "success");
            allAttendees = allAttendees.filter(a => a.id !== studentCode);

            // ⚡ مزامنة الحذف مع شيت الطالب الفردي
            let linksMap = JSON.parse(localStorage.getItem('PERSONAL_LINKS_MAP') || '{}');
            let personalApi = linksMap[studentCode];
            if (personalApi) {
              let taskName = "TASK " + lec;
              console.log("Syncing deletion to personal sheet:", personalApi);
              fetch(`${personalApi}?action=update&qrCode=${encodeURIComponent(studentCode)}&taskName=${encodeURIComponent(taskName)}&category=${encodeURIComponent('attendance .15')}&val=0`)
                .then(r => r.json())
                .then(res => console.log("Personal Sheet Deletion Synced:", res))
                .catch(e => console.error("Personal Sheet Deletion Sync Error:", e));
            }
          } else {
            showToast(data.message, "error"); loadDashboard();
          }
        }).catch(err => {
          showToast("❌ فشل الاتصال بالسيرفر، تراجعت عن الإلغاء", "error"); loadDashboard();
        });
    }

    async function exportToExcel() {
      if (allAttendees.length === 0) return showCustomAlert("لا توجد بيانات حضور لتصديرها.", "تصدير فارغ", "warning");
      const lec = document.getElementById('lecture').value; const group = localStorage.getItem('userGroup') || "Group A";
      let csvContent = "\uFEFFكود الطالب,الاسم بالكامل,وقت التوثيق\n";
      allAttendees.forEach(student => { let safeName = student.name.replace(/,/g, " "); csvContent += `${student.id},${safeName},${student.time}\n`; });
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a");
      link.href = URL.createObjectURL(blob); link.download = `Report_${group}_Lec_${lec}.csv`; link.click(); showToast("✅ تم التصدير", "success");
    }

    async function fetchAnalyticsData(type = 'group') {
      showProgress("تحليل البيانات وبناء الرسوم... 📈");
      const currentGroup = localStorage.getItem('userGroup') || "Group A";
      const currentLec = parseInt(document.getElementById('lecture').value || "1");
      const role = (localStorage.getItem('userRole') || "").toUpperCase();

      const labels = [];
      const dataPoints = [];
      let chartTitle = "";

      try {
        const promises = [];

        if (type === 'all' && (role === 'OWNER' || role === 'CO-FOUNDER' || role === 'ADMIN')) {
          document.getElementById('analyticsDesc').innerText = `📊 مقارنة حية لحضور الجروبات - محاضرة ${currentLec}`;
          chartTitle = 'حضور الجروبات';

          const groupSelect = document.getElementById('globalGroupSelect');
          const groups = groupSelect ? Array.from(groupSelect.options).map(opt => opt.value) : ["Group A", "Group B", "Group K"];

          groups.forEach(g => {
            labels.push(g);
            const url = `${getEffectiveApi(ATTENDANCE_API_URL)}?action=getDashboard&lectureNum=${currentLec}&group=${encodeURIComponent(g)}${getAuthParams()}`;
            promises.push(fetch(url).then(r => r.json()).catch(() => ({ count: 0 })));
          });

        } else {
          document.getElementById('analyticsDesc').innerText = `📈 تتبع كفاءة الحضور لـ ${currentGroup} حتى المحاضرة ${currentLec}`;
          chartTitle = 'كثافة الحضور';

          // Fetch from lec 1 to currentLec
          for (let i = 1; i <= currentLec; i++) {
            labels.push(`م ${i}`);
            const url = `${getEffectiveApi(ATTENDANCE_API_URL)}?action=getDashboard&lectureNum=${i}&group=${encodeURIComponent(currentGroup)}${getAuthParams()}`;
            promises.push(fetch(url).then(r => r.json()).catch(() => ({ count: 0 })));
          }
        }

        const results = await Promise.all(promises);
        results.forEach(res => {
          dataPoints.push(res.count || 0);
        });

        completeProgress();
        document.getElementById('analyticsDesc').style.display = 'block';

        // التحقق من وجود بيانات
        const hasData = dataPoints.some(val => val > 0);
        if (hasData) {
          renderAnalyticsChart(labels, dataPoints, chartTitle);
        } else {
          showToast("⚠️ لا توجد بيانات حضور كافية للرسم البياني حتى الآن.", "warning");
          if (attendanceChartInstance) { attendanceChartInstance.destroy(); }
        }

      } catch (err) {
        completeProgress();
        console.error(err);
        showToast("❌ فشل في الاتصال بالإنترنت أو قاعدة البيانات.", "error");
      }
    }

    function loadAnalytics(type = 'group') {
      fetchAnalyticsData(type);
    }

    function renderAnalyticsChart(labelsArray, dataArray, labelTitle) {
      const canvas = document.getElementById('attendanceChart');
      const ctx = canvas.getContext('2d');
      if (attendanceChartInstance) { attendanceChartInstance.destroy(); }

      const isDark = document.body.classList.contains('dark-mode');
      const chartColor = isDark ? '#00d2ff' : '#0f172a';
      const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

      attendanceChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labelsArray,
          datasets: [{
            label: labelTitle,
            data: dataArray,
            backgroundColor: chartColor,
            borderColor: '#f5b041',
            borderWidth: 2,
            borderRadius: 12,
            hoverBackgroundColor: '#f5b041'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { grid: { display: false }, ticks: { color: isDark ? '#fff' : '#334155', font: { family: 'Cairo', weight: 'bold' } } },
            y: { beginAtZero: true, ticks: { stepSize: 1, color: isDark ? '#fff' : '#334155' }, grid: { color: gridColor, borderDash: [4, 4] } }
          },
          plugins: { legend: { display: false } },
          animation: { duration: 1500, easing: 'easeOutQuart' }
        }
      });
    }

    let allSystemUsers = [];
    function loadUsers() {
      const tbody = document.getElementById('usersList');
      if (!tbody) return;
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px;">⏳ جاري فك التشفير...</td></tr>`;
      showProgress("قراءة بروتوكولات الأمان...");

      fetch(`${LOGIN_API_URL}?action=getUsers${getAuthParams()}`)
        .then(res => res.json())
        .then(data => {
          completeProgress();
          if (data.status === "success" && data.users && data.users.length > 0) {
            allSystemUsers = data.users.filter(u => u.role !== 'Owner');
            renderUsersTable(allSystemUsers);
          } else {
            allSystemUsers = [];
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 30px;">الخادم خالي أو لا صلاحيات</td></tr>`;
          }
        }).catch(err => { completeProgress(); tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#ef4444; padding: 30px;">❌ حدث خطأ في جلب البيانات</td></tr>`; });
    }

    function renderUsersTable(usersToRender) {
      const tbody = document.getElementById('usersList');
      if (!tbody) return;
      if (usersToRender.length === 0) { tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 30px;">لا توجد تطابقات للبحث</td></tr>`; return; }

      const currentUserRole = (localStorage.getItem('userRole') || '').toUpperCase();
      let tableContent = '';

      usersToRender.forEach(u => {
        const isProtected = (u.role === 'CO-Founder' && currentUserRole !== 'OWNER');
        let groupOptions = '';
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let i = 0; i < letters.length; i++) {
          let gName = 'Group ' + letters[i];
          groupOptions += `<option value="${gName}" ${u.group === gName ? 'selected' : ''}>${gName}</option>`;
        }

        tableContent += `<tr>
          <td style="font-size:13px; line-height: 1.5; color: inherit;"><b>${u.name}</b><br><span style="color:var(--text-muted); font-family:monospace;">${u.email}</span></td> 
          <td>
            <select class="role-select" onchange="changeUserRole('${u.email}', this.value)" ${isProtected ? 'disabled title="مغلق - صلاحية عليا"' : ''}>
              <option value="Cadre" ${u.role === 'Cadre' || u.role === 'User' ? 'selected' : ''}>Cadre</option>
              <option value="Coordinator" ${u.role === 'Coordinator' || u.role === 'Manager' ? 'selected' : ''}>Coordinator</option>
              <option value="Team Manager" ${u.role === 'Team Manager' || u.role === 'Admin' ? 'selected' : ''}>Team Manager</option>
              <option value="CO-Founder" ${u.role === 'CO-Founder' ? 'selected' : ''}>CO-Founder ✨</option>
            </select>
          </td>
          <td>
            <select class="role-select" onchange="changeUserGroup('${u.email}', this.value)" ${isProtected ? 'disabled' : ''}>
              ${groupOptions}
            </select>
          </td>
          <td>${isProtected ? '<span style="font-size:12px; color:var(--electric-blue); font-weight:800; background:rgba(0, 210, 255, 0.1); padding:4px 8px; border-radius:8px;">🔒 محمي</span>' : `<button class="btn-danger btn-small" onclick="deleteUser('${u.email}')">عزل 🗑️</button>`}</td>
        </tr>`;
      });
      tbody.innerHTML = tableContent;
    }

    function filterSystemUsers() {
      const query = (document.getElementById('searchUsersInput').value || "").toLowerCase();
      renderUsersTable(allSystemUsers.filter(u => (u.name || "").toLowerCase().includes(query) || (u.email || "").toLowerCase().includes(query)));
    }

    function changeUserRole(email, newRole) {
      showProgress("تحديث الصلاحية...");
      fetch(`${LOGIN_API_URL}?action=updateRole&targetEmail=${encodeURIComponent(email)}&role=${encodeURIComponent(newRole)}${getAuthParams()}`)
        .then(res => res.json()).then(data => { completeProgress(); if (data.status === 'success') { showToast("✅ تمت الترقية بنجاح", "success"); } else { showToast(data.message, "error"); loadUsers(); } }).catch(err => { completeProgress(); showToast("❌ خطأ.", "error"); loadUsers(); });
    }

    function changeUserGroup(email, newGroup) {
      showProgress("نقل المستخدم...");
      fetch(`${LOGIN_API_URL}?action=updateGroup&targetEmail=${encodeURIComponent(email)}&group=${encodeURIComponent(newGroup)}${getAuthParams()}`)
        .then(res => res.json()).then(data => { completeProgress(); if (data.status === 'success') { showToast("✅ تم النقل بنجاح", "success"); } else { showToast(data.message, "error"); loadUsers(); } }).catch(err => { completeProgress(); showToast("❌ خطأ.", "error"); loadUsers(); });
    }

    async function addUser() {
      const name = document.getElementById('newUserName').value; const email = document.getElementById('newUserEmail').value;
      const pass = document.getElementById('newUserPass').value; const role = document.getElementById('newUserRole').value;
      const group = document.getElementById('newUserGroup').value;
      if (!name || !email || !pass) return showCustomAlert("برجاء إكمال جميع البيانات المطلوبة لتوثيق المستخدم.", "بيانات ناقصة", "warning");
      showProgress("توليد حساب...");
      fetch(`${LOGIN_API_URL}?action=addUser&name=${encodeURIComponent(name)}&targetEmail=${encodeURIComponent(email)}&pass=${encodeURIComponent(pass)}&role=${encodeURIComponent(role)}&group=${encodeURIComponent(group)}${getAuthParams()}`)
        .then(res => res.json()).then(data => {
          completeProgress();
          if (data.status === 'success') { showToast("✅ تم توثيق المستخدم", "success"); document.getElementById('newUserName').value = ''; document.getElementById('newUserEmail').value = ''; document.getElementById('newUserPass').value = ''; loadUsers(); }
          else { showToast(data.message, "error"); }
        });
    }

    async function deleteUser(email) {
      if (!await showCustomConfirm("هل أنت متأكد من قرار عزل هذا المستخدم وسحب صلاحياته بالكامل؟", "تأكيد العزل", "warning")) return;
      showProgress("تدمير الصلاحيات...");
      fetch(`${LOGIN_API_URL}?action=deleteUser&targetEmail=${encodeURIComponent(email)}${getAuthParams()}`).then(res => res.json()).then(data => { completeProgress(); if (data.status === 'success') { showToast("✅ تم العزل", "success"); loadUsers(); } else { showToast(data.message, "error"); } });
    }

    let allGroupStudentsForMail = [];
    function loadMailTargetList() {
      const listContainer = document.getElementById('mailOptionList');
      const selectBox = document.getElementById('mailSelectBoxText');
      if (!listContainer) return;

      listContainer.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-muted);">جاري جلب قائمة متدربي الجروب... ⏳</div>`;
      selectBox.innerText = `جار التحميل... 🔽`;

      const group = document.getElementById('globalGroupSelect') ? document.getElementById('globalGroupSelect').value : (localStorage.getItem('userGroup') || "Group A");

      fetch(`${getEffectiveApi(ATTENDANCE_API_URL)}?action=getTop&fromLec=1&toLec=1&group=${encodeURIComponent(group)}${getAuthParams()}`)
        .then(r => r.json())
        .then(data => {
          if (data.status === 'success' && data.scores) {
            allGroupStudentsForMail = data.scores.filter(s => s.id != null && s.id !== "");
            let html = `
                    <div class="option-item" style="border-bottom: 2px dashed rgba(0,0,0,0.1); margin-bottom: 5px; color: var(--accent);">
                       <input type="checkbox" id="cbMailAll" onchange="toggleMailSelectAll(this.checked)">
                       <label style="flex:1; cursor:pointer;" onclick="this.previousElementSibling.click()">تحديد كافة المتدربين داخل الجروب (${allGroupStudentsForMail.length})</label>
                    </div>
                `;
            allGroupStudentsForMail.forEach(s => {
              html += `
                    <div class="option-item">
                       <input type="checkbox" class="cb-mail-student" value="${s.id}" onchange="updateMailSelectText()">
                       <label style="flex:1; cursor:pointer;" onclick="this.previousElementSibling.click()">${s.name} (${s.id})</label>
                    </div>`;
            });
            listContainer.innerHTML = html;
            updateMailSelectText();
          } else {
            listContainer.innerHTML = `<div style="text-align:center; padding: 20px; color: #ef4444;">❌ الكشف التابع لهذا الجروب فارغ أو غير موجود</div>`;
            selectBox.innerText = `حاول مجدداً ⚠️`;
          }
        }).catch(e => {
          listContainer.innerHTML = `<div style="text-align:center; padding: 20px; color: #ef4444;">❌ خطأ في الاتصال بقواعد البيانات</div>`;
          selectBox.innerText = `لا يوجد اتصال ⚠️`;
        });
    }

    function toggleMailOptionList() { document.getElementById('mailOptionList').classList.toggle('open'); }
    function toggleMailSelectAll(isChecked) {
      document.querySelectorAll('.cb-mail-student').forEach(cb => cb.checked = isChecked);
      updateMailSelectText();
    }
    function updateMailSelectText() {
      const cbs = document.querySelectorAll('.cb-mail-student');
      const checked = Array.from(cbs).filter(cb => cb.checked);
      const box = document.getElementById('mailSelectBoxText');
      const allCb = document.getElementById('cbMailAll');

      if (checked.length === 0) {
        box.innerText = "اختر المتدربين المرسل إليهم 🔽";
        if (allCb) allCb.checked = false;
      } else if (checked.length === cbs.length && cbs.length > 0) {
        box.innerText = `تم تحديد كافة المتدربين (${cbs.length}) 🔽`;
        if (allCb) allCb.checked = true;
      } else {
        box.innerText = `تم تحديد (${checked.length}) متدربين 🔽`;
        if (allCb) allCb.checked = false;
      }
    }

    function updateAttachLabel(input) {
      const label = document.getElementById('attachLabelContent');
      if (!label) return;
      if (input.files && input.files[0]) {
        const f = input.files[0];
        const size = (f.size / 1024 / 1024).toFixed(2);
        const icon = f.type.includes('pdf') ? '📄' : '🖼️';
        label.innerHTML = `
          <div style="font-size:28px; margin-bottom:6px;">${icon}</div>
          <div style="font-weight:800; color:var(--accent);">${f.name}</div>
          <div style="font-size:12px; color:var(--text-muted); margin-top:3px;">${size} MB — جاهز للإرفاق ✅</div>
        `;
      } else {
        label.innerHTML = `
          <div style="font-size: 32px; margin-bottom: 8px; opacity: 0.5;">☁️</div>
          <div style="font-weight: 700; color: var(--text-main); margin-bottom: 4px;">اسحب الملف هنا أو اضغط للاختيار</div>
          <div style="font-size: 12px; color: var(--text-muted);">PDF أو صور — الحد الأقصى 5MB</div>
        `;
      }
    }

    function sendBroadcastMail() {
      const cbs = document.querySelectorAll('.cb-mail-student:checked');
      if (cbs.length === 0) return showToast("⚠️ يرجى تحديد متدرب واحد على الأقل!", "warning");

      const isAllChecked = document.getElementById('cbMailAll').checked;
      const target = isAllChecked ? 'all' : Array.from(cbs).map(cb => cb.value).join(',');

      const subject = document.getElementById('mailSubject').value.trim();
      const body = document.getElementById('mailBody').value.trim();
      if (!subject || !body) return showToast("⚠️ يرجى تعبئة عنوان ومحتوى الرسالة!", "warning");

      const fileInput = document.getElementById('mailAttachment');
      let fileData = null;
      var file = fileInput.files[0];

      if (file && file.size > 5 * 1024 * 1024) return showToast("❌ حجم الملف يجب أن لا يتخطى 5MB!", "error");

      const processRequest = (base64File, mimeType, fileName) => {
        showProgress("جاري الإرسال للخوادم المركزية 🚀 (تأكد من استقرار الإنترنت)...");

        const payload = {
          action: "sendBroadcast",
          senderName: localStorage.getItem('userName') || "مدير التدريب",
          group: document.getElementById('globalGroupSelect') ? document.getElementById('globalGroupSelect').value : (localStorage.getItem('userGroup') || "Group A"),
          target: target,
          subject: subject,
          body: body
        };

        if (base64File) {
          payload.attachment = {
            data: base64File.split(',')[1],
            mimeType: mimeType,
            filename: fileName
          };
        }

        fetch(getEffectiveApi(ATTENDANCE_API_URL), {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload)
        }).then(r => r.text()).then(text => {
          completeProgress();
          try {
            const data = JSON.parse(text);
            if (data.status === 'success') {
              showToast(`✅ تم الإرسال بفضل الله. (${data.sentCount} رسالة تم توجيهها)`, "success");
              document.getElementById('mailSubject').value = '';
              document.getElementById('mailBody').value = '';
              if (fileInput) fileInput.value = '';
            } else {
              showToast(data.message || "حدث خطأ أثناء المعالجة.", "error");
            }
          } catch (e) {
            console.error("Server API Error. Returned HTML/Text instead of JSON:", text);
            showToast("❌ خطأ بسيرفر جوجل! راجع كود doPost للمنصة.", "error");
          }
        }).catch(e => {
          completeProgress();
          console.error("Network/CORS Error:", e);
          showToast("❌ خطأ اتصال أو CORS! تأكد من نشر السكربت كـ (Anyone)", "error");
        });
      };

      if (file) {
        showProgress("جاري تشفير المرفق للرفع الآمن...");
        const reader = new FileReader();
        reader.onload = function (e) { processRequest(e.target.result, file.type, file.name); };
        reader.readAsDataURL(file);
      } else {
        processRequest(null, null, null);
      }
    }

// ==================== SECTION ====================
// ==================== PWA & SERVICE WORKER ====================
    let deferredPrompt;
    
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
          .then((registration) => {
            console.log('[PWA] Service Worker registered');
            
            // Check for updates periodically
            setInterval(() => {
              registration.update();
            }, 3600000); // Check every hour
          })
          .catch((err) => {
            console.log('[PWA] Service Worker registration failed:', err);
          });
      });
      
      // Listen for install prompt
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        // You can show a custom install button here
      });
    }
    
    // Function to trigger install prompt
    function installPWA() {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            showToast('✅ تم تثبيت التطبيق!', 'success');
          }
          deferredPrompt = null;
        });
      }
    }

// ==================== SECTION ====================
// --- MAGNETIC CURSOR LOGIC ---
    document.addEventListener('DOMContentLoaded', () => {
      if (window.matchMedia("(pointer: fine)").matches) {
        const cursorGlow = document.createElement('div');
        cursorGlow.classList.add('cursor-glow');
        document.body.appendChild(cursorGlow);

        let mouseX = -100, mouseY = -100;
        let cursorX = -100, cursorY = -100;

        document.addEventListener('mousemove', (e) => {
          mouseX = e.clientX;
          mouseY = e.clientY;
        });

        function animateCursor() {
          cursorX += (mouseX - cursorX) * 0.15;
          cursorY += (mouseY - cursorY) * 0.15;
          cursorGlow.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
          requestAnimationFrame(animateCursor);
        }
        animateCursor();

        const addHoverListeners = () => {
          document.querySelectorAll('button, a, input, select, .glass-panel, .dashboard-card').forEach(el => {
            if (!el.dataset.hasCursorHover) {
              el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
              el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
              el.dataset.hasCursorHover = "true";
            }
          });
        };
        addHoverListeners();
        setInterval(addHoverListeners, 2000);
      }
    });

    // --- SMOOTH BACKGROUND PARTICLES (CSS-only, no JS overhead) ---
    document.addEventListener('DOMContentLoaded', () => {
      const container = document.getElementById('particles-container');
      if (!container) return;
      
      // Reduced count for performance
      const particleCount = 12;
      
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Random properties
        const size = Math.random() * 2 + 1.5;
        const left = Math.random() * 100;
        const delay = Math.random() * 20;
        const duration = Math.random() * 15 + 15;
        
        particle.style.cssText = `
          width: ${size}px;
          height: ${size}px;
          left: ${left}%;
          animation-delay: ${delay}s;
          animation-duration: ${duration}s;
        `;
        
        container.appendChild(particle);
      }
    });

