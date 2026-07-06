// Default Grading Scale Configuration
const defaultGradingScale = [
    { letter: 'O', points: 10.0, desc: 'Outstanding (≥ 90%)' },
    { letter: 'A+', points: 9.0, desc: 'Excellent (80% to < 90%)' },
    { letter: 'A', points: 8.0, desc: 'Very Good (70% to < 80%)' },
    { letter: 'B+', points: 7.0, desc: 'Good (60% to < 70%)' },
    { letter: 'B', points: 6.0, desc: 'Above Average (50% to < 60%)' },
    { letter: 'C', points: 5.0, desc: 'Average (45% to < 50%)' },
    { letter: 'P', points: 4.0, desc: 'Pass (40% to < 45%)' },
    { letter: 'F', points: 0.0, desc: 'Fail (< 40%)' }
];

// App State
let state = {
    semesters: [],
    simulations: [], // Simulated semesters for the simulator projection
    maxGpaScale: 10.0,
    scaleType: 'preset', // 'preset' or 'custom'
    gradingScale: JSON.parse(JSON.stringify(defaultGradingScale))
};

// Generate Unique Id helper
function generateUniqueId() {
    return Date.now() + '-' + Math.floor(Math.random() * 1000000);
}

// Modal helper variables
let modalCallback = null;

function showConfirmModal(title, message, callback) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-message').innerText = message;
    const modal = document.getElementById('confirm-modal');
    modal.classList.remove('hide');
    modalCallback = callback;
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    renderGradingScale();
    setupEventListeners();
    updateUI();
    lucide.createIcons();
});

