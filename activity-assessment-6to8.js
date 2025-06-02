const { jsPDF } = window.jspdf;

if (document.location.pathname.includes('activity-assessment-6to8.html')) {
    console.log('[ACTIVITY INIT] Starting activity assessment');

    const urlParams = new URLSearchParams(window.location.search);
    const currentCategory = urlParams.get('category') || 'scenario';
    let timeLeft = 10 * 60;
    let timerInterval;
    let activityScore = 0;
    let selectedQuestions = [];

    // DOM elements
    let instructions, startBtn, timerDisplay, assessmentContent, finishBtn, completion, downloadBtn;

    // Fetch questions
    async function loadQuestions(category) {
        console.log(`[ACTIVITY LOAD] Fetching: ${category}`);
        try {
            const response = await fetch(`questions-6to8-${category}.json?cachebust=${Date.now()}`);
            console.log(`[ACTIVITY LOAD] Status: ${response.status}`);
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            const data = await response.json();
            if (!Array.isArray(data)) throw new Error('Not an array');
            if (data.length === 0) throw new Error('Empty array');
            data.forEach((q, i) => {
                if (!q.q || !Array.isArray(q.o) || q.o.length === 0 || !q.a) {
                    throw new Error(`Invalid question at ${i}`);
                }
            });
            console.log(`[ACTIVITY LOAD] Loaded ${data.length} questions`);
            return data;
        } catch (error) {
            console.error(`[ACTIVITY LOAD] Error: ${error.message}`);
            return null;
        }
    }

    // Select random questions
    function getRandomQuestions(questionsArray, count = 5) {
        console.log(`[ACTIVITY SHUFFLE] Input: ${questionsArray?.length || 0}`);
        if (!questionsArray || !Array.isArray(questionsArray) || questionsArray.length === 0) {
            console.error('[ACTIVITY SHUFFLE] Invalid input');
            return [];
        }
        const shuffled = [...questionsArray].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, Math.min(count, questionsArray.length));
        console.log(`[ACTIVITY SHUFFLE] Selected ${selected.length}`);
        return selected;
    }

    // Initialize questions
    async function initQuestions() {
        assessmentContent = document.getElementById('assessmentContent');
        if (!assessmentContent) {
            console.error('[ACTIVITY INIT] assessmentContent missing');
            alert('Error: Page broken.');
            return false;
        }
        assessmentContent.innerHTML = `<p>Loading scenarios...</p>`;
        const data = await loadQuestions(currentCategory);
        if (data && data.length > 0) {
            selectedQuestions = getRandomQuestions(data, 5);
            if (selectedQuestions.length > 0) {
                console.log(`[ACTIVITY INIT] Assigned ${selectedQuestions.length} scenarios`);
                assessmentContent.innerHTML = `<p>Scenarios loaded. Click "Start Test" to begin.</p>`;
                return true;
            } else {
                console.error('[ACTIVITY INIT] No scenarios');
                assessmentContent.innerHTML = `<p style="color: red;">Error: No valid scenarios.</p>`;
            }
        } else {
            console.error('[ACTIVITY INIT] Load failed');
            assessmentContent.innerHTML = `<p style="color: red;">Error: Failed to load scenarios.</p>`;
        }
        return false;
    }

    // Setup DOM and events
    function setupEventListeners() {
        instructions = document.getElementById('instructions');
        startBtn = document.getElementById('startBtn');
        timerDisplay = document.getElementById('timer');
        finishBtn = document.getElementById('finishBtn');
        completion = document.getElementById('completion');
        downloadBtn = document.getElementById('downloadBtn');

        console.log('[ACTIVITY SETUP] DOM:', { startBtn: !!startBtn });

        if (startBtn) {
            console.log('[ACTIVITY SETUP] Enabling startBtn');
            startBtn.disabled = false;
            startBtn.style.cursor = 'pointer';
            startBtn.addEventListener('click', () => {
                console.log('[ACTIVITY START] Clicked');
                if (!instructions || !timerDisplay || !assessmentContent || !finishBtn) {
                    console.error('[ACTIVITY START] Missing elements');
                    assessmentContent.innerHTML = `<p style="color: red;">Error: Page broken.</p>`;
                    return;
                }
                instructions.classList.add('hidden');
                timerDisplay.classList.remove('hidden');
                assessmentContent.classList.remove('hidden');
                finishBtn.classList.remove('hidden');
                startTimer();
                if (selectedQuestions.length > 0) {
                    showQuestions();
                } else {
                    console.log('[ACTIVITY START] Retrying');
                    assessmentContent.innerHTML = `<p>Retrying...</p>`;
                    initQuestions().then((success) => {
                        if (success) showQuestions();
                    });
                }
            });
        } else {
            console.error('[ACTIVITY SETUP] startBtn missing');
            if (assessmentContent) {
                assessmentContent.innerHTML = `<p style="color: red;">Error: Start button missing.</p>`;
            }
        }

        if (finishBtn) {
            finishBtn.addEventListener('click', () => {
                console.log('[ACTIVITY FINISH] Scoring');
                selectedQuestions.forEach((question, index) => {
                    const selected = document.querySelector(`input[name="answer-${index}"]:checked`);
                    if (selected && selected.value === question.a) {
                        activityScore += 10;
                    }
                });
                console.log(`[ACTIVITY FINISH] Score: ${activityScore}`);
                clearInterval(timerInterval);
                localStorage.setItem('activityScore', activityScore);
                completion.classList.remove('hidden');
                finishBtn.classList.add('hidden');
            });
        }

        if (downloadBtn) {
            downloadBtn.addEventListener('click', generatePDF);
        }
    }

    function startTimer() {
        console.log('[ACTIVITY TIMER] Starting');
        timerInterval = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerDisplay.textContent = `Time Remaining: ${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
            if (timeLeft <= 0) {
                console.log('[ACTIVITY TIMER] Done');
                clearInterval(timerInterval);
                alert('Time’s up!');
                finishBtn.click();
            }
        }, 1000);
    }

    function showQuestions() {
        console.log('[ACTIVITY RENDER] Rendering');
        if (!selectedQuestions || selectedQuestions.length === 0) {
            console.error('[ACTIVITY RENDER] No questions');
            assessmentContent.innerHTML = `<p style="color: red;">Error: No scenarios available.</p>`;
            return;
        }
        let html = `<h3>Scenarios</h3>`;
        selectedQuestions.forEach((question, index) => {
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
            console.error('[ACTIVITY RENDER] Render failed');
            assessmentContent.innerHTML = `<p style="color: red;">Error: Rendering failed.</p>`;
        }
    }

    // Generate PDF with career suggestions
    function generatePDF() {
        console.log('[PDF] Generating');
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Career Assessment Report', 20, 20);
        doc.setFontSize(12);

        // Psychometric scores
        const totalScore = parseInt(localStorage.getItem('totalScore')) || 0;
        const categoryScores = JSON.parse(localStorage.getItem('categoryScores')) || {};
        const activityScore = parseInt(localStorage.getItem('activityScore')) || 0;

        doc.text('Psychometric Assessment Scores:', 20, 30);
        let y = 40;
        for (const [cat, score] of Object.entries(categoryScores)) {
            doc.text(`${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${score}/150`, 30, y);
            y += 10;
        }
        doc.text(`Total Psychometric Score: ${totalScore}`, 30, y);
        y += 10;
        doc.text(`Activity Assessment Score: ${activityScore}/50`, 30, y);
        y += 20;

        // Map scores to RIASEC (simplified)
        const riasec = {
            Realistic: categoryScores.cognitive || 0,
            Investigative: categoryScores.aptitude || 0,
            Artistic: categoryScores.interest || 0,
            Social: categoryScores.emotional || 0,
            Enterprising: categoryScores.leadership || 0,
            Conventional: categoryScores.career || 0
        };
        const topTraits = Object.entries(riasec)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([trait]) => trait);

        doc.text('Top Career Traits:', 20, y);
        doc.text(topTraits.join(', '), 30, y + 10);
        y += 20;

        // O*NET Career Suggestions
        const careers = getCareerSuggestions(topTraits);
        doc.text('Career Suggestions (O*NET):', 20, y);
        y += 10;
        careers.forEach((career, i) => {
            doc.text(`${i + 1}. ${career.title} (O*NET Code: ${career.code})`, 30, y);
            doc.setFontSize(10);
            doc.text(career.description, 30, y + 5, { maxWidth: 150 });
            doc.setFontSize(12);
            y += 20;
        });

        doc.save('Career_Assessment_Report.pdf');
        console.log('[PDF] Saved');
        localStorage.clear(); // Reset for next assessment
    }

    // Static O*NET career mappings
    function getCareerSuggestions(traits) {
        const careerMap = {
            Investigative: [
                { title: 'Data Analyst', code: '15-2051.00', description: 'Analyze data to find patterns using math and software.' },
                { title: 'Software Developer', code: '15-1252.00', description: 'Design and build computer programs.' }
            ],
            Realistic: [
                { title: 'Civil Engineer', code: '17-2051.00', description: 'Design infrastructure like bridges using math.' },
                { title: 'Electrician', code: '47-2111.00', description: 'Install and repair electrical systems.' }
            ],
            Artistic: [
                { title: 'Graphic Designer', code: '27-1024.00', description: 'Create visual designs for media.' },
                { title: 'Writer', code: '27-3043.00', description: 'Write stories or content creatively.' }
            ],
            Social: [
                { title: 'Teacher', code: '25-2021.00', description: 'Educate and support students in learning.' },
                { title: 'Counselor', code: '21-1012.00', description: 'Help people with personal challenges.' }
            ],
            Enterprising: [
                { title: 'Marketing Manager', code: '11-2021.00', description: 'Lead campaigns to promote products.' },
                { title: 'Entrepreneur', code: '11-1011.00', description: 'Start and manage businesses.' }
            ],
            Conventional: [
                { title: 'Accountant', code: '13-2011.00', description: 'Manage financial records accurately.' },
                { title: 'Office Manager', code: '43-1011.00', description: 'Organize office operations.' }
            ]
        };

        const suggestions = [];
        traits.forEach(trait => {
            if (careerMap[trait]) {
                suggestions.push(...careerMap[trait]);
            }
        });
        return suggestions.slice(0, 4); // Limit to 4 careers
    }

    document.addEventListener('DOMContentLoaded', () => {
        console.log('[ACTIVITY INIT] DOM loaded');
        initQuestions().then((success) => {
            if (success) setupEventListeners();
        });
    });
}