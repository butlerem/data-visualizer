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

export function ClimateChange() {
  // Public properties
  this.name = "Climate Change";
  this.id = "climate-change";
  this.title = "Climate Change in ℃ Per Year";
  this.collectionName = "surface_temp";
  this.loaded = false;
  this.xAxisLabel = "Year";
  this.yAxisLabel = "Change in ℃";
  this.data = [];

  // Statistics for stats panel
  this.stats = [
    { icon: "eco", value: "0.5℃", label: "Avg Increase" },
    { icon: "trending_up", value: "2.0℃", label: "Max Increase" },
    { icon: "trending_down", value: "-1.0℃", label: "Min Increase" },
  ];

  /**
   * TODO: Make the stats panel dynamically update based on data for all visuals.
   * - Extract relevant statistics from the dataset like min max average.
   * - Automatically update stats panel for better insights.
   */

  // p5 layout settings
  const marginSize = 35;
  this.layout = createLayout(marginSize, width, height, {
    grid: false,
    numXTickLabels: 8,
    numYTickLabels: 8,
  });
  textSize(16);

  // Preload data from Firestore
  this.preload = async function () {
    try {
      let rawData = await fetchData("surface_temp");
      // Convert string data to numeric values
      this.data = rawData.map((d) => ({
        year: parseFloat(d.year),
        temperature: parseFloat(d.temperature),
      }));
      this.loaded = true;
      console.log("Climate Change Data loaded");
    } catch (error) {
      console.error("Error loading Climate Change data:", error);
    }
  };

  /**
   * Setup: Initialize UI, sort data
   */
  this.setup = function () {
    // Define the data range
    this.minYear = this.data[0].year;
    this.maxYear = this.data[this.data.length - 1].year;
    const allTemps = this.data.map((d) => d.temperature);
    this.minTemperature = Math.min(...allTemps);
    this.maxTemperature = Math.max(...allTemps);
    this.meanTemperature =
      allTemps.reduce((acc, t) => acc + t, 0) / this.data.length;

    // Create sliders for year range
    this.sliders = createYearSliders(this.minYear, this.maxYear);

    // Reset animation frame count
    this.frameCount = 0;
  };

  // Destroy visual, clean up UI
  this.destroy = function () {
    if (this.sliders) removeYearSliders(this.sliders);
  };

  // Draw: Render the line chart
  this.draw = function () {
    if (!this.loaded) {
      console.log("Climate data not loaded yet.");
      return;
    }

    // Update year range based on slider values
    this.startYear = parseInt(this.sliders.startSlider.value());
    this.endYear = parseInt(this.sliders.endSlider.value());
    const numYears = this.endYear - this.startYear;

    // Draw y-axis tick labels and axes
    drawYAxisTickLabels(
      this.minTemperature,
      this.maxTemperature,
      this.layout,
      this.mapTemperatureToHeight.bind(this),
      1
    );
    drawAxis(this.layout);
    drawAxisLabels(this.xAxisLabel, this.yAxisLabel, this.layout);

    // Draw X-axis tick labels
    const xTickSkip = Math.ceil(numYears / this.layout.numXTickLabels);
    for (let year = this.startYear; year <= this.endYear; year++) {
      if ((year - this.startYear) % xTickSkip === 0) {
        drawXAxisTickLabels(year, this.layout, this.mapYearToWidth.bind(this));
      }
    }

    // Draw mean temperature line
    stroke(150);
    strokeWeight(1);
    line(
      this.layout.leftMargin,
      this.mapTemperatureToHeight(this.meanTemperature),
      this.layout.rightMargin,
      this.mapTemperatureToHeight(this.meanTemperature)
    );

    // Draw each segment of the data with animation
    const segmentWidth = this.layout.plotWidth() / numYears;
    let previous = null;
    let segmentsDrawn = 0;

    for (let i = 0; i < this.data.length; i++) {
      const current = this.data[i];
      if (
        previous &&
        current.year > this.startYear &&
        current.year <= this.endYear
      ) {
        if (segmentsDrawn < this.frameCount) {
          // Draw background rectangle representing temperature
          noStroke();
          fill(this.mapTemperatureToColour(current.temperature));
          rect(
            this.mapYearToWidth(previous.year),
            this.layout.topMargin,
            segmentWidth,
            this.layout.plotHeight()
          );

          // Draw connecting line between data points
          stroke(150);
          line(
            this.mapYearToWidth(previous.year),
            this.mapTemperatureToHeight(previous.temperature),
            this.mapYearToWidth(current.year),
            this.mapTemperatureToHeight(current.temperature)
          );
          segmentsDrawn++;
        }
      }
      previous = current;
    }

    // Increase frame count to animate progressively
    this.frameCount += 2;
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
   * Helper: Maps a temperature value to its corresponding y-coordinate
   * @param {number} temp - temperature value
   * @returns {number} - y-coordinate value
   */
  this.mapTemperatureToHeight = function (temp) {
    return map(
      temp,
      this.minTemperature,
      this.maxTemperature,
      this.layout.bottomMargin,
      this.layout.topMargin
    );
  };

  /**
   * Helper: Maps a temperature value to a color
   * @param {number} temp - temperature value
   * @returns {p5.Color} - color corresponding to the temperature
   */
  this.mapTemperatureToColour = function (temp) {
    const red = map(temp, this.minTemperature, this.maxTemperature, 231, 79);
    const green = map(temp, this.minTemperature, this.maxTemperature, 111, 157);
    const blue = map(temp, this.minTemperature, this.maxTemperature, 81, 247);
    return color(red, green, blue, 80);
  };
}
