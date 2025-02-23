// import-tech-diversity-race.js
import {
  getFirestore,
  collection,
  setDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

const db = getFirestore(window.app);

async function importTechDiversityRace() {
  try {
    const response = await fetch("./data/tech-diversity/race-2018.csv");
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const csvText = await response.text();
    const lines = csvText.trim().split("\n");
    // First row contains the company names; the first cell is empty.
    const headerRow = lines[0]
      .split(",")
      .map((h) => h.replace(/"/g, "").trim());
    // headerRow should be something like:
    // ["", "AirBnB", "Amazon", "Apple", ... , "eBay"]

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.replace(/"/g, "").trim());
      // The first cell is the race.
      const race = values[0];
      if (!race) {
        console.log(`Missing race in row ${i}, skipping.`);
        continue;
      }
      let companyData = {};
      // Iterate over the company columns (starting at index 1).
      for (let j = 1; j < headerRow.length; j++) {
        const companyName = headerRow[j];
        // Use the corresponding value; if missing, default to an empty string.
        companyData[companyName] = values[j] || "";
      }
      // Save the document with the race as the document ID.
      await setDoc(
        doc(collection(db, "tech_diversity_race"), race),
        companyData
      );
      console.log(
        `Tech diversity race document for ${race} added to Firestore.`
      );
    }
  } catch (error) {
    console.error("Error importing tech_diversity_race CSV: ", error);
  }
}

importTechDiversityRace();
