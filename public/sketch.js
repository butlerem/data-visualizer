import { Gallery } from "./gallery.js";
import { TechDiversityRace } from "./tech-diversity-race.js";
import { TechDiversityGender } from "./tech-diversity-gender.js";
import { PayGapByJob2017 } from "./pay-gap-by-job.js";
import { PayGapTimeSeries } from "./pay-gap-time-series.js";
import { ClimateChange } from "./climate-change.js";
import { EducationCompletionRate } from "./education-completion-rate.js";
import { EducationGenderRadar } from "./education-gender-radar.js";
import { fetchData } from "./helper-functions.js";

let gallery;
let canvasContainer;

// Attach p5 lifecycle functions to the window object
window.setup = function () {
  // p5 setup
  canvasContainer = select("#canvas");
  var c = createCanvas(800, 500);
  c.parent("canvas"); // Attach the canvas to the HTML element with id='canvas'

  // Create a new gallery object
  gallery = new Gallery();

  // Add the visualisation objects here
  gallery.addVisual(new TechDiversityGender());
  gallery.addVisual(new EducationGenderRadar());
  gallery.addVisual(new EducationCompletionRate());
  gallery.addVisual(new TechDiversityRace());
  gallery.addVisual(new PayGapByJob2017());
  gallery.addVisual(new ClimateChange());
  gallery.addVisual(new PayGapTimeSeries());

  // Attach download button event listener
  setupDownloadButton();
};

window.draw = function () {
  background("#3a3e44");

  if (gallery.selectedVisual != null) {
    gallery.selectedVisual.draw();
  }
};

/**
 * Sets up the download button to fetch and download
 * the entire "visuals" Firestore collection as a JSON file.
 */
function setupDownloadButton() {
  const downloadButton = document.getElementById("download");

  if (downloadButton) {
    downloadButton.addEventListener("click", async () => {
      try {
        if (!gallery.selectedVisual) {
          console.error("No visualization selected.");
          return;
        }

        // 🔥 Get the collection name directly from the visualization
        const collectionName = gallery.selectedVisual.collectionName;

        if (!collectionName) {
          console.error("No dataset found for the selected visualization.");
          return;
        }

        // Fetch the correct collection from Firestore
        const data = await fetchData(collectionName);

        if (!data || data.length === 0) {
          console.error(`No data found in the "${collectionName}" collection.`);
          return;
        }

        // Convert data to a downloadable JSON file
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });

        // Create a download link
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${collectionName}.json`; // File named after the collection

        // Trigger the download
        document.body.appendChild(a);
        a.click();

        // Clean up
        document.body.removeChild(a);

        console.log(`Download triggered for "${collectionName}".`);
      } catch (error) {
        console.error("Error downloading data:", error);
      }
    });
  }
}
