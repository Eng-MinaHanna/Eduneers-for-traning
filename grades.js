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
function initLecOptions() {
    let lecOptions = "";
    for (let i = 1; i <= 20; i++) lecOptions += `<option value="${i}">المحاضرة ${i}</option>`;
    
    const curLec = document.getElementById('currentLecNum');
    if (curLec && curLec.children.length === 0) curLec.innerHTML = lecOptions;

    let quizOptions = "";
    for (let i = 1; i <= 20; i++) quizOptions += `<option value="${i}">Quiz ${i}</option>`;
    
    const setQ = document.getElementById('setQNum');
    if (setQ && setQ.children.length === 0) setQ.innerHTML = quizOptions;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLecOptions);
} else {
    initLecOptions();
}

// ==================== SECTION ====================
const CENTRAL_LINKS_API = "https://script.google.com/macros/s/AKfycbxFT_0yMGQMp2tK_F3G_ndN-b5URC-PQOxaT63rLPExzCNyV6p9-UKGpKELVnJbc2LA/exec";

        // Single API for all operations - Grade Sheet handles scan/saveGrade/saveQuiz/saveExtra/getTop
        let GRADES_API = "https://script.google.com/macros/s/AKfycbyATAge8KOnxJorTSRBKhp01ZNC292S0ScLyUGqyAO8WIJaDbNJi_8htuQhoRNooHrI/exec";

        // 🔗 دالة اختيار الـ API المناسب (الافتراضي أو المخصص للجروب)
        function getEffectiveApi(originalUrl) {
            const currentGroup = localStorage.getItem('userGroup') || "Group A";
            const groupOverride = localStorage.getItem(`GROUP_API_${currentGroup}`);
            // إذا وجد رابط للجروب، نستخدمه لجميع العمليات بدلاً من الروابط الافتراضية
            return groupOverride || originalUrl;
        }

        // 🔗 دالة جلب رابط الطالب الفردي
        function getPersonalApi(studentCode) {
            let linksMap = JSON.parse(localStorage.getItem('PERSONAL_LINKS_MAP') || '{}');
            return linksMap[studentCode] || localStorage.getItem('PERSONAL_API') || "";
        }

        let myChart = null;

        // Smart caching system for grades
        const GRADES_CACHE = {
            leaderboard: { data: null, timestamp: 0, params: '' },
            search: { data: null, timestamp: 0, code: '' }
        };
        const GRADES_CACHE_TTL = 20000; // 20 seconds

        // Prefetch system for grades - loads data in background
        const GRADES_PREFETCH = {
            enabled: true,
            idleTime: 4000,
            timeout: null,

            start: function () {
                if (!this.enabled || this.timeout) return;
                this.timeout = setTimeout(() => this.prefetchData(), this.idleTime);
            },

            cancel: function () {
                if (this.timeout) {
                    clearTimeout(this.timeout);
                    this.timeout = null;
                }
            },

            prefetchData: function () {
                this.enabled = false;

                const auth = getAuthParams();
                const group = localStorage.getItem('userGroup') || "Group A";

                // Fire and forget prefetch for common ranges
                fetch(`${getEffectiveApi(GRADES_API)}?action=getTop&fromTask=1&toTask=5${auth}`, { method: 'HEAD' })
                    .catch(() => { });
                fetch(`${getEffectiveApi(GRADES_API)}?action=getTop&fromLec=1&toLec=5${auth}`, { method: 'HEAD' })
                    .catch(() => { });
            }
        };

        // Track activity to trigger prefetch
        ['click', 'keydown', 'scroll'].forEach(evt => {
            document.addEventListener(evt, () => GRADES_PREFETCH.start(), { passive: true });
        });

        function getGradesCached(key) {
            const cache = GRADES_CACHE[key];
            if (cache && cache.data && (Date.now() - cache.timestamp < GRADES_CACHE_TTL)) {
                return cache.data;
            }
            return null;
        }

        function setGradesCache(key, data, extra = '') {
            GRADES_CACHE[key] = { data, timestamp: Date.now(), params: extra };
        }

        function clearGradesCache(key) {
            if (key) {
                GRADES_CACHE[key] = { data: null, timestamp: 0, params: '' };
            } else {
                GRADES_CACHE.leaderboard = { data: null, timestamp: 0, params: '' };
                GRADES_CACHE.search = { data: null, timestamp: 0, code: '' };
            }
        }

        // 🔴 دالة تحويل الأرقام العربية إلى إنجليزية
        function convertNumerals(str) {
            const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
            return str.replace(/[٠-٩]/g, w => arabicNumbers.indexOf(w));
        }

        window.onload = () => {
            try {
                if (localStorage.getItem('isLoggedIn') !== 'true') { window.location.href = 'index.html'; return; }
                if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark-mode');
                if (localStorage.getItem('performanceMode') === 'true') { document.body.classList.add('performance-mode'); document.getElementById('perfToggle').innerText = '💤'; }

                const rawRole = localStorage.getItem('userRole') || "CADRE";
                const role = rawRole.toUpperCase();
                
                if (role === 'CADRE') {
                    window.location.href = 'index.html';
                    return;
                }

                const name = localStorage.getItem('userName') || "مهندس";

                document.getElementById('welcomeName').innerText = `| ${name}`;
                document.getElementById('sideRole').innerText = rawRole;

                const rBadge = document.getElementById('roleBadge');
                if (rBadge) {
                    rBadge.innerText = (role === 'OWNER') ? 'المالك 👑' : 
                                      (role === 'CO-FOUNDER') ? 'CO-Founder 🌟' : 
                                      (role === 'TEAM MANAGER' || role === 'ADMIN') ? 'Team Manager' : 
                                      (role === 'CADRE LEADER') ? 'Cadre Leader 🌟' : 
                                      (role === 'QUALITY CONTROL') ? 'Quality Control 👁️' :
                                      (role === 'COORDINATOR' || role === 'MANAGER') ? 'Coordinator' : 'Cadre';
                    rBadge.style.display = 'inline-block';
                }

                const groupVal = localStorage.getItem('userGroup') || "Group A";
                document.getElementById('groupBadge').innerText = groupVal;
                document.getElementById('groupBadge').style.display = "inline-block";

                if (role === 'OWNER') document.body.classList.add('role-owner');
                else if (role === 'CO-FOUNDER') document.body.classList.add('role-co-founder');
                else if (role === 'TEAM MANAGER' || role === 'ADMIN') document.body.classList.add('role-admin');
                else if (role === 'CADRE LEADER') {
                    document.body.classList.add('role-cadre-leader');
                }
                else if (role === 'QUALITY CONTROL' || role === 'QC') {
                    document.body.classList.add('role-qc');
                }
                else if (role === 'COORDINATOR' || role === 'MANAGER') document.body.classList.add('role-manager');
                else document.body.classList.add('role-user');

                fillGroupSelects();
                loadLinksDatabase();

                // Restore saved view or default to grading
                const savedView = localStorage.getItem('savedView');
                if (savedView && ['grading', 'studentDashboard', 'searchView', 'topView', 'settings'].includes(savedView)) {
                    switchView(savedView);
                } else {
                    switchView('grading');
                }

                // 🚀 Background Prefetch: silently load data so views are instant
                setTimeout(() => prefetchGroupData(), 2000);
            } catch (error) {
                console.error("Grades System Error:", error);
                showToast("❌ حدث خطأ أثناء تهيئة النظام", "error");
            }
        };
        
        // Global error handler
        window.onerror = function(msg, url, lineNo, columnNo, error) {
            console.error('Global Error:', msg, url, lineNo, columnNo, error);
            try { 
                const cleanMsg = msg ? msg.toString() : "خطأ غير متوقع";
                showToast("⚠️ خطأ: " + cleanMsg, "warning"); 
            } catch(e) {}
            return false;
        };
        
        // Global unhandled promise rejection handler
        window.addEventListener('unhandledrejection', function(event) {
            console.error('Unhandled Promise Rejection:', event.reason);
            try { showToast("⚠️ خطأ في الاتصال", "warning"); } catch(e) {}
        });
        
        // PWA Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js')
                    .then((reg) => console.log('[PWA] SW registered'))
                    .catch((err) => console.log('[PWA] SW failed:', err));
            });
        }

        // Cache storage for prefetched data
        let _prefetchCache = {};
        let _prefetchDone = false;

        async function prefetchGroupData() {
            const auth = getAuthParams();
            const fl = 1, tl = 20;
            try {
                const [rTasks, rQuizzes, rAttend, rExtra] = await Promise.all([
                    fetch(`${getEffectiveApi(GRADES_API)}?action=getTop&fromTask=${fl}&toTask=${tl}${auth}`).then(r => r.json()).catch(() => ({})),
                    fetch(`${getEffectiveApi(GRADES_API)}?action=getTop&fromQuiz=${fl}&toQuiz=${tl}${auth}`).then(r => r.json()).catch(() => ({})),
                    fetch(`${getEffectiveApi(GRADES_API)}?action=getTop&fromLec=${fl}&toLec=${tl}&weight=15${auth}`).then(r => r.json()).catch(() => ({})),
                    fetch(`${getEffectiveApi(GRADES_API)}?action=getTop&extraOnly=1&fromLec=${fl}&toLec=${tl}${auth}`).then(r => r.json()).catch(() => ({}))
                ]);
                _prefetchCache = { tasks: rTasks, quizzes: rQuizzes, attendance: rAttend, extras: rExtra, params: `fl=${fl}&tl=${tl}` };
                _prefetchDone = true;
                console.log("✅ Background prefetch complete");
            } catch (e) {
                console.log("Prefetch skipped:", e);
            }
        }

        function loadLinksDatabase() {
            fetch(`${CENTRAL_LINKS_API}?action=getAllLinks`)
                .then(r => r.json())
                .then(data => {
                    if (data.status === "success") {
                        // Update Groups Cache
                        for (let g in data.groups) {
                            localStorage.setItem(`GROUP_API_${g}`, data.groups[g]);
                        }
                        // Update Individuals Cache
                        localStorage.setItem('PERSONAL_LINKS_MAP', JSON.stringify(data.individuals));

                        // refresh UI if on settings view
                        if (document.getElementById('groupApiInput')) {
                            const currentGroup = localStorage.getItem('userGroup') || "Group A";
                            document.getElementById('groupApiInput').value = localStorage.getItem(`GROUP_API_${currentGroup}`) || "";
                        }
                        refreshLinksMonitor();
                    }
                }).catch(e => console.error("Error loading links DB", e));
        }

        function saveGroupApi() {
            const url = document.getElementById('groupApiInput').value.trim();
            const currentGroup = localStorage.getItem('userGroup') || "Group A";
            if (!url) return showToast("❌ יرجى إدخال الرابط أولاً", "error");

            showToast("⏳ جاري الحفظ في الـ Database المركزية...", "info");
            fetch(`${CENTRAL_LINKS_API}?action=saveGroup&group=${encodeURIComponent(currentGroup)}&url=${encodeURIComponent(url)}`)
                .then(r => r.json())
                .then(res => {
                    localStorage.setItem(`GROUP_API_${currentGroup}`, url);
                    showToast(`✅ تم حفظ رابط الجروب لـ ${currentGroup}! 🚀`, "success");
                }).catch(e => showToast("❌ خطأ في الاتصال بالشبكة", "error"));
        }

        function resetGroupApi() {
            const currentGroup = localStorage.getItem('userGroup') || "Group A";
            showToast("⏳ جاري الحذف من الـ Database...", "info");
            fetch(`${CENTRAL_LINKS_API}?action=removeGroup&group=${encodeURIComponent(currentGroup)}`)
                .then(r => r.json())
                .then(res => {
                    localStorage.removeItem(`GROUP_API_${currentGroup}`);
                    document.getElementById('groupApiInput').value = "";
                    showToast(`🔄 تم إرجاع ${currentGroup} للرابط الافتراضي`, "success");
                }).catch(e => showToast("❌ خطأ في الاتصال بالشبكة", "error"));
        }

        function savePersonalApi() {
            const url = document.getElementById('personalApiInput').value.trim();
            let code = document.getElementById('targetStudentCode').value.trim().toUpperCase();
            const currentGroup = localStorage.getItem('userGroup') || "Group A";

            if (!code || !url) return showToast("❌ يرجى إدخال الكود والرابط معاً", "error");
            // If they just typed "K1", append standard suffix
            if (!code.includes("EDUR")) code = code + "EDUR9";

            const groupLetter = currentGroup.replace("Group ", "").trim();
            if (!code.startsWith(groupLetter)) {
                return showToast("❌ لا تملك صلاحية التعديل على جروب آخر!", "error");
            }

            showToast("⏳ جاري الحفظ في الـ Database المركزية...", "info");
            fetch(`${CENTRAL_LINKS_API}?action=saveIndividual&code=${encodeURIComponent(code)}&url=${encodeURIComponent(url)}&group=${encodeURIComponent(currentGroup)}`)
                .then(r => r.json())
                .then(res => {
                    let linksMap = JSON.parse(localStorage.getItem('PERSONAL_LINKS_MAP') || '{}');
                    linksMap[code] = url;
                    localStorage.setItem('PERSONAL_LINKS_MAP', JSON.stringify(linksMap));

                    showToast(`✅ تم بنجاح ربط الطالب ${code} 🔗`, "success");
                    document.getElementById('targetStudentCode').value = "";
                    document.getElementById('personalApiInput').value = "";
                    refreshLinksMonitor();
                }).catch(e => showToast("❌ خطأ في الاتصال", "error"));
        }

        function refreshLinksMonitor() {
            const tableBody = document.getElementById('mappedLinksMonitorTable');
            if (!tableBody) return;
            
            let linksMap = JSON.parse(localStorage.getItem('PERSONAL_LINKS_MAP') || '{}');
            const currentGroup = localStorage.getItem('userGroup') || "Group A";
            const groupLetter = currentGroup.replace("Group ", "").trim();

            // Update stats in the Settings Dashboard
            const groupStat = document.getElementById('settings-stat-group');
            if (groupStat) groupStat.innerText = currentGroup;

            let groupKeys = Object.keys(linksMap).filter(code => code.startsWith(groupLetter));
            
            // Apply custom links order if exists
            let customOrder = JSON.parse(localStorage.getItem('PERSONAL_LINKS_ORDER_' + currentGroup) || '[]');
            if (customOrder.length > 0) {
                let filteredOrder = customOrder.filter(k => groupKeys.includes(k));
                groupKeys.forEach(k => {
                    if (!filteredOrder.includes(k)) {
                        filteredOrder.push(k);
                    }
                });
                groupKeys = filteredOrder;
                localStorage.setItem('PERSONAL_LINKS_ORDER_' + currentGroup, JSON.stringify(groupKeys));
            }

            const studentsStat = document.getElementById('settings-stat-students');
            if (studentsStat) studentsStat.innerText = groupKeys.length;

            let html = "";
            groupKeys.forEach(code => {
                const url = linksMap[code];
                html += `
                    <tr class="link-row" draggable="true" data-code="${code}"
                        ondragstart="onLinkRowDragStart(event, '${code}')"
                        ondragover="onLinkRowDragOver(event)"
                        ondrop="onLinkRowDrop(event, '${code}')"
                        ondragend="onLinkRowDragEnd(event)"
                        style="border-bottom:1px solid rgba(255,255,255,0.05); transition: background 0.2s; cursor:grab;">
                        <td style="padding:12px 10px; font-weight:bold; color:var(--electric-blue); font-family:monospace; font-size:13px;">${code}</td>
                        <td style="padding:12px 10px; opacity:0.75; font-family:monospace; font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:280px;" title="${url}">${url}</td>
                        <td style="padding:12px 10px; text-align:center;">
                            <div style="display:flex; justify-content:center; gap:8px; align-items:center;">
                                <button onclick="moveLinkUp('${code}')" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:var(--electric-blue); cursor:pointer; font-size:10px; padding:3px 6px; border-radius:4px; transition: all 0.2s;" title="ترتيب لأعلى">▲</button>
                                <button onclick="moveLinkDown('${code}')" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:var(--electric-blue); cursor:pointer; font-size:10px; padding:3px 6px; border-radius:4px; transition: all 0.2s;" title="ترتيب لأسفل">▼</button>
                                <div style="width:1px; height:12px; background:rgba(255,255,255,0.15); margin:0 2px;"></div>
                                <button onclick="editPersonalLink('${code}', '${url}')" style="background:none; border:none; color:var(--accent); cursor:pointer; font-size:14px; padding:2px;" title="تعديل">✏️</button>
                                <button onclick="copyToClipboard('${url}')" style="background:none; border:none; color:var(--electric-blue); cursor:pointer; font-size:14px; padding:2px;" title="نسخ الرابط">📋</button>
                                <button onclick="confirmRemoveLink('${code}')" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:14px; padding:2px;" title="حذف">🗑️</button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            tableBody.innerHTML = html || `<tr><td colspan="3" style="text-align:center; padding:30px; opacity:0.5; color:var(--text-muted);">لا يوجد روابط مسجلة حالياً لـ ${currentGroup}...</td></tr>`;
        }

        // Drag-and-Drop handlers for link rows
        let _draggedLinkCode = null;

        window.onLinkRowDragStart = function(e, code) {
            _draggedLinkCode = code;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', code);
            e.target.style.opacity = '0.4';
        };

        window.onLinkRowDragOver = function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            document.querySelectorAll('tr.link-row').forEach(r => r.classList.remove('drag-over'));
            const row = e.target.closest('tr.link-row');
            if (row) row.classList.add('drag-over');
        };

        window.onLinkRowDrop = function(e, targetCode) {
            e.preventDefault();
            if (!_draggedLinkCode || _draggedLinkCode === targetCode) return;

            const currentGroup = localStorage.getItem('userGroup') || "Group A";
            let customOrder = JSON.parse(localStorage.getItem('PERSONAL_LINKS_ORDER_' + currentGroup) || '[]');
            let linksMap = JSON.parse(localStorage.getItem('PERSONAL_LINKS_MAP') || '{}');
            const groupLetter = currentGroup.replace("Group ", "").trim();
            let groupKeys = Object.keys(linksMap).filter(c => c.startsWith(groupLetter));

            if (customOrder.length > 0) {
                let filteredOrder = customOrder.filter(k => groupKeys.includes(k));
                groupKeys.forEach(k => { if (!filteredOrder.includes(k)) filteredOrder.push(k); });
                groupKeys = filteredOrder;
            }

            const fromIdx = groupKeys.indexOf(_draggedLinkCode);
            const toIdx = groupKeys.indexOf(targetCode);
            if (fromIdx === -1 || toIdx === -1) return;

            groupKeys.splice(fromIdx, 1);
            groupKeys.splice(toIdx, 0, _draggedLinkCode);

            localStorage.setItem('PERSONAL_LINKS_ORDER_' + currentGroup, JSON.stringify(groupKeys));
            saveLinksOrderToServer(groupKeys);
            refreshLinksMonitor();
        };

        window.onLinkRowDragEnd = function(e) {
            _draggedLinkCode = null;
            e.target.style.opacity = '1';
            document.querySelectorAll('tr.link-row').forEach(r => r.classList.remove('drag-over'));
        };

        function saveLinksOrderToServer(orderArray) {
            const orderStr = orderArray.join(',');
            fetch(`${CENTRAL_LINKS_API}?action=reorderIndividuals&order=${encodeURIComponent(orderStr)}`)
                .then(r => r.json())
                .then(res => {
                    if (res.status === 'success') {
                        console.log('Order saved to server:', res.message);
                    }
                })
                .catch(e => console.error('Failed to save order to server', e));
        }

        window.moveLinkUp = function(code) {
            const currentGroup = localStorage.getItem('userGroup') || "Group A";
            const groupLetter = currentGroup.replace("Group ", "").trim();
            let linksMap = JSON.parse(localStorage.getItem('PERSONAL_LINKS_MAP') || '{}');
            let groupKeys = Object.keys(linksMap).filter(c => c.startsWith(groupLetter));
            
            let customOrder = JSON.parse(localStorage.getItem('PERSONAL_LINKS_ORDER_' + currentGroup) || '[]');
            if (customOrder.length > 0) {
                let filteredOrder = customOrder.filter(k => groupKeys.includes(k));
                groupKeys.forEach(k => {
                    if (!filteredOrder.includes(k)) filteredOrder.push(k);
                });
                groupKeys = filteredOrder;
            }

            const index = groupKeys.indexOf(code);
            if (index > 0) {
                const temp = groupKeys[index];
                groupKeys[index] = groupKeys[index - 1];
                groupKeys[index - 1] = temp;
                
                localStorage.setItem('PERSONAL_LINKS_ORDER_' + currentGroup, JSON.stringify(groupKeys));
                saveLinksOrderToServer(groupKeys);
                refreshLinksMonitor();
                
                if (window.dashboardStudents && window.dashboardStudents.length > 0) {
                    sortDashboardStudentsList();
                    if (window.dbActiveTab === 'excel') {
                        renderExcelGrid();
                    } else {
                        renderDashboardGrid(window.dashboardStudents);
                    }
                }
                
                showToast(`🔼 تم نقل كود ${code} للأعلى في الترتيب`, "success");
            } else {
                showToast("⚠️ العنصر موجود بالفعل في البداية!", "warning");
            }
        };

        window.moveLinkDown = function(code) {
            const currentGroup = localStorage.getItem('userGroup') || "Group A";
            const groupLetter = currentGroup.replace("Group ", "").trim();
            let linksMap = JSON.parse(localStorage.getItem('PERSONAL_LINKS_MAP') || '{}');
            let groupKeys = Object.keys(linksMap).filter(c => c.startsWith(groupLetter));
            
            let customOrder = JSON.parse(localStorage.getItem('PERSONAL_LINKS_ORDER_' + currentGroup) || '[]');
            if (customOrder.length > 0) {
                let filteredOrder = customOrder.filter(k => groupKeys.includes(k));
                groupKeys.forEach(k => {
                    if (!filteredOrder.includes(k)) filteredOrder.push(k);
                });
                groupKeys = filteredOrder;
            }

            const index = groupKeys.indexOf(code);
            if (index !== -1 && index < groupKeys.length - 1) {
                const temp = groupKeys[index];
                groupKeys[index] = groupKeys[index + 1];
                groupKeys[index + 1] = temp;
                
                localStorage.setItem('PERSONAL_LINKS_ORDER_' + currentGroup, JSON.stringify(groupKeys));
                saveLinksOrderToServer(groupKeys);
                refreshLinksMonitor();
                
                if (window.dashboardStudents && window.dashboardStudents.length > 0) {
                    sortDashboardStudentsList();
                    if (window.dbActiveTab === 'excel') {
                        renderExcelGrid();
                    } else {
                        renderDashboardGrid(window.dashboardStudents);
                    }
                }
                
                showToast(`🔽 تم نقل كود ${code} للأسفل في الترتيب`, "success");
            } else {
                showToast("⚠️ العنصر موجود بالفعل في النهاية!", "warning");
            }
        };

        function removePersonalLink(code) {
            const currentGroup = localStorage.getItem('userGroup') || "Group A";
            const groupLetter = currentGroup.replace("Group ", "").trim();
            if (!code.startsWith(groupLetter)) {
                return showToast("❌ غير مصرح لك بحذف كود من جروب آخر!", "error");
            }

            showToast("⏳ جاري الحذف من الـ Database...", "info");
            fetch(`${CENTRAL_LINKS_API}?action=removeIndividual&code=${encodeURIComponent(code)}`)
                .then(r => r.json())
                .then(res => {
                    let linksMap = JSON.parse(localStorage.getItem('PERSONAL_LINKS_MAP') || '{}');
                    delete linksMap[code];
                    localStorage.setItem('PERSONAL_LINKS_MAP', JSON.stringify(linksMap));
                    refreshLinksMonitor();
                    showToast("🗑️ تم حذف الربط بنجاح", "success");
                }).catch(e => showToast("❌ خطأ في الاتصال", "error"));
        }

        window.editPersonalLink = function(code, url) {
            document.getElementById('targetStudentCode').value = code;
            document.getElementById('personalApiInput').value = url;
            document.getElementById('personalApiInput').focus();
            showToast("✏️ تم تعبئة بيانات الطالب للتعديل", "info");
        };

        window.copyToClipboard = function(text) {
            navigator.clipboard.writeText(text).then(() => {
                showToast("📋 تم نسخ الرابط إلى الحافظة!", "success");
            }).catch(() => {
                showToast("❌ فشل النسخ التلقائي", "error");
            });
        };

        window.confirmRemoveLink = async function(code) {
            const confirmed = await showCustomConfirm(`هل أنت متأكد من رغبتك في حذف ربط الطالب ${code}؟`, "تأكيد حذف الربط");
            if (confirmed) {
                removePersonalLink(code);
            }
        };

        window.filterLinksMonitorTable = function() {
            const query = document.getElementById('searchLinksInput').value.trim().toUpperCase();
            const rows = document.querySelectorAll('#mappedLinksMonitorTable .link-row');
            rows.forEach(row => {
                const code = row.getAttribute('data-code') || "";
                if (code.toUpperCase().includes(query)) {
                    row.style.display = "";
                } else {
                    row.style.display = "none";
                }
            });
        };

        window.testGroupConnection = function() {
            const url = document.getElementById('groupApiInput').value.trim();
            if (!url) return showToast("❌ يرجى إدخال الرابط للاختبار", "error");

            showToast("⏳ جاري اختبار الاتصال بالشيت المركزي...", "info");
            
            const testUrl = `${url}${url.includes('?') ? '&' : '?'}action=getTop&fromLec=1&toLec=1`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            fetch(testUrl, { signal: controller.signal })
                .then(r => r.json())
                .then(res => {
                    clearTimeout(timeoutId);
                    if (res && res.status === "success") {
                        showCustomAlert("✅ تم الاتصال بنجاح! الرابط متصل ومستقر وقاعدة البيانات جاهزة للاستجابة.", "اتصال ناجح ⚡", "success");
                    } else {
                        showCustomAlert(`⚠️ استجاب الرابط ولكن بنتيجة غير متوقعة: ${res.message || 'خطأ مجهول'}`, "تنبيه الاتصال", "warning");
                    }
                })
                .catch(err => {
                    clearTimeout(timeoutId);
                    showCustomAlert("❌ فشل الاتصال برابط الـ API المحدد. يرجى التأكد من نشر السكربت كـ Web App وتفعيل صلاحيات الوصول للجميع (Anyone).", "فشل الاتصال ⚠️", "warning");
                });
        };

        function switchView(viewId) {
            document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
            document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));

            document.getElementById(`view-${viewId}`).classList.add('active');
            const navItem = document.getElementById(`nav-${viewId}`);
            if (navItem) navItem.classList.add('active');
        }

        function toggleDarkMode() {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
            if (myChart) extractTop5();
        }

        function togglePerformanceMode() {
            const isPerf = document.body.classList.toggle('performance-mode');
            localStorage.setItem('performanceMode', isPerf);
            document.getElementById('perfToggle').innerText = isPerf ? '💤' : '⚡';
        }

        function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('overlay').classList.toggle('show'); }
        function logout() {
            // مسح بيانات الجلسة فقط والحفاظ على الإعدادات
            const keysToKeep = ['darkMode', 'PERSONAL_LINKS_MAP', 'PERSONAL_API'];
            // نحتفظ أيضاً بروابط الجروبات
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('GROUP_API_')) keysToKeep.push(key);
            }

            const backup = {};
            keysToKeep.forEach(k => backup[k] = localStorage.getItem(k));

            localStorage.clear();

            Object.keys(backup).forEach(k => {
                if (backup[k] !== null) localStorage.setItem(k, backup[k]);
            });

            window.location.href = 'index.html';
        }

        function fillGroupSelects() {
            let options = ''; const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            for (let i = 0; i < letters.length; i++) { let g = 'Group ' + letters[i]; options += `<option value="${g}">${g}</option>`; }
            const gSelect = document.getElementById('globalGroupSelect');
            if (gSelect) { gSelect.innerHTML = options; gSelect.value = localStorage.getItem('userGroup') || 'Group A'; }
        }

        function changeGlobalGroup(val) {
            localStorage.setItem('userGroup', val);
            const groupBadge = document.getElementById('groupBadge');
            if (groupBadge) groupBadge.innerText = val;

            // Refresh API input field for new group selection
            if (document.getElementById('groupApiInput')) {
                document.getElementById('groupApiInput').value = localStorage.getItem(`GROUP_API_${val}`) || "";
            }

            // Auto-refresh active views
            const activeTab = document.querySelector('.view-section.active');
            if (activeTab) {
                if (activeTab.id === 'view-settings') {
                    if (typeof loadLinksDatabase === 'function') loadLinksDatabase();
                    if (typeof refreshLinksMonitor === 'function') refreshLinksMonitor();
                } else if (activeTab.id === 'view-topView') {
                    if (typeof extractLeaderboard === 'function') extractLeaderboard(false);
                } else if (activeTab.id === 'view-grading') {
                    const gradeTable = document.getElementById('gradeTable');
                    const res = document.getElementById('result');
                    if (gradeTable) gradeTable.style.display = 'none';
                    if (res) res.style.display = 'none';
                    if (typeof prefetchGroupData === 'function') prefetchGroupData();
                } else if (activeTab.id === 'view-searchView') {
                    const searchRes = document.getElementById('searchResult');
                    if (searchRes) searchRes.style.display = 'none';
                }
            }
        }

        function showLoader(show, msg = "جاري العمل...") {
            const l = document.getElementById('loader');
            if (show) {
                document.getElementById('loaderMsg').innerText = msg;
                l.style.display = 'flex';
                let p = 0; window.ldrItv = setInterval(() => { p += Math.floor(Math.random() * 10) + 1; if (p > 90) p = 90; document.getElementById('barFill').style.width = p + '%'; document.getElementById('percent').innerText = p + '%'; }, 100);
            } else {
                clearInterval(window.ldrItv);
                document.getElementById('barFill').style.width = '100%'; document.getElementById('percent').innerText = '100%';
                setTimeout(() => { l.style.display = 'none'; document.getElementById('barFill').style.width = '0%'; }, 300);
            }
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

        function playBeep(type) {
            if (navigator.vibrate) { 
                if (type === 'success') navigator.vibrate(150); 
                else navigator.vibrate([100, 50, 100, 50, 200]); 
            }
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)(); 
                const osc = ctx.createOscillator(); 
                const gain = ctx.createGain();
                osc.connect(gain); 
                gain.connect(ctx.destination);
                if (type === 'success') { 
                    osc.type = 'sine'; 
                    osc.frequency.value = 800; 
                    gain.gain.value = 0.1; 
                    osc.start(); 
                    osc.stop(ctx.currentTime + 0.15); 
                } else { 
                    osc.type = 'sawtooth'; 
                    osc.frequency.value = 300; 
                    gain.gain.value = 0.1; 
                    osc.start(); 
                    osc.stop(ctx.currentTime + 0.3); 
                }
            } catch(e) {
                console.log("Audio play error", e);
            }
        }

        function showToast(text, type = "success") {
            const t = document.getElementById('toast'); t.innerText = text;
            t.style.background = type === "success" ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #ef4444, #dc2626)";
            t.style.display = 'block'; setTimeout(() => { t.style.display = 'none'; }, 4000);
        }

        function getAuthParams() {
            return `&email=${encodeURIComponent(localStorage.getItem('userEmail'))}&token=${encodeURIComponent(localStorage.getItem('sessionToken'))}&group=${encodeURIComponent(localStorage.getItem('userGroup'))}`;
        }

        let _isSubmitting = false;

        async function submitData() {
            if (_isSubmitting) return;

            let numRaw = document.getElementById('studentCode').value.trim();
            if (!numRaw) return showToast("❌ برجاء إدخال رقم كود الطالب", "error");

            let num = convertNumerals(numRaw);
            const groupLetter = localStorage.getItem('userGroup').replace("Group ", "").trim();
            const code = groupLetter + num + "EDUR9";
            const lec = document.getElementById('currentLecNum').value;
            const auth = getAuthParams();

            _isSubmitting = true;

            // Use single central API endpoint
            const centralApi = getEffectiveApi(GRADES_API);
            let promises = [];
            let taskName = "TASK " + lec;

            // 1. Save Attendance (scan) - Central
            if (document.getElementById('attBtn').classList.contains('active-att')) {
                promises.push(fetch(`${centralApi}?action=scan&qrCode=${code}&lectureNum=${lec}&weight=15${auth}`).then(r => r.json()).catch(e => ({})));
            } else {
                promises.push(fetch(`${centralApi}?action=deleteAttendance&qrCode=${code}&lectureNum=${lec}${auth}`).then(r => r.json()).catch(e => ({})));
            }

            // 2. Save Main Task Grade - Central
            let taskValRaw = document.getElementById('valTask').value.trim();
            let quizValRaw = document.getElementById('valQuiz').value.trim();

            let isTaskEmpty = (taskValRaw === "");
            let isQuizEmpty = (quizValRaw === "");

            if (isTaskEmpty || isQuizEmpty) {
                let confirmZero = await showCustomConfirm("هل تريد وضع مجموع 0 درجات لهذا المتدرب ؟", "تأكيد رصد الدرجة");
                if (!confirmZero) {
                    _isSubmitting = false;
                    return;
                }
                if (isTaskEmpty) taskValRaw = "0";
                if (isQuizEmpty) quizValRaw = "0";
            }

            let taskVal = convertNumerals(taskValRaw);
            if (taskVal !== "") {
                promises.push(fetch(`${centralApi}?action=saveGrade&qrCode=${code}&taskNum=${lec}&val=${taskVal}${auth}`).then(r => r.json()).catch(e => ({})));
            }

            // 3. Save Quiz Grade - Central  
            let quizVal = convertNumerals(quizValRaw);
            if (quizVal !== "") {
                promises.push(fetch(`${centralApi}?action=saveQuiz&qrCode=${code}&quizNum=${lec}&val=${quizVal}${auth}`).then(r => r.json()).catch(e => ({})));
            }

            // 4. Save Extra (feedback, attitude, bonus) - Central
            let f = document.getElementById('feedBtn').classList.contains('active-feed') ? 1 : 0;
            let a = document.getElementById('attitBtn').classList.contains('active-attit') ? 5 : 0;
            let b = convertNumerals(document.getElementById('valBonus').value) || 0;

            promises.push(fetch(`${centralApi}?action=saveExtra&qrCode=${code}&lectureNum=${lec}&feedback=${f}&attitude=${a}&bonus=${b}${auth}`).then(r => r.json()).catch(e => ({})));

            // === SYNC to Individual Student Sheet ===
            let personalApi = getPersonalApi(code);
            if (personalApi) {
                console.log("Syncing to personal sheet:", personalApi);

                // Attendance
                const attActiveSubmit = document.getElementById('attBtn').classList.contains('active-att');
                promises.push(
                    fetch(`${personalApi}?action=update&qrCode=${code}&taskName=${encodeURIComponent(taskName)}&category=${encodeURIComponent('attendance .15')}&val=${attActiveSubmit ? 15 : 0}`)
                        .then(r => r.json()).then(res => console.log("Sync Attendance:", res)).catch(e => console.error("Sync Error:", e))
                );

                // Main Task
                if (taskVal !== "") {
                    promises.push(
                        fetch(`${personalApi}?action=update&qrCode=${code}&taskName=${encodeURIComponent(taskName)}&category=${encodeURIComponent('Main task. 70')}&val=${taskVal}`)
                            .then(r => r.json()).then(res => console.log("Sync Task:", res)).catch(e => console.error("Sync Error:", e))
                    );
                }

                // Quiz
                if (quizVal !== "") {
                    promises.push(
                        fetch(`${personalApi}?action=update&qrCode=${code}&taskName=${encodeURIComponent(taskName)}&category=${encodeURIComponent('online quize 25')}&val=${quizVal}`)
                            .then(r => r.json()).then(res => console.log("Sync Quiz:", res)).catch(e => console.error("Sync Error:", e))
                    );
                }

                // Extra (attitude + feedback)
                let combinedAtt = 0;
                if (f) combinedAtt += 5;
                if (a) combinedAtt += 5;

                promises.push(
                    fetch(`${personalApi}?action=update&qrCode=${code}&taskName=${encodeURIComponent(taskName)}&category=${encodeURIComponent('attitude .10')}&val=${combinedAtt}`)
                        .then(r => r.json()).then(res => console.log("Sync Attitude:", res)).catch(e => console.error("Sync Error:", e))
                );

                // Bonus
                promises.push(
                    fetch(`${personalApi}?action=update&qrCode=${code}&taskName=${encodeURIComponent(taskName)}&category=${encodeURIComponent('bonus')}&val=${b}`)
                        .then(r => r.json()).then(res => console.log("Sync Bonus:", res)).catch(e => console.error("Sync Error:", e))
                );
            } else {
                console.log("No personal API found for:", code);
            }

            if (promises.length === 0) {
                _isSubmitting = false;
                playBeep('error');
                return showToast("⚠️ لم يتم إدخال أي تقييم لإرساله!", "error");
            }

            playBeep('success');
            _isSubmitting = false;

            // Auto-clear for quick continuous entry
            document.getElementById('studentCode').value = "";
            document.getElementById('valTask').value = "";
            document.getElementById('valQuiz').value = "";
            document.getElementById('valBonus').value = "";
            document.getElementById('attBtn').classList.remove('active-att');
            document.getElementById('feedBtn').classList.remove('active-feed');
            document.getElementById('attitBtn').classList.remove('active-attit');
            document.getElementById('studentCode').focus();

            showToast("⏳ جاري التسجيل...", "success");

            Promise.all(promises).then(results => {
                let studentName = "";
                for (let res of results) {
                    if (!res) continue;
                    if (res.name) { studentName = res.name; break; }
                    if (res.studentName) { studentName = res.studentName; break; }
                    if (res.message && res.message.includes("الطالب")) {
                        let parts = res.message.split("الطالب");
                        if (parts.length > 1) { studentName = parts[1].replace(':', '').trim(); break; }
                    }
                    if (res.message && res.message.includes("-")) {
                        let parts = res.message.split("-");
                        if (parts.length > 1) { studentName = parts[1].trim(); break; }
                    }
                }
                let displayName = studentName || (groupLetter + num);
                showToast("✅ تم التوثيق بنجاح لـ: " + displayName, "success");
            }).catch(e => {
                showToast("❌ حدث خطأ في بعض ملفات التقييم", "error");
                playBeep('error');
            });
        }

        async function searchStudent() {
            let numRaw = document.getElementById('searchCode').value.trim();
            if (!numRaw) return showToast("❌ برجاء إدخال رقم الطالب", "error");

            let num = convertNumerals(numRaw);
            let fl = document.getElementById('sfL').value, tl = document.getElementById('stL').value;
            if (parseInt(fl) > parseInt(tl)) return showToast("❌ نطاق المحاضرات غير صحيح", "error");

            const group = localStorage.getItem('userGroup');
            const code = group.replace("Group ", "").trim() + num + "EDUR9";

            showLoader(true, "جاري استرجاع سجلات الطالب 🔍...");
            try {
                const auth = getAuthParams();

                // Fetch each category separately with correct parameters
                const [rAttend, rTasks, rQuizzes, rExtra] = await Promise.all([
                    // Attendance: uses fromLec/toLec (no task or quiz params)
                    fetch(`${getEffectiveApi(GRADES_API)}?action=getTop&fromLec=${fl}&toLec=${tl}&weight=15${auth}`).then(r => r.json()),
                    // Main Tasks: uses fromTask/toTask
                    fetch(`${getEffectiveApi(GRADES_API)}?action=getTop&fromTask=${fl}&toTask=${tl}${auth}`).then(r => r.json()),
                    // Quizzes: uses fromQuiz/toQuiz  
                    fetch(`${getEffectiveApi(GRADES_API)}?action=getTop&fromQuiz=${fl}&toQuiz=${tl}${auth}`).then(r => r.json()),
                    // Extra (feedback + attitude + bonus): uses extraOnly
                    fetch(`${getEffectiveApi(GRADES_API)}?action=getTop&extraOnly=1&fromLec=${fl}&toLec=${tl}${auth}`).then(r => r.json())
                ]);

                let total = 0; let html = "";
                const addRow = (res, label) => {
                    let s = (res.scores || []).find(x => x.id === code);
                    let val = (s && !isNaN(parseFloat(s.total))) ? parseFloat(s.total) : 0;
                    html += `<tr><td>${label}</td><td><span style="color:var(--electric-blue); font-size:1.1rem;">${val}</span></td></tr>`;
                    total += val;
                    if (s && s.name) document.getElementById('resName').innerText = s.name;
                };

                document.getElementById('resName').innerText = "لم يتم العثور على اسم";

                // Each API returns its own category data
                addRow(rAttend, "إجمالي الحضور");
                addRow(rTasks, "إجمالي التاسكات");
                addRow(rQuizzes, "إجمالي الكويزات");
                addRow(rExtra, "إجمالي (الفيدباك + السلوك + البونص)");

                document.getElementById('searchResult').style.display = 'block';
                document.getElementById('resDetails').innerHTML = html;
                document.getElementById('resTotal').innerText = total;
                showLoader(false);

            } catch (e) {
                console.error(e);
                showLoader(false);
                showToast("❌ خطأ في جلب البيانات", "error");
            }
        }

        let fullLeaderboard = [];
        async function extractLeaderboard(useCache = true) {
            let fl = document.getElementById('fL').value, tl = document.getElementById('tL').value;
            if (parseInt(fl) > parseInt(tl)) return showToast("❌ نطاق المحاضرات غير صحيح", "error");

            // Check cache first
            const cacheParams = `fl=${fl}&tl=${tl}`;
            if (useCache) {
                const cached = getGradesCached('leaderboard');
                if (cached && GRADES_CACHE.leaderboard.params === cacheParams) {
                    fullLeaderboard = cached;
                    renderLeaderboard(fullLeaderboard);
                    if (fullLeaderboard.length > 0) {
                        document.getElementById('chartWrapper').style.display = 'block';
                        let top5 = fullLeaderboard.slice(0, 5);
                        renderChart(top5.map(x => (x.n || "").split(" ")[0]), top5.map(x => x.t));
                    }
                    return;
                }
            }

            showLoader(true, "جاري تحليل بيانات الجروب لاستخراج الترتيب 🏆...");
            try {
                const auth = getAuthParams();

                // Fetch each category separately
                const [rTasks, rQuizzes, rAttend, rExtra] = await Promise.all([
                    fetch(`${getEffectiveApi(GRADES_API)}?action=getTop&fromTask=${fl}&toTask=${tl}${auth}`).then(r => r.json()),
                    fetch(`${getEffectiveApi(GRADES_API)}?action=getTop&fromQuiz=${fl}&toQuiz=${tl}${auth}`).then(r => r.json()),
                    fetch(`${getEffectiveApi(GRADES_API)}?action=getTop&fromLec=${fl}&toLec=${tl}&weight=15${auth}`).then(r => r.json()),
                    fetch(`${getEffectiveApi(GRADES_API)}?action=getTop&extraOnly=1&fromLec=${fl}&toLec=${tl}${auth}`).then(r => r.json())
                ]);

                let m = {};
                const col = (d, weight = 1) => {
                    if (d.status === 'success') {
                        d.scores.forEach(s => {
                            let val = parseFloat(s.total);
                            if (!isNaN(val)) {
                                if (!m[s.id]) m[s.id] = { id: s.id, n: s.name, t: 0 };
                                m[s.id].t += val;
                            }
                        });
                    }
                };

                col(rTasks); col(rQuizzes); col(rAttend); col(rExtra);

                fullLeaderboard = Object.values(m).sort((a, b) => b.t - a.t);
                fullLeaderboard.forEach((s, idx) => s.rank = idx + 1);

                showLoader(false);

                if (fullLeaderboard.length === 0) {
                    document.getElementById('leaderboard').innerHTML = "<div style='text-align:center; padding:20px; color:var(--text-muted); font-weight:bold;'>لا توجد بيانات كافية لعرض الترتيب</div>";
                    document.getElementById('chartWrapper').style.display = 'none';
                    return;
                }

                renderLeaderboard(fullLeaderboard);
                document.getElementById('chartWrapper').style.display = 'block';
                let top5 = fullLeaderboard.slice(0, 5);
                renderChart(top5.map(x => (x.n || "").split(" ")[0]), top5.map(x => x.t));

                // Save to cache
                setGradesCache('leaderboard', fullLeaderboard, cacheParams);

            } catch (e) {
                console.error(e);
                showLoader(false);
                showToast("❌ فشل استخراج الترتيب", "error");
            }
        }

        function renderLeaderboard(dataArray) {
            let listHtml = "";
            if (dataArray.length === 0) {
                document.getElementById('leaderboard').innerHTML = "<div style='text-align:center; padding:20px;'>لا توجد نتائج متطابقة للبحث</div>"; return;
            }
            dataArray.forEach(s => {
                let rankClass = s.rank <= 3 ? `rank-${s.rank}` : `rank-other`;
                let rankIcon = s.rank === 1 ? "🥇" : s.rank === 2 ? "🥈" : s.rank === 3 ? "🥉" : `#${s.rank}`;
                listHtml += `
            <div class="leader-card ${rankClass}">
                <div class="leader-rank">${rankIcon}</div>
                <div class="leader-name" style="flex:1; padding-right:15px; text-align:right;">${s.n} <br><span style="font-size:11px; color:var(--text-muted); font-family:monospace;">${s.id}</span></div>
                <div class="leader-score">${s.t} Pt</div>
            </div>`;
            });
            document.getElementById('leaderboard').innerHTML = listHtml;
        }

        function filterLeaderboard() {
            const query = (document.getElementById('searchLeaderInput').value || "").toLowerCase();
            renderLeaderboard(fullLeaderboard.filter(s => (s.n || "").toLowerCase().includes(query) || (s.id || "").toLowerCase().includes(query)));
        }

        function renderChart(labels, data) {
            const ctx = document.getElementById('topChart').getContext('2d');
            if (myChart) myChart.destroy();
            const isDark = document.body.classList.contains('dark-mode');
            const barColor = isDark ? '#00d2ff' : '#0f172a';
            const textColor = isDark ? '#cbd5e1' : '#64748b';

            myChart = new Chart(ctx, {
                type: 'bar',
                data: { labels, datasets: [{ label: 'إجمالي النقاط', data, backgroundColor: ['#FFD700', '#C0C0C0', '#CD7F32', barColor, barColor], borderRadius: 8 }] },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { ticks: { color: textColor } }, x: { ticks: { color: textColor, font: { family: 'Cairo', weight: 'bold' } } } }, plugins: { legend: { display: false } } }
            });
        }

        function loadSettingMax() { }
        function saveMaxConfig() { showToast("✅ تم حفظ الإعدادات بنجاح"); }

