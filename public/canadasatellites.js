function CanadaSatellites() {
  this.name = 'Satellite Map Canada';
  this.id = 'canada-map';
  this.title = 'Current Satellite Positions on Canada Map';
  this.worldMap = null;

  this.satData = [];

  this.setup = function() {
    textSize(16);
  };

  this.preload = function () {
    this.worldMap = loadImage('./data/satellite-location/canada.png');
  };

  this.destroy = function() {};
  
  // Method to receive new positions from server
  this.setData = function(positions) {
    if (!positions || positions.length === 0) return;
    let p = positions [0];

    this.satData.push({
      lat: p.satlatitude,
      lon: p.satlongitude,
      t: Date.now()
    });
  };

  this.draw = function() {
    image(this.worldMap, 0, 0, width, height);

    drawTitle(this.title);

    // If no data yet, display a message
    if (this.satData.length === 0) {
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(16);
      text("Waiting for data...", width / 2, height / 2);
      return;
    }

    // Plot each position in satData
    // Equirectangular projection logic: 
    //   longitude: -180..180 -> x: 0..width
    //   latitude:  +90..-90  -> y: 0..height (notice lat is inverted)
    stroke(200,0,0);
    fill(200,0,0);
    for (let i = 0; i < this.satData.length; i++) {
      let lat = this.satData[i].lat;
      let lon = this.satData[i].lon;
      
      let x = map(lon, -180, 180, 0, width);
      let y = map(lat, 90, -90, 0, height);

      // Draw a tiny ellipse for the satellite position
      ellipse(x, y, 5, 5);

      if (i === this.satData.length - 1) {
        fill(255);
        noStroke();
        let labelOffsetY = 20;
        text(`Lat: ${nf(lat, 1, 2)}, Lon: ${nf(lon, 1, 2)}`, x, y + labelOffsetY);
        fill(200,0,0);
        stroke(200,0,0);
      }
    }
  };
}