// Setup Events
function setupEventListeners() {
    // Navigation Tabs
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabId = e.currentTarget.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Custom Modal Events
    document.getElementById('modal-cancel-btn').addEventListener('click', () => {
        document.getElementById('confirm-modal').classList.add('hide');
        modalCallback = null;
    });

    document.getElementById('modal-confirm-btn').addEventListener('click', () => {
        document.getElementById('confirm-modal').classList.add('hide');
        if (modalCallback) {
            modalCallback();
            modalCallback = null;
        }
    });

    // Reset Button using custom Modal
    document.getElementById('reset-all-btn').addEventListener('click', () => {
        showConfirmModal(
            'Reset All Data?',
            'Are you sure you want to clear all semesters, subjects, and simulations? This cannot be undone.',
            () => {
                state.semesters = [];
                state.simulations = [];
                saveToLocalStorage();
                updateUI();
            }
        );
    });

    // Add Semester Button
    document.getElementById('add-semester-btn').addEventListener('click', () => {
        const nextSemNum = state.semesters.length + 1;
        const newSem = {
            id: generateUniqueId(),
            name: `Semester ${nextSemNum}`,
            collapsed: false,
            courses: [
                { id: generateUniqueId(), name: '', credits: 3, grade: 'A' }
            ]
        };
        state.semesters.push(newSem);
        saveToLocalStorage();
        updateUI();
    });

    // Simulator: Goal Planner
    document.getElementById('calculate-target-btn').addEventListener('click', () => {
        const currentCgpa = parseFloat(document.getElementById('current-cgpa-sim').value) || 0;
        const completedCredits = parseFloat(document.getElementById('current-credits-sim').value) || 0;
        const targetCgpa = parseFloat(document.getElementById('target-cgpa-sim').value) || 0;
        const remainingCredits = parseFloat(document.getElementById('remaining-credits-sim').value) || 0;
        const remainingSemesters = parseInt(document.getElementById('remaining-semesters-sim').value) || 0;

        const resultBox = document.getElementById('sim-target-result');
        resultBox.classList.remove('hide');

        if (targetCgpa <= 0 || remainingCredits <= 0) {
            resultBox.innerHTML = `<span style="color: var(--red);">Please enter valid Target CGPA and Remaining Credits.</span>`;
            return;
        }

        if (targetCgpa > state.maxGpaScale || currentCgpa > state.maxGpaScale) {
            resultBox.style.backgroundColor = 'var(--pink)';
            resultBox.innerHTML = `
                <strong>Input Exceeds Cap</strong><br>
                Target CGPA and Current CGPA cannot exceed the current scale cap of <strong>${state.maxGpaScale.toFixed(2)}</strong>.
            `;
            return;
        }

        // Calculate Target GPA
        const totalCreditsGraduation = completedCredits + remainingCredits;
        const totalPointsNeeded = targetCgpa * totalCreditsGraduation;
        const currentPoints = currentCgpa * completedCredits;
        const pointsNeededFromRemaining = totalPointsNeeded - currentPoints;
        const requiredGpa = pointsNeededFromRemaining / remainingCredits;

        // Build per-semester breakdown if remaining semesters is provided
        let semBreakdown = '';
        if (remainingSemesters > 0 && requiredGpa > 0 && requiredGpa <= state.maxGpaScale) {
            const creditsPerSem = (remainingCredits / remainingSemesters).toFixed(1);
            semBreakdown = `
                <hr style="border: 1px dashed #000; margin: 0.75rem 0;">
                <strong>Per-Semester Breakdown</strong><br>
                Across <strong>${remainingSemesters}</strong> remaining semester${remainingSemesters > 1 ? 's' : ''} (~<strong>${creditsPerSem}</strong> credits each):<br>
                You need to maintain an average GPA of <strong>${requiredGpa.toFixed(2)}</strong> every semester to reach your target.
            `;
        }

        if (requiredGpa > state.maxGpaScale) {
            resultBox.style.backgroundColor = 'var(--pink)';
            resultBox.innerHTML = `
                <strong>Goal Unachievable (GP: ${requiredGpa.toFixed(2)})</strong><br>
                To achieve a <strong>${targetCgpa.toFixed(2)}</strong> CGPA, you would need a GPA of <strong>${requiredGpa.toFixed(2)}</strong> over your remaining <strong>${remainingCredits}</strong> credits, which exceeds the maximum possible ${state.maxGpaScale.toFixed(2)} GPA limit.
            `;
        } else if (requiredGpa < 0) {
            resultBox.style.backgroundColor = 'var(--green)';
            resultBox.innerHTML = `
                <strong>Goal Already Achieved! (GP: 0.00)</strong><br>
                Your current CGPA is high enough that you do not need any additional points to maintain a <strong>${targetCgpa.toFixed(2)}</strong> CGPA.
            `;
        } else {
            resultBox.style.backgroundColor = 'var(--green)';
            resultBox.innerHTML = `
                <strong>Target GPA Needed: ${requiredGpa.toFixed(2)}</strong><br>
                To achieve your target CGPA of <strong>${targetCgpa.toFixed(2)}</strong>, you must maintain an average GPA of <strong>${requiredGpa.toFixed(2)}</strong> across your remaining <strong>${remainingCredits}</strong> credits.
                ${semBreakdown}
            `;
        }
    });

    // Simulator: Future Projections Add Button
    document.getElementById('add-projection-btn').addEventListener('click', () => {
        const nameInput = document.getElementById('proj-sem-name');
        const creditsInput = document.getElementById('proj-sem-credits');
        const gpaInput = document.getElementById('proj-sem-gpa');

        const name = nameInput.value.trim() || `Sim Sem ${state.simulations.length + 1}`;
        const credits = parseFloat(creditsInput.value);
        const gpa = parseFloat(gpaInput.value);

        if (isNaN(credits) || credits <= 0 || isNaN(gpa) || gpa < 0 || gpa > state.maxGpaScale) {
            alert(`Please enter valid credits and GPA values (0 to ${state.maxGpaScale}).`);
            return;
        }

        state.simulations.push({ id: generateUniqueId(), name, credits, gpa });
        
        nameInput.value = '';
        creditsInput.value = '';
        gpaInput.value = '';

        updateSimulationUI();
    });

    // Grading System: Scale Presets
    document.getElementById('preset-4-btn').addEventListener('click', () => {
        applyPresetScale(4.0);
    });

    document.getElementById('preset-5-btn').addEventListener('click', () => {
        applyPresetScale(5.0);
    });

    document.getElementById('preset-10-btn').addEventListener('click', () => {
        applyPresetScale(10.0);
    });

    document.getElementById('preset-custom-btn').addEventListener('click', () => {
        state.scaleType = 'custom';
        saveToLocalStorage();
        renderGradingScale();
        const input = document.getElementById('max-gpa-input');
        input.focus();
        input.select();
    });

    document.getElementById('max-gpa-input').addEventListener('input', (e) => {
        const newMax = parseFloat(e.target.value);
        if (newMax && newMax > 0) {
            // Apply scale change but keep custom scaleType
            const oldMax = state.maxGpaScale;
            state.maxGpaScale = newMax;
            state.gradingScale.forEach(grade => {
                grade.points = parseFloat(((grade.points / oldMax) * newMax).toFixed(2));
            });
            state.simulations.forEach(sim => {
                if (sim.gpa > newMax) sim.gpa = newMax;
            });
            saveToLocalStorage();
            updateUI();
            renderGradingScale();
        }
    });

    // Grading System: Add & Restore Custom Grades
    document.getElementById('add-grade-btn').addEventListener('click', () => {
        addCustomGrade();
    });

    document.getElementById('restore-grading-btn').addEventListener('click', () => {
        showConfirmModal(
            'Restore Defaults?',
            'Are you sure you want to restore the standard 4.0 grading scale defaults? Your custom changes will be overwritten.',
            () => {
                restoreGradingDefaults();
            }
        );
    });
}