// ==================== SECTION ====================
document.addEventListener('DOMContentLoaded', function () {
            if (typeof particlesJS !== 'undefined') {
                particlesJS('particles-js', {
                    "particles": {
                        "number": { "value": 80, "density": { "enable": true, "value_area": 800 } },
                        "color": { "value": ["#00d2ff", "#f5b041", "#ffffff"] },
                        "shape": { "type": "circle" },
                        "opacity": { "value": 0.8, "random": true, "anim": { "enable": true, "speed": 10, "opacity_min": 0.1, "sync": false } },
                        "size": { "value": 2, "random": true },
                        "line_linked": { "enable": true, "distance": 120, "color": "#00d2ff", "opacity": 0.6, "width": 1.5 },
                        "move": { "enable": true, "speed": 5, "direction": "none", "random": true, "out_mode": "out", "bounce": false, "attract": { "enable": true, "rotateX": 600, "rotateY": 1200 } }
                    },
                    "interactivity": {
                        "detect_on": "window",
                        "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": true, "mode": "repulse" }, "resize": true },
                        "modes": { "grab": { "distance": 250, "line_linked": { "opacity": 1 } }, "repulse": { "distance": 200, "duration": 0.4 } }
                    },
                    "retina_detect": true
                });
            }
        });

// ==================== SECTION: COMPATIBLE STUDENT GRADE DASHBOARD ====================

