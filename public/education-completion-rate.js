import {
  createLayout,
  createYearSliders,
  removeYearSliders,
  drawYAxisTickLabels,
  drawAxis,
  drawAxisLabels,
  fetchData,
  hideElement,
} from "./helper-functions.js";

export function EducationCompletionRate() {
  // Public properties
  this.name = "Education Completion";
  this.id = "education-completion-rate";
  this.title = "Female Primary Education Completion Rate Over Time (by Region)";
  this.loaded = false;
  this.xAxisLabel = "Year";
  this.yAxisLabel = "% Completion";

  // rawData: original records fetched from database
  // data: processed and grouped data by region
  // regionColors: mapping of region to a color
  this.rawData = [];
  this.data = {};
  this.regionColors = {};

  // Default year range
  this.globalStartYear = 1990;
  this.globalEndYear = 2022;

  // Statistics for stats panel
  this.stats = [
    { icon: "trending_up", value: "90%", label: "Completion Rate" },
    { icon: "pie_chart", value: "50%", label: "Female Share" },
    { icon: "pie_chart", value: "50%", label: "Male Share" },
  ];

  // p5 layout settings
  const marginSize = 35;
  this.layout = createLayout(marginSize, width, height, {
    grid: true,
    numXTickLabels: 10,
    numYTickLabels: 8,
  });

  // Preload data asynchronously
  this.preload = async function () {
    try {
      this.rawData = await fetchData("primary_education_completion");
      this.loaded = true;
      console.log("Education Data loaded");
    } catch (error) {
      console.error("Error loading Education data:", error);
    }
  };

  /**
   * Setup: Initialize UI, process data, group by region
   */
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
          if (!regionYearValues[region][year]) {
            regionYearValues[region][year] = [];
          }
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
    }

    // Compute overall min and max rates across regions.
    const allRates = [];
    for (let region in this.data) {
      for (let entry of this.data[region]) {
        allRates.push(entry.rate);
      }
    }
    this.minRate = Math.min(...allRates);
    this.maxRate = Math.max(...allRates);

    // Assign distinct colors to each region.
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

    // Create sliders for year range
    this.sliders = createYearSliders(this.globalStartYear, this.globalEndYear);

    // Reset animation frame count
    this.frameCount = 0;
  };

  // Destroy visual, clean up UI elements
  this.destroy = function () {
    if (this.sliders) removeYearSliders(this.sliders);
    hideElement("education-visualization");
  };

  // Draw: Render the education completion chart
  this.draw = function () {
    if (!this.loaded) {
      console.log("Education Completion data not loaded yet.");
      return;
    }

    // Ensure slider values are valid (start less than end)
    if (this.sliders.startSlider.value() >= this.sliders.endSlider.value()) {
      this.sliders.startSlider.value(this.sliders.endSlider.value() - 1);
    }

    // Update year range based on slider values
    this.startYear = parseInt(this.sliders.startSlider.value());
    this.endYear = parseInt(this.sliders.endSlider.value());
    const numYears = this.endYear - this.startYear;

    // Draw y-axis tick labels and axes
    drawYAxisTickLabels(
      this.minRate,
      this.maxRate,
      this.layout,
      this.mapRateToHeight.bind(this),
      0
    );
    drawAxis(this.layout);
    drawAxisLabels(this.xAxisLabel, this.yAxisLabel, this.layout);

    // Draw the x tick labels
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

    // Draw lines by region
    for (let region in this.data) {
      // Filter data points for current year range
      const regionData = this.data[region].filter(
        (d) => d.year >= this.startYear
      );
      if (regionData.length < 2) continue;

      stroke(this.regionColors[region] || color(255, 0, 0));
      strokeWeight(2);
      noFill();

      beginShape();
      let count = 0;
      // Draw data progressively for animation
      for (let pt of regionData) {
        if (count >= this.frameCount) break;
        vertex(this.mapYearToWidth(pt.year), this.mapRateToHeight(pt.rate));
        count++;
      }
      endShape();
    }

    // Increase frame count to animate progressively
    this.frameCount++;
    if (this.frameCount >= numYears) {
      this.frameCount = numYears;
    }
  };

  /**
   * Helper: Maps a given year to its corresponding x-coordinate
   * @param {number} year - year to be mapped
   * @returns {number} - x-coordinate based on the current layout
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
   * Helper: Maps a rate value to its corresponding y-coordinate on the canvas
   * @param {number} rate - education completion rate
   * @returns {number} - y-coordinate based on the current layout
   */
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
