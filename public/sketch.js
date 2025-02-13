let socket;
let satPositions;
var gallery;

function setup() {
  canvasContainer = select('#app');
  var c = createCanvas(1040, 550);
  c.parent('app');

  // Create a new gallery object.
  gallery = new Gallery();

  // Add the visualisation objects here.
  gallery.addVisual(new TechDiversityRace());
  gallery.addVisual(new TechDiversityGender());
  gallery.addVisual(new PayGapByJob2017());
  gallery.addVisual(new PayGapTimeSeries());
  gallery.addVisual(new ClimateChange());
}

function draw() {
  background(40);
  if (gallery.selectedVisual != null) {
    gallery.selectedVisual.draw();
  }
}
