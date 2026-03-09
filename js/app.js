/**
 * App.js — Main application logic
 * Handles: dropdown, form modal, confirmation, Firestore CRUD, real-time listener
 */

// ===== DOM ELEMENTS =====
const actionsBtn = document.getElementById('actionsBtn');
const dropdownMenu = document.getElementById('dropdownMenu');
const newRiskBtn = document.getElementById('newRiskBtn');
const riskFormModal = document.getElementById('riskFormModal');
const closeFormModal = document.getElementById('closeFormModal');
const cancelFormBtn = document.getElementById('cancelFormBtn');
const riskForm = document.getElementById('riskForm');
const confirmModal = document.getElementById('confirmModal');
const confirmYes = document.getElementById('confirmYes');
const confirmNo = document.getElementById('confirmNo');
const riskTableBody = document.getElementById('riskTableBody');
const riskTable = document.getElementById('riskTable');
const emptyMsg = document.getElementById('emptyMsg');

// Form fields
const riskIdInput = document.getElementById('riskId');
const riskDescInput = document.getElementById('riskDesc');
const severityInput = document.getElementById('severityLevel');
const groupsInput = document.getElementById('groups');

// Error spans
const riskIdError = document.getElementById('riskIdError');
const riskDescError = document.getElementById('riskDescError');
const severityError = document.getElementById('severityError');
const groupsError = document.getElementById('groupsError');

// Save button for hover tracking
const saveBtn = riskForm.querySelector('.btn-save');

// Temp storage for form data before confirmation
let pendingRiskData = null;

// Delete modal elements
const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const deleteYes = document.getElementById('deleteYes');
const deleteNo = document.getElementById('deleteNo');

// Temp storage for doc ID to delete
let pendingDeleteDocId = null;

// ===== 1. ACTIONS DROPDOWN =====
actionsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('show');
});

// Close dropdown when clicking outside
document.addEventListener('click', () => {
    dropdownMenu.classList.remove('show');
});

// ===== 2. NEW RISK — OPEN FORM MODAL =====
newRiskBtn.addEventListener('click', () => {
    dropdownMenu.classList.remove('show');
    openFormModal();
});

function openFormModal() {
    riskForm.reset();
    clearErrors();
    riskFormModal.classList.add('active');
    uxTracker.startTracking(); // Start UX tracking
}

function closeFormModalFn() {
    riskFormModal.classList.remove('active');
    uxTracker.cancelTracking(); // Cancel & reset all metrics to 0 (Cross / Cancel clicked)
}

closeFormModal.addEventListener('click', closeFormModalFn);
cancelFormBtn.addEventListener('click', closeFormModalFn);

// Close form modal on overlay click
riskFormModal.addEventListener('click', (e) => {
    if (e.target === riskFormModal) closeFormModalFn();
});

// ===== 3. HOVER TRACKING ON SAVE BUTTON =====
saveBtn.addEventListener('mouseenter', () => {
    uxTracker.startHoverTimer();
});

saveBtn.addEventListener('mouseleave', () => {
    uxTracker.stopHoverTimer();
});

// ===== 4. FORM VALIDATION & SUBMIT =====
riskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    uxTracker.stopHoverTimer(); // Stop hover if clicking save

    if (!validateForm()) return;

    // Store form data and show confirmation
    pendingRiskData = {
        riskId: riskIdInput.value.trim(),
        riskDescription: riskDescInput.value.trim(),
        severityLevel: severityInput.value,
        groups: groupsInput.value.trim(),
        createdAt: new Date().toISOString()
    };

    // Show confirmation popup
    confirmModal.classList.add('active');
});

function validateForm() {
    let isValid = true;
    clearErrors();

    if (!riskIdInput.value.trim()) {
        showError(riskIdInput, riskIdError, 'Risk ID is required');
        isValid = false;
    }

    if (!riskDescInput.value.trim()) {
        showError(riskDescInput, riskDescError, 'Risk Description is required');
        isValid = false;
    }

    if (!severityInput.value) {
        showError(severityInput, severityError, 'Please select a Severity Level');
        isValid = false;
    }

    if (!groupsInput.value.trim()) {
        showError(groupsInput, groupsError, 'Groups is required');
        isValid = false;
    }

    if (!isValid) {
        uxTracker.recordFormError(); // Track validation failure
    }

    return isValid;
}

function showError(input, errorSpan, message) {
    input.classList.add('error');
    errorSpan.textContent = message;
}

function clearErrors() {
    [riskIdInput, riskDescInput, severityInput, groupsInput].forEach(el => el.classList.remove('error'));
    [riskIdError, riskDescError, severityError, groupsError].forEach(el => el.textContent = '');
}