// Global state variables
window.dashboardStudents = [];
window.currentEditingStudent = null;
window.dbSortAsc = true;

// 🎓 Populate lecture range inputs inside studentDashboard on load
function initDbLecOptions() {
    const from = document.getElementById('dbLecFrom');
    const to = document.getElementById('dbLecTo');
    const activeLec = document.getElementById('currentLecNum') ? document.getElementById('currentLecNum').value : "1";
    if (from && !from.value) from.value = activeLec || "1";
    if (to && !to.value) to.value = activeLec || "1";
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDbLecOptions);
} else {
    initDbLecOptions();
}

// 🎓 Intercept gotoView to load dashboard data when appropriate
const originalGotoView = window.gotoView;
window.gotoView = function(page, view) {
    if (view === 'studentDashboard') {
        localStorage.setItem('savedView', 'studentDashboard');
        if (window.location.pathname.endsWith('grades.html')) {
            switchView('studentDashboard');
            toggleSidebar();
            loadDashboardStudents(true); // Load or reload student list
        } else {
            window.location.href = 'grades.html';
        }
    } else {
        if (typeof originalGotoView === 'function') {
            originalGotoView(page, view);
        }
    }
};

// 🎓 Override switchView to handle active nav styling for studentDashboard
const originalSwitchView = window.switchView;
window.switchView = function(viewId) {
    if (typeof originalSwitchView === 'function') {
        originalSwitchView(viewId);
    }
    
    // Manage sidebar active class
    document.querySelectorAll('.sidebar a').forEach(el => el.classList.remove('active'));
    const navItem = document.getElementById(`nav-${viewId}`);
    if (navItem) navItem.classList.add('active');
};

