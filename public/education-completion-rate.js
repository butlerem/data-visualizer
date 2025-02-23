export function EducationCompletionRate() {
  this.name = "Education Completion";
  this.id = "education-completion-rate";
  this.title = "Female Primary Education Completion Rate Over Time (by Region)";

  this.loaded = false;

  // These labels appear on your gallery UI
  this.xAxisLabel = "Year";
  this.yAxisLabel = "% Completion";

  // p5 layout settings
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

  // ---------------------
  // Storing data in two forms:
  //   1) this.rawData: array of docs from Firestore
  //   2) this.data: object grouped by region, e.g.
  //      { "Africa": [ { year:1990, rate:50.1 }, ... ], "Asia": [...], ... }
  // ---------------------
  this.rawData = [];
  this.data = {}; // Processed data, grouped by region
  this.regionColors = {};

  // --------------
  // 1) PRELOAD: get Firestore data
  // --------------
  this.preload = function () {
    const self = this;
    import("https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js")
      .then(({ getFirestore, collection, getDocs }) => {
        const db = getFirestore(window.app); // ensure window.app is your initialized Firebase app
        return getDocs(collection(db, "primary_education_completion"));
      })
      .then((querySnapshot) => {
        // Save raw array
        self.rawData = querySnapshot.docs.map((doc) => doc.data());
        self.loaded = true;
        console.log("Education data loaded from Firestore:", self.rawData);
      })
      .catch((error) => {
        console.error("Error loading data from Firestore:", error);
      });
  };

  // --------------
  // 2) SETUP: transform rawData, compute min/max, create slider, etc.
  // --------------
  this.setup = function () {
    // If data not loaded or empty, skip
    if (!this.loaded || !this.rawData.length) {
      console.warn("Education data not loaded or is empty.");
      return;
    }

    textSize(16);
    textAlign(CENTER, CENTER);

    // Step A: Group data by region, collecting multiple entries per year
    let regionYearValues = {};
    // regionYearValues might look like:
    // { "Africa": { 1990: [50.1, 49.7], 1991: [52.3, 51.8] }, "Asia": {...}, ... }

    for (let i = 0; i < this.rawData.length; i++) {
      const row = this.rawData[i];
      const region = row["Region"];
      if (!region) continue; // skip if no region

      // Make sure regionYearValues[region] exists
      if (!regionYearValues[region]) {
        regionYearValues[region] = {};
      }

      // For each year from 1990 to 2023, see if row has a value
      for (let year = 1990; year <= 2023; year++) {
        const strYear = year.toString();
        const val = row[strYear];
        if (val !== undefined && val !== "") {
          // Convert string to a number
          let numVal = parseFloat(val);
          if (!regionYearValues[region][year]) {
            regionYearValues[region][year] = [];
          }
          regionYearValues[region][year].push(numVal);
        }
      }
    }

    // Step B: For each region + year array, compute average and store
    // final structure in this.data
    for (let region in regionYearValues) {
      this.data[region] = [];
      for (let year = 1990; year <= 2023; year++) {
        const arr = regionYearValues[region][year];
        if (arr && arr.length > 0) {
          const sum = arr.reduce((acc, val) => acc + val, 0);
          const avg = sum / arr.length;
          // push { year, rate } to region’s array
          this.data[region].push({ year: year, rate: avg });
        }
      }
      // Sort by year just in case
      this.data[region].sort((a, b) => a.year - b.year);
    }

    // Step C: Overall min/max for all rates
    // Gather all rates in one array
    let allRates = [];
    for (let region in this.data) {
      for (let i = 0; i < this.data[region].length; i++) {
        allRates.push(this.data[region][i].rate);
      }
    }
    // If allRates is empty, bail out
    if (!allRates.length) {
      console.warn("No valid rates found in Firestore data.");
      return;
    }

    this.minRate = min(allRates); // p5's min()
    this.maxRate = max(allRates); // p5's max()

    // Step D: Year range, defaults
    this.globalStartYear = 1990;
    this.globalEndYear = 2023;
    this.startYear = this.globalStartYear;
    this.endYear = this.globalEndYear;

    // Step E: Create a slider for selecting start year
    this.yearSlider = createSlider(
      this.globalStartYear,
      this.globalEndYear,
      this.globalStartYear,
      1
    );
    this.yearSlider.parent("sliders");
    this.yearSlider.style("width", "300px");

    // Step F: Assign distinct colors to each region
    let availableColors = [
      color("#5e81ac"),
      color("#81a1c1"),
      color("#8fbcbb"),
      color("#a3be8c"),
      color("#b48ead"),
      color("#d08770"),
    ];
    let colorIndex = 0;
    for (let region in this.data) {
      this.regionColors[region] =
        availableColors[colorIndex % availableColors.length];
      colorIndex++;
    }

    // Step G: Initialize frameCount for animation
    this.frameCount = 0;
  };

  // --------------
  // 3) DESTROY: remove slider or other DOM elements if user switches visuals
  // --------------
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

  // --------------
  // 4) DRAW: main loop
  // --------------
  this.draw = function () {
    // Make sure data is loaded and processed
    if (!this.loaded || Object.keys(this.data).length === 0) {
      console.log("Education data not yet loaded or no data after processing.");
      return;
    }

    // Read slider value (startYear)
    this.startYear = parseInt(this.yearSlider.value());
    let numYears = this.endYear - this.startYear;

    // Draw Y axis ticks, axes, labels
    drawYAxisTickLabels(
      this.minRate,
      this.maxRate,
      this.layout,
      this.mapRateToHeight.bind(this),
      0 // decimal places
    );
    drawAxis(this.layout);
    drawAxisLabels(this.xAxisLabel, this.yAxisLabel, this.layout);

    // Draw X axis ticks
    let xTickSkip = ceil(numYears / this.layout.numXTickLabels);
    textStyle(NORMAL);
    for (let yr = this.startYear; yr <= this.endYear; yr++) {
      if ((yr - this.startYear) % xTickSkip === 0) {
        let x = this.mapYearToWidth(yr);
        // optional grid line
        stroke(150);
        line(x, this.layout.topMargin, x, this.layout.bottomMargin);

        // label
        noStroke();
        fill(255);
        text(yr, x, this.layout.bottomMargin + 15);
      }
    }

    // Draw lines for each region
    for (let region in this.data) {
      // Filter region points to only those >= this.startYear
      let regionData = this.data[region].filter(
        (d) => d.year >= this.startYear
      );
      if (regionData.length < 2) continue; // need at least two points

      stroke(this.regionColors[region]);
      strokeWeight(2);
      noFill();

      beginShape();
      let yearCount = 0; // for animation

      for (let i = 0; i < regionData.length; i++) {
        if (yearCount >= this.frameCount) break; // stop if we haven't "animated" this far
        let pt = regionData[i];
        let x = this.mapYearToWidth(pt.year);
        let y = this.mapRateToHeight(pt.rate);
        vertex(x, y);
        yearCount++;
      }
      endShape();
    }

    // Increment animation frame
    this.frameCount++;
    if (this.frameCount >= numYears) {
      this.frameCount = numYears; // or noLoop() if you want to stop
    }
  };

  // --------------
  // 5) HELPER: map year -> x
  // --------------
  this.mapYearToWidth = function (value) {
    return map(
      value,
      this.startYear,
      this.endYear,
      this.layout.leftMargin,
      this.layout.rightMargin
    );
  };

  // --------------
  // 6) HELPER: map rate -> y
  // --------------
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
