const counsellors = [
  {
    name: "Mr. Ashok Kumar",
    specialization: ["Psychometric", "Career Counsultant"],
    experience: "10+ years",
    about: "Expert in analyzing psychometric results and tailoring career paths. Helps individuals understand their cognitive strengths and weaknesses.",
    type: "Counsellor",
    linkedin: "https://www.linkedin.com/in/ashokcareerguidance"
  },
  {
    name: "Dr. Priya Mehra",
    specialization: ["Psychometric", "Career Coaching"],
    experience: "12 years",
    about: "Specializes in psychometric assessments and personalized career coaching to guide professionals toward fulfilling careers.",
    type: "Expert",
    linkedin: "https://www.linkedin.com/in/priyamehra-careercoach"
  },
  {
    name: "Dr. Neha Gupta",
    specialization: ["Psychometric", "Career Coaching"],
    experience: "10 years",
    about: "Expert in psychometric evaluations and career planning, helping clients align their strengths with professional goals.",
    type: "Expert",
    linkedin: "https://www.linkedin.com/in/nehagupta-careercoach"
  },
  {
    name: "Mr. Vikram Singh",
    specialization: ["Activity-Based", "Career Counsultant"],
    experience: "8 years",
    about: "Designs interactive workshops to uncover career aptitudes, specializing in practical career guidance for young professionals.",
    type: "Counsellor",
    linkedin: "https://www.linkedin.com/in/vikramsingh-careerguide"
  },
  {
    name: "Ms. Aarti Patel",
    specialization: ["Psychometric", "Activity-Based"],
    experience: "9 years",
    about: "Combines data-driven psychometric insights with hands-on activities to create tailored career paths for students and professionals.",
    type: "Counsellor",
    linkedin: "https://www.linkedin.com/in/aartipatel-careerpath"
  }
  
];

function renderCounsellors() {
  const grid = document.getElementById("counsellorGrid");
  const psychometricOn = document.getElementById("psychometricFilter").checked;
  const activityOn = document.getElementById("activityFilter").checked;

  grid.innerHTML = ""; // Clear old entries

  counsellors.forEach((counsellor) => {
    const hasPsych = counsellor.specialization.includes("Psychometric");
    const hasActivity = counsellor.specialization.includes("Activity-Based");

    if ((psychometricOn && hasPsych) || (activityOn && hasActivity)) {
      const card = document.createElement("div");
      card.className = "counsellor-card";

      card.innerHTML = `
        <h3>${counsellor.name}</h3>
        <p><strong>Experience:</strong> ${counsellor.experience}</p>
        <p>${counsellor.about}</p>
        <div>
          ${counsellor.specialization
            .map((tag) => `<span class="badge">${tag}</span>`)
            .join("")}
        </div>
        ${counsellor.linkedin ? `<p><strong>LinkedIn:</strong> <a href="${counsellor.linkedin}">${counsellor.linkedin}</a></p>` : ""}
        <button class="btn-contact" onclick="alert('Schedule a session with ${counsellor.name}')">Contact</button>
        <span class="type-badge">${counsellor.type}</span>
      `;

      grid.appendChild(card);
    }
  });
}

// Attach filter listeners
document.getElementById("psychometricFilter").addEventListener("change", renderCounsellors);
document.getElementById("activityFilter").addEventListener("change", renderCounsellors);

// Initial render
renderCounsellors();