// 🎓 Load trainees from server central sheet
window.loadDashboardStudents = async function(useCache = true, forceRosterOnly = false) {
    if (window.dbActiveTab === 'excel' && !forceRosterOnly) {
        loadExcelDashboardSheet(useCache);
        return;
    }

    if (useCache && window.dashboardStudents && window.dashboardStudents.length > 0) {
        renderDashboardGrid(window.dashboardStudents);
        return;
    }

    const container = document.getElementById('dbStudentsContainer');
    if (container) {
        container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted); font-size: 15px;">⏳ جاري الاتصال بالسيرفر وجلب المتدربين...</div>`;
    }

    try {
        const auth = getAuthParams();
        const api = getEffectiveApi(GRADES_API);
        // Call getTop with task 1 to get a complete student directory
        const res = await fetch(`${api}?action=getTop&fromTask=1&toTask=1${auth}`).then(r => r.json());
        
        let serverStudents = [];
        if (res.status === 'success' && res.scores) {
            serverStudents = res.scores;
        }

        // Get the list of all student codes for the current group from local links map
        let linksMap = JSON.parse(localStorage.getItem('PERSONAL_LINKS_MAP') || '{}');
        const currentGroup = localStorage.getItem('userGroup') || "Group A";
        const groupLetter = currentGroup.replace("Group ", "").trim(); // e.g. "K"
        
        // Filter keys in PERSONAL_LINKS_MAP starting with active group letter
        let groupKeys = Object.keys(linksMap).filter(code => code.startsWith(groupLetter));

        // Build a unified roster with merging
        const mergedStudentsMap = new Map();

        // 1. Add all students from the server roster first
        serverStudents.forEach(s => {
            if (s.id) {
                const cleanCode = s.id.replace("EDUR9", "");
                mergedStudentsMap.set(s.id, {
                    name: s.name || `متدرب (${cleanCode})`,
                    id: s.id,
                    code: cleanCode
                });
            }
        });

        // 2. Add any students from PERSONAL_LINKS_MAP who are missing from the server roster
        groupKeys.forEach(code => {
            const fullId = code.includes("EDUR9") ? code : (code + "EDUR9");
            const cleanCode = code.replace("EDUR9", "");

            if (!mergedStudentsMap.has(fullId)) {
                mergedStudentsMap.set(fullId, {
                    name: `متدرب (${cleanCode})`,
                    id: fullId,
                    code: cleanCode
                });
            }
        });

        // Convert the map back to array
        window.dashboardStudents = Array.from(mergedStudentsMap.values());

        if (window.dashboardStudents.length > 0) {
            sortDashboardStudentsList();
            renderDashboardGrid(window.dashboardStudents);
        } else {
            showToast("❌ فشل تحميل الطلاب من السيرفر", "error");
            if (container) {
                container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #ef4444; font-size: 15px;">❌ فشل الاتصال بالخادم. يرجى التحقق من إعدادات الجروب أو ربط شيت طالب أولاً</div>`;
            }
        }
    } catch (e) {
        console.error("Dashboard Students Load Error:", e);
        showToast("❌ خطأ في الاتصال بالسيرفر", "error");
        if (container) {
            container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #ef4444; font-size: 15px;">❌ خطأ في الشبكة أو رابط الـ API غير صحيح</div>`;
        }
    }
};