// ===== 5. CONFIRMATION POPUP =====
confirmNo.addEventListener('click', () => {
    confirmModal.classList.remove('active');
    pendingRiskData = null;
});

confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) {
        confirmModal.classList.remove('active');
        pendingRiskData = null;
    }
});

confirmYes.addEventListener('click', async () => {
    confirmModal.classList.remove('active');

    if (!pendingRiskData) return;

    // Collect final UX metrics
    const uxMetrics = uxTracker.stopTracking();

    try {
        // Generate a unique user session ID (or reuse from localStorage)
        let userId = localStorage.getItem('ux_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
            localStorage.setItem('ux_user_id', userId);
        }

        // Save risk data + UX metrics to Firestore
        // Structure: users/{userId}/risks/{autoId}
        await db.collection('users').doc(userId).collection('risks').add({
            ...pendingRiskData,
            uxMetrics: {
                task_time: uxMetrics.task_time,
                click_count: uxMetrics.click_count,
                rage_clicks: uxMetrics.rage_clicks,
                backtracks: uxMetrics.backtracks,
                form_errors: uxMetrics.form_errors,
                hover_time: uxMetrics.hover_time
            }
        });

        showToast('Risk saved successfully!');
    } catch (error) {
        console.error('Error saving risk:', error);
        showToast('Error saving risk. Check console.', true);
    }

    pendingRiskData = null;
    riskFormModal.classList.remove('active');
});

// ===== 5b. DELETE CONFIRMATION POPUP =====

// Event delegation: listen for clicks on dustbin buttons in the table
riskTableBody.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.delete-btn');
    if (!deleteBtn) return;

    pendingDeleteDocId = deleteBtn.getAttribute('data-doc-id');
    deleteConfirmModal.classList.add('active');
});

deleteNo.addEventListener('click', () => {
    deleteConfirmModal.classList.remove('active');
    pendingDeleteDocId = null;
});

deleteConfirmModal.addEventListener('click', (e) => {
    if (e.target === deleteConfirmModal) {
        deleteConfirmModal.classList.remove('active');
        pendingDeleteDocId = null;
    }
});

deleteYes.addEventListener('click', async () => {
    deleteConfirmModal.classList.remove('active');

    if (!pendingDeleteDocId) return;

    try {
        let userId = localStorage.getItem('ux_user_id');
        if (!userId) return;

        await db.collection('users').doc(userId).collection('risks').doc(pendingDeleteDocId).delete();

        showToast('Risk deleted successfully!');
    } catch (error) {
        console.error('Error deleting risk:', error);
        showToast('Error deleting risk. Check console.', true);
    }

    pendingDeleteDocId = null;
});

// ===== 6. REAL-TIME FIRESTORE LISTENER =====
function setupRealtimeListener() {
    let userId = localStorage.getItem('ux_user_id');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('ux_user_id', userId);
    }

    // Real-time snapshot listener on the user's risks sub-collection
    db.collection('users').doc(userId).collection('risks')
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            riskTableBody.innerHTML = '';

            if (snapshot.empty) {
                riskTable.classList.remove('has-data');
                emptyMsg.classList.remove('hidden');
                return;
            }

            riskTable.classList.add('has-data');
            emptyMsg.classList.add('hidden');

            snapshot.forEach((doc) => {
                const data = doc.data();
                const row = document.createElement('tr');

                const severityClass = `severity-${data.severityLevel.toLowerCase()}`;
                const createdDate = data.createdAt
                    ? new Date(data.createdAt).toLocaleString()
                    : 'N/A';

                row.innerHTML = `
                    <td>${escapeHtml(data.riskId)}</td>
                    <td>${escapeHtml(data.riskDescription)}</td>
                    <td><span class="severity-badge ${severityClass}">${escapeHtml(data.severityLevel)}</span></td>
                    <td>${escapeHtml(data.groups)}</td>
                    <td>${createdDate}</td>
                    <td><button class="delete-btn" data-doc-id="${doc.id}" title="Delete Risk">&#128465;</button></td>
                `;

                riskTableBody.appendChild(row);
            });
        }, (error) => {
            console.error('Firestore listener error:', error);
            showToast('Error loading risks. Check console.', true);
        });
}

// ===== 7. UTILITY FUNCTIONS =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = 'toast' + (isError ? ' error' : '');
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== 8. INIT =====
setupRealtimeListener();

// ===== 9. CONFUSION SCORE =====
const bottomActionsBtn = document.getElementById('bottomActionsBtn');
const confusionResult = document.getElementById('confusionResult');
const confusionPercent = document.getElementById('confusionPercent');
const ringProgress = document.getElementById('ringProgress');
const confusionLabel = document.getElementById('confusionLabel');
const confusionMetrics = document.getElementById('confusionMetrics');

