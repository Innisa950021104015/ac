const chatbox = document.getElementById('chatbox');
const input = document.getElementById('userInput');
const iframeContainer = document.getElementById('iframe-container');
const resourceFrame = document.getElementById('resourceFrame');
const linkSelect = document.getElementById('linkSelect');

let careerInfo = {};

// Fetch career data from JSON file
fetch('onet_careers.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to load career data');
    }
    return response.json();
  })
  .then(data => {
    // Convert JSON array to object with career titles as keys
    data.careers.forEach(career => {
      const key = career.title.toLowerCase().replace(/\s+/g, '_');
      careerInfo[key] = {
        degree: career.degree,
        courses: career.courses,
        exams: career.exams,
        path: career.path,
        resources: career.resources,
        title: career.title // Store original title for display
      };
    });
    console.log('Career data loaded successfully');
  })
  .catch(error => {
    console.error('Error loading careers:', error);
    addMessage("❌ Error loading career data. Please try again later.");
  });

// Utility to show messages
function addMessage(text, sender = 'bot') {
  const msg = document.createElement('div');
  msg.className = sender;
  msg.innerHTML = text;
  chatbox.appendChild(msg);
  chatbox.scrollTop = chatbox.scrollHeight;
}

// Function to check if title has more than 3 words or special characters
function isComplexTitle(title) {
  const wordCount = title.trim().split(/\s+/).length;
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(title);
  return wordCount > 3 || hasSpecialChars;
}

// Function to display careers with complex titles
function showComplexCareers() {
  const complexCareers = Object.values(careerInfo).filter(career => isComplexTitle(career.title));
  
  if (complexCareers.length === 0) {
    addMessage("❌ No careers found with more than 3 words or special characters in the title.");
    return;
  }

  let careersHTML = "<b>📋 Careers with complex titles:</b><ul>";
  complexCareers.forEach(career => {
    careersHTML += `<li>${career.title}</li>`;
  });
  careersHTML += "</ul>";
  addMessage(careersHTML);
}

// Handle user input
input.addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    console.log('Enter key pressed, input value:', input.value); // Debug input
    const query = input.value.trim().toLowerCase();
    if (!query) {
      addMessage("❗ Please enter a career or command.");
      return;
    }
    input.value = '';
    addMessage(query, 'user');

    // Check for command to show complex careers
    if (query === "show complex careers") {
      showComplexCareers();
      return;
    }

    if (query.startsWith("open ")) {
      const key = query.replace("open ", "").replace(/\s+/g, "_");
      if (careerInfo[key]) {
        const firstLink = careerInfo[key].resources[0];
        if (firstLink) {
          resourceFrame.src = firstLink.link;
          iframeContainer.style.display = 'block';
          populateDropdown(key);
          addMessage(`🧭 Previewing <b>${firstLink.name}</b> below 👇`);
        }
      } else {
        addMessage(`❌ No resources found for "${key}".`);
      }
      return;
    }

    // Improved matching for multi-word titles
    const queryKey = query.replace(/\s+/g, '_');
    let match = careerInfo[queryKey]; // Try exact match first
    if (!match) {
      // Fallback to partial match
      const matchedKey = Object.keys(careerInfo).find(c =>
        c.replace(/_/g, ' ').includes(query)
      );
      match = matchedKey ? careerInfo[matchedKey] : null;
    }

    if (match) {
      const info = match;
      iframeContainer.style.display = 'none';
      resourceFrame.src = '';
      linkSelect.innerHTML = '';

      setTimeout(() => {
        addMessage(`<b>🎓 Degree:</b> ${info.degree}`);
        addMessage(`<b>📚 Courses:</b> ${info.courses.join(', ')}`);
        addMessage(`<b>📝 Exams:</b> ${info.exams.join(', ')}`);
        addMessage(`<b>🚀 Path:</b> ${info.path}`);

        let linksHTML = `<b>🔗 Resources:</b><ul>`;
        info.resources.forEach(r => {
          linksHTML += `<li><a href="${r.link}" target="_blank">${r.name}</a></li>`;
        });
        linksHTML += `</ul>`;
        addMessage(linksHTML);

        populateDropdown(queryKey in careerInfo ? queryKey : Object.keys(careerInfo).find(c => careerInfo[c] === info));
        iframeContainer.style.display = 'block';
        resourceFrame.src = info.resources[0].link;
        addMessage(`📂 Choose a resource below to explore more 👇`);
      }, 500);
    } else {
      addMessage("❗ Sorry, I don't have info on that career. Try one like 'civil engineer', 'nurse', 'secondary special education teacher', or 'accountant'. Or type 'show complex careers' to see careers with complex titles.");
    }
  }
});

linkSelect.addEventListener('change', () => {
  const selectedURL = linkSelect.value;
  resourceFrame.src = selectedURL;
});

function populateDropdown(careerKey) {
  linkSelect.innerHTML = "";
  const links = careerInfo[careerKey].resources;
  links.forEach((r) => {
    const opt = document.createElement('option');
    opt.value = r.link;
    opt.textContent = r.name;
    linkSelect.appendChild(opt);
  });
}

window.onload = () => {
  addMessage("👋 Welcome to the Career Guidance for School Children Bot! Type a career like <b>nurse</b>, <b>software developer</b>, <b>secondary special education teacher</b>, or <b>accountant</b> to learn more. Or type <b>show complex careers</b> to see a few careers with titles .");
  input.focus(); // Ensure input field is focused
};