// 🎓 Sort students numerically or by custom links order
function sortDashboardStudentsList() {
    const currentGroup = localStorage.getItem('userGroup') || "Group A";
    const customOrder = JSON.parse(localStorage.getItem('PERSONAL_LINKS_ORDER_' + currentGroup) || '[]');
    
    if (customOrder.length > 0) {
        window.dashboardStudents.sort((a, b) => {
            const aIndex = customOrder.indexOf(a.code);
            const bIndex = customOrder.indexOf(b.code);
            
            if (aIndex !== -1 && bIndex !== -1) {
                return window.dbSortAsc ? aIndex - bIndex : bIndex - aIndex;
            }
            if (aIndex !== -1) return window.dbSortAsc ? -1 : 1;
            if (bIndex !== -1) return window.dbSortAsc ? 1 : -1;
            
            const aNum = parseInt(a.code.replace(/\D/g, '')) || 0;
            const bNum = parseInt(b.code.replace(/\D/g, '')) || 0;
            
            if (aNum !== bNum) {
                return window.dbSortAsc ? aNum - bNum : bNum - aNum;
            }
            return window.dbSortAsc ? a.code.localeCompare(b.code) : b.code.localeCompare(a.code);
        });
    } else {
        window.dashboardStudents.sort((a, b) => {
            const aNum = parseInt(a.code.replace(/\D/g, '')) || 0;
            const bNum = parseInt(b.code.replace(/\D/g, '')) || 0;
            
            if (aNum !== bNum) {
                return window.dbSortAsc ? aNum - bNum : bNum - aNum;
            }
            return window.dbSortAsc ? a.code.localeCompare(b.code) : b.code.localeCompare(a.code);
        });
    }
}

// 🎓 Toggle sort order
window.toggleDashboardSort = function() {
    window.dbSortAsc = !window.dbSortAsc;
    const btnText = document.getElementById('dbSortText');
    if (btnText) {
        btnText.innerText = window.dbSortAsc ? "تصاعدي بالكود 🔢" : "تنازلي بالكود 🔢";
    }
    sortDashboardStudentsList();
    filterDashboardStudents();
};

// 🎓 Filter students by search query
window.filterDashboardStudents = function() {
    const query = (document.getElementById('dbSearchInput').value || "").trim().toLowerCase();
    if (!query) {
        renderDashboardGrid(window.dashboardStudents);
        return;
    }
    
    const filtered = window.dashboardStudents.filter(s => {
        return (s.name.toLowerCase().includes(query) || s.code.toLowerCase().includes(query));
    });
    renderDashboardGrid(filtered);
};