// Tab Switching logic
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tabId) {
            btn.classList.add('active');
        }
    });

    const activeTab = document.getElementById(tabId);
    if (activeTab) {
        activeTab.classList.add('active');
    }

    // Refresh simulation autofills if target tab is simulation
    if (tabId === 'simulator') {
        const { cgpa, totalCredits } = calculateCGPA();
        document.getElementById('current-cgpa-sim').value = cgpa.toFixed(2);
        document.getElementById('current-credits-sim').value = totalCredits;
        document.getElementById('proj-current-cgpa').innerText = cgpa.toFixed(2);
        document.getElementById('proj-current-credits').innerText = totalCredits;
        updateSimulationUI();
    }
}

// Render the interactive, editable grading scale in the tab
function renderGradingScale() {
    const tbody = document.getElementById('grading-scale-body');
    if (!tbody) return;
    
    const isCustom = state.scaleType === 'custom';
    
    // Set max scale input value and editability
    const maxInput = document.getElementById('max-gpa-input');
    if (maxInput) {
        maxInput.value = state.maxGpaScale;
        maxInput.disabled = !isCustom;
    }

    // Show/hide the Action column header
    const thead = document.getElementById('grading-table-head');
    if (thead) {
        if (isCustom) {
            thead.innerHTML = `<tr>
                <th>Letter Grade</th>
                <th>Grade Points</th>
                <th>Description</th>
                <th style="width: 60px;">Action</th>
            </tr>`;
        } else {
            thead.innerHTML = `<tr>
                <th>Letter Grade</th>
                <th>Grade Points</th>
                <th>Description</th>
            </tr>`;
        }
    }

    // Show/hide the Add Custom Grade and Restore Defaults buttons
    const actionsDiv = document.getElementById('grading-custom-actions');
    if (actionsDiv) {
        actionsDiv.style.display = isCustom ? 'flex' : 'none';
    }

    if (state.gradingScale.length === 0) {
        const cols = isCustom ? 4 : 3;
        tbody.innerHTML = `<tr><td colspan="${cols}" style="text-align: center; font-style: italic;">No grades defined. Click Add Custom Grade below!</td></tr>`;
        return;
    }

    tbody.innerHTML = state.gradingScale.map((grade, idx) => `
        <tr>
            <td>
                <input type="text" value="${grade.letter}" style="font-weight: 700; width: 100%; border: 2px solid #000; padding: 0.25rem 0.5rem;${isCustom ? '' : ' background-color: #EEE;'}" 
                    ${isCustom ? '' : 'disabled'}
                    onfocus="this.select()"
                    oninput="updateGradingField(${idx}, 'letter', this.value)">
            </td>
            <td>
                <input type="number" value="${grade.points}" step="0.1" min="0" max="100" style="width: 100%; border: 2px solid #000; padding: 0.25rem 0.5rem;${isCustom ? '' : ' background-color: #EEE;'}" 
                    ${isCustom ? '' : 'disabled'}
                    onfocus="this.select()"
                    oninput="updateGradingField(${idx}, 'points', this.value)">
            </td>
            <td>
                <input type="text" value="${grade.desc}" style="width: 100%; border: 2px solid #000; padding: 0.25rem 0.5rem;${isCustom ? '' : ' background-color: #EEE;'}" 
                    ${isCustom ? '' : 'disabled'}
                    onfocus="this.select()"
                    oninput="updateGradingField(${idx}, 'desc', this.value)">
            </td>
            ${isCustom ? `<td style="text-align: center;">
                <button class="btn-icon delete-btn-icon" onclick="deleteGradingRow(${idx})" title="Delete Grade">
                    <i data-lucide="minus"></i>
                </button>
            </td>` : ''}
        </tr>
    `).join('');

    lucide.createIcons();
}

