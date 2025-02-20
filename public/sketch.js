import { TechDiversityGender3D } from "./tech-diversity-gender-3d.js";
import { PayGapByJob2017 } from "./pay-gap-by-job-2017.js";

let gallery;
let canvasContainer;

// Attach p5 lifecycle functions to the window object
window.setup = function () {
  // p5 setup
  canvasContainer = select("#canvas");
  var c = createCanvas(1000, 550);
  c.parent("canvas"); // Attach the canvas to the HTML element with id='canvas'

  // Create a new gallery object
  gallery = new Gallery();

  // Add the visualisation objects here
  gallery.addVisual(new TechDiversityRace());
  gallery.addVisual(new TechDiversityGender3D());
  gallery.addVisual(new PayGapByJob2017());
  gallery.addVisual(new PayGapTimeSeries());
  gallery.addVisual(new ClimateChange());
  gallery.addVisual(new EducationCompletionRate());
  gallery.addVisual(new EducationGenderRadarChart());
};

window.draw = function () {
  background("#1c1c20");

  if (gallery.selectedVisual != null) {
    gallery.selectedVisual.draw();
  }
};