// 🎓 Render student cards
function renderDashboardGrid(students) {
    const container = document.getElementById('dbStudentsContainer');
    if (!container) return;
    
    if (students.length === 0) {
        container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted); font-size: 15px;">🔍 لم يتم العثور على متدربين يطابقون البحث</div>`;
        return;
    }
    
    let html = "";
    students.forEach(s => {
        html += `
        <div class="glass-panel dashboard-card" style="padding: 20px; border-radius: 16px; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid rgba(255,255,255,0.05); transition: transform 0.2s, border-color 0.2s; position: relative; overflow: hidden; background: rgba(255,255,255,0.01);">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px; text-align: right;" dir="rtl">
                <div style="width: 42px; height: 42px; background: rgba(0, 210, 255, 0.1); border: 1px solid rgba(0, 210, 255, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; color: var(--electric-blue); font-weight: bold; flex-shrink: 0;">
                    ${s.code.substring(0, 2).toUpperCase()}
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 800; font-size: 14px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${s.name}">${s.name}</div>
                    <div style="font-size: 12px; color: var(--accent); font-weight: bold; margin-top: 2px;">${s.code}</div>
                </div>
            </div>
            
            <button class="btn-submit" onclick="openDashboardGradeModal('${s.id}')" style="margin: 0; padding: 10px; font-size: 12px; width: 100%; border-radius: 8px; background: rgba(0, 210, 255, 0.1); border: 1px solid rgba(0, 210, 255, 0.3); color: var(--electric-blue); font-weight: bold; transition: all 0.2s ease; cursor: pointer;">
                رصد تقييم المتدرب ✍️
            </button>
        </div>
        `;
    });
    
    container.innerHTML = html;
}

// 🎓 Open grade editor modal
window.openDashboardGradeModal = async function(id) {
    const student = window.dashboardStudents.find(s => s.id === id);
    if (!student) {
        showToast("❌ لم يتم العثور على المتدرب", "error");
        return;
    }
    const { name, code } = student;
    window.currentEditingStudent = { id, name, code };
    
    const lec = document.getElementById('dbLecFrom').value;
    document.getElementById('dbModalStudentName').innerText = `${name} (${code})`;
    document.getElementById('dbModalLecNum').innerText = `محاضرة ${lec}`;
    
    // Clear styling on toggle buttons
    document.getElementById('dbModalAttBtn').classList.remove('active-att');
    document.getElementById('dbModalFeedBtn').classList.remove('active-feed');
    document.getElementById('dbModalAttitBtn').classList.remove('active-attit');
    
    // Show Modal
    const modal = document.getElementById('dbGradeModal');
    modal.style.display = 'flex';
    
    setModalInputsLoading(true);
    
    try {
        const auth = getAuthParams();
        const api = getEffectiveApi(GRADES_API);
        
        // Fetch current grades for this specific lecture L
        const [rAttend, rTasks, rQuizzes, rExtra] = await Promise.all([
            fetch(`${api}?action=getTop&fromLec=${lec}&toLec=${lec}&weight=15${auth}`).then(r => r.json()).catch(e => ({})),
            fetch(`${api}?action=getTop&fromTask=${lec}&toTask=${lec}${auth}`).then(r => r.json()).catch(e => ({})),
            fetch(`${api}?action=getTop&fromQuiz=${lec}&toQuiz=${lec}${auth}`).then(r => r.json()).catch(e => ({})),
            fetch(`${api}?action=getTop&extraOnly=1&fromLec=${lec}&toLec=${lec}${auth}`).then(r => r.json()).catch(e => ({}))
        ]);
        
        const findScore = (res) => (res && res.scores || []).find(x => x.id === id);
        const sAttend = findScore(rAttend);
        const sTask = findScore(rTasks);
        const sQuiz = findScore(rQuizzes);
        const sExtra = findScore(rExtra);
        
        const attendVal = sAttend ? parseFloat(sAttend.total) : 0;
        const taskVal = sTask && sTask.total !== "" ? parseFloat(sTask.total) : "";
        const quizVal = sQuiz && sQuiz.total !== "" ? parseFloat(sQuiz.total) : "";
        const extraVal = sExtra ? parseFloat(sExtra.total) : 0;
        
        // Attendance
        if (attendVal >= 15) document.getElementById('dbModalAttBtn').classList.add('active-att');
        
        // Task
        document.getElementById('dbModalValTask').value = taskVal;
        
        // Quiz
        document.getElementById('dbModalValQuiz').value = quizVal;
        
        // Extra points decomposition
        document.getElementById('dbModalFeedBtn').classList.remove('active-feed');
        document.getElementById('dbModalAttitBtn').classList.remove('active-attit');
        document.getElementById('dbModalValBonus').value = "";
        
        if (extraVal === 5) {
            document.getElementById('dbModalFeedBtn').classList.add('active-feed');
        } else if (extraVal === 10) {
            document.getElementById('dbModalFeedBtn').classList.add('active-feed');
            document.getElementById('dbModalAttitBtn').classList.add('active-attit');
        } else if (extraVal > 0) {
            let rem = extraVal;
            if (rem >= 5) { document.getElementById('dbModalFeedBtn').classList.add('active-feed'); rem -= 5; }
            if (rem >= 5) { document.getElementById('dbModalAttitBtn').classList.add('active-attit'); rem -= 5; }
            if (rem > 0) { document.getElementById('dbModalValBonus').value = rem; }
        }
        
        setModalInputsLoading(false);
    } catch (e) {
        console.error("Fetch individual student grade error:", e);
        setModalInputsLoading(false);
    }
};

function setModalInputsLoading(loading) {
    const inputs = ['dbModalValBonus', 'dbModalValTask', 'dbModalValQuiz'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = loading;
    });
    
    const btns = ['dbModalAttBtn', 'dbModalFeedBtn', 'dbModalAttitBtn'];
    btns.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (loading) el.style.pointerEvents = 'none';
            else el.style.pointerEvents = 'auto';
        }
    });
    
    const taskInput = document.getElementById('dbModalValTask');
    if (loading) {
        taskInput.placeholder = "جاري القراءة...";
    } else {
        taskInput.placeholder = "من 70";
    }
}

// 🎓 Save grades using legacy transactional calls
window.saveDashboardStudentGrade = async function() {
    if (!window.currentEditingStudent) return;
    
    const student = window.currentEditingStudent;
    const code = student.id;
    const lec = document.getElementById('dbLecFrom').value;
    const auth = getAuthParams();
    const centralApi = getEffectiveApi(GRADES_API);
    let promises = [];
    let taskName = "TASK " + lec;
    
    showLoader(true, "جاري حفظ ومزامنة التقييم... 💾");
    
    const attActive = document.getElementById('dbModalAttBtn').classList.contains('active-att');
    if (attActive) {
        promises.push(fetch(`${centralApi}?action=scan&qrCode=${code}&lectureNum=${lec}&weight=15${auth}`).then(r => r.json()).catch(e => ({})));
    }
    
    let taskValRaw = document.getElementById('dbModalValTask').value.trim();
    let quizValRaw = document.getElementById('dbModalValQuiz').value.trim();
    
    let isTaskEmpty = (taskValRaw === "");
    let isQuizEmpty = (quizValRaw === "");
    
    if (isTaskEmpty || isQuizEmpty) {
        let confirmZero = await showCustomConfirm("هل تريد وضع مجموع 0 درجات لهذا المتدرب ؟", "تأكيد رصد الدرجة");
        if (!confirmZero) {
            showLoader(false);
            return;
        }
        if (isTaskEmpty) taskValRaw = "0";
        if (isQuizEmpty) quizValRaw = "0";
    }
    
    let taskVal = convertNumerals(taskValRaw);
    if (taskVal !== "") {
        promises.push(fetch(`${centralApi}?action=saveGrade&qrCode=${code}&taskNum=${lec}&val=${taskVal}${auth}`).then(r => r.json()).catch(e => ({})));
    }
    
    let quizVal = convertNumerals(quizValRaw);
    if (quizVal !== "") {
        promises.push(fetch(`${centralApi}?action=saveQuiz&qrCode=${code}&quizNum=${lec}&val=${quizVal}${auth}`).then(r => r.json()).catch(e => ({})));
    }
    
    let f = document.getElementById('dbModalFeedBtn').classList.contains('active-feed') ? 1 : 0;
    let a = document.getElementById('dbModalAttitBtn').classList.contains('active-attit') ? 5 : 0;
    let b = convertNumerals(document.getElementById('dbModalValBonus').value) || 0;
    
    promises.push(fetch(`${centralApi}?action=saveExtra&qrCode=${code}&lectureNum=${lec}&feedback=${f}&attitude=${a}&bonus=${b}${auth}`).then(r => r.json()).catch(e => ({})));
    
    // === SYNC to Individual Student Sheet ===
    let personalApi = getPersonalApi(code);
    if (personalApi) {
        if (attActive) {
            promises.push(
                fetch(`${personalApi}?action=update&qrCode=${code}&taskName=${encodeURIComponent(taskName)}&category=${encodeURIComponent('attendance .15')}&val=15`)
                        .then(r => r.json()).catch(e => ({}))
                );
        }
        if (taskVal !== "") {
            promises.push(
                fetch(`${personalApi}?action=update&qrCode=${code}&taskName=${encodeURIComponent(taskName)}&category=${encodeURIComponent('Main task. 70')}&val=${taskVal}`)
                    .then(r => r.json()).catch(e => ({}))
            );
        }
        if (quizVal !== "") {
            promises.push(
                fetch(`${personalApi}?action=update&qrCode=${code}&taskName=${encodeURIComponent(taskName)}&category=${encodeURIComponent('online quize 25')}&val=${quizVal}`)
                    .then(r => r.json()).catch(e => ({}))
            );
        }
        let combinedAtt = 0;
        if (f) combinedAtt += 5;
        if (a) combinedAtt += 5;
        promises.push(
            fetch(`${personalApi}?action=update&qrCode=${code}&taskName=${encodeURIComponent(taskName)}&category=${encodeURIComponent('attitude .10')}&val=${combinedAtt}`)
                .then(r => r.json()).catch(e => ({}))
        );
        promises.push(
            fetch(`${personalApi}?action=update&qrCode=${code}&taskName=${encodeURIComponent(taskName)}&category=${encodeURIComponent('bonus')}&val=${b}`)
                .then(r => r.json()).catch(e => ({}))
        );
    }
    
    if (promises.length === 0) {
        showLoader(false);
        playBeep('error');
        return showToast("⚠️ لم يتم إدخال أي تقييم لحفظه!", "error");
    }
    
    try {
        await Promise.all(promises);
        showLoader(false);
        playBeep('success');
        showToast(`✅ تم حفظ تقييم ${student.name} للمحاضرة ${lec} بنجاح!`, "success");
        closeDashboardGradeModal();
    } catch (e) {
        console.error("Save Dashboard Grade Error:", e);
        showLoader(false);
        showToast("❌ حدث خطأ في حفظ بعض التقييمات", "error");
        playBeep('error');
    }
};

window.closeDashboardGradeModal = function() {
    const modal = document.getElementById('dbGradeModal');
    if (modal) modal.style.display = 'none';
    window.currentEditingStudent = null;
};

window.onDashboardLectureChange = function() {
    const from = document.getElementById('dbLecFrom');
    const targetLecSelect = document.getElementById('currentLecNum');
    if (from && targetLecSelect) {
        targetLecSelect.value = from.value;
    }
    if (window.dbActiveTab === 'excel') {
        loadExcelDashboardSheet(true);
    }
};

// ==================== SECTION: EXCEL-STYLE INTERACTIVE SPREADSHEET DASHBOARD ====================

