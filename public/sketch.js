import { TechDiversityGender3D } from "./tech-diversity-gender-3d.js";

let gallery;
let canvasContainer; // Declare here

// Attach p5 lifecycle functions to the window object
window.setup = function () {
  // p5 setup
  canvasContainer = select("#canvas");
  var c = createCanvas(1100, 600); // Create a canvas of size 1100x600
  c.parent("canvas"); // Attach the canvas to the HTML element with id='canvas'

  // Create a new gallery object
  gallery = new Gallery();

  // Add the visualisation objects here
  gallery.addVisual(new TechDiversityRace());
  gallery.addVisual(new TechDiversityGender());
  gallery.addVisual(new PayGapByJob2017());
  gallery.addVisual(new PayGapTimeSeries());
  gallery.addVisual(new ClimateChange());
  gallery.addVisual(new EducationCompletionRate());

  // Add your new 3D visual
  gallery.addVisual(new TechDiversityGender3D());
};

window.draw = function () {
  // p5 draw
  background("#1c1c20"); // Set the background color

  let gap = 50; // Space between the two visuals
  let visualWidth = width / 2 - gap / 2; // Each visual fits within its half

  if (gallery.selectedVisual != null) {
    push();
    translate(visualWidth - width / 2, 0); // Position left visual
    gallery.selectedVisual.draw();
    pop();
  }

  if (gallery.selectedVisual2 != null) {
    push();
    translate(visualWidth + gap, 0); // Position right visual
    gallery.selectedVisual2.draw();
    pop();
  }
};
