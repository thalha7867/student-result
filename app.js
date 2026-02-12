const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const csv = require("csv-parser");

const PORT = process.env.PORT || 5001;
const CSV_FILE = path.join(__dirname, "student_data.csv");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

function getGradePoint(marks) {
  if (marks >= 90) return { gp: 10, grade: "A+" };
  if (marks >= 80) return { gp: 9, grade: "A" };
  if (marks >= 70) return { gp: 8, grade: "B" };
  if (marks >= 60) return { gp: 7, grade: "C" };
  if (marks >= 50) return { gp: 6, grade: "D" };
  if (marks >= 40) return { gp: 5, grade: "E" };
  return { gp: 0, grade: "F" };
}

function calculateSgpa(subjects) {
  let totalPoints = 0;
  let totalCredits = 0;
  for (const subj of subjects) {
    const { gp } = getGradePoint(subj.marks);
    totalPoints += gp * Number(subj.credits);
    totalCredits += Number(subj.credits);
  }
  const sgpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
  return Math.round(sgpa * 100) / 100;
}

let allStudentsData = {};

function loadStudentsFromCSV(filename = CSV_FILE) {
  return new Promise((resolve) => {
    const students = {};
    if (!fs.existsSync(filename)) {
      console.error(`❌ ERROR: File '${filename}' not found.`);
      resolve(students);
      return;
    }

    fs.createReadStream(filename)
      .pipe(csv())
      .on("data", (row) => {
        const roll = (row.roll || "").toUpperCase().trim();
        if (!roll) return;

        if (!students[roll]) {
          students[roll] = {
            name: row.name || "",
            roll,
            dept: row.dept || "",
            semester: row.semester || "",
            subjects: [],
          };
        }

        students[roll].subjects.push({
          subject: row.subject || "",
          marks: parseInt(row.marks || "0", 10),
          credits: parseFloat(row.credits || "0"),
        });
      })
      .on("end", () => {
        console.log("✅ Loaded student_data.csv");
        resolve(students);
      })
      .on("error", (err) => {
        console.error("❌ CSV load error:", err);
        resolve({});
      });
  });
}

app.get("/student/:roll_number", (req, res) => {
  const roll = (req.params.roll_number || "").toUpperCase();
  const studentData = allStudentsData[roll];

  if (!studentData) {
    return res.status(404).json({ error: "Student not found" });
  }

  const studentCopy = {
    ...studentData,
    subjects: studentData.subjects.map((s) => ({ ...s })),
  };

  let hasFailed = false;
  for (const subj of studentCopy.subjects) {
    const { grade } = getGradePoint(subj.marks);
    subj.grade = grade;
    if (grade === "F") hasFailed = true;
  }

  let sgpa;
  let totalCredits;
  if (hasFailed) {
    sgpa = "-";
    totalCredits = "-";
  } else {
    sgpa = calculateSgpa(studentCopy.subjects);
    totalCredits = studentCopy.subjects.reduce(
      (sum, s) => sum + Number(s.credits),
      0
    );
  }

  res.json({
    name: studentCopy.name,
    roll: studentCopy.roll,
    dept: studentCopy.dept,
    semester: studentCopy.semester,
    subjects: studentCopy.subjects,
    sgpa,
    total_credits: totalCredits,
  });
});

(async function startServer() {
  allStudentsData = await loadStudentsFromCSV();
  app.listen(PORT, () =>
    console.log(`✅ Server running on port ${PORT}`)
  );
})();