window.dbActiveTab = 'cards';
window.excelGradesMap = {};

window.switchDashboardTab = function(tabId) {
    window.dbActiveTab = tabId;
    const btnCards = document.getElementById('btnViewCards');
    const btnExcel = document.getElementById('btnViewExcel');
    const containerCards = document.getElementById('dbStudentsContainer');
    const containerExcel = document.getElementById('dbExcelContainer');

    if (tabId === 'cards') {
        if (containerCards) containerCards.style.display = 'grid';
        if (containerExcel) containerExcel.style.display = 'none';
        
        if (btnCards) {
            btnCards.style.background = 'var(--electric-blue)';
            btnCards.style.color = '#000';
            btnCards.style.border = 'none';
        }
        if (btnExcel) {
            btnExcel.style.background = 'rgba(255, 255, 255, 0.03)';
            btnExcel.style.color = '#fff';
            btnExcel.style.border = '1px solid rgba(255, 255, 255, 0.08)';
        }
        renderDashboardGrid(window.dashboardStudents);
    } else if (tabId === 'excel') {
        if (containerCards) containerCards.style.display = 'none';
        if (containerExcel) containerExcel.style.display = 'block';

        if (btnExcel) {
            btnExcel.style.background = 'var(--electric-blue)';
            btnExcel.style.color = '#000';
            btnExcel.style.border = 'none';
        }
        if (btnCards) {
            btnCards.style.background = 'rgba(255, 255, 255, 0.03)';
            btnCards.style.color = '#fff';
            btnCards.style.border = '1px solid rgba(255, 255, 255, 0.08)';
        }
        loadExcelDashboardSheet(true);
    }
};

window.loadExcelDashboardSheet = async function(useCache = true) {
    const container = document.getElementById('excelRowsContainer');
    if (!container) return;

    const lec = document.getElementById('dbLecFrom').value || "1";
    
    const badge = document.getElementById('excelLecBadge');
    if (badge) badge.innerText = `المحاضرة النشطة: ${lec}`;

    // Ensure roster is loaded
    if (!window.dashboardStudents || window.dashboardStudents.length === 0) {
        container.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 40px; color: var(--text-muted); font-size: 14px;">⏳ جاري جلب قائمة المتدربين لتجهيز الشيت...</td></tr>`;
        await loadDashboardStudents(true, true);
    }

    container.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 40px; color: var(--text-muted); font-size: 14px;">⏳ جاري تحميل درجات شيت الإكسيل للمحاضرة ${lec} من السيرفر المركزي...</td></tr>`;

    try {
        const auth = getAuthParams();
        const api = getEffectiveApi(GRADES_API);

        // Fetch all 4 categories for the selected lecture
        const [rAttend, rTasks, rQuizzes, rExtra] = await Promise.all([
            fetch(`${api}?action=getTop&fromLec=${lec}&toLec=${lec}&weight=15${auth}`).then(r => r.json()).catch(e => ({})),
            fetch(`${api}?action=getTop&fromTask=${lec}&toTask=${lec}${auth}`).then(r => r.json()).catch(e => ({})),
            fetch(`${api}?action=getTop&fromQuiz=${lec}&toQuiz=${lec}${auth}`).then(r => r.json()).catch(e => ({})),
            fetch(`${api}?action=getTop&extraOnly=1&fromLec=${lec}&toLec=${lec}${auth}`).then(r => r.json()).catch(e => ({}))
        ]);

        const gradesMap = {};
        // Default grades for everyone
        window.dashboardStudents.forEach(s => {
            gradesMap[s.id] = { attend: 0, task: "", quiz: "", feedback: 0, attitude: 0, bonus: 0 };
        });

        // Attendance (15)
        if (rAttend && rAttend.scores) {
            rAttend.scores.forEach(s => {
                if (gradesMap[s.id]) gradesMap[s.id].attend = parseFloat(s.total) >= 15 ? 15 : 0;
            });
        }
        // Task (70)
        if (rTasks && rTasks.scores) {
            rTasks.scores.forEach(s => {
                if (gradesMap[s.id]) gradesMap[s.id].task = s.total !== "" ? parseFloat(s.total) : "";
            });
        }
        // Quiz (25)
        if (rQuizzes && rQuizzes.scores) {
            rQuizzes.scores.forEach(s => {
                if (gradesMap[s.id]) gradesMap[s.id].quiz = s.total !== "" ? parseFloat(s.total) : "";
            });
        }
        // Extra (Feedback, Attitude, Bonus)
        if (rExtra && rExtra.scores) {
            rExtra.scores.forEach(s => {
                const extraVal = parseFloat(s.total) || 0;
                if (gradesMap[s.id]) {
                    let rem = extraVal;
                    if (rem >= 5) { gradesMap[s.id].feedback = 5; rem -= 5; }
                    if (rem >= 5) { gradesMap[s.id].attitude = 5; rem -= 5; }
                    if (rem > 0) { gradesMap[s.id].bonus = rem; }
                }
            });
        }

        window.excelGradesMap = gradesMap;
        renderExcelGrid();
        calculateSubmitPct();
    } catch (e) {
        console.error("Load Excel Dashboard Grades Error:", e);
        showToast("❌ خطأ في تحميل درجات شيت الإكسيل", "error");
        container.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 40px; color: #ef4444; font-size: 14px;">❌ فشل الاتصال بالسيرفر. يرجى التحقق من الشبكة وإعادة المحاولة.</td></tr>`;
    }
};

window.calculateSubmitPct = async function() {
    const pctEl = document.getElementById('excelSubmitPct');
    if (!pctEl) return;

    const fromLec = document.getElementById('dbLecFrom').value || "1";
    const toLec = document.getElementById('dbLecTo').value || "1";

    try {
        const auth = getAuthParams();
        const api = getEffectiveApi(GRADES_API);

        const [rAttend, rTasks, rQuizzes, rExtra] = await Promise.all([
            fetch(`${api}?action=getTop&fromLec=${fromLec}&toLec=${toLec}&weight=15${auth}`).then(r => r.json()).catch(e => ({})),
            fetch(`${api}?action=getTop&fromTask=${fromLec}&toTask=${toLec}${auth}`).then(r => r.json()).catch(e => ({})),
            fetch(`${api}?action=getTop&fromQuiz=${fromLec}&toQuiz=${toLec}${auth}`).then(r => r.json()).catch(e => ({})),
            fetch(`${api}?action=getTop&extraOnly=1&fromLec=${fromLec}&toLec=${toLec}${auth}`).then(r => r.json()).catch(e => ({}))
        ]);

        const total = window.dashboardStudents ? window.dashboardStudents.length : 0;
        if (total === 0) {
            pctEl.innerHTML = '👥 0 متدرب';
            return;
        }

        const submitted = new Set();
        if (rAttend && rAttend.scores) rAttend.scores.forEach(s => { if (parseFloat(s.total) > 0) submitted.add(s.id); });
        if (rTasks && rTasks.scores) rTasks.scores.forEach(s => { if (parseFloat(s.total) > 0) submitted.add(s.id); });
        if (rQuizzes && rQuizzes.scores) rQuizzes.scores.forEach(s => { if (parseFloat(s.total) > 0) submitted.add(s.id); });
        if (rExtra && rExtra.scores) rExtra.scores.forEach(s => { if (parseFloat(s.total) > 0) submitted.add(s.id); });

        const count = submitted.size;
        const pct = Math.round((count / total) * 100);
        const color = pct >= 80 ? '#10b981' : pct >= 50 ? 'var(--accent)' : '#ef4444';
        const rangeText = fromLec === toLec ? `المحاضرة ${fromLec}` : `المحاضرات ${fromLec}-${toLec}`;

        pctEl.innerHTML = `📊 تسليم ${rangeText}: <span style="font-weight:900;font-size:16px;color:${color};">${pct}%</span> (${count}/${total})`;
    } catch (e) {
        console.error("Submit % error:", e);
        pctEl.innerHTML = '❌ خطأ';
    }
};

window.renderExcelGrid = function() {
    const container = document.getElementById('excelRowsContainer');
    if (!container) return;

    if (!window.dashboardStudents || window.dashboardStudents.length === 0) {
        container.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 40px; color: var(--text-muted); font-size: 14px;">🔍 لا يوجد طلاب مسجلين في الجروب حالياً</td></tr>`;
        return;
    }

    let html = "";
    window.dashboardStudents.forEach(s => {
        const g = window.excelGradesMap[s.id] || { attend: 0, task: "", quiz: "", feedback: 0, attitude: 0, bonus: 0 };
        
        const attendChecked = g.attend >= 15 ? "checked" : "";
        const feedbackChecked = g.feedback >= 5 ? "checked" : "";
        const attitudeChecked = g.attitude >= 5 ? "checked" : "";
        
        const sum = (g.attend >= 15 ? 15 : 0) + (parseFloat(g.task) || 0) + (parseFloat(g.quiz) || 0) + (g.feedback >= 5 ? 5 : 0) + (g.attitude >= 5 ? 5 : 0) + (parseFloat(g.bonus) || 0);

        // Apply distinct sum colors based on performance
        let sumBg = 'rgba(0, 210, 255, 0.08)';
        let sumColor = 'var(--electric-blue)';
        let sumBorder = 'rgba(0, 210, 255, 0.2)';
        if (sum >= 115) {
            sumBg = 'rgba(16, 185, 129, 0.1)';
            sumColor = '#10b981';
            sumBorder = 'rgba(16, 185, 129, 0.3)';
        } else if (sum >= 70) {
            sumBg = 'rgba(245, 176, 65, 0.1)';
            sumColor = 'var(--accent)';
            sumBorder = 'rgba(245, 176, 65, 0.3)';
        }

        html += `
        <tr id="excel-row-${s.id}" style="border-bottom: 1px solid rgba(255, 255, 255, 0.05); transition: background 0.2s;" class="excel-tr">
            <td style="padding: 10px 8px; text-align: center; font-weight: bold; color: var(--accent); font-family: monospace; font-size: 13px;">${s.code}</td>
            <td style="padding: 10px 8px; font-weight: 800; color: #fff; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 250px;" title="${s.name}">${s.name}</td>
            
            <!-- Attendance (15) -->
            <td style="padding: 10px 8px; text-align: center;">
                <input type="checkbox" ${attendChecked} id="excel-att-${s.id}" onchange="recalculateExcelSum('${s.id}')" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--electric-blue);">
            </td>
            
            <!-- Task (70) -->
            <td style="padding: 10px 8px; text-align: center;">
                <input type="number" value="${g.task}" id="excel-task-${s.id}" oninput="recalculateExcelSum('${s.id}')" style="width: 70px; text-align: center; border-radius: 6px; padding: 6px 4px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.4); color: #fff; font-weight: bold; font-size: 13px; outline: none; transition: border-color 0.2s;" min="0" max="70" placeholder="0">
            </td>
            
            <!-- Quiz (25) -->
            <td style="padding: 10px 8px; text-align: center;">
                <input type="number" value="${g.quiz}" id="excel-quiz-${s.id}" oninput="recalculateExcelSum('${s.id}')" style="width: 70px; text-align: center; border-radius: 6px; padding: 6px 4px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.4); color: #fff; font-weight: bold; font-size: 13px; outline: none; transition: border-color 0.2s;" min="0" max="25" placeholder="0">
            </td>
            
            <!-- Feedback (5) -->
            <td style="padding: 10px 8px; text-align: center;">
                <input type="checkbox" ${feedbackChecked} id="excel-feed-${s.id}" onchange="recalculateExcelSum('${s.id}')" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--electric-blue);">
            </td>
            
            <!-- Attitude (5) -->
            <td style="padding: 10px 8px; text-align: center;">
                <input type="checkbox" ${attitudeChecked} id="excel-attit-${s.id}" onchange="recalculateExcelSum('${s.id}')" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--electric-blue);">
            </td>
            
            <!-- Bonus -->
            <td style="padding: 10px 8px; text-align: center;">
                <input type="number" value="${g.bonus || ''}" id="excel-bonus-${s.id}" oninput="recalculateExcelSum('${s.id}')" style="width: 65px; text-align: center; border-radius: 6px; padding: 6px 4px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.4); color: #fff; font-weight: bold; font-size: 13px; outline: none; transition: border-color 0.2s;" placeholder="0">
            </td>
            
            <!-- Sum -->
            <td style="padding: 10px 8px; text-align: center;">
                <span id="excel-sum-${s.id}" style="font-weight: 900; font-size: 12px; padding: 4px 10px; border-radius: 20px; background: ${sumBg}; color: ${sumColor}; border: 1px solid ${sumBorder}; font-family: monospace;">${sum}</span>
            </td>
            
            <!-- Actions -->
            <td style="padding: 10px 8px; text-align: center;">
                <button id="excel-save-btn-${s.id}" onclick="saveExcelRow('${s.id}')" style="background: rgba(0, 210, 255, 0.15); border: 1px solid rgba(0, 210, 255, 0.3); color: var(--electric-blue); padding: 6px 12px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 11px; transition: all 0.2s ease; width: 85px;">حفظ 💾</button>
            </td>
        </tr>
        `;
    });
    container.innerHTML = html;
    
    if (!document.getElementById('excel-row-styles')) {
        const style = document.createElement('style');
        style.id = 'excel-row-styles';
        style.innerHTML = `
            .excel-tr:hover { background: rgba(255,255,255,0.03) !important; }
            .excel-tr input[type="number"]:focus { border-color: var(--electric-blue) !important; box-shadow: 0 0 8px rgba(0, 210, 255, 0.2); }
            .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        `;
        document.head.appendChild(style);
    }
};

