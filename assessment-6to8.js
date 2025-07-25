const { jsPDF } = window.jspdf;

console.log('[INIT] English assessment script loaded @ May 29, 2025, 20:44 PM IST');

// Determine if this is a psychometric or activity assessment
const isPsychometric = document.location.pathname.includes('psychometric') || document.location.pathname.includes('psychometric-assessment-6to8-english.html');
const isActivity = document.location.pathname.includes('activity') || document.location.pathname.includes('activity-assessment-6to8-english.html');

if (!isPsychometric && !isActivity) {
    console.error('[INIT] Unable to determine assessment type from pathname:', document.location.pathname);
}

// Shared state
let timeLeft = isPsychometric ? 10 * 60 : 5 * 60;
let timerInterval;
let totalScore = localStorage.getItem('totalScore') ? parseInt(localStorage.getItem('totalScore')) : 0;
let categoryScores = JSON.parse(localStorage.getItem('categoryScores')) || {};
let activityScores = JSON.parse(localStorage.getItem('activityScores')) || {};
let completedCategories = JSON.parse(localStorage.getItem('completedCategories')) || {
    psychometric: [],
    activity: []
};
let selectedActivities = [];
let userSortings = JSON.parse(localStorage.getItem('userSortings')) || {};

// DOM elements
let instructions, startBtn, timerDisplay, assessmentContent, nextBtn, downloadBtn, pdfError, viewPdfLink, categoryCompletion, completionMessage, finalCompletion, navError, startActivityBtn;

// Category definitions with English display names
const categoryDisplayNames = {
    aptitude: 'Aptitude',
    emotional: 'Emotional Intelligence',
    cognitive: 'Cognitive Ability',
    career: 'Career Knowledge',
    interest: 'Interest',
    leadership: 'Leadership',
    career_exploration: 'Career Exploration',
    career_value_sorting: 'Career Value Sorting',
    roleplay: 'Roleplay',
    career_reality_quiz: 'Career Reality Quiz'
};
const psychoCategories = ['aptitude', 'emotional', 'cognitive', 'career', 'interest', 'leadership'];
const activityCategories = ['career_exploration', 'career_value_sorting', 'roleplay', 'career_reality_quiz'];
const urlParams = new URLSearchParams(window.location.search);
const currentCategory = urlParams.get('category') || (isPsychometric ? 'aptitude' : 'career_exploration');
const categoryIndex = isPsychometric ? psychoCategories.indexOf(currentCategory) : activityCategories.indexOf(currentCategory);

// Validate current category
if (isPsychometric && !psychoCategories.includes(currentCategory)) {
    console.error('[INIT] Invalid psychometric category:', currentCategory, 'Expected:', psychoCategories);
    document.addEventListener('DOMContentLoaded', () => {
        const content = document.getElementById('assessmentContent');
        if (content) {
            content.innerHTML = `<p style="color: #d32f2f;">Error: Invalid psychometric category '${currentCategory}'. Valid categories: ${psychoCategories.map(cat => categoryDisplayNames[cat]).join(', ')}.</p>`;
        }
    });
    throw new Error('Invalid psychometric category');
}
if (isActivity && !activityCategories.includes(currentCategory)) {
    console.error('[INIT] Invalid activity category:', currentCategory, 'Expected:', activityCategories);
    document.addEventListener('DOMContentLoaded', () => {
        const content = document.getElementById('assessmentContent');
        if (content) {
            content.innerHTML = `<p style="color: #d32f2f;">Error: Invalid activity category '${currentCategory}'. Valid categories: ${activityCategories.map(cat => categoryDisplayNames[cat]).join(', ')}.</p>`;
        }
    });
    throw new Error('Invalid activity category');
}

// O*NET credentials
const onetUsername = 'psychometric_assessm';
const onetPassword = '2964bsx';

// Zunker’s weights for holistic scoring
const weights = {
    aptitude: 0.15,
    emotional: 0.1,
    cognitive: 0.15,
    career: 0.1,
    interest: 0.2,
    leadership: 0.15,
    career_exploration: 0.25,
    career_value_sorting: 0.25,
    roleplay: 0.25,
    career_reality_quiz: 0.25
};

// RIASEC mapping
const riasecMapping = {
    aptitude: ['I', 'R'],
    emotional: ['S'],
    cognitive: ['I', 'R'],
    career: ['C'],
    interest: ['A'],
    leadership: ['E'],
    career_exploration: ['I', 'A'],
    career_value_sorting: ['C'],
    roleplay: ['A', 'S'],
    career_reality_quiz: ['E']
};

// Career domains and predefined careers
const careerDomains = {
    arts: {
        riasec: ['A', 'S'],
        categories: ['interest', 'roleplay'],
        careers: [
            { title: 'Animator', code: '27-1014.00', description: 'Create animations for films and games.' },
            { title: 'Photographer', code: '27-4021.00', description: 'Capture images for various purposes.' },
            { title: 'Fashion Designer', code: '27-1022.00', description: 'Design clothing and accessories.' },
            { title: 'Theater Actor', code: '27-2011.00', description: 'Perform in stage productions.' },
            { title: 'Creative Writer', code: '27-3043.00', description: 'Write original content for publications.' }
        ]
    },
    science: {
        riasec: ['I', 'R'],
        categories: ['cognitive', 'aptitude'],
        careers: [
            { title: 'Astronomer', code: '19-2011.00', description: 'Study celestial bodies and phenomena.' },
            { title: 'Microbiologist', code: '19-1022.00', description: 'Research microorganisms and their effects.' },
            { title: 'Zoologist', code: '19-1023.00', description: 'Study animals and their behaviors.' },
            { title: 'Biomedical Scientist', code: '19-1042.00', description: 'Conduct research to improve health.' },
            { title: 'Oceanographer', code: '19-2043.00', description: 'Study oceans and marine ecosystems.' }
        ]
    },
    computer: {
        riasec: ['I', 'C'],
        categories: ['cognitive', 'career'],
        careers: [
            { title: 'Web Developer', code: '15-1254.00', description: 'Design and maintain websites.' },
            { title: 'Database Administrator', code: '15-1242.00', description: 'Manage and organize data systems.' },
            { title: 'Game Developer', code: '15-1255.00', description: 'Create interactive video games.' },
            { title: 'IT Project Manager', code: '15-1299.09', description: 'Oversee technology projects.' },
            { title: 'Systems Analyst', code: '15-1211.00', description: 'Analyze and improve IT systems.' }
        ]
    },
    commerce: {
        riasec: ['E', 'C'],
        categories: ['leadership', 'career_value_sorting'],
        careers: [
            { title: 'Retail Manager', code: '11-2022.00', description: 'Oversee retail store operations.' },
            { title: 'Investment Banker', code: '13-2052.00', description: 'Manage financial investments.' },
            { title: 'Business Consultant', code: '13-1111.00', description: 'Advise companies on business strategies.' },
            { title: 'Logistics Manager', code: '11-3071.00', description: 'Coordinate supply chain operations.' },
            { title: 'Market Research Analyst', code: '13-1161.00', description: 'Study market trends and consumer behavior.' }
        ]
    },
    engineering: {
        riasec: ['R', 'I'],
        categories: ['aptitude', 'cognitive'],
        careers: [
            { title: 'Robotics Engineer', code: '17-2199.08', description: 'Design and build robotic systems.' },
            { title: 'Structural Engineer', code: '17-2051.01', description: 'Design safe buildings and structures.' },
            { title: 'Automotive Engineer', code: '17-2141.02', description: 'Develop vehicle systems and components.' },
            { title: 'Environmental Engineer', code: '17-2081.00', description: 'Address environmental challenges.' },
            { title: 'Petroleum Engineer', code: '17-2171.00', description: 'Design oil and gas extraction systems.' }
        ]
    }
};