const PREDICTION_API = 'http://localhost:5000/predict';
const RING_CIRCUMFERENCE = 490.09; // 2 * π * 78

bottomActionsBtn.addEventListener('click', async () => {
    // Show loading state
    confusionResult.classList.add('active');
    confusionPercent.textContent = '...';
    ringProgress.style.strokeDashoffset = RING_CIRCUMFERENCE;
    ringProgress.className = 'ring-progress';
    confusionLabel.textContent = 'Fetching last risk data...';
    confusionMetrics.innerHTML = '';

    try {
        // 1. Get current user ID
        let userId = localStorage.getItem('ux_user_id');
        if (!userId) {
            confusionLabel.textContent = 'No user session found. Create a risk first.';
            confusionPercent.textContent = '--';
            return;
        }

        // 2. Get the most recent risk from Firestore
        const snapshot = await db.collection('users').doc(userId).collection('risks')
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        if (snapshot.empty) {
            confusionLabel.textContent = 'No risks found. Create a risk first.';
            confusionPercent.textContent = '--';
            return;
        }

        const lastRisk = snapshot.docs[0].data();
        const ux = lastRisk.uxMetrics;

        if (!ux) {
            confusionLabel.textContent = 'Last risk has no UX metrics data.';
            confusionPercent.textContent = '--';
            return;
        }

        confusionLabel.textContent = 'Calculating confusion score...';

        // 3. Call the prediction API
        const response = await fetch(PREDICTION_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                backtracks: ux.backtracks || 0,
                click_count: ux.click_count || 0,
                form_errors: ux.form_errors || 0,
                hover_time: ux.hover_time || 0,
                rage_clicks: ux.rage_clicks || 0,
                task_time: ux.task_time || 0
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Prediction API error');
        }

        const result = await response.json();
        const score = result.confusion_score;

        // 4. Animate the ring & display results
        animateConfusionScore(score);

        // Show which risk it's based on
        confusionLabel.textContent = `Based on risk: ${escapeHtml(lastRisk.riskId)}`;

        // Show the UX metrics used
        confusionMetrics.innerHTML = `
            <div class="confusion-metric-item">Task Time<span>${ux.task_time}s</span></div>
            <div class="confusion-metric-item">Clicks<span>${ux.click_count}</span></div>
            <div class="confusion-metric-item">Rage Clicks<span>${ux.rage_clicks}</span></div>
            <div class="confusion-metric-item">Backtracks<span>${ux.backtracks}</span></div>
            <div class="confusion-metric-item">Form Errors<span>${ux.form_errors}</span></div>
            <div class="confusion-metric-item">Hover Time<span>${ux.hover_time}s</span></div>
        `;

        // 5. Show parameter-impact visualisation
        renderParameterImpact(ux);

    } catch (error) {
        console.error('Confusion score error:', error);
        confusionPercent.textContent = '!';
        confusionLabel.textContent = 'Error: ' + error.message;
        confusionLabel.classList.add('confusion-error');
    }
});

function animateConfusionScore(score) {
    const offset = RING_CIRCUMFERENCE - (score / 100) * RING_CIRCUMFERENCE;

    // Set color class based on score level
    ringProgress.className = 'ring-progress';
    const statusBadge = document.getElementById('statusBadge');
    statusBadge.className = 'status-badge';

    if (score <= 25) {
        ringProgress.classList.add('low');
        statusBadge.classList.add('low');
        statusBadge.textContent = 'Low';
    } else if (score <= 50) {
        ringProgress.classList.add('medium');
        statusBadge.classList.add('medium');
        statusBadge.textContent = 'Medium';
    } else if (score <= 75) {
        ringProgress.classList.add('high');
        statusBadge.classList.add('high');
        statusBadge.textContent = 'High';
    } else {
        ringProgress.classList.add('critical');
        statusBadge.classList.add('critical');
        statusBadge.textContent = 'Critical';
    }

    // Animate ring
    ringProgress.style.strokeDashoffset = offset;

    // Animate number count-up
    let current = 0;
    const target = Math.round(score * 10) / 10;
    const duration = 1200;
    const startTime = performance.now();

    function step(timestamp) {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out
        const eased = 1 - Math.pow(1 - progress, 3);
        current = eased * target;
        confusionPercent.textContent = current.toFixed(1) + '%';
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            confusionPercent.textContent = target.toFixed(1) + '%';
        }
    }
    requestAnimationFrame(step);
}

// ===== 10. PARAMETER IMPACT VISUALISATION =====
// Mirrors the friction_index formula from api.py so we can show
// each parameter's weighted contribution on the client side.

