import { ClimateChange } from "./climate-change.js";
import { EducationCompletionRate } from "./education-completion-rate.js";
import { EducationGenderRadar } from "./education-gender-radar.js";
import { Gallery } from "./gallery.js";
import { PayGapByJob2017 } from "./pay-gap-by-job.js";
import { PayGapTimeSeries } from "./pay-gap-time-series.js";
import { TechDiversityRace } from "./tech-diversity-race.js";
import { TechDiversityGender } from "./tech-diversity-gender.js";
import { setupDownloadButton } from "./download.js";
import { TechDiversityMST } from "./diversity-mst.js";

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
  gallery.addVisual(new TechDiversityGender());
  gallery.addVisual(new EducationGenderRadar());
  gallery.addVisual(new EducationCompletionRate());
  gallery.addVisual(new TechDiversityRace());
  gallery.addVisual(new PayGapByJob2017());
  gallery.addVisual(new ClimateChange());
  gallery.addVisual(new PayGapTimeSeries());
  gallery.addVisual(new TechDiversityMST());

  // Attach download button event listener
  setupDownloadButton(gallery);
};

window.draw = function () {
  background("#fff");

  if (gallery.selectedVisual != null) {
    gallery.selectedVisual.draw();
  }
};