// Check if all categories are completed
function areAllCategoriesCompleted() {
    const psychoCompleted = psychoCategories.every(cat => completedCategories.psychometric.includes(cat));
    const activityCompleted = activityCategories.every(cat => completedCategories.activity.includes(cat));
    return psychoCompleted && activityCompleted;
}

// Extract keywords from hint
function extractHintKeywords(hint) {
    if (!hint) return [];
    const commonWords = ['a', 'an', 'the', 'and', 'or', 'in', 'to', 'for', 'with'];
    return hint
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !commonWords.includes(word));
}

// Verify activity response
function verifyActivityResponse(activity, activityDiv) {
    const type = activity.type;
    const input = activityDiv.querySelector('.text-input, input[type="radio"]:checked');
    const errorDiv = activityDiv.querySelector('.error-message') || document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.color = '#d32f2f';
    errorDiv.textContent = '';
    activityDiv.appendChild(errorDiv);

    if (type === 'drag_drop') {
        const zones = activityDiv.querySelectorAll('.drop-zone');
        console.log('[VERIFY] Checking drag_drop zones for activity:', activity.task);
        console.log('[VERIFY] Zone contents:', Array.from(zones).map(z => ({
            zone: z.dataset.zone,
            content: z.querySelector('.drop-area')?.textContent.trim()
        })));
        const allFilled = Array.from(zones).every(zone => {
            const content = zone.querySelector('.drop-area')?.textContent.trim();
            return content && content !== 'Drop here' && content !== '';
        });
        if (!allFilled) {
            errorDiv.textContent = 'Please fill all drop zones.';
            activityDiv.classList.add('shake');
            setTimeout(() => activityDiv.classList.remove('shake'), 500);
            console.log('[VERIFY] Validation failed: Not all zones filled');
            return false;
        }
        const userOrder = Array.from(zones).map(zone => zone.querySelector('.drop-area').textContent.trim());
        userSortings[activity.task] = userOrder;
        localStorage.setItem('userSortings', JSON.stringify(userSortings));
        console.log('[VERIFY] User sorting saved:', userOrder);
        let score = 0;

        if (currentCategory === 'career_exploration') {
            const correctAnswers = activity.correctAnswers || {};
            let isCorrect = true;
            zones.forEach(zone => {
                const career = zone.dataset.zone;
                const reality = zone.querySelector('.drop-area').textContent.trim();
                if (correctAnswers[career] !== reality) {
                    isCorrect = false;
                }
            });
            if (isCorrect) {
                zones.forEach(zone => {
                    const reality = zone.querySelector('.drop-area').textContent.trim();
                    score += activity.itemWeights[reality] || 2;
                });
            }
            console.log('[VERIFY] Career exploration score:', score, 'Correct:', isCorrect);
        } else if (currentCategory === 'career_value_sorting') {
            const correctOrder = activity.correctOrder || [];
            const isCorrect = userOrder.every((item, idx) => item === correctOrder[idx]);
            if (isCorrect) {
                const topItem = userOrder[0];
                score = activity.itemWeights[topItem] || 2.5;
            }
            console.log('[VERIFY] Career value sorting score:', score, 'Correct:', isCorrect);
        }

        activityDiv.dataset.score = Math.min(score, 10);
        activityDiv.dataset.completed = 'true';
        errorDiv.textContent = 'Response accepted!';
        errorDiv.style.color = '#388e3c';
        console.log('[VERIFY] Submission accepted, score:', score);
        return true;
    } else if (type === 'scenario') {
        const hintKeywords = activity.hintKeywords || extractHintKeywords(activity.hint);
        let score = 0;
        if (input && input.value.trim()) {
            const text = input.value.toLowerCase();
            const keywordCount = hintKeywords.filter(kw => text.includes(kw.toLowerCase())).length;
            score = Math.min(keywordCount * 2, 10);
        } else {
            errorDiv.textContent = 'Please enter a response.';
            input.classList.add('error-border');
            console.log('[VERIFY] Scenario failed: No response entered');
            return false;
        }
        activityDiv.dataset.score = score;
        activityDiv.dataset.completed = 'true';
        input.classList.remove('error-border');
        input.classList.add('success-border');
        errorDiv.textContent = 'Response accepted!';
        errorDiv.style.color = '#388e3c';
        console.log('[VERIFY] Scenario accepted, score:', score);
        return true;
    } else if (type === 'quiz') {
        let score = 0;
        if (input && input.value.trim()) {
            if (input.value === activity.correctAnswer) {
                score = 10;
            }
        } else {
            errorDiv.textContent = 'Please select an option.';
            console.log('[VERIFY] Quiz failed: No option selected');
            return false;
        }
        activityDiv.dataset.score = score;
        activityDiv.dataset.completed = 'true';
        input.classList.remove('error-border');
        input.classList.add('success-border');
        errorDiv.textContent = 'Response accepted!';
        errorDiv.style.color = '#388e3c';
        console.log('[VERIFY] Quiz accepted, score:', score);
        return true;
    }
    console.log('[VERIFY] Invalid activity type:', type);
    return false;
}

// Check if activity is completed
function isActivityCompleted() {
    if (!selectedActivities || selectedActivities.length === 0) {
        console.log('[CHECK] No activities selected');
        return false;
    }
    const completed = selectedActivities.every((activity, index) => {
        const activityDiv = document.querySelector(`#activity-${index}`);
        if (!activityDiv) {
            console.log(`[CHECK] Activity div not found for index ${index}`);
            return false;
        }
        const isCompleted = verifyActivityResponse(activity, activityDiv);
        console.log(`[CHECK] Activity ${index} completed:`, isCompleted);
        return isCompleted;
    });
    console.log('[CHECK] All activities completed:', completed);
    return completed;
}

