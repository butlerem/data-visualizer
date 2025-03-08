import { Gallery } from "./gallery.js";
import { setupDownloadButton } from "./download.js";
import { ClimateChange } from "./vis/climate-change.js";
import { PayGapByJob2017 } from "./vis/pay-gap-by-job.js";
import { TechDiversityMST } from "./vis/diversity-mst.js";
import { PayGapTimeSeries } from "./vis/pay-gap-time-series.js";
import { TechDiversityRace } from "./vis/tech-diversity-race.js";
import { TechDiversityGender } from "./vis/tech-diversity-gender.js";
import { EducationGenderRadar } from "./vis/education-gender-radar.js";
import { EducationCompletionRate } from "./vis/education-completion-rate.js";

let gallery;
let canvasContainer;

// Attach p5 lifecycle functions to the window object
window.setup = function () {
  // p5 setup
  canvasContainer = select("#canvas");
  var c = createCanvas(800, 500);
  c.parent("canvas");

  // Create a new gallery object
  gallery = new Gallery();

  // Add the visualisation objects here
  gallery.addVisual(new EducationCompletionRate());
  gallery.addVisual(new TechDiversityGender());
  gallery.addVisual(new TechDiversityMST());
  gallery.addVisual(new ClimateChange());
  gallery.addVisual(new PayGapByJob2017());
  gallery.addVisual(new PayGapTimeSeries());
  gallery.addVisual(new TechDiversityRace());
  gallery.addVisual(new EducationGenderRadar());

  // Attach download button event listener
  setupDownloadButton(gallery);
};

window.draw = function () {
  background("#fff");

  if (gallery.selectedVisual != null) {
    gallery.selectedVisual.draw();
  }
};
