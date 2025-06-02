// Ensure jsPDF is available
const { jsPDF } = window.jspdf;

if (document.location.pathname.includes('psychometric-assessment-9to10.html')) {
    console.log('[PSYCHO INIT] Starting psychometric assessment');

    const urlParams = new URLSearchParams(window.location.search);
    const currentCategory = urlParams.get('category') || 'aptitude';
    const psychoCategories = ['aptitude', 'personality', 'emotional', 'career', 'interest', 'cognitive', 'leadership'];
    const categoryIndex = psychoCategories.indexOf(currentCategory);

    // DOM elements
    let instructions, startBtn, timerDisplay, assessmentContent, nextBtn, completion, startActivityBtn;
    let timeLeft = 10 * 60;
    let timerInterval;
    let totalScore = localStorage.getItem('totalScore') ? parseInt(localStorage.getItem('totalScore')) : 0;
    let categoryScores = JSON.parse(localStorage.getItem('categoryScores')) || {};
    let selectedQuestions = {};

    // Fetch questions
    async function loadQuestions(category) {
        console.log(`[PSYCHO LOAD] Fetching: ${category}`);
        try {
            const response = await fetch(`questions-6to8-${category}.json?cachebust=${Date.now()}`);
            console.log(`[PSYCHO LOAD] Status: ${response.status}`);
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            const data = await response.json();
            if (!Array.isArray(data)) throw new Error('Not an array');
            if (data.length === 0) throw new Error('Empty array');
            data.forEach((q, i) => {
                if (!q.q || !Array.isArray(q.o) || q.o.length === 0 || !q.a) {
                    throw new Error(`Invalid question at ${i}`);
                }
            });
            console.log(`[PSYCHO LOAD] Loaded ${data.length} questions`);
            return data;
        } catch (error) {
            console.error(`[PSYCHO LOAD] Error: ${error.message}`);
            return null;
        }
    }

    // Select random questions
    function getRandomQuestions(questionsArray, count = 15) {
        console.log(`[PSYCHO SHUFFLE] Input: ${questionsArray?.length || 0}`);
        if (!questionsArray || !Array.isArray(questionsArray) || questionsArray.length === 0) {
            console.error('[PSYCHO SHUFFLE] Invalid input');
            return [];
        }
        const shuffled = [...questionsArray].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, Math.min(count, questionsArray.length));
        console.log(`[PSYCHO SHUFFLE] Selected ${selected.length}`);
        return selected;
    }

    // Initialize questions
    async function initQuestions() {
        assessmentContent = document.getElementById('assessmentContent');
        if (!assessmentContent) {
            console.error('[PSYCHO INIT] assessmentContent missing');
            alert('Error: Page broken.');
            return false;
        }
        assessmentContent.innerHTML = `<p>Loading questions for ${currentCategory}...</p>`;
        const data = await loadQuestions(currentCategory);
        if (data && data.length > 0) {
            selectedQuestions[currentCategory] = getRandomQuestions(data, 15);
            if (selectedQuestions[currentCategory].length > 0) {
                console.log(`[PSYCHO INIT] Assigned ${selectedQuestions[currentCategory].length} questions`);
                assessmentContent.innerHTML = `<p>Questions loaded for ${currentCategory}. Click "Start Test" to begin.</p>`;
                return true;
            } else {
                console.error('[PSYCHO INIT] No questions');
                assessmentContent.innerHTML = `<p style="color: red;">Error: No valid questions.</p>`;
            }
        } else {
            console.error('[PSYCHO INIT] Load failed');
            assessmentContent.innerHTML = `<p style="color: red;">Error: Failed to load questions.</p>`;
        }
        return false;
    }

    // Setup DOM and events
    function setupEventListeners() {
        instructions = document.getElementById('instructions');
        startBtn = document.getElementById('startBtn');
        timerDisplay = document.getElementById('timer');
        nextBtn = document.getElementById('nextBtn');
        completion = document.getElementById('completion');
        startActivityBtn = document.getElementById('startActivityBtn');

        console.log('[PSYCHO SETUP] DOM:', { startBtn: !!startBtn });

        if (startBtn) {
            console.log('[PSYCHO SETUP] Enabling startBtn');
            startBtn.disabled = false;
            startBtn.style.cursor = 'pointer';
            startBtn.addEventListener('click', () => {
                console.log('[PSYCHO START] Clicked');
                if (!instructions || !timerDisplay || !assessmentContent || !nextBtn) {
                    console.error('[PSYCHO START] Missing elements');
                    assessmentContent.innerHTML = `<p style="color: red;">Error: Page broken.</p>`;
                    return;
                }
                instructions.classList.add('hidden');
                timerDisplay.classList.remove('hidden');
                assessmentContent.classList.remove('hidden');
                nextBtn.classList.remove('hidden');
                startTimer();
                if (selectedQuestions[currentCategory]?.length > 0) {
                    showQuestions();
                } else {
                    console.log('[PSYCHO START] Retrying');
                    assessmentContent.innerHTML = `<p>Retrying...</p>`;
                    initQuestions().then((success) => {
                        if (success) showQuestions();
                    });
                }
            });
        } else {
            console.error('[PSYCHO SETUP] startBtn missing');
            if (assessmentContent) {
                assessmentContent.innerHTML = `<p style="color: red;">Error: Start button missing.</p>`;
            }
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                console.log('[PSYCHO NEXT] Scoring');
                if (!selectedQuestions[currentCategory]) {
                    console.error('[PSYCHO NEXT] No questions');
                    alert('No questions loaded.');
                    return;
                }
                let categoryScore = 0;
                selectedQuestions[currentCategory].forEach((question, index) => {
                    const selected = document.querySelector(`input[name="answer-${index}"]:checked`);
                    if (selected && selected.value === question.a) {
                        categoryScore += 10;
                        totalScore += 10;
                    }
                });
                categoryScores[currentCategory] = categoryScore;
                localStorage.setItem('totalScore', totalScore);
                localStorage.setItem('categoryScores', JSON.stringify(categoryScores));
                console.log(`[PSYCHO NEXT] Score: ${categoryScore} for ${currentCategory}, Total: ${totalScore}`);
                clearInterval(timerInterval);
                moveToNextCategoryOrActivity();
            });
        }

        if (startActivityBtn) {
            startActivityBtn.addEventListener('click', () => {
                console.log('[PSYCHO NAV] To activity');
                window.location.href = 'activity-assessment-9to10.html?category=scenario';
            });
        }
    }

    function startTimer() {
        console.log('[PSYCHO TIMER] Starting');
        timerInterval = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerDisplay.textContent = `Time Remaining: ${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
            if (timeLeft <= 0) {
                console.log('[PSYCHO TIMER] Done');
                clearInterval(timerInterval);
                alert('Time’s up!');
                moveToNextCategoryOrActivity();
            }
        }, 1000);
    }

    function showQuestions() {
        console.log('[PSYCHO RENDER] Rendering:', currentCategory);
        if (!selectedQuestions[currentCategory] || selectedQuestions[currentCategory].length === 0) {
            console.error('[PSYCHO RENDER] No questions');
            assessmentContent.innerHTML = `<p style="color: red;">Error: No questions available.</p>`;
            return;
        }
        let html = `<h3>${currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)}</h3>`;
        selectedQuestions[currentCategory].forEach((question, index) => {
            if (!question.q || !Array.isArray(question.o) || !question.a) return;
            html += `
                <div class="question fade-in">
                    <p>${index + 1}. ${question.q}</p>
                    ${question.o.map((opt, i) => `
                        <label>
                            <input type="radio" name="answer-${index}" value="${opt}">
                            ${opt}
                        </label>
                    `).join('<br>')}
                </div>
            `;
        });
        assessmentContent.innerHTML = html;
        if (assessmentContent.querySelectorAll('.question').length === 0) {
            console.error('[PSYCHO RENDER] Render failed');
            assessmentContent.innerHTML = `<p style="color: red;">Error: Rendering failed.</p>`;
        }
    }

    function moveToNextCategoryOrActivity() {
        console.log('[PSYCHO NAV] Next');
        const nextCategoryIndex = categoryIndex + 1;
        if (nextCategoryIndex < psychoCategories.length) {
            window.location.href = `psychometric-assessment-9to10.html?category=${psychoCategories[nextCategoryIndex]}`;
        } else {
            completion.classList.remove('hidden');
            nextBtn.classList.add('hidden');
            localStorage.setItem('psychometricCompleted', 'true');
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        console.log('[PSYCHO INIT] DOM loaded');
        initQuestions().then((success) => {
            if (success) setupEventListeners();
        });
    });
}