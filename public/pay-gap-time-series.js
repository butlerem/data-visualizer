import {
  createLayout,
  createYearSliders,
  removeYearSliders,
  drawYAxisTickLabels,
  drawAxis,
  drawAxisLabels,
} from "./helper-functions.js";

export function PayGapTimeSeries() {
  const self = this;
  this.name = "Pay Gap Over Time";
  this.id = "pay-gap-timeseries";
  this.title = "Percent Difference Between Male and Female Pay Per Year";
  this.loaded = false;
  this.xAxisLabel = "Year";
  this.yAxisLabel = "%";
  this.data = [];

  this.stats = [
    { icon: "timeline", value: "10%", label: "Min Gap" },
    { icon: "timeline", value: "20%", label: "Max Gap" },
    { icon: "timeline", value: "15%", label: "Average Gap" },
  ];

  // Global settings for the data range (will be updated on setup)
  this.globalStartYear = 1997;
  this.globalEndYear = 2017;
  this.minPayGap = 0;
  this.maxPayGap = 30;

  // p5 layout: using a marginSize of 35
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

  // PRELOAD: fetch data from Firestore
  this.preload = function () {
    const self = this;
    import("https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js")
      .then(({ getFirestore, collection, getDocs }) => {
        const db = getFirestore(window.app);
        return getDocs(collection(db, "pay_gap_by_year"));
      })
      .then((querySnapshot) => {
        self.data = querySnapshot.docs.map((doc) => doc.data());
        self.loaded = true;
        console.log("Pay Gap Data loaded:", self.data);
      })
      .catch((error) => {
        console.error("Error loading Pay Gap data:", error);
      });
  };

  // SETUP: prepare the data, layout, and UI
  this.setup = function () {
    textSize(16);
    textAlign(CENTER, CENTER);

    if (!this.loaded || !this.data.length) {
      console.log("PayGapTimeSeries: no data in setup.");
      return;
    }

    // Parse and sort data by year
    this.data.forEach((d) => {
      d.year = parseFloat(d.year) || 2000;
      d.pay_gap = parseFloat(d.pay_gap) || 0;
    });
    this.data.sort((a, b) => a.year - b.year);

    // Update global range and pay gap min/max from data
    this.globalStartYear = this.data[0].year;
    this.globalEndYear = this.data[this.data.length - 1].year;
    const payGaps = this.data.map((d) => d.pay_gap);
    this.minPayGap = Math.min(...payGaps);
    this.maxPayGap = Math.max(...payGaps);

    // Recreate layout in case canvas size has changed
    this.layout = createLayout(marginSize, width, height, {
      grid: true,
      numXTickLabels: 10,
      numYTickLabels: 8,
    });

    // Create sliders using helper
    this.sliders = createYearSliders(this.globalStartYear, this.globalEndYear);

    this.frameCount = 0; // Reset animation frame count
  };

  // DESTROY: remove UI elements
  this.destroy = function () {
    if (this.sliders) removeYearSliders(this.sliders);
  };

  // DRAW: p5 draw loop for rendering
  this.draw = function () {
    if (!this.loaded || !this.data.length) {
      console.log("PayGapTimeSeries: data not loaded in draw()");
      return;
    }

    const startYear = parseInt(this.sliders.startSlider.value());
    const endYear = parseInt(this.sliders.endSlider.value());

    // Ensure valid year range
    if (startYear >= endYear) {
      this.sliders.startSlider.value(endYear - 1);
    }

    // Draw axis, ticks, and labels (assuming you have global functions drawAxis, drawYAxisTickLabels, drawAxisLabels)
    drawYAxisTickLabels(
      this.minPayGap,
      this.maxPayGap,
      this.layout,
      this.mapPayGapToHeight.bind(this),
      0
    );
    drawAxis(this.layout);
    drawAxisLabels(this.xAxisLabel, this.yAxisLabel, this.layout);

    // Draw X ticks
    const numYears = endYear - startYear;
    const xTickSkip = ceil(numYears / this.layout.numXTickLabels);
    for (let yr = startYear; yr <= endYear; yr++) {
      if ((yr - startYear) % xTickSkip === 0) {
        const x = this.mapYearToWidth(yr, startYear, endYear);
        stroke(150);
        line(x, this.layout.topMargin, x, this.layout.bottomMargin);
        noStroke();
        fill(255);
        text(yr, x, this.layout.bottomMargin + 15);
      }
    }
    stroke(255);
    strokeWeight(2);
    noFill();
    beginShape();

    let drawnCount = 0;
    const filteredData = this.data.filter(
      (d) => d.year >= startYear && d.year <= endYear
    );
    const maxFrames = filteredData.length;

    for (let i = 0; i < filteredData.length; i++) {
      const d = filteredData[i];
      if (drawnCount >= this.frameCount) break;

      vertex(
        this.mapYearToWidth(d.year, startYear, endYear),
        this.mapPayGapToHeight(d.pay_gap)
      );

      drawnCount++;
    }

    endShape();

    this.frameCount++;
    if (this.frameCount > maxFrames) {
      this.frameCount = maxFrames;
    }
  };

  // Helper: Map a given year to an x-coordinate based on current slider range
  this.mapYearToWidth = function (year, startYear, endYear) {
    return map(
      year,
      startYear,
      endYear,
      this.layout.leftMargin,
      this.layout.rightMargin
    );
  };

  // Helper: Map a pay gap value to a y-coordinate
  this.mapPayGapToHeight = function (gap) {
    return map(
      gap,
      this.minPayGap,
      this.maxPayGap,
      this.layout.bottomMargin,
      this.layout.topMargin
    );
  };
}