// Fetch questions for psychometric
async function loadQuestions(category, retries = 3) {
    if (!psychoCategories.includes(category)) {
        console.error(`[LOAD] Invalid psychometric category: ${category}`);
        return [];
    }
    console.log(`[LOAD] Fetching questions: questions-6to8-${category}_english.json`);
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(`questions-6to8-${category}_english.json?cachebust=${Date.now()}`, {
                method: 'GET',
                cache: 'no-store'
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (!Array.isArray(data) || data.length < 3) throw new Error(`Invalid data: ${data.length} items`);
            console.log(`[LOAD] Loaded ${data.length} questions`);
            return data.filter(q => q.q && Array.isArray(q.o) && q.a);
        } catch (error) {
            console.error(`[LOAD] Attempt ${attempt}/${retries}: ${error.message}`);
            if (attempt === retries) {
                assessmentContent.innerHTML = `<p style="color: #d32f2f;">Error: Unable to load questions for ${categoryDisplayNames[category]}. Check if file 'questions-6to8-${category}_english.json' exists.</p>`;
                return [];
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

// Fetch activities
async function loadActivities(category, retries = 3) {
    if (!activityCategories.includes(category)) {
        console.error(`[LOAD] Invalid activity category: ${category}`);
        return [];
    }
    console.log(`[LOAD] Fetching activities: activities-6to8-${category}_english.json`);
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(`activities-6to8-${category}_english.json?cachebust=${Date.now()}`, {
                method: 'GET',
                cache: 'no-store'
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (!Array.isArray(data) || data.length === 0) throw new Error(`Invalid data: ${data.length} items`);
            console.log(`[LOAD] Loaded ${data.length} activities`);
            return data.filter(activity => {
                if (!activity.task || !activity.type) return false;
                if (activity.type === 'drag_drop' && (!Array.isArray(activity.items) || !Array.isArray(activity.zones))) return false;
                if (activity.type === 'quiz' && (!activity.question || !Array.isArray(activity.options) || !activity.correctAnswer)) return false;
                if (activity.type === 'scenario' && !activity.scenario) return false;
                return true;
            });
        } catch (error) {
            console.error(`[LOAD] Attempt ${attempt}/${retries}: ${error.message}`);
            if (attempt === retries) {
                assessmentContent.innerHTML = `<p style="color: #d CCA3f2f;">Error: Unable to load activities for ${categoryDisplayNames[category]}. Check if file 'activities-6to8-${category}_english.json' exists.</p>`;
                return [];
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

// Select random items
function getRandomItems(array, count) {
    if (!array || !Array.isArray(array)) return [];
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, array.length));
}

// Initialize questions
async function initQuestions() {
    console.log('[INIT] Initializing psychometric questions for category:', currentCategory);
    assessmentContent = document.getElementById('assessmentContent');
    startBtn = document.getElementById('startBtn');
    if (!assessmentContent) {
        console.error('[INIT] assessmentContent missing');
        return false;
    }
    if (!startBtn) {
        console.error('[INIT] startBtn missing, creating fallback');
        startBtn = document.createElement('button');
        startBtn.id = 'startBtn';
        startBtn.textContent = 'Start';
        startBtn.style.cursor = 'not-allowed';
        startBtn.disabled = true;
        const instructions = document.getElementById('instructions');
        if (instructions) instructions.appendChild(startBtn);
    }
    assessmentContent.innerHTML = `<p>Loading questions...</p>`;
    const data = await loadQuestions(currentCategory);
    if (data.length > 0) {
        selectedActivities = getRandomItems(data, 2);
        assessmentContent.innerHTML = `<p>Questions for ${categoryDisplayNames[currentCategory]} loaded. Press "Start" to begin.</p>`;
        startBtn.disabled = false;
        startBtn.removeAttribute('disabled');
        startBtn.style.cursor = 'pointer';
        startBtn.style.pointerEvents = 'auto';
        startBtn.classList.remove('disabled');
        console.log('[INIT] Button state:', {
            disabled: startBtn.disabled,
            style: startBtn.style.cssText,
            classList: startBtn.classList.toString()
        });
        startBtn.addEventListener('click', handleStartButtonClick);
        console.log('[INIT] Psychometric questions loaded successfully:', selectedActivities.length);
        return true;
    }
    startBtn.disabled = true;
    startBtn.style.cursor = 'not-allowed';
    console.error('[INIT] Failed to load psychometric questions');
    return false;
}

// Handle start button click
function handleStartButtonClick() {
    try {
        console.log('[START] Start button clicked');
        if (startBtn.disabled) {
            console.warn('[START] Button is disabled, ignoring click');
            return;
        }
        instructions.classList.add('hidden');
        timerDisplay.classList.remove('hidden');
        assessmentContent.classList.remove('hidden');
        categoryCompletion.classList.add('hidden');
        startTimer();
        if (selectedActivities.length > 0) {
            if (isPsychometric) {
                console.log('[START] Showing psychometric questions');
                showPsychometricQuestions();
            } else {
                console.log('[START] Showing activities');
                showActivities();
            }
        } else {
            console.warn('[START] No activities selected, retrying load');
            assessmentContent.innerHTML = `<p>Retrying...</p>`;
            (isPsychometric ? initQuestions : initActivities)().then(success => {
                if (success) {
                    if (isPsychometric) showPsychometricQuestions();
                    else showActivities();
                } else {
                    assessmentContent.innerHTML = `<p style="color: #d32f2f;">Error: Unable to load questions.</p>`;
                }
            });
        }
    } catch (error) {
        console.error('[START] Error in start button handler:', error.message);
        assessmentContent.innerHTML = `<p style="color: #d32f2f;">Error: Unable to start. Check console for details.</p>`;
    }
}

// Start timer
function startTimer() {
    console.log('[TIMER] Starting');
    timeLeft = isPsychometric ? 10 * 60 : 5 * 60;
    timerInterval = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `Time Remaining: ${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
        if (timeLeft <= 0) {
            console.log('[TIMER] Done');
            clearInterval(timerInterval);
            alert('Time is up!');
            showCategoryCompletion();
        }
    }, 1000);
}

// Show psychometric questions
function showPsychometricQuestions() {
    console.log('[RENDER] Rendering psychometric:', categoryDisplayNames[currentCategory]);
    let html = `<h3 class="category-title">${categoryDisplayNames[currentCategory]}</h3>`;
    selectedActivities.forEach((question, index) => {
        if (!question.q || !Array.isArray(question.o) || !question.a) {
            console.warn(`[RENDER] Skipping invalid question at index ${index}`);
            return;
        }
        html += `
            <div class="question-card">
                <p class="question-text">${index + 1}. ${question.q}</p>
                <div class="options">
                    ${question.o.map(opt => `
                        <label class="option-label">
                            <input type="radio" name="answer-${index}" value="${opt}">
                            <span>${opt}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    });
    html += `<button id="submitBtn" class="btn primary-btn">Submit</button>`;
    assessmentContent.innerHTML = html;

    // Psychometric-specific CSS
    const style = document.createElement('style');
    style.textContent = `
        * {
            box-sizing: border-box;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .category-title {
            font-size: 24px;
            font-weight: 600;
            color: #1a237e;
            margin-bottom: 20px;
            text-align: center;
        }
        .question-card {
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            padding: 20px;
            margin: 20px auto;
            max-width: 700px;
        }
        .question-text {
            font-size: 18px;
            font-weight: 500;
            color: #212121;
            margin-bottom: 15px;
        }
        .options {
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 10px;
        }
        .option-label {
            display: flex;
            align-items: center;
            font-size: 16px;
            color: #424242;
            cursor: pointer;
        }
        .option-label input {
            margin-right: 10px;
        }
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
        }
        .primary-btn {
            background: #3f51b5;
            color: #ffffff;
        }
        .primary-btn:hover {
            background: #303f9f;
        }
        #startBtn {
            pointer-events: auto !important;
        }
        #startBtn.disabled {
            cursor: not-allowed;
            background: #e0e0e0;
        }
        @media (max-width: 600px) {
            .question-card {
                padding: 15px;
                margin: 10px;
            }
            .category-title {
                font-size: 20px;
            }
            .question-text {
                font-size: 16px;
            }
        }
    `;
    document.head.appendChild(style);

    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            console.log('[SUBMIT] Psychometric Submit clicked');
            if (!selectedActivities.every((_, index) => document.querySelector(`input[name="answer-${index}"]:checked`))) {
                alert('Please complete all questions.');
                return;
            }
            let rawScore = 0;
            selectedActivities.forEach((question, index) => {
                const selected = document.querySelector(`input[name="answer-${index}"]:checked`);
                if (selected && selected.value === question.a) {
                    rawScore += 10;
                }
            });
            const normalizedScore = (rawScore / 150) * 100;
            categoryScores[currentCategory] = normalizedScore;
            totalScore += rawScore;
            localStorage.setItem('totalScore', totalScore);
            localStorage.setItem('categoryScores', JSON.stringify(categoryScores));
            completedCategories.psychometric = [...new Set([...completedCategories.psychometric, currentCategory])];
            localStorage.setItem('completedCategories', JSON.stringify(completedCategories));
            console.log(`[SUBMIT] Psychometric score: ${rawScore}/150, Normalized: ${normalizedScore}/100`);
            clearInterval(timerInterval);
            showCategoryCompletion();
        });
    }
}

// Show activity tasks
function showActivities() {
    console.log('[RENDER] Rendering activity:', categoryDisplayNames[currentCategory]);
    if (!selectedActivities || selectedActivities.length === 0) {
        console.error('[RENDER] No activities available');
        assessmentContent.innerHTML = `<p style="color: #d32f2f;">Error: No activities available.</p>`;
        return;
    }
    let html = `
        <h3 class="category-title">${categoryDisplayNames[currentCategory]}</h3>
        <div id="progress" class="progress-bar">Progress: 0/${selectedActivities.length} activities completed</div>
    `;
    selectedActivities.forEach((activity, index) => {
        if (!activity.task || !activity.type) {
            console.warn(`[RENDER] Skipping invalid activity at index ${index}: Missing task or type`);
            return;
        }
        html += `<div class="activity-card" id="activity-${index}" data-completed="false">`;
        html += `<p class="activity-text">${index + 1}. ${activity.task}</p>`;
        if (activity.type === 'drag_drop') {
            if (!Array.isArray(activity.items) || !Array.isArray(activity.zones)) {
                console.warn(`[RENDER] Skipping drag_drop at index ${index}: Missing items or zones`);
                return;
            }
            const shuffledItems = [...activity.items].sort(() => 0.5 - Math.random());
            html += `
                <div class="drag-container" id="drag-container-${index}">
                    <div class="items">
                        ${shuffledItems.map(item => `<div class="draggable" draggable="true" data-item="${item}">${item}</div>`).join('')}
                    </div>
                    <div class="drop-zones ${currentCategory === 'career_exploration' ? 'collapsible' : ''}">
                        ${activity.zones.map(zone => `
                            <div class="drop-zone" data-zone="${zone}" data-activity="${index}">
                                <span class="zone-label">${zone}</span>
                                <div class="drop-area">Drop here</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="button-group">
                    <button class="submit-text btn primary-btn">Submit</button>
                </div>
                <div class="error-message"></div>
            `;
        } else if (activity.type === 'scenario') {
            if (!activity.scenario) {
                console.warn(`[RENDER] Skipping scenario at index ${index}: Missing scenario text`);
                return;
            }
            html += `
                <p class="scenario-text">${activity.scenario}</p>
                <textarea class="text-input" placeholder="Enter your response..."></textarea>
                <div class="button-group">
                    <button class="submit-text btn primary-btn">Submit</button>
                </div>
                <div class="error-message"></div>
            `;
        } else if (activity.type === 'quiz') {
            if (!activity.question || !Array.isArray(activity.options) || !activity.correctAnswer) {
                console.warn(`[RENDER] Skipping quiz at index ${index}: Missing question, options, or correct answer`);
                return;
            }
            html += `
                <p class="question-text">${activity.question}</p>
                <div class="options">
                    ${activity.options.map(opt => `
                        <label class="option-label">
                            <input type="radio" name="quiz-${index}" value="${opt}">
                            <span>${opt}</span>
                        </label>
                    `).join('')}
                </div>
                <p class="hint-text">Hint: ${activity.hint}</p>
                <div class="button-group">
                    <button class="submit-quiz btn primary-btn">Submit</button>
                </div>
                <div class="error-message"></div>
            `;
        } else {
            console.warn(`[RENDER] Skipping unknown activity type at index ${index}: ${activity.type}`);
            return;
        }
        html += `</div>`;
    });
    html += `<button id="submitBtn" class="btn primary-btn">Submit Category</button>`;
    assessmentContent.innerHTML = html;

    // Activity-specific CSS
    const style = document.createElement('style');
    style.textContent = `
        * {
            box-sizing: border-box;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .category-title {
            font-size: 24px;
            font-weight: 600;
            color: #1a237e;
            margin-bottom: 20px;
            text-align: center;
        }
        .progress-bar {
            font-size: 16px;
            color: #424242;
            background: #e8eaf6;
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
        }
        .activity-card {
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            padding: 20px;
            margin: 20px auto;
            max-width: 700px;
        }
        .activity-text {
            font-size: 18px;
            font-weight: 500;
            color: #212121;
            margin-bottom: 15px;
        }
        .scenario-text {
            font-size: 16px;
            color: #616161;
            margin-bottom: 15px;
            font-style: italic;
        }
        .hint-text {
            font-size: 14px;
            color: #757575;
            margin: 10px 0;
            font-style: italic;
        }
        .options {
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 10px;
        }
        .option-label {
            display: flex;
            align-items: center;
            font-size: 16px;
            color: #424242;
            cursor: pointer;
        }
        .option-label input {
            margin-right: 10px;
        }
        .drag-container {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .items {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .draggable {
            background: #e3f2fd;
            padding: 12px;
            border-radius: 6px;
            cursor: move;
            font-size: 16px;
            user-select: none;
        }
        .draggable.disabled {
            background: #e0e0e0;
            cursor: not-allowed;
            opacity: 0.5;
        }
        .drop-zones {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .drop-zones.collapsible .drop-area {
            display: none;
        }
        .drop-zones.collapsible.expanded .drop-area {
            display: block;
        }
        .drop-zone {
            display: flex;
            align-items: center;
            background: #f5f5f5;
            padding: 12px;
            margin: 8px 0;
            border: 2px dashed #bdbdbd;
            border-radius: 6px;
            min-height: 40px;
            font-size: 16px;
        }
        .drop-zone.filled {
            background: #c8e6c9;
            border: 2px solid #388e3c;
        }
        .drop-zone.filled .drop-area {
            display: block;
        }
        .drop-zone.hover .drop-area {
            background: #e8f5e9;
            border: 2px dashed #388e3c;
        }
        .zone-label {
            flex: 1;
            font-weight: 500;
            color: #212121;
        }
        .drop-area {
            flex: 2;
            text-align: center;
        }
        .text-input {
            width: 100%;
            padding: 12px;
            margin: 10px 0;
            border: 1px solid #bdbdbd;
            border-radius: 6px;
            font-size: 16px;
            resize: vertical;
        }
        .text-input:focus {
            border: 1px solid #3f51b5;
            outline: none;
        }
        .error-border {
            border: 2px solid #d32f2f;
        }
        .success-border {
            border: 2px solid #388e3c;
        }
        .error-message {
            font-size: 14px;
            margin-top: 10px;
            min-height: 20px;
        }
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
        }
        .primary-btn {
            background: #3f51b5;
            color: #ffffff;
        }
        .primary-btn:hover {
            background: #303f9f;
        }
        .secondary-btn {
            background: #e0e0e0;
            color: #424242;
            margin-left: 10px;
        }
        .secondary-btn:hover {
            background: #bdbdbd;
        }
        .button-group {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }
        .shake {
            animation: shake 0.5s;
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(-5px); }
        }
        @media (max-width: 600px) {
            .activity-card {
                padding: 15px;
                margin: 10px;
            }
            .category-title {
                font-size: 20px;
            }
            .activity-text {
                font-size: 16px;
            }
            .draggable {
                padding: 10px;
                font-size: 14px;
            }
            .drop-zone {
                padding: 10px;
                font-size: 14px;
            }
        }
    `;
    document.head.appendChild(style);

    // Setup drag-and-drop
    selectedActivities.forEach((activity, index) => {
        if (activity.type !== 'drag_drop') return;
        const container = document.getElementById(`drag-container-${index}`);
        if (!container) {
            console.warn(`[SETUP] Drag container not found for activity ${index}`);
            return;
        }
        const draggables = container.querySelectorAll('.draggable');
        const dropZones = container.querySelectorAll('.drop-zone');
        let dragHistory = [];
        let placedItems = {};

        dropZones.forEach(zone => {
            const dropArea = zone.querySelector('.drop-area');
            if (dropArea) {
                dropArea.textContent = 'Drop here';
                zone.classList.remove('filled');
            } else {
                console.warn(`[SETUP] Drop area not found in zone for activity ${index}`);
            }
        });

        function updateDraggables() {
            const placed = Object.values(placedItems);
            draggables.forEach(draggable => {
                const item = draggable.dataset.item;
                if (placed.includes(item)) {
                    draggable.classList.add('disabled');
                    draggable.setAttribute('draggable', 'false');
                } else {
                    draggable.classList.remove('disabled');
                    draggable.setAttribute('draggable', 'true');
                }
            });
            console.log('[DRAG] Updated draggables, placed items:', placed);
        }

        draggables.forEach(draggable => {
            draggable.addEventListener('dragstart', e => {
                if (draggable.classList.contains('disabled')) {
                    e.preventDefault();
                    console.log('[DRAG] Drag prevented: Item disabled');
                    return;
                }
                e.dataTransfer.setData('text', e.target.dataset.item);
                draggable.classList.add('dragging');
                console.log('[DRAG] Drag started:', e.target.dataset.item);
            });
            draggable.addEventListener('dragend', () => {
                draggable.classList.remove('dragging');
                console.log('[DRAG] Drag ended');
            });
        });

        dropZones.forEach(zone => {
            const dropArea = zone.querySelector('.drop-area');
            if (!dropArea) {
                console.warn(`[SETUP] Drop area missing for zone ${zone.dataset.zone}`);
                return;
            }
            zone.addEventListener('dragover', e => {
                e.preventDefault();
                if (!zone.classList.contains('filled')) {
                    dropArea.classList.add('hover');
                }
            });
            zone.addEventListener('dragleave', () => {
                dropArea.classList.remove('hover');
            });
            zone.addEventListener('drop', e => {
                e.preventDefault();
                dropArea.classList.remove('hover');
                const item = e.dataTransfer.getData('text');
                if (!zone.classList.contains('filled') && item) {
                    dropZones.forEach(z => {
                        const zDropArea = z.querySelector('.drop-area');
                        if (z !== zone && zDropArea && zDropArea.textContent === item) {
                            zDropArea.textContent = 'Drop here';
                            z.classList.remove('filled');
                            delete placedItems[z.dataset.zone];
                            console.log('[DRAG] Cleared item from zone:', z.dataset.zone);
                        }
                    });
                    dropArea.textContent = item;
                    zone.classList.add('filled');
                    placedItems[zone.dataset.zone] = item;
                    dragHistory.push({ zone, item });
                    updateDraggables();
                    updateProgress();
                    console.log('[DRAG] Item dropped:', item, 'in zone:', zone.dataset.zone, 'History:', dragHistory.length);
                } else {
                    console.log('[DRAG] Drop ignored: Zone filled or invalid item');
                }
            });
        });

        const undoDrag = container.querySelector('.undo-drag');
        if (undoDrag) {
            undoDrag.addEventListener('click', () => {
                console.log('[UNDO] Undo clicked for activity', index);
                if (dragHistory.length === 0) {
                    console.log('[UNDO] Nothing to undo');
                    return;
                }
                dragHistory = [];
                dropZones.forEach(zone => {
                    const dropArea = zone.querySelector('.drop-area');
                    if (dropArea) {
                        dropArea.textContent = 'Drop here';
                        zone.classList.remove('filled');
                    }
                });
                placedItems = {};
                updateDraggables();
                updateProgress();
                console.log('[UNDO] Reset all drop zones for activity', index);
            });
        } else {
            console.error('[SETUP] Undo-drag button not found for activity', index);
        }

        const toggleCollapse = container.querySelector('.toggle-collapse');
        if (toggleCollapse) {
            toggleCollapse.addEventListener('click', () => {
                const dropZonesDiv = container.querySelector('.drop-zones');
                dropZonesDiv.classList.toggle('expanded');
                toggleCollapse.textContent = dropZonesDiv.classList.contains('expanded') ? 'Hide Realities' : 'Show Realities';
                console.log('[TOGGLE] Realities toggled:', dropZonesDiv.classList.contains('expanded') ? 'expanded' : 'collapsed');
            });
        }
    });

    // Update progress
    function updateProgress() {
        const completed = selectedActivities.filter((_, i) => {
            const activityDiv = document.querySelector(`#activity-${i}`);
            return activityDiv && activityDiv.dataset.completed === 'true';
        }).length;
        const progressBar = document.getElementById('progress');
        if (progressBar) {
            progressBar.textContent = `Progress: ${completed}/${selectedActivities.length} activities completed`;
        }
        console.log('[PROGRESS] Updated:', completed, '/', selectedActivities.length);
    }

    document.querySelectorAll('.text-input').forEach((input, idx) => {
        input.addEventListener('input', () => {
            input.classList.remove('error-border', 'success-border');
            input.closest('.activity-card').querySelector('.error-message').textContent = '';
        });
    });

    document.querySelectorAll('.submit-text').forEach((btn, idx) => {
        btn.addEventListener('click', e => {
            console.log('[SUBMIT] Text submit clicked for activity', idx);
            const activityDiv = e.target.closest('.activity-card');
            if (verifyActivityResponse(selectedActivities[idx], activityDiv)) {
                activityDiv.dataset.completed = 'true';
                updateProgress();
            }
        });
    });

    document.querySelectorAll('.submit-quiz').forEach((btn, idx) => {
        btn.addEventListener('click', e => {
            console.log('[SUBMIT] Quiz submit clicked for activity', idx);
            const activityDiv = e.target.closest('.activity-card');
            if (verifyActivityResponse(selectedActivities[idx], activityDiv)) {
                activityDiv.dataset.completed = 'true';
                updateProgress();
            }
        });
    });

    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            console.log('[SUBMIT] Submit Category clicked');
            if (!isActivityCompleted()) {
                alert('Please complete all activities.');
                console.log('[SUBMIT] Category submission blocked: Not all activities completed');
                return;
            }
            let rawScore = 0;
            selectedActivities.forEach((_, index) => {
                const activityDiv = document.querySelector(`#activity-${index}`);
                if (activityDiv.dataset.completed === 'true') {
                    rawScore += parseInt(activityDiv.dataset.score) || 0;
                }
            });
            const normalizedScore = (rawScore / (selectedActivities.length * 10)) * 100;
            activityScores[currentCategory] = normalizedScore;
            localStorage.setItem('activityScores', JSON.stringify(activityScores));
            completedCategories.activity = [...new Set([...completedCategories.activity, currentCategory])];
            localStorage.setItem('completedCategories', JSON.stringify(completedCategories));
            console.log(`[SUBMIT] Activity score: ${rawScore}/${selectedActivities.length * 10}, Normalized: ${normalizedScore}/100`);
            clearInterval(timerInterval);
            showCategoryCompletion();
        });
    } else {
        console.error('[SETUP] Submit Category button (#submitBtn) not found');
    }
}

// Show category completion message
function showCategoryCompletion() {
    console.log('[COMPLETION] Showing for:', categoryDisplayNames[currentCategory]);
    if (!categoryCompletion || !completionMessage || !nextBtn) {
        console.error('[COMPLETION] Missing DOM elements');
        if (assessmentContent) {
            assessmentContent.innerHTML = `
                <div class="category-completion">
                    <p>${categoryDisplayNames[currentCategory]} category completed!</p>
                    <button id="fallbackNextBtn" class="btn primary-btn">Next</button>
                </div>
            `;
            const fallbackNextBtn = document.getElementById('fallbackNextBtn');
            if (fallbackNextBtn) {
                fallbackNextBtn.addEventListener('click', moveToNextCategoryOrFinish);
            }
        }
        return;
    }
    assessmentContent.classList.add('hidden');
    timerDisplay.classList.add('hidden');
    categoryCompletion.classList.remove('hidden');
    completionMessage.textContent = `${categoryDisplayNames[currentCategory]} category completed! Click Next to continue.`;
    nextBtn.classList.remove('hidden');
    nextBtn.disabled = false;
    nextBtn.style.cursor = 'pointer';
}

// Move to next category
function moveToNextCategoryOrFinish() {
    console.log('[NAV] Moving from:', categoryDisplayNames[currentCategory]);
    try {
        const categories = isPsychometric ? psychoCategories : activityCategories;
        const nextCategoryIndex = categoryIndex + 1;
        const htmlFile = isPsychometric ? 'psychometric-assessment-6to8-english' : 'activity-assessment-6to8-english';
        if (nextCategoryIndex < categories.length) {
            const nextCategory = categories[nextCategoryIndex];
            console.log('[NAV] Navigating to:', `${htmlFile}.html?category=${nextCategory}`);
            window.location.href = `${htmlFile}.html?category=${nextCategory}`;
        } else {
            categoryCompletion.classList.add('hidden');
            if (finalCompletion) {
                finalCompletion.classList.remove('hidden');
            } else {
                console.warn('[NAV] finalCompletion element missing, showing fallback');
                assessmentContent.innerHTML = `
                    <div class="final-completion">
                        <p>All ${isPsychometric ? 'psychometric' : 'activity'} categories completed!</p>
                        ${isActivity ? '<button id="fallbackDownloadBtn" class="btn primary-btn">Download Report</button>' : ''}
                    </div>
                `;
                const fallbackDownloadBtn = document.getElementById('fallbackDownloadBtn');
                if (fallbackDownloadBtn) {
                    fallbackDownloadBtn.addEventListener('click', generatePDF);
                }
            }
            if (isPsychometric) {
                localStorage.setItem('psychometricCompleted', 'true');
            } else {
                localStorage.setItem('activityCompleted', 'true');
                if (downloadBtn) {
                    downloadBtn.disabled = !areAllCategoriesCompleted();
                    downloadBtn.style.cursor = areAllCategoriesCompleted() ? 'pointer' : 'not-allowed';
                }
            }
        }
    } catch (error) {
        console.error('[NAV] Error:', error.message);
        if (navError) navError.classList.remove('hidden');
        alert('Unable to load the next category. Check network connection or file paths.');
    }
}

// Calculate holistic score
function calculateHolisticScore() {
    let holisticScore = 0;
    for (const [cat, score] of Object.entries(categoryScores)) {
        holisticScore += score * weights[cat];
    }
    for (const [cat, score] of Object.entries(activityScores)) {
        holisticScore += score * weights[cat];
    }
    return Math.round(holisticScore);
}

// Calculate RIASEC scores
function calculateRiasecScores() {
    const riasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    for (const [cat, score] of Object.entries(categoryScores)) {
        riasecMapping[cat].forEach(trait => {
            riasecScores[trait] += score / riasecMapping[cat].length;
        });
    }
    for (const [cat, score] of Object.entries(activityScores)) {
        riasecMapping[cat].forEach(trait => {
            riasecScores[trait] += score / riasecMapping[cat].length;
        });
    }
    return riasecScores;
}

// Select top careers by domain
function selectTopCareersByDomain(riasecScores) {
    const domainCareers = {};
    Object.keys(careerDomains).forEach(domain => {
        const domainInfo = careerDomains[domain];
        const domainScore = domainInfo.riasec.reduce((sum, trait) => sum + (riasecScores[trait] || 0), 0) / domainInfo.riasec.length +
            domainInfo.categories.reduce((sum, cat) => sum + (categoryScores[cat] || activityScores[cat] || 0), 0) / domainInfo.categories.length;
        const sortedCareers = domainInfo.careers
            .map(career => ({
                ...career,
                relevance: domainScore
            }))
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, 3);
        domainCareers[domain] = sortedCareers;
        console.log(`[CAREER] Domain ${domain} score: ${domainScore}, Selected careers:`, sortedCareers.map(c => c.title));
    });
    return domainCareers;
}

// Fetch O*NET careers (fallback)
async function fetchOnetCareers(riasecScores, retries = 3) {
    console.log('[ONET] Fetching careers for RIASEC:', riasecScores);
    try {
        const apiScores = {
            realistic: riasecScores.R || 0,
            investigative: riasecScores.I || 0,
            artistic: riasecScores.A || 0,
            social: riasecScores.S || 0,
            enterprising: riasecScores.E || 0,
            conventional: riasecScores.C || 0
        };
        const maxScore = Math.max(...Object.values(apiScores));
        if (maxScore > 0) {
            Object.keys(apiScores).forEach(key => {
                apiScores[key] = Math.round((apiScores[key] / maxScore) * 100);
            });
        }
        const response = await fetch('https://services.onetcenter.org/ws/mnm/interestprofiler/results', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + btoa(`${onetUsername}:${onetPassword}`),
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(apiScores)
        });
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        if (!data.career || !Array.isArray(data.career)) throw new Error('Invalid response: No careers found');
        const careers = data.career.slice(0, 5).map(c => ({
            title: c.title || 'Unknown Career',
            code: c.code || 'N/A',
            description: c.description || 'No description available.'
        }));
        console.log('[ONET] Fetched careers:', careers.map(c => c.title));
        return careers;
    } catch (error) {
        console.error(`[ONET] Attempt ${4 - retries}/${3}: ${error.message}`);
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return await fetchOnetCareers(riasecScores, retries - 1);
        }
        console.warn('[ONET] Using fallback careers');
        return [
            { title: 'Web Developer', code: '15-1254.00', description: 'Design and maintain websites.' },
            { title: 'Database Administrator', code: '15-1242.00', description: 'Manage and organize data systems.' },
            { title: 'Market Research Analyst', code: '13-1161.00', description: 'Study market trends and consumer behavior.' },
            { title: 'Environmental Engineer', code: '17-2081.00', description: 'Address environmental challenges.' },
            { title: 'School Counselor', code: '21-1012.00', description: 'Support student development.' }
        ];
    }
}