const FRICTION_PARAMS = [
    { key: 'task_time',    label: 'Task Time',    weight: 0.45, min: 10,  max: 180 },
    { key: 'form_errors',  label: 'Form Errors',  weight: 0.25, min: 0,   max: 10  },
    { key: 'rage_clicks',  label: 'Rage Clicks',  weight: 0.15, min: 0,   max: 8   },
    { key: 'backtracks',   label: 'Backtracks',   weight: 0.08, min: 0,   max: 20  },
    { key: 'click_count',  label: 'Click Count',  weight: 0.05, min: 1,   max: 50  },
    { key: 'hover_time',   label: 'Hover Time',   weight: 0.02, min: 0,   max: 10  },
];

/**
 * Main entry – called after a successful confusion-score calculation.
 * @param {Object} ux  Raw UX metrics object from Firestore
 */
function renderParameterImpact(ux) {
    const impactCard = document.getElementById('impactCard');
    impactCard.style.display = '';

    // 1. Compute each param's normalized (0-1) value and weighted contribution
    const items = FRICTION_PARAMS.map(p => {
        const raw   = ux[p.key] || 0;
        const norm  = Math.max(0, Math.min(1, (raw - p.min) / (p.max - p.min)));
        const contrib = p.weight * norm;             // weighted contribution
        return { ...p, raw, norm, contrib };
    });

    const totalContrib = items.reduce((s, i) => s + i.contrib, 0) || 1;

    // 2. Build horizontal bar chart
    buildImpactBars(items, totalContrib);

    // 3. Build radar chart
    buildRadarChart(items);
}

/* ----------  Horizontal bar chart  ---------- */
function buildImpactBars(items, totalContrib) {
    const container = document.getElementById('impactBars');
    container.innerHTML = '';

    items.forEach(item => {
        const pct = Math.round((item.contrib / totalContrib) * 100);

        const row = document.createElement('div');
        row.className = `impact-bar-row bar-${item.key}`;

        row.innerHTML = `
            <span class="impact-bar-label">${item.label}</span>
            <div class="impact-bar-track">
                <div class="impact-bar-fill" style="width:0%"></div>
            </div>
            <span class="impact-bar-value">${pct}%</span>
        `;
        container.appendChild(row);

        // Animate after paint
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                row.querySelector('.impact-bar-fill').style.width = pct + '%';
            });
        });
    });
}

/* ----------  Radar chart (pure SVG)  ---------- */
function buildRadarChart(items) {
    const svg = document.getElementById('radarChart');
    svg.innerHTML = '';

    const cx = 150, cy = 150, R = 110;
    const n = items.length;
    const angleStep = (2 * Math.PI) / n;

    // Gradient definition for radar fill
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
        <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="var(--cyan)" stop-opacity="0.30"/>
            <stop offset="100%" stop-color="var(--purple)" stop-opacity="0.08"/>
        </radialGradient>
    `;
    svg.appendChild(defs);

    // Draw concentric grid rings (4 levels)
    for (let ring = 1; ring <= 4; ring++) {
        const r = (R / 4) * ring;
        const pts = [];
        for (let i = 0; i < n; i++) {
            const angle = angleStep * i - Math.PI / 2;
            pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
        }
        const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        poly.setAttribute('points', pts.join(' '));
        poly.setAttribute('class', 'radar-grid');
        svg.appendChild(poly);
    }

    // Axis lines + labels
    const dataPoints = [];
    items.forEach((item, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const ex = cx + R * Math.cos(angle);
        const ey = cy + R * Math.sin(angle);

        // Axis line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', cx);
        line.setAttribute('y1', cy);
        line.setAttribute('x2', ex);
        line.setAttribute('y2', ey);
        line.setAttribute('class', 'radar-axis');
        svg.appendChild(line);

        // Label
        const lx = cx + (R + 18) * Math.cos(angle);
        const ly = cy + (R + 18) * Math.sin(angle);
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', lx);
        label.setAttribute('y', ly);
        label.setAttribute('class', 'radar-label');
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('dominant-baseline', 'central');
        label.textContent = item.label;
        svg.appendChild(label);

        // Data point coordinates (norm 0-1 mapped to radius)
        const dr = R * item.norm;
        dataPoints.push({
            x: cx + dr * Math.cos(angle),
            y: cy + dr * Math.sin(angle),
        });
    });

    // Filled area polygon
    const areaPts = dataPoints.map(p => `${p.x},${p.y}`).join(' ');
    const area = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    area.setAttribute('points', areaPts);
    area.setAttribute('class', 'radar-area');
    area.setAttribute('fill', 'url(#radarGrad)');
    svg.appendChild(area);

    // Dots
    dataPoints.forEach(p => {
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('cx', p.x);
        c.setAttribute('cy', p.y);
        c.setAttribute('r', 4);
        c.setAttribute('class', 'radar-dot');
        svg.appendChild(c);
    });
}
