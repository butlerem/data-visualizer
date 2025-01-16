let socket;
let satPositions;
var gallery;

function setup() {
  canvasContainer = select('#app');
  var c = createCanvas(1040, 550);
  c.parent('app');

  // Connect to node server
  socket = io.connect("http://localhost:3000");

  // Listen for satellite data updates
  socket.on("satelliteData", (data) => {
    console.log("Received from server:", data);
    satPositions = data.positions;
  });
  
  // Create a new gallery object.
  gallery = new Gallery();

  // Add the visualisation objects here.
  gallery.addVisual(new TechDiversityRace());
  gallery.addVisual(new TechDiversityGender());
  gallery.addVisual(new PayGapByJob2017());
  gallery.addVisual(new PayGapTimeSeries());
  gallery.addVisual(new ClimateChange());
  gallery.addVisual(new SatelliteLocation());
  gallery.addVisual(new CanadaSatellites());
}

function draw() {
  background(40);
  if (gallery.selectedVisual instanceof SatelliteLocation) {
    if (satPositions) {
      gallery.selectedVisual.setData(satPositions);
    }
  }
  if (gallery.selectedVisual != null) {
    gallery.selectedVisual.draw();
  }
}