// Create bar chart
async function createBarChart() {
    console.log('[CHART] Creating bar chart');
    return new Promise((resolve, reject) => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 340;
            canvas.height = 170;
            document.body.appendChild(canvas);
            canvas.style.position = 'absolute';
            canvas.style.left = '-9999px';

            const ctx = canvas.getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: [
                        'Aptitude', 'Emotional Intelligence', 'Cognitive Ability', 'Career Knowledge', 'Interest', 'Leadership',
                        'Career Exploration', 'Career Value Sorting', 'Roleplay', 'Career Reality Quiz'
                    ],
                    datasets: [{
                        label: 'Scores',
                        data: [
                            categoryScores.aptitude || 0,
                            categoryScores.emotional || 0,
                            categoryScores.cognitive || 0,
                            categoryScores.career || 0,
                            categoryScores.interest || 0,
                            categoryScores.leadership || 0,
                            activityScores.career_exploration || 0,
                            activityScores.career_value_sorting || 0,
                            activityScores.roleplay || 0,
                            activityScores.career_reality_quiz || 0
                        ],
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                            '#9966FF', '#FF9F40', '#7BC043', '#FF99CC',
                            '#66CCCC', '#FF6666'
                        ],
                        borderColor: '#003366',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: { beginAtZero: true, max: 100, title: { display: true, text: 'Normalized Score' } }
                    },
                    plugins: {
                        legend: { display: false },
                        title: { display: true, text: 'Assessment Scores', font: { size: 14, weight: 'bold' } }
                    }
                }
            });

            setTimeout(() => {
                const imgData = canvas.toDataURL('image/png');
                canvas.remove();
                resolve(imgData);
            }, 500);
        } catch (error) {
            console.error('[CHART] Bar chart error:', error.message);
            reject(error);
        }
    });
}

