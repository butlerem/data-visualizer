import {
  createLayout,
  createYearSliders,
  removeYearSliders,
  drawYAxisTickLabels,
  drawXAxisTickLabels,
  drawAxis,
  drawAxisLabels,
  fetchData,
} from "../helper-functions.js";

export function PayGapTimeSeries() {
  // Public properties
  const self = this;
  this.name = "Gender Pay Gap";
  this.id = "pay-gap-timeseries";
  this.title = "Percent Difference Between Male and Female Pay Per Year";
  this.collectionName = "pay_gap_by_year";
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

  const marginSize = 35;
  this.layout = createLayout(marginSize, width, height, {
    grid: true,
    numXTickLabels: 10,
    numYTickLabels: 8,
  });

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
    this.StartYear = 1997;
    this.EndYear = 2017;
    this.minPayGap = 15;
    this.maxPayGap = 30;

    // Create sliders for year range
    this.sliders = createYearSliders(1997, 2017);

    // For animation
    this.frameCount = 0;
  };

  // Destroy visual, clean up UI
  this.destroy = function () {
    if (this.sliders) removeYearSliders(this.sliders);
  };

  // Draw: Render the line chart
  this.draw = function () {
    if (!this.loaded || !this.data.length) {
      console.log("PayGapTimeSeries data not loaded yet.");
      return;
    }
    textFont("DM Sans");
    textSize(14);
    textStyle(NORMAL);

    // Update year range based on slider values
    this.startYear = parseInt(this.sliders.startSlider.value());
    this.endYear = parseInt(this.sliders.endSlider.value());
    const numYears = this.endYear - this.startYear;

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

    const xTickSkip = Math.ceil(numYears / this.layout.numXTickLabels);
    for (let year = this.startYear; year <= this.endYear; year++) {
      if ((year - this.startYear) % xTickSkip === 0) {
        drawXAxisTickLabels(year, this.layout, this.mapYearToWidth.bind(this));
      }
    }

    stroke(255);
    strokeWeight(1);
    noFill();
    beginShape();

    let previous = null;
    let segmentsDrawn = 0;

    for (let i = 0; i < this.data.length; i++) {
      const current = this.data[i];
      if (
        previous &&
        current.year >= this.startYear &&
        current.year <= this.endYear
      ) {
        if (segmentsDrawn < this.frameCount) {
          stroke(200);
          line(
            this.mapYearToWidth(previous.year),
            this.mapPayGapToHeight(previous.pay_gap),
            this.mapYearToWidth(current.year),
            this.mapPayGapToHeight(current.pay_gap)
          );
          segmentsDrawn++;
        }
      }
      previous = current;
    }

    // Increase frame count to animate progressively
    this.frameCount += 0.5;
    if (this.frameCount >= numYears) {
      this.frameCount = numYears;
    }
  };

  /**
   * Helper: Maps a given year to its x-coordinate
   * @param {number} year - year to map.
   * @returns {number} - x-coordinate value.
   */
  this.mapYearToWidth = function (year) {
    return map(
      year,
      this.startYear,
      this.endYear,
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
