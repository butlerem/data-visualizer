import {
  createLayout,
  createYearSliders,
  removeYearSliders,
  drawYAxisTickLabels,
  drawAxis,
  drawAxisLabels,
  fetchData,
} from "./helper-functions.js";

export function PayGapTimeSeries() {
  // Public properties
  const self = this;
  this.name = "Pay Gap Over Time";
  this.id = "pay-gap-timeseries";
  this.title = "Percent Difference Between Male and Female Pay Per Year";
  this.loaded = false;
  this.xAxisLabel = "Year";
  this.yAxisLabel = "%";
  this.data = [];

  // Statistics for stats panel
  this.stats = [
    { icon: "timeline", value: "10%", label: "Min Gap" },
    { icon: "timeline", value: "20%", label: "Max Gap" },
    { icon: "timeline", value: "15%", label: "Average Gap" },
  ];

  // p5 layout: using a marginSize of 35. (Assuming global variables width and height from p5.)
  const marginSize = 35;
  this.layout = createLayout(marginSize, width, height, {
    grid: true,
    numXTickLabels: 10,
    numYTickLabels: 8,
  });
  textSize(16);
  textAlign(CENTER, CENTER);

  // Preload
  this.preload = async function () {
    try {
      this.data = await fetchData("pay_gap_by_year");
      this.loaded = true;
      console.log("Pay Gap Data loaded");
    } catch (error) {
      console.error("Error loading Pay Gap data:", error);
    }
  };

  /**
   * Setup: Initialize UI, sort data
   */
  this.setup = function () {
    // Settings for the data range
    this.globalStartYear = 1997;
    this.globalEndYear = 2017;
    this.minPayGap = 0;
    this.maxPayGap = 30;

    // Create sliders for year range
    this.sliders = createYearSliders(1997, 2017);

    // For animation
    this.frameCount = 0;
  };

  // Destroy visual, clean up UI elements
  this.destroy = function () {
    if (this.sliders) removeYearSliders(this.sliders);
  };

  // Draw: Render the line chart
  this.draw = function () {
    if (!this.loaded || !this.data.length) {
      console.log("PayGapTimeSeries data not loaded yet.");
      return;
    }

    const startYear = parseInt(this.sliders.startSlider.value());
    const endYear = parseInt(this.sliders.endSlider.value());

    // Ensure valid year range
    if (startYear >= endYear) {
      this.sliders.startSlider.value(endYear - 1);
    }

    // Draw y-axis tick labels and axes
    drawYAxisTickLabels(
      this.minPayGap,
      this.maxPayGap,
      this.layout,
      this.mapPayGapToHeight.bind(this),
      0
    );
    drawAxis(this.layout);
    drawAxisLabels(this.xAxisLabel, this.yAxisLabel, this.layout);

    // Draw x ticks using p5 functions
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

    // Draw average line
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

  /**
   * Helper: Maps a given year to its x-coordinate
   * @param {number} year - year to map.
   * @returns {number} - x-coordinate value.
   */
  this.mapYearToWidth = function (year, startYear, endYear) {
    return map(
      year,
      startYear,
      endYear,
      this.layout.leftMargin,
      this.layout.rightMargin
    );
  };

  /**
   * Helper: Maps a pay gap value to its corresponding y-coordinate
   * @param {number} gap - gap value
   * @returns {number} - y-coordinate value
   */
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
