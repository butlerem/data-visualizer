export function EducationCompletionRate() {
  this.name = "Education Completion";
  this.id = "education-completion-rate";
  this.title = "Female Primary Education Completion Rate Over Time (by Region)";
  this.loaded = false;

  this.xAxisLabel = "Year";
  this.yAxisLabel = "% Completion";

  // Layout and margins
  let marginSize = 35;
  this.layout = {
    marginSize: marginSize,
    leftMargin: marginSize * 2,
    rightMargin: width - marginSize,
    topMargin: marginSize,
    bottomMargin: height - marginSize * 2,
    pad: 5,
    grid: true,
    numXTickLabels: 10,
    numYTickLabels: 8,
    plotWidth: function () {
      return this.rightMargin - this.leftMargin;
    },
    plotHeight: function () {
      return this.bottomMargin - this.topMargin;
    },
  };

  // Store raw Firestore array here.
  // e.g. this.rawData = [ {Region: "Africa", "1990":"50.1", ...}, ... ]
  this.rawData = [];

  // Final processed data grouped by region:
  // e.g. this.data = { Africa: [ { year: 1990, rate: 50.1 }, ... ], ... }
  this.data = {};

  // We'll also store regionColors for drawing lines later.
  this.regionColors = {};

  // Preload data from Firestore (async)
  this.preload = function () {
    const self = this;
    import("https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js")
      .then(({ getFirestore, collection, getDocs }) => {
        const db = getFirestore(window.app); // Make sure window.app is your Firebase app
        return getDocs(collection(db, "education_gender"));
      })
      .then((querySnapshot) => {
        // Save the Firestore docs as an array of objects in rawData
        self.rawData = querySnapshot.docs.map((doc) => doc.data());
        self.loaded = true;
        console.log("Data loaded from Firestore:", self.rawData);
      })
      .catch((error) => {
        console.error("Error loading data:", error);
      });
  };

  // Setup: transform rawData into grouped data, create slider, etc.
  this.setup = function () {
    // Make sure the data is actually loaded
    if (!this.loaded || !this.rawData.length) {
      console.warn("Education data not loaded or is empty yet.");
      return;
    }

    textSize(16);
    textAlign(CENTER, CENTER);

    // 1) Organize data by region and year
    let regionYearValues = {};
    for (let i = 0; i < this.rawData.length; i++) {
      let row = this.rawData[i]; // e.g. { Region: "Africa", 1990: "50.1", 1991: "52.3", ... }
      let region = row["Region"];
      if (!region) continue; // skip if no region

      if (!regionYearValues[region]) {
        regionYearValues[region] = {};
      }

      // Loop through years 1990-2023
      for (let year = 1990; year <= 2023; year++) {
        let val = row[year.toString()];
        if (val !== undefined && val !== "") {
          let numValue = parseFloat(val);
          if (!regionYearValues[region][year]) {
            regionYearValues[region][year] = [];
          }
          regionYearValues[region][year].push(numValue);
        }
      }
    }

    // 2) For each region, compute the average completion rate for each year
    for (let region in regionYearValues) {
      // e.g. regionYearValues["Africa"] = { 1990: [50.1, 49.9], 1991: [52.3], ... }
      this.data[region] = [];
      for (let year = 1990; year <= 2023; year++) {
        let valuesArray = regionYearValues[region][year];
        if (valuesArray && valuesArray.length > 0) {
          let sum = valuesArray.reduce((acc, val) => acc + val, 0);
          let avg = sum / valuesArray.length;
          this.data[region].push({ year: year, rate: avg });
        }
      }
      // Sort by year
      this.data[region].sort((a, b) => a.year - b.year);
    }

    // 3) Define overall year range
    this.globalStartYear = 1990;
    this.globalEndYear = 2023;
    this.startYear = this.globalStartYear;
    this.endYear = this.globalEndYear;

    // 4) Determine overall min and max rate across all regions
    let allRates = [];
    for (let region in this.data) {
      for (let i = 0; i < this.data[region].length; i++) {
        allRates.push(this.data[region][i].rate);
      }
    }
    // You can use p5's min() and max() or standard JS:
    this.minRate = min(allRates); // p5 version
    this.maxRate = max(allRates); // p5 version
    // Or: this.minRate = Math.min(...allRates); etc.

    // 5) Create a slider for selecting a start year
    this.yearSlider = createSlider(
      this.globalStartYear,
      this.globalEndYear,
      this.globalStartYear,
      1
    );
    this.yearSlider.parent("sliders");
    this.yearSlider.style("width", "300px");

    // 6) Assign distinct colors to each region
    let availableColors = [
      color("#5e81ac"),
      color("#81a1c1"),
      color("#8fbcbb"),
      color("#a3be8c"),
      color("#b48ead"),
      color("#d08770"),
    ];
    let index = 0;
    for (let region in this.data) {
      this.regionColors[region] =
        availableColors[index % availableColors.length];
      index++;
    }

    // 7) Start an animation frame count
    this.frameCount = 0;
  };

  // Remove slider, etc. if user changes visuals
  this.destroy = function () {
    console.log("Destroying Education Completion Rate visualization...");
    if (this.yearSlider) {
      this.yearSlider.remove();
    }
    const slidersDiv = document.getElementById("sliders");
    if (slidersDiv) {
      slidersDiv.innerHTML = "";
    }
  };

  // Main draw function
  this.draw = function () {
    if (!this.loaded || Object.keys(this.data).length === 0) {
      console.log("Education data not yet loaded or data is empty.");
      return;
    }

    // Update the start year from the slider
    this.startYear = parseInt(this.yearSlider.value());
    let numYears = this.endYear - this.startYear;

    // Draw Y-axis stuff (tick labels, axis lines)
    drawYAxisTickLabels(
      this.minRate,
      this.maxRate,
      this.layout,
      this.mapRateToHeight.bind(this),
      0
    );
    drawAxis(this.layout);
    drawAxisLabels(this.xAxisLabel, this.yAxisLabel, this.layout);

    // Draw X-axis tick marks for each relevant year
    let xTickSkip = ceil(numYears / this.layout.numXTickLabels);
    textStyle(NORMAL);
    for (let year = this.startYear; year <= this.endYear; year++) {
      if ((year - this.startYear) % xTickSkip === 0) {
        let x = this.mapYearToWidth(year);
        stroke(150);
        line(x, this.layout.topMargin, x, this.layout.bottomMargin);
        noStroke();
        fill(255);
        text(year, x, this.layout.bottomMargin + 15);
      }
    }

    // Draw the lines for each region
    for (let region in this.data) {
      // Filter region data for years >= this.startYear
      let regionData = this.data[region].filter(
        (d) => d.year >= this.startYear
      );
      if (regionData.length < 2) continue; // Need at least 2 points to draw

      // Set stroke for this region
      stroke(this.regionColors[region]);
      strokeWeight(2);
      noFill();

      beginShape();
      let yearCount = 0; // For animation limiting

      // Walk through each data point in regionData
      for (let i = 0; i < regionData.length; i++) {
        if (yearCount >= this.frameCount) break; // Stop animating more points
        let pt = regionData[i];
        let x = this.mapYearToWidth(pt.year);
        let y = this.mapRateToHeight(pt.rate);
        vertex(x, y);
        yearCount++;
      }
      endShape();
    }

    // Increment frameCount for simple animation
    this.frameCount++;
    if (this.frameCount >= numYears) {
      this.frameCount = numYears;
    }
  };

  // Helper function: map year to x-position
  this.mapYearToWidth = function (value) {
    return map(
      value,
      this.startYear,
      this.endYear,
      this.layout.leftMargin,
      this.layout.rightMargin
    );
  };

  // Helper function: map rate to y-position
  this.mapRateToHeight = function (value) {
    return map(
      value,
      this.minRate,
      this.maxRate,
      this.layout.bottomMargin,
      this.layout.topMargin
    );
  };
}
