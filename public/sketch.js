let gallery;

function setup() {
  canvasContainer = select("#canvas");
  var c = createCanvas(1100, 600); // Create a canvas of size 1200x700
  c.parent("canvas"); // Attach the canvas to the HTML element with id 'app'

  // Create a new gallery object.
  gallery = new Gallery();

  // Add the visualisation objects here.
  gallery.addVisual(new TechDiversityRace());
  gallery.addVisual(new TechDiversityGender());
  gallery.addVisual(new PayGapByJob2017());
  gallery.addVisual(new PayGapTimeSeries());
  gallery.addVisual(new ClimateChange());
  gallery.addVisual(new EducationCompletionRate());
}

function draw() {
  background("#1c1c20"); // Set the background color

  let gap = 50; // Space between the two visuals
  let visualWidth = width / 2 - gap / 2; // Each visual fits within its half

  if (gallery.selectedVisual != null) {
    push();
    translate(visualWidth - width / 2, 0); // Position left visual correctly
    gallery.selectedVisual.draw();
    pop();
  }

  if (gallery.selectedVisual2 != null) {
    push();
    translate(visualWidth + gap, 0); // Position right visual with spacing
    gallery.selectedVisual2.draw();
    pop();
  }
}
