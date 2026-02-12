document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.getElementById("search-btn");
  const rollInput = document.getElementById("roll-input");
  const reportContainer = document.getElementById("report-card-container");

  const fetchReport = async () => {
    const rollNumber = rollInput.value.trim();
    if (!rollNumber) {
      reportContainer.innerHTML = `<p class="error-text">Please enter a roll number.</p>`;
      return;
    }

    reportContainer.innerHTML = `<p class="placeholder-text">Fetching data...</p>`;

    try {
      const response = await fetch(`/student/${rollNumber}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Student not found!");
      }

      const data = await response.json();
      displayReport(data);
    } catch (error) {
      reportContainer.innerHTML = `<p class="error-text">❌ ${error.message}</p>`;
    }
  };

  const displayReport = (data) => {
    let subjectsHtml = "";
    data.subjects.forEach((subject) => {
      subjectsHtml += `
        <tr>
          <td>${subject.subject}</td>
          <td>${subject.marks}</td>
          <td>${subject.credits}</td>
          <td>${subject.grade}</td>
        </tr>
      `;
    });

    const reportHtml = `
      <div class="report-header">
        <h2>${data.name}</h2>
        <p><strong>Roll Number:</strong> ${data.roll}</p>
        <p><strong>Department:</strong> ${data.dept} | <strong>Semester:</strong> ${data.semester}</p>
      </div>
      <table class="subjects-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Marks</th>
            <th>Credits</th>
            <th>Grade</th>
          </tr>
        </thead>
        <tbody>${subjectsHtml}</tbody>
      </table>
      <div class="report-footer">
        <span>Total Credits: ${data.total_credits}</span>
        <span>SGPA: ${data.sgpa}</span>
      </div>
    `;

    reportContainer.innerHTML = reportHtml;
  };

  searchBtn.addEventListener("click", fetchReport);
  rollInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      fetchReport();
    }
  });
});
