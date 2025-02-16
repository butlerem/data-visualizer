let gallery;

function setup() {
  canvasContainer = select("#app");
  var c = createCanvas(1600, 700); // Create a canvas of size 1200x700
  c.parent("app"); // Attach the canvas to the HTML element with id 'app'

  // Create a new gallery object.
  gallery = new Gallery();

  // Add the visualisation objects here.
  gallery.addVisual(new TechDiversityRace());
  gallery.addVisual(new TechDiversityGender());
  gallery.addVisual(new PayGapByJob2017());
  gallery.addVisual(new PayGapTimeSeries());
  gallery.addVisual(new ClimateChange());
  gallery.addVisual(new EducationCompletionRate());
  gallery.addVisual(new PovertyGap());

  // Add second visualisation objects here.
  gallery.addVisual(new ClimateChange2());
  /*gallery.addVisual(new TechDiversityRace2());
  gallery.addVisual(new TechDiversityGender2());
  gallery.addVisual(new PayGapByJob20172());
  gallery.addVisual(new PayGapTimeSeries2());
  gallery.addVisual(new EducationCompletionRate2());
  gallery.addVisual(new PovertyGap2());*/
}

function draw() {
  background(40); // Set the background color to dark gray

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
