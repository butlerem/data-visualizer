import {
  createLayout,
  createYearSliders,
  removeYearSliders,
  drawYAxisTickLabels,
  drawAxis,
  drawAxisLabels,
} from "./helper-functions.js";

export function EducationCompletionRate() {
  this.name = "Education Completion";
  this.id = "education-completion-rate";
  this.title = "Female Primary Education Completion Rate Over Time (by Region)";
  this.loaded = false;
  this.xAxisLabel = "Year";
  this.yAxisLabel = "% Completion";

  // Data storage: raw data and grouped data by region
  this.rawData = [];
  this.data = {}; // e.g. { "Africa": [{ year, rate }, ...], ... }
  this.regionColors = {};

  // Global year range
  this.globalStartYear = 1990;
  this.globalEndYear = 2022;

  // p5 layout settings
  const marginSize = 35;
  this.layout = createLayout(marginSize, width, height, {
    grid: true,
    numXTickLabels: 10,
    numYTickLabels: 8,
  });

  // UI elements for year range
  this.sliders = null;

  // For animation
  this.frameCount = 0;

  // PRELOAD: fetch education completion data
  this.preload = function () {
    const self = this;
    import("https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js")
      .then(({ getFirestore, collection, getDocs }) => {
        const db = getFirestore(window.app);
        return getDocs(collection(db, "primary_education_completion"));
      })
      .then((querySnapshot) => {
        self.rawData = querySnapshot.docs.map((doc) => doc.data());
        self.loaded = true;
        console.log("Education Data loaded:", self.rawData);
      })
      .catch((error) => {
        console.error("Error loading Education data:", error);
      });
  };

  // SETUP: group data by region, compute averages, and set up UI
  this.setup = function () {
    if (!this.loaded || !this.rawData.length) {
      console.warn("EducationCompletionRate: Data not loaded or empty.");
      return;
    }

    textSize(16);
    textAlign(CENTER, CENTER);

    // Group rawData by region and year
    const regionYearValues = {};
    for (let row of this.rawData) {
      const region = row["Region"];
      if (!region) continue;
      if (!regionYearValues[region]) regionYearValues[region] = {};
      for (
        let year = this.globalStartYear;
        year <= this.globalEndYear;
        year++
      ) {
        const strYear = year.toString();
        const val = row[strYear];
        if (val !== undefined && val !== "") {
          const numVal = parseFloat(val);
          if (!regionYearValues[region][year])
            regionYearValues[region][year] = [];
          regionYearValues[region][year].push(numVal);
        }
      }
    }

    // Compute average rate for each region and year
    for (let region in regionYearValues) {
      this.data[region] = [];
      for (
        let year = this.globalStartYear;
        year <= this.globalEndYear;
        year++
      ) {
        const arr = regionYearValues[region][year];
        if (arr && arr.length > 0) {
          const avg = arr.reduce((acc, val) => acc + val, 0) / arr.length;
          this.data[region].push({ year, rate: avg });
        }
      }
      // Ensure data is sorted by year
      this.data[region].sort((a, b) => a.year - b.year);
    }

    // Compute overall min and max rates across regions
    const allRates = [];
    for (let region in this.data) {
      for (let entry of this.data[region]) {
        allRates.push(entry.rate);
      }
    }
    this.minRate = Math.min(...allRates);
    this.maxRate = Math.max(...allRates);

    // Create sliders using helper
    this.sliders = createYearSliders(this.globalStartYear, this.globalEndYear);

    // Assign distinct colors to each region
    const availableColors = [
      color("#ab52d5"), // Vibrant Purple
      color("#84d7d9"), // Soft Cyan
      color("#f4a261"), // Warm Orange
      color("#2a9d8f"), // Deep Teal
      color("#e76f51"), // Coral Red
      color("#4f9df7"), // Light Blue
    ];
    let colorIndex = 0;
    for (let region in this.data) {
      this.regionColors[region] =
        availableColors[colorIndex % availableColors.length];
      colorIndex++;
    }

    this.frameCount = 0;
  };

  // DESTROY: remove UI elements
  this.destroy = function () {
    if (this.sliders) removeYearSliders(this.sliders);
  };

  // DRAW: render the education completion chart
  this.draw = function () {
    if (!this.loaded || Object.keys(this.data).length === 0) {
      console.log("EducationCompletionRate: Data not ready in draw()");
      return;
    }

    // Ensure valid slider values
    if (this.sliders.startSlider.value() >= this.sliders.endSlider.value()) {
      this.sliders.startSlider.value(this.sliders.endSlider.value() - 1);
    }

    this.startYear = parseInt(this.sliders.startSlider.value());
    this.endYear = parseInt(this.sliders.endSlider.value());
    const numYears = this.endYear - this.startYear;

    drawYAxisTickLabels(
      this.minRate,
      this.maxRate,
      this.layout,
      this.mapRateToHeight.bind(this),
      0
    );
    drawAxis(this.layout);
    drawAxisLabels(this.xAxisLabel, this.yAxisLabel, this.layout);

    // Draw X tick labels
    const xTickSkip = ceil(numYears / this.layout.numXTickLabels);
    for (let yr = this.startYear; yr <= this.endYear; yr++) {
      if ((yr - this.startYear) % xTickSkip === 0) {
        const x = this.mapYearToWidth(yr);
        stroke(150);
        line(x, this.layout.topMargin, x, this.layout.bottomMargin);
        noStroke();
        fill(255);
        text(yr, x, this.layout.bottomMargin + 15);
      }
    }

    // Draw lines for each region
    for (let region in this.data) {
      const regionData = this.data[region].filter(
        (d) => d.year >= this.startYear
      );
      if (regionData.length < 2) continue;

      stroke(this.regionColors[region] || color(255, 0, 0));
      strokeWeight(2);
      noFill();

      beginShape();
      let count = 0;
      for (let pt of regionData) {
        if (count >= this.frameCount) break;
        vertex(this.mapYearToWidth(pt.year), this.mapRateToHeight(pt.rate));
        count++;
      }
      endShape();
    }

    this.frameCount++;
    if (this.frameCount >= numYears) {
      this.frameCount = numYears;
    }
  };

  // Helper: Map a year value to an x-coordinate
  this.mapYearToWidth = function (year) {
    return map(
      year,
      this.startYear,
      this.endYear,
      this.layout.leftMargin,
      this.layout.rightMargin
    );
  };

  // Helper: Map a rate value to a y-coordinate
  this.mapRateToHeight = function (rate) {
    return map(
      rate,
      this.minRate,
      this.maxRate,
      this.layout.bottomMargin,
      this.layout.topMargin
    );
  };
}
