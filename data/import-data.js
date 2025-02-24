// import-tech-diversity-gender-occupation.js
import {
  getFirestore,
  collection,
  setDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Instead of importing PapaParse, assume it's loaded globally via the HTML script tag.
const Papa = window.Papa;

const db = getFirestore(window.app);

async function importGenderOccupationData() {
  try {
    const response = await fetch("./occupation-hourly-pay-by-gender-2017.csv");
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const csvText = await response.text();
    const parsedData = Papa.parse(csvText, {
      header: true, // Use the first row as column names
      skipEmptyLines: true, // Skip empty lines
    });

    for (let row of parsedData.data) {
      // Ensure we have the keys needed for a unique document id.
      if (!row["job_type_code"] || !row["job_subtype_code"]) {
        console.log(
          "Skipping row with missing job_type_code or job_subtype_code."
        );
        continue;
      }

      // Construct a document ID using job_type_code and job_subtype_code.
      const docId = `${row["job_type_code"]}_${row["job_subtype_code"]}`;

      await setDoc(doc(collection(db, "occupation_pay_gap"), docId), row);
      console.log(`Added document for ${docId}`);
    }
  } catch (error) {
    console.error("Error importing gender occupation data CSV: ", error);
  }
}

importGenderOccupationData();