// Create pie chart
async function createPieChart(riasecScores) {
    console.log('[CHART] Creating pie chart');
    return new Promise((resolve, reject) => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 170;
            canvas.height = 170;
            document.body.appendChild(canvas);
            canvas.style.position = 'absolute';
            canvas.style.left = '-9999px';

            const ctx = canvas.getContext('2d');
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: Object.keys(riasecScores),
                    datasets: [{
                        data: Object.values(riasecScores),
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56',
                            '#4BC0C0', '#9966FF', '#FF9F40'
                        ],
                        borderColor: '#003366',
                        borderWidth: 1
                    }]
                },
                options: {
                    plugins: {
                        legend: { position: 'right', labels: { font: { size: 10 } } },
                        title: { display: true, text: 'Holland Code Distribution', font: { size: 14, weight: 'bold' } }
                    }
                }
            });

            setTimeout(() => {
                const imgData = canvas.toDataURL('image/png');
                canvas.remove();
                resolve(imgData);
            }, 500);
        } catch (error) {
            console.error('[CHART] Pie chart error:', error.message);
            reject(error);
        }
    });
}

// Generate PDF
async function generatePDF() {
    console.log('[PDF] Generating PDF');
    if (!areAllCategoriesCompleted()) {
        alert('Please complete all psychometric and activity categories.');
        return;
    }
    try {
        const doc = new jsPDF();
        const riasecScores = calculateRiasecScores();
        const domainCareers = selectTopCareersByDomain(riasecScores);
        const barChartImg = await createBarChart();
        const pieChartImg = await createPieChart(riasecScores);

        let y = 10;

        doc.setFontSize(16);
        doc.text('Career Assessment Report', 105, y, { align: 'center' });
        y += 10;
        doc.setFontSize(10);
        doc.text('Generated on May 20, 2025', 105, y, { align: 'center' });
        y += 10;
        doc.line(10, y, 200, y);
        y += 10;

        // Add category scores table
        doc.setFontSize(12);
        doc.text('Category Scores Summary', 10, y);
        y += 8;
        doc.setFontSize(10);
        doc.text('Category', 10, y);
        doc.text('Score (%)', 100, y);
        y += 5;
        doc.line(10, y, 150, y);
        y += 5;
        const allCategories = [...psychoCategories, ...activityCategories];
        allCategories.forEach(cat => {
            const score = categoryScores[cat] || activityScores[cat] || 0;
            doc.text(categoryDisplayNames[cat], 10, y);
            doc.text(score.toFixed(1), 100, y);
            y += 8;
        });
        y += 5;

        // Add bar chart
        doc.setFontSize(12);
        doc.text('Assessment Category Scores', 10, y);
        y += 8;
        doc.addImage(barChartImg, 'PNG', 10, y, 190, 95);
        y += 105;

        // Add pie chart
        doc.setFontSize(12);
        doc.text('Holland Code Distribution', 10, y);
        y += 8;
        doc.addImage(pieChartImg, 'PNG', 80, y, 50, 50);
        y += 60;

        // Add career recommendations
        doc.setFontSize(12);
        doc.text('Career Recommendations by Domain', 10, y);
        y += 8;
        doc.setFontSize(10);
        const domainNames = {
            arts: 'Arts',
            science: 'Science',
            computer: 'Computer',
            commerce: 'Commerce',
            engineering: 'Engineering'
        };
        for (const [domain, careers] of Object.entries(domainCareers)) {
            if (y > 250) {
                doc.addPage();
                y = 10;
            }
            doc.setFontSize(12);
            doc.text(domainNames[domain], 10, y);
            y += 8;
            doc.setFontSize(10);
            careers.forEach((c, i) => {
                doc.text(`${i + 1}. ${c.title} (${c.code})`, 15, y);
                y += 6;
                doc.text(`Description: ${c.description}`, 20, y, { maxWidth: 175 });
                y += 10;
            });
            y += 5;
        }

        // Add career info page description
        if (y > 250) {
            doc.addPage();
            y = 10;
        }
        doc.setFontSize(10);
        doc.text('For more information about your career options, visit the Career Info page at our website:', 10, y, { maxWidth: 190 });
        y += 5;
        doc.text('https://careerpath.example.com', 10, y);
        y += 10;

        doc.line(10, y, 200, y);
        y += 5;
        doc.text('CareerPath Assessment', 105, y, { align: 'center' });

        doc.save('Career_Assessment_Report_6to8.pdf');
        console.log('[PDF] PDF generated successfully');
        localStorage.clear();
    } catch (error) {
        console.error('[PDF] Error:', error.message);
        if (pdfError) pdfError.classList.remove('hidden');
        alert('Unable to create PDF. Check console for errors.');
    }
}