// State calculations
function calculateSemesterGPA(semester) {
    let totalPoints = 0;
    let totalCredits = 0;

    semester.courses.forEach(course => {
        const gradeConfig = state.gradingScale.find(g => g.letter === course.grade);
        const points = gradeConfig ? gradeConfig.points : 0;
        const credits = parseFloat(course.credits) || 0;
        
        totalPoints += points * credits;
        totalCredits += credits;
    });

    return totalCredits === 0 ? 0 : totalPoints / totalCredits;
}

function calculateCGPA() {
    let totalPoints = 0;
    let totalCredits = 0;

    state.semesters.forEach(semester => {
        semester.courses.forEach(course => {
            const gradeConfig = state.gradingScale.find(g => g.letter === course.grade);
            const points = gradeConfig ? gradeConfig.points : 0;
            const credits = parseFloat(course.credits) || 0;
            
            totalPoints += points * credits;
            totalCredits += credits;
        });
    });

    const cgpa = totalCredits === 0 ? 0 : totalPoints / totalCredits;
    return { cgpa, totalCredits };
}

// Save & Load LocalStorage
function saveToLocalStorage() {
    localStorage.setItem('cosc_gpa_state', JSON.stringify(state));
}

function loadFromLocalStorage() {
    const raw = localStorage.getItem('cosc_gpa_state');
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            state.semesters = parsed.semesters || [];
            state.simulations = parsed.simulations || [];
            state.maxGpaScale = parsed.maxGpaScale !== undefined ? parsed.maxGpaScale : 10.0;
            state.scaleType = parsed.scaleType || 'preset';
            state.gradingScale = parsed.gradingScale || JSON.parse(JSON.stringify(defaultGradingScale));
        } catch (e) {
            console.error('Failed parsing state', e);
        }
    }
}

// UI Rendering Engine
function updateUI() {
    renderDashboard();
    renderSemestersList();
}

function renderDashboard() {
    const { cgpa, totalCredits } = calculateCGPA();
    
    document.getElementById('cgpa-display').innerText = cgpa.toFixed(2);
    
    // Add classification division if scale is 10.0
    const classText = getCgpaClass(cgpa);
    document.getElementById('cgpa-label-wrapper').innerHTML = classText ? `Running CGPA <br><small style="font-size:0.75rem; text-transform:none;">(${classText})</small>` : 'Running CGPA';
    
    document.getElementById('total-credits-display').innerText = totalCredits;
    document.getElementById('semesters-count-display').innerText = state.semesters.length;

    // Delegate chart rendering to analytics.js
    renderGpaChart();
}

