// import-tech-diversity-race.js
import {
  getFirestore,
  collection,
  setDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

import Papa from "https://cdn.jsdelivr.net/npm/papaparse@5.3.0/papaparse.min.js";

const db = getFirestore(window.app);

async function importTechDiversityRace() {
  try {
    const response = await fetch("./occupation-hourly-pay-by-gender-2017.csv");
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const csvText = await response.text();
    const parsedData = Papa.parse(csvText, {
      header: true, // Ensures the first row is treated as column names
      skipEmptyLines: true,
    });

    for (let row of parsedData.data) {
      if (!row["Race"]) {
        console.log(`Skipping row with missing race.`);
        continue;
      }
      await setDoc(
        doc(collection(db, "tech_diversity_race"), row["Race"]),
        row
      );
      console.log(`Added document for ${row["Race"]}`);
    }
  } catch (error) {
    console.error("Error importing tech_diversity_race CSV: ", error);
  }
}
importTechDiversityRace();
