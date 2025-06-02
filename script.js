// Select Elements
const englishBtn = document.getElementById('englishAssessment');
const tamilBtn = document.getElementById('tamilAssessment');
const studentCategorySection = document.getElementById('studentCategory');
const std6to8Btn = document.getElementById('std6to8');
const std9to10Btn = document.getElementById('std9to10');
const std11to12Btn = document.getElementById('std11to12');
const dropoutsBtn = document.getElementById('dropouts');

// Set background images and styles for each element, including enlarged sizes
if (englishBtn) {
    englishBtn.style.backgroundImage = 'url("https://us.123rf.com/450wm/perhapzzz/perhapzzz1712/perhapzzz171200230/91787526-learn-english-concept-time-to-learning-languages-word-composed-from-colorful-abc-alphabet-block.jpg?ver=6")';
    englishBtn.style.backgroundSize = 'cover';
    englishBtn.style.backgroundPosition = 'center';
    englishBtn.style.backgroundRepeat = 'no-repeat';
    englishBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.6)'; // Semi-transparent for readability
    englishBtn.style.color = '#003366';
    englishBtn.style.textShadow = '0 0 3px rgba(0, 0, 0, 0.5)';
    englishBtn.style.minWidth = '200px'; // Enlarged size
    englishBtn.style.minHeight = '80px';
    englishBtn.style.padding = '10px';
}

if (tamilBtn) {
    tamilBtn.style.backgroundImage = 'url("data:image/png;base64,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")';
    tamilBtn.style.backgroundSize = 'cover';
    tamilBtn.style.backgroundPosition = 'center';
    tamilBtn.style.backgroundRepeat = 'no-repeat';
    tamilBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
    tamilBtn.style.color = '#003366';
    tamilBtn.style.textShadow = '0 0 3px rgba(0, 0, 0, 0.5)';
    tamilBtn.style.minWidth = '200px';
    tamilBtn.style.minHeight = '80px';
    tamilBtn.style.padding = '10px';
}

if (studentCategorySection) {
    studentCategorySection.style.backgroundImage = 'url("https://png.pngtree.com/thumb_back/fh260/back_our/20190621/ourmid/pngtree-computer-training-class-enrollment-hand-painted-flat-blue-banner-image_177222.jpg")';
    studentCategorySection.style.backgroundSize = 'cover';
    studentCategorySection.style.backgroundPosition = 'center';
    studentCategorySection.style.backgroundRepeat = 'no-repeat';
    studentCategorySection.style.minWidth = '100%'; // Full width
    studentCategorySection.style.minHeight = '400px'; // Enlarged section
    studentCategorySection.style.padding = '20px';
}

if (std6to8Btn) {
    std6to8Btn.style.backgroundImage = 'url("https://static.vecteezy.com/system/resources/thumbnails/001/971/264/small_2x/beautiful-cherry-blossom-with-bokeh-lights-background-concept-free-vector.jpg")';
    std6to8Btn.style.backgroundSize = 'cover';
    std6to8Btn.style.backgroundPosition = 'center';
    std6to8Btn.style.backgroundRepeat = 'no-repeat';
    std6to8Btn.style.backgroundColor = 'rgba(57, 24, 202, 0.6)';
    std6to8Btn.style.color = '#003366';
    std6to8Btn.style.textShadow = '0 0 3px rgba(17, 15, 15, 0.5)';
    std6to8Btn.style.minWidth = '200px';
    std6to8Btn.style.minHeight = '80px';
    std6to8Btn.style.padding = '10px';
}

if (std9to10Btn) {
    std9to10Btn.style.backgroundImage = 'url("https://static.vecteezy.com/system/resources/thumbnails/001/971/264/small_2x/beautiful-cherry-blossom-with-bokeh-lights-background-concept-free-vector.jpg")';
    std9to10Btn.style.backgroundSize = 'cover';
    std9to10Btn.style.backgroundPosition = 'center';
    std9to10Btn.style.backgroundRepeat = 'no-repeat';
    std9to10Btn.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
    std9to10Btn.style.color = '#003366';
    std9to10Btn.style.textShadow = '0 0 3px rgba(0, 0, 0, 0.5)';
    std9to10Btn.style.minWidth = '200px';
    std9to10Btn.style.minHeight = '80px';
    std9to10Btn.style.padding = '10px';
}

if (std11to12Btn) {
    std11to12Btn.style.backgroundImage = 'url("https://static.vecteezy.com/system/resources/thumbnails/001/971/264/small_2x/beautiful-cherry-blossom-with-bokeh-lights-background-concept-free-vector.jpg")';
    std11to12Btn.style.backgroundSize = 'cover';
    std11to12Btn.style.backgroundPosition = 'center';
    std11to12Btn.style.backgroundRepeat = 'no-repeat';
    std11to12Btn.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
    std11to12Btn.style.color = '#003366';
    
    std11to12Btn.style.minWidth = '200px';
    std11to12Btn.style.minHeight = '80px';
    std11to12Btn.style.padding = '10px';
}

if (dropoutsBtn) {
    dropoutsBtn.style.backgroundImage = 'url("https://static.vecteezy.com/system/resources/thumbnails/001/971/264/small_2x/beautiful-cherry-blossom-with-bokeh-lights-background-concept-free-vector.jpg")';
    dropoutsBtn.style.backgroundSize = 'cover';
    dropoutsBtn.style.backgroundPosition = 'center';
    dropoutsBtn.style.backgroundRepeat = 'no-repeat';
    dropoutsBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
    dropoutsBtn.style.color = '#003366';
    dropoutsBtn.style.textShadow = '0 0 3px rgba(0, 0, 0, 0.5)';
    dropoutsBtn.style.minWidth = '200px';
    dropoutsBtn.style.minHeight = '80px';
    dropoutsBtn.style.padding = '10px';
}

// Variables to track language
let selectedLanguage = '';

// Show student category section when assessment type is clicked
englishBtn.addEventListener('click', () => {
    selectedLanguage = 'english';
    studentCategorySection.classList.remove('hidden');
    scrollToSection(studentCategorySection);
});

tamilBtn.addEventListener('click', () => {
    selectedLanguage = 'tamil';
    studentCategorySection.classList.remove('hidden');
    scrollToSection(studentCategorySection);
});

// Navigate to respective assessment pages based on category
std6to8Btn.addEventListener('click', () => {
    window.location.href = `${selectedLanguage}-assessment-6to8.html`;
});

std9to10Btn.addEventListener('click', () => {
    window.location.href = `${selectedLanguage}-assessment-9to10.html`;
});

std11to12Btn.addEventListener('click', () => {
    window.location.href = `${selectedLanguage}-assessment-11to12.html`;
});

dropoutsBtn.addEventListener('click', () => {
    window.location.href = `${selectedLanguage}-assessment-dropouts.html`;
});

// Smooth scroll function
function scrollToSection(section) {
    section.scrollIntoView({ behavior: 'smooth' });
}