function renderSemestersList() {
    const container = document.getElementById('semesters-list');
    if (!container) return;

    if (state.semesters.length === 0) {
        container.innerHTML = `
            <div class="card white-bg text-center" style="padding: 3rem; text-align: center;">
                <p style="font-size: 1.2rem; margin-bottom: 1.5rem; font-weight: 500;">No semesters added yet.</p>
                <button onclick="document.getElementById('add-semester-btn').click()" class="action-btn yellow-btn">
                    <i data-lucide="plus"></i> Add Your First Semester
                </button>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    container.innerHTML = '';

    state.semesters.forEach((sem, semIndex) => {
        const semGpa = calculateSemesterGPA(sem);
        const semCard = document.createElement('div');
        semCard.className = 'semester-card card';
        
        // Header
        const header = document.createElement('div');
        header.className = 'sem-header';
        header.innerHTML = `
            <div class="sem-header-left">
                <i data-lucide="${sem.collapsed ? 'chevron-right' : 'chevron-down'}"></i>
                <span class="sem-title">${sem.name}</span>
                <span class="sem-gpa-badge">GPA: ${semGpa.toFixed(2)}</span>
            </div>
            <div class="sem-header-right">
                <button class="btn-icon delete-btn-icon" title="Delete Semester" onclick="deleteSemester('${sem.id}', event)">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `;
        
        // Toggle collapse on click header (except buttons)
        header.addEventListener('click', (e) => {
            if (e.target.closest('.btn-icon')) return;
            sem.collapsed = !sem.collapsed;
            saveToLocalStorage();
            updateUI();
        });

        const body = document.createElement('div');
        body.className = `sem-body ${sem.collapsed ? 'collapsed' : ''}`;
        
        // Course Grade sheet table
        let tableRowsHTML = sem.courses.map((course, courseIndex) => {
            const options = state.gradingScale.map(grade => `
                <option value="${grade.letter}" ${course.grade === grade.letter ? 'selected' : ''}>
                    ${grade.letter} (${grade.points.toFixed(1)})
                </option>
            `).join('');

            return `
                <tr>
                    <td>
                        <input type="text" value="${course.name}" placeholder="e.g. Mathematics" 
                            onfocus="this.select()"
                            oninput="updateCourseField('${sem.id}', '${course.id}', 'name', this.value)">
                    </td>
                    <td style="width: 100px;">
                        <input type="number" value="${course.credits}" min="1" step="0.5" max="10"
                            onfocus="this.select()"
                            oninput="updateCourseField('${sem.id}', '${course.id}', 'credits', this.value)">
                    </td>
                    <td style="width: 150px;">
                        <select onchange="updateCourseField('${sem.id}', '${course.id}', 'grade', this.value)">
                            ${options}
                        </select>
                    </td>
                    <td style="width: 50px; text-align: center;">
                        <button class="btn-icon delete-btn-icon" onclick="deleteCourse('${sem.id}', '${course.id}')">
                            <i data-lucide="minus"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        body.innerHTML = `
            <table class="courses-table">
                <thead>
                    <tr>
                        <th>Subject Name</th>
                        <th>Credits</th>
                        <th>Grade</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRowsHTML}
                </tbody>
            </table>
            <div class="sem-actions">
                <button class="action-btn green-btn" onclick="addCourseToSemester('${sem.id}')">
                    <i data-lucide="plus-circle"></i> Add Subject
                </button>
            </div>
        `;

        semCard.appendChild(header);
        semCard.appendChild(body);
        container.appendChild(semCard);
    });

    lucide.createIcons();
}

// Semester Operations
window.deleteSemester = function(semId, event) {
    event.stopPropagation();
    showConfirmModal(
        'Delete Semester?',
        'Are you sure you want to delete this semester and all its grades?',
        () => {
            state.semesters = state.semesters.filter(s => s.id !== semId);
            saveToLocalStorage();
            updateUI();
        }
    );
};

window.addCourseToSemester = function(semId) {
    const sem = state.semesters.find(s => s.id === semId);
    if (sem) {
        sem.courses.push({
            id: generateUniqueId(),
            name: '',
            credits: 3,
            grade: 'A'
        });
        saveToLocalStorage();
        updateUI();
    }
};

window.deleteCourse = function(semId, courseId) {
    const sem = state.semesters.find(s => s.id === semId);
    if (sem) {
        sem.courses = sem.courses.filter(c => c.id !== courseId);
        saveToLocalStorage();
        updateUI();
    }
};

window.updateCourseField = function(semId, courseId, field, value) {
    const sem = state.semesters.find(s => s.id === semId);
    if (sem) {
        const course = sem.courses.find(c => c.id === courseId);
        if (course) {
            if (field === 'credits') {
                course.credits = parseFloat(value) || 0;
            } else {
                course[field] = value;
            }
            saveToLocalStorage();
            // We do a soft recalculation/re-render to avoid losing focus on text inputs
            softRecalculate(semId);
        }
    }
};

// Update badges and dashboard details without full list re-render (which breaks input focus)
function softRecalculate(focusedSemId) {
    const { cgpa, totalCredits } = calculateCGPA();
    document.getElementById('cgpa-display').innerText = cgpa.toFixed(2);
    document.getElementById('total-credits-display').innerText = totalCredits;

    // Update specific semester GPA badge in header
    state.semesters.forEach(sem => {
        const semGpa = calculateSemesterGPA(sem);
        // Find corresponding semester card and update badge
        const cards = document.querySelectorAll('.semester-card');
        cards.forEach(card => {
            const titleEl = card.querySelector('.sem-title');
            if (titleEl && titleEl.innerText === sem.name) {
                const badge = card.querySelector('.sem-gpa-badge');
                if (badge) badge.innerText = `GPA: ${semGpa.toFixed(2)}`;
            }
        });
    });

    // Update trend chart
    renderDashboard();
}

