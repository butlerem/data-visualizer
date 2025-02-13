let gallery;
const apiKey = "0ae792d9-3c7b-407a-8bf8-8fc8aea61aa1";
const apiUrl = "https://services.nvd.nist.gov/rest/json/cves/1.0";

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
  gallery.addVisual(new EducationCompletionRate());
  gallery.addVisual(new PovertyGap());

}

function draw() {
  background(40);
  if (gallery.selectedVisual != null) {
    gallery.selectedVisual.draw();
  }
}