// Initialize activities
async function initActivities() {
    console.log('[INIT] Initializing activities for category:', currentCategory);
    assessmentContent = document.getElementById('assessmentContent');
    startBtn = document.getElementById('startBtn');
    if (!assessmentContent) {
        console.error('[INIT] assessmentContent missing');
        return false;
    }
    if (!startBtn) {
        console.error('[INIT] startBtn missing, creating fallback');
        startBtn = document.createElement('button');
        startBtn.id = 'startBtn';
        startBtn.textContent = 'Start';
        startBtn.style.cursor = 'not-allowed';
        startBtn.disabled = true;
        const instructions = document.getElementById('instructions');
        if (instructions) instructions.appendChild(startBtn);
    }
    assessmentContent.innerHTML = `<p>Loading activities...</p>`;
    const data = await loadActivities(currentCategory);
    if (data.length > 0) {
        selectedActivities = getRandomItems(data, 2);
        assessmentContent.innerHTML = `<p>Activities for ${categoryDisplayNames[currentCategory]} loaded. Press "Start" to begin.</p>`;
        startBtn.disabled = false;
        startBtn.removeAttribute('disabled');
        startBtn.style.cursor = 'pointer';
        startBtn.style.pointerEvents = 'auto';
        startBtn.classList.remove('disabled');
        console.log('[INIT] Button state:', {
            disabled: startBtn.disabled,
            style: startBtn.style.cssText,
            classList: startBtn.classList.toString()
        });
        startBtn.addEventListener('click', handleStartButtonClick);
        console.log('[INIT] Activities loaded successfully:', selectedActivities.length);
        return true;
    }
    startBtn.disabled = true;
    startBtn.style.cursor = 'not-allowed';
    console.error('[INIT] Failed to load activities');
    return false;
}

// DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('[DOM] DOM loaded');
    instructions = document.getElementById('instructions');
    timerDisplay = document.getElementById('timer');
    assessmentContent = document.getElementById('assessmentContent');
    nextBtn = document.getElementById('nextBtn');
    downloadBtn = document.getElementById('downloadBtn');
    pdfError = document.getElementById('pdfError');
    viewPdfLink = document.getElementById('viewPdfLink');
    categoryCompletion = document.getElementById('categoryCompletion');
    completionMessage = document.getElementById('completionMessage');
    finalCompletion = document.getElementById('finalCompletion');
    navError = document.getElementById('navError');
    startActivityBtn = document.getElementById('startActivityBtn');

    // Load Chart.js for PDF charts
    const chartScript = document.createElement('script');
    chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js';
    chartScript.async = true;
    chartScript.onload = () => console.log('[INIT] Chart.js loaded');
    chartScript.onerror = () => console.error('[INIT] Failed to load Chart.js');
    document.head.appendChild(chartScript);

    // Validate DOM elements
    if (!instructions || !timerDisplay || !assessmentContent) {
        console.error('[DOM] Missing critical elements:', {
            instructions: !!instructions,
            timerDisplay: !!timerDisplay,
            assessmentContent: !!assessmentContent
        });
        if (assessmentContent) {
            assessmentContent.innerHTML = `<p style="color: #d32f2f;">Error: Unable to load page content.</p>`;
        }
        return;
    }

    // Initialize based on assessment type
    if (isPsychometric) {
        console.log('[DOM] Initializing psychometric assessment');
        if (completedCategories.psychometric.includes(currentCategory)) {
            assessmentContent.innerHTML = `<p>${categoryDisplayNames[currentCategory]} category already completed. Proceed to the next category.</p>`;
            if (categoryCompletion) {
                categoryCompletion.classList.remove('hidden');
                completionMessage.textContent = `${categoryDisplayNames[currentCategory]} category already completed!`;
                nextBtn.classList.remove('hidden');
                nextBtn.disabled = false;
                nextBtn.style.cursor = 'pointer';
                nextBtn.addEventListener('click', moveToNextCategoryOrFinish);
            }
            return;
        }
        initQuestions();
    } else {
        console.log('[DOM] Initializing activity assessment');
        if (completedCategories.activity.includes(currentCategory)) {
            assessmentContent.innerHTML = `<p>${categoryDisplayNames[currentCategory]} category already completed. Proceed to the next category.</p>`;
            if (categoryCompletion) {
                categoryCompletion.classList.remove('hidden');
                completionMessage.textContent = `${categoryDisplayNames[currentCategory]} category already completed!`;
                nextBtn.classList.remove('hidden');
                nextBtn.disabled = false;
                nextBtn.style.cursor = 'pointer';
                nextBtn.addEventListener('click', moveToNextCategoryOrFinish);
            }
            return;
        }
        initActivities();
    }

    // Setup navigation and PDF buttons
    if (nextBtn) {
        nextBtn.addEventListener('click', moveToNextCategoryOrFinish);
    } else {
        console.warn('[DOM] nextBtn missing');
    }
    if (downloadBtn) {
        downloadBtn.addEventListener('click', generatePDF);
        downloadBtn.disabled = !areAllCategoriesCompleted();
        downloadBtn.style.cursor = areAllCategoriesCompleted() ? 'pointer' : 'not-allowed';
    } else {
        console.warn('[DOM] downloadBtn missing');
    }
    if (startActivityBtn) {
        startActivityBtn.addEventListener('click', () => {
            console.log('[NAV] Start Activity button clicked');
            window.location.href = 'activity-assessment-6to8-english.html?category=career_exploration';
        });
    }

    // Handle view PDF link
    if (viewPdfLink) {
        viewPdfLink.addEventListener('click', async () => {
            console.log('[PDF] View PDF link clicked');
            try {
                const doc = new jsPDF();
                const riasecScores = calculateRiasecScores();
                const domainCareers = selectTopCareersByDomain(riasecScores);
                const barChartImg = await createBarChart();
                const pieChartImg = await createPieChart(riasecScores);

                let y = 10;

                doc.setFontSize(16);
                doc.text('Career Assessment Report', 105, y, { align: 'center' });
                y += 10;
                doc.setFontSize(10);
                doc.text('Generated on May 20, 2025', 105, y, { align: 'center' });
                y += 10;
                doc.line(10, y, 200, y);
                y += 10;

                // Add category scores table
                doc.setFontSize(12);
                doc.text('Category Scores Summary', 10, y);
                y += 8;
                doc.setFontSize(10);
                doc.text('Category', 10, y);
                doc.text('Score (%)', 100, y);
                y += 5;
                doc.line(10, y, 150, y);
                y += 5;
                const allCategories = [...psychoCategories, ...activityCategories];
                allCategories.forEach(cat => {
                    const score = categoryScores[cat] || activityScores[cat] || 0;
                    doc.text(categoryDisplayNames[cat], 10, y);
                    doc.text(score.toFixed(1), 100, y);
                    y += 8;
                });
                y += 5;

                // Add bar chart
                doc.setFontSize(12);
                doc.text('Assessment Category Scores', 10, y);
                y += 8;
                doc.addImage(barChartImg, 'PNG', 10, y, 190, 95);
                y += 105;

                // Add pie chart
                doc.setFontSize(12);
                doc.text('Holland Code Distribution', 10, y);
                y += 8;
                doc.addImage(pieChartImg, 'PNG', 80, y, 50, 50);
                y += 60;

                // Add career recommendations
                doc.setFontSize(12);
                doc.text('Career Recommendations by Domain', 10, y);
                y += 8;
                doc.setFontSize(10);
                const domainNames = {
                    arts: 'Arts',
                    science: 'Science',
                    computer: 'Computer',
                    commerce: 'Commerce',
                    engineering: 'Engineering'
                };
                for (const [domain, careers] of Object.entries(domainCareers)) {
                    if (y > 250) {
                        doc.addPage();
                        y = 10;
                    }
                    doc.setFontSize(12);
                    doc.text(domainNames[domain], 10, y);
                    y += 8;
                    doc.setFontSize(10);
                    careers.forEach((c, i) => {
                        doc.text(`${i + 1}. ${c.title} (${c.code})`, 15, y);
                        y += 6;
                        doc.text(`Description: ${c.description}`, 20, y, { maxWidth: 175 });
                        y += 10;
                    });
                    y += 5;
                }

                // Add career info page description
                if (y > 250) {
                    doc.addPage();
                    y = 10;
                }
                doc.setFontSize(10);
                doc.text('For more information about your career options, visit the Career Info page at our website:', 10, y, { maxWidth: 190 });
                y += 5;
                doc.text('https://careerpath.example.com', 10, y);
                y += 10;

                doc.line(10, y, 200, y);
                y += 5;
                doc.text('CareerPath Assessment', 105, y, { align: 'center' });

                const pdfBlob = doc.output('blob');
                const pdfUrl = URL.createObjectURL(pdfBlob);
                window.open(pdfUrl);
                console.log('[PDF] PDF opened in new tab');
            } catch (error) {
                console.error('[PDF] View PDF error:', error.message);
                if (pdfError) pdfError.classList.remove('hidden');
                alert('Unable to view PDF. Check console for errors.');
            }
        });
    }

    // Check if all categories are completed
    if (areAllCategoriesCompleted()) {
        console.log('[DOM] All categories completed, enabling download');
        if (downloadBtn) {
            downloadBtn.disabled = false;
            downloadBtn.style.cursor = 'pointer';
        }
        if (finalCompletion) {
            finalCompletion.classList.remove('hidden');
            categoryCompletion.classList.add('hidden');
        }
    } else {
        console.log('[DOM] Not all categories completed');
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    console.log('[CLEANUP] Saving state before unload');
    localStorage.setItem('categoryScores', JSON.stringify(categoryScores));
    localStorage.setItem('activityScores', JSON.stringify(activityScores));
    localStorage.setItem('completedCategories', JSON.stringify(completedCategories));
    localStorage.setItem('totalScore', totalScore);
    localStorage.setItem('userSortings', JSON.stringify(userSortings));
});