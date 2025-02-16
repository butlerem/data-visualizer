let gallery;

function setup() {
  canvasContainer = select('#app');
  var c = createCanvas(1040, 550); // Create a canvas of size 1040x550
  c.parent('app'); // Attach the canvas to the HTML element with id 'app'

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
  if (gallery.selectedVisual != null) {
    push(); // Save the current drawing state
    translate(0, 0); // Draw the first visual on the left half
    gallery.selectedVisual.draw(); // Call the draw method of the first visual
    pop(); // Restore the previous drawing state
  }
  if (gallery.selectedVisual2 != null) {
    push(); // Save the current drawing state
    translate(width / 2, 0); // Draw the second visual on the right half
    gallery.selectedVisual2.draw(); // Call the draw method of the second visual
    pop(); // Restore the previous drawing state
  }
}