window.recalculateExcelSum = function(id) {
    const att = document.getElementById(`excel-att-${id}`).checked ? 15 : 0;
    const task = parseFloat(document.getElementById(`excel-task-${id}`).value) || 0;
    const quiz = parseFloat(document.getElementById(`excel-quiz-${id}`).value) || 0;
    const feed = document.getElementById(`excel-feed-${id}`).checked ? 5 : 0;
    const attit = document.getElementById(`excel-attit-${id}`).checked ? 5 : 0;
    const bonus = parseFloat(document.getElementById(`excel-bonus-${id}`).value) || 0;

    const sum = att + task + quiz + feed + attit + bonus;
    const sumEl = document.getElementById(`excel-sum-${id}`);
    if (sumEl) {
        sumEl.innerText = sum;
        if (sum >= 115) {
            sumEl.style.background = 'rgba(16, 185, 129, 0.1)';
            sumEl.style.color = '#10b981';
            sumEl.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        } else if (sum >= 70) {
            sumEl.style.background = 'rgba(245, 176, 65, 0.1)';
            sumEl.style.color = 'var(--accent)';
            sumEl.style.borderColor = 'rgba(245, 176, 65, 0.3)';
        } else {
            sumEl.style.background = 'rgba(0, 210, 255, 0.08)';
            sumEl.style.color = 'var(--electric-blue)';
            sumEl.style.borderColor = 'rgba(0, 210, 255, 0.2)';
        }
    }
    
    if (window.excelGradesMap && window.excelGradesMap[id]) {
        window.excelGradesMap[id] = {
            attend: att,
            task: document.getElementById(`excel-task-${id}`).value,
            quiz: document.getElementById(`excel-quiz-${id}`).value,
            feedback: feed,
            attitude: attit,
            bonus: bonus
        };
    }
};

window.saveExcelRow = async function(id) {
    const student = window.dashboardStudents.find(s => s.id === id);
    if (!student) return showToast("❌ المتدرب غير موجود", "error");

    const btn = document.getElementById(`excel-save-btn-${id}`);
    if (!btn || btn.disabled) return;

    const code = id;
    const lec = document.getElementById('dbLecFrom').value || "1";
    const auth = getAuthParams();
    const centralApi = getEffectiveApi(GRADES_API);
    let promises = [];
    let taskName = "TASK " + lec;

    // Extract DOM inputs
    const attActive = document.getElementById(`excel-att-${id}`).checked;
    let taskValRaw = document.getElementById(`excel-task-${id}`).value.trim();
    let quizValRaw = document.getElementById(`excel-quiz-${id}`).value.trim();
    const f = document.getElementById(`excel-feed-${id}`).checked ? 1 : 0;
    const a = document.getElementById(`excel-attit-${id}`).checked ? 5 : 0;
    let bVal = document.getElementById(`excel-bonus-${id}`).value.trim();
    const b = convertNumerals(bVal) || 0;

    let isTaskEmpty = (taskValRaw === "");
    let isQuizEmpty = (quizValRaw === "");

    if (isTaskEmpty || isQuizEmpty) {
        let confirmZero = await showCustomConfirm(`هل تريد رصد مجموع 0 درجات للمتدرب ${student.name}؟`, "تأكيد رصد الدرجة");
        if (!confirmZero) return;
        if (isTaskEmpty) { taskValRaw = "0"; document.getElementById(`excel-task-${id}`).value = "0"; }
        if (isQuizEmpty) { quizValRaw = "0"; document.getElementById(`excel-quiz-${id}`).value = "0"; }
    }

    // Set Saving Animation
    btn.disabled = true;
    btn.innerText = "جاري الحفظ⏳";
    btn.style.background = 'rgba(245, 176, 65, 0.15)';
    btn.style.color = 'var(--accent)';
    btn.style.borderColor = 'rgba(245, 176, 65, 0.3)';

    const rowInputs = [
        document.getElementById(`excel-att-${id}`),
        document.getElementById(`excel-task-${id}`),
        document.getElementById(`excel-quiz-${id}`),
        document.getElementById(`excel-feed-${id}`),
        document.getElementById(`excel-attit-${id}`),
        document.getElementById(`excel-bonus-${id}`)
    ];
    rowInputs.forEach(inp => { if (inp) inp.disabled = true; });

    // 1. Save Attendance Scan
    if (attActive) {
        promises.push(fetch(`${centralApi}?action=scan&qrCode=${code}&lectureNum=${lec}&weight=15${auth}`).then(r => r.json()).catch(e => ({})));
    } else {
        promises.push(fetch(`${centralApi}?action=deleteAttendance&qrCode=${code}&lectureNum=${lec}${auth}`).then(r => r.json()).catch(e => ({})));
    }
    
    // 2. Save Task
    let taskVal = convertNumerals(taskValRaw);
    if (taskVal !== "") {
        promises.push(fetch(`${centralApi}?action=saveGrade&qrCode=${code}&taskNum=${lec}&val=${taskVal}${auth}`).then(r => r.json()).catch(e => ({})));
    }

    // 3. Save Quiz
    let quizVal = convertNumerals(quizValRaw);
    if (quizVal !== "") {
        promises.push(fetch(`${centralApi}?action=saveQuiz&qrCode=${code}&quizNum=${lec}&val=${quizVal}${auth}`).then(r => r.json()).catch(e => ({})));
    }

    // 4. Save Extras (Feedback, Attitude, Bonus)
    promises.push(fetch(`${centralApi}?action=saveExtra&qrCode=${code}&lectureNum=${lec}&feedback=${f}&attitude=${a}&bonus=${b}${auth}`).then(r => r.json()).catch(e => ({})));

    // === SYNC to Personal Sheet ===
    let personalApi = getPersonalApi(code);
    if (personalApi) {
        promises.push(fetch(`${personalApi}?action=update&qrCode=${code}&taskName=${encodeURIComponent(taskName)}&category=${encodeURIComponent('attendance .15')}&val=${attActive ? 15 : 0}`).then(r => r.json()).catch(e => ({})));
        if (taskVal !== "") {
            promises.push(fetch(`${personalApi}?action=update&qrCode=${code}&taskName=${encodeURIComponent(taskName)}&category=${encodeURIComponent('Main task. 70')}&val=${taskVal}`).then(r => r.json()).catch(e => ({})));
        }
        if (quizVal !== "") {
            promises.push(fetch(`${personalApi}?action=update&qrCode=${code}&taskName=${encodeURIComponent(taskName)}&category=${encodeURIComponent('online quize 25')}&val=${quizVal}`).then(r => r.json()).catch(e => ({})));
        }
        let combinedAtt = 0;
        if (f) combinedAtt += 5;
        if (a) combinedAtt += 5;
        promises.push(fetch(`${personalApi}?action=update&qrCode=${code}&taskName=${encodeURIComponent(taskName)}&category=${encodeURIComponent('attitude .10')}&val=${combinedAtt}`).then(r => r.json()).catch(e => ({})));
        promises.push(fetch(`${personalApi}?action=update&qrCode=${code}&taskName=${encodeURIComponent(taskName)}&category=${encodeURIComponent('bonus')}&val=${b}`).then(r => r.json()).catch(e => ({})));
    }

    if (promises.length === 0) {
        btn.disabled = false;
        btn.innerText = "حفظ 💾";
        btn.style.background = '';
        btn.style.color = '';
        btn.style.borderColor = '';
        rowInputs.forEach(inp => { if (inp) inp.disabled = false; });
        playBeep('error');
        return showToast("⚠️ لم يتم إدخال أي تقييم لحفظه!", "error");
    }

    try {
        await Promise.all(promises);
        
        playBeep('success');
        btn.innerText = "تم الحفظ ✅";
        btn.style.background = 'rgba(16, 185, 129, 0.15)';
        btn.style.color = '#10b981';
        btn.style.borderColor = 'rgba(16, 185, 129, 0.3)';

        rowInputs.forEach(inp => { if (inp) inp.disabled = false; });
        showToast(`✅ تم حفظ ومزامنة تقييم ${student.name} للمحاضرة ${lec}!`, "success");

        setTimeout(() => {
            btn.disabled = false;
            btn.innerText = "حفظ 💾";
            btn.style.background = '';
            btn.style.color = '';
            btn.style.borderColor = '';
        }, 3000);

    } catch (e) {
        console.error("Save Excel Row Grade Error:", e);
        playBeep('error');
        btn.disabled = false;
        btn.innerText = "فشل ❌";
        btn.style.background = 'rgba(239, 68, 68, 0.15)';
        btn.style.color = '#f87171';
        btn.style.borderColor = 'rgba(239, 68, 68, 0.3)';
        rowInputs.forEach(inp => { if (inp) inp.disabled = false; });
        showToast("❌ حدث خطأ في حفظ بعض التقييمات", "error");

        setTimeout(() => {
            btn.innerText = "حفظ 💾";
            btn.style.background = '';
            btn.style.color = '';
            btn.style.borderColor = '';
        }, 3000);
    }
};