// Simulation tab UI and calculations
function updateSimulationUI() {
    const simList = document.getElementById('simulated-sems-list');
    if (!simList) return;

    if (state.simulations.length === 0) {
        simList.innerHTML = `<li class="empty-list-msg">No simulated semesters added. Add one above!</li>`;
    } else {
        simList.innerHTML = state.simulations.map(sim => `
            <li>
                <div>
                    <strong>${sim.name}</strong> - ${sim.credits} Credits @ ${sim.gpa.toFixed(2)} GPA
                </div>
                <button class="btn-icon delete-btn-icon" onclick="deleteSimulation('${sim.id}')">
                    <i data-lucide="minus"></i>
                </button>
            </li>
        `).join('');
        lucide.createIcons();
    }

    // Calculate projected CGPA
    const { cgpa: currentCgpa, totalCredits: currentCredits } = calculateCGPA();
    let totalPoints = currentCgpa * currentCredits;
    let totalCredits = currentCredits;

    state.simulations.forEach(sim => {
        totalPoints += sim.gpa * sim.credits;
        totalCredits += sim.credits;
    });

    const projectedCgpa = totalCredits === 0 ? 0 : totalPoints / totalCredits;

    document.getElementById('proj-final-cgpa').innerText = projectedCgpa.toFixed(2);
    document.getElementById('proj-final-credits').innerText = totalCredits;
}

window.deleteSimulation = function(id) {
    state.simulations = state.simulations.filter(s => s.id !== id);
    updateSimulationUI();
};

// Global helper to switch tabs
window.switchTab = switchTab;

// Grading scale helper functions
function applyPresetScale(newMax) {
    const oldMax = state.maxGpaScale;
    state.maxGpaScale = newMax;
    state.scaleType = 'preset';
    document.getElementById('max-gpa-input').value = newMax;
    
    // Scale existing grade point values proportionally
    state.gradingScale.forEach(grade => {
        grade.points = parseFloat(((grade.points / oldMax) * newMax).toFixed(2));
    });
    
    // Clamp simulations to not exceed the new max scale points
    state.simulations.forEach(sim => {
        if (sim.gpa > newMax) {
            sim.gpa = newMax;
        }
    });
    
    saveToLocalStorage();
    updateUI();
    renderGradingScale();
}

function restoreGradingDefaults() {
    state.maxGpaScale = 10.0;
    state.scaleType = 'custom'; // Restoring defaults makes it a custom, fully editable scale again if desired, or let's keep it preset. Let's make it 'custom' so they can edit it, or lock it as 'preset' to match standard defaults. Let's make it lock as 'preset'!
    state.scaleType = 'preset';
    state.gradingScale = JSON.parse(JSON.stringify(defaultGradingScale));
    document.getElementById('max-gpa-input').value = 10.0;
    saveToLocalStorage();
    updateUI();
    renderGradingScale();
}

// CGPA Class Classification helper
function getCgpaClass(cgpa) {
    // Only display class division if max scale is 10
    if (Math.abs(state.maxGpaScale - 10.0) > 0.1) {
        return '';
    }
    if (cgpa >= 8.00) return 'Distinction';
    if (cgpa >= 6.50) return 'First Class';
    if (cgpa >= 6.00) return 'Second Class';
    if (cgpa >= 4.00) return 'Pass Class';
    return 'Fail';
}

function addCustomGrade() {
    state.gradingScale.push({
        letter: 'New',
        points: state.maxGpaScale,
        desc: 'Custom Grade'
    });
    saveToLocalStorage();
    updateUI();
    renderGradingScale();
}

window.updateGradingField = function(index, field, value) {
    const grade = state.gradingScale[index];
    if (grade) {
        if (field === 'points') {
            grade.points = parseFloat(value) || 0;
        } else {
            grade[field] = value;
        }
        saveToLocalStorage();
        // Trigger update to refresh dropdowns and overall UI math
        updateUI();
    }
};

window.deleteGradingRow = function(index) {
    state.gradingScale.splice(index, 1);
    saveToLocalStorage();
    updateUI();
    renderGradingScale();
};

