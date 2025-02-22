function EducationCompletionRate() {
  this.name = "Education Completion";
  this.id = "education-completion-rate";
  this.title = "Female Primary Education Completion Rate Over Time (by Region)";
  this.loaded = false;
  this.xAxisLabel = "Year";
  this.yAxisLabel = "% Completion";
  var marginSize = 35;

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

  // Instead of a selected country, we now group data by region.
  // this.data will be an object where each key is a region and each value is an array of {year, rate} objects.
  this.data = {};
  // This object will hold a color for each region (so each line is visually distinct)
  this.regionColors = {};

  // 1) Preload: load the CSV table containing our education data.
  this.preload = function () {
    let self = this;
    this.table = loadTable(
      "./data/education/primary_education_completion.csv",
      "csv",
      "header",
      function (table) {
        self.loaded = true;
        console.log("Data loaded!");
      }
    );
  };

  // 2) Setup: Process the data and group it by region.
  this.setup = function () {
    textSize(16);
    textAlign("center", "center");
    if (!this.loaded) return;

    // Create an intermediate object to gather values for each region and year.
    // It will have the form:
    // { regionName: { year: [list of rates from different countries in that region] } }
    let regionYearValues = {};

    // Assume our data spans the years 1990 to 2023 (based on your CSV headers)
    for (let i = 0; i < this.table.getRowCount(); i++) {
      let row = this.table.getRow(i);
      let region = row.get("Region");
      if (!region) continue; // Skip rows without a region

      // If we haven't seen this region before, create an entry for it.
      if (!regionYearValues[region]) {
        regionYearValues[region] = {};
      }

      // Loop through each year and add the value (if available) to the list.
      for (let year = 1990; year <= 2023; year++) {
        let value = row.get(year.toString());
        if (value !== "") {
          // Only process if there is data for that year
          let numValue = float(value);
          if (!regionYearValues[region][year]) {
            regionYearValues[region][year] = [];
          }
          regionYearValues[region][year].push(numValue);
        }
      }
    }

    // Now, compute the average completion rate for each region per year.
    // We will store this processed data in this.data.
    for (let region in regionYearValues) {
      this.data[region] = [];
      for (let year = 1990; year <= 2023; year++) {
        let values = regionYearValues[region][year];
        if (values && values.length > 0) {
          let sum = values.reduce((a, b) => a + b, 0);
          let avg = sum / values.length;
          this.data[region].push({ year: year, rate: avg });
        }
      }
      // Make sure the array is sorted by year.
      this.data[region].sort((a, b) => a.year - b.year);
    }

    // Define the global start and end years (you can change these if needed)
    this.globalStartYear = 1990;
    this.globalEndYear = 2023;
    this.startYear = this.globalStartYear;
    this.endYear = this.globalEndYear;

    // Calculate the overall minimum and maximum rate values across all regions.
    let allRates = [];
    for (let region in this.data) {
      for (let i = 0; i < this.data[region].length; i++) {
        allRates.push(this.data[region][i].rate);
      }
    }
    this.minRate = min(allRates);
    this.maxRate = max(allRates);

    // Create a slider to allow the user to select a start year.
    this.yearSlider = createSlider(
      this.globalStartYear,
      this.globalEndYear,
      this.globalStartYear,
      1
    );
    this.yearSlider.parent("sliders");
    this.yearSlider.style("width", "300px");

    // Assign a distinct color to each region.
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

    this.frameCount = 0;
  };

  // 3) Destroy: Remove any UI elements when this visualization is taken down.
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

  // 4) Draw: Render the visualization on the canvas.
  this.draw = function () {
    if (!this.loaded || Object.keys(this.data).length === 0) {
      console.log("Education data not yet loaded.");
      return;
    }

    // Update the start year from the slider value.
    this.startYear = this.yearSlider.value();

    // Draw Y axis tick labels (assumes you have a drawYAxisTickLabels function).
    drawYAxisTickLabels(
      this.minRate,
      this.maxRate,
      this.layout,
      this.mapRateToHeight.bind(this),
      0
    );
    // Draw the main axes and their labels.
    drawAxis(this.layout);
    drawAxisLabels(this.xAxisLabel, this.yAxisLabel, this.layout);

    let numYears = this.endYear - this.startYear;
    let xTickSkip = ceil(numYears / this.layout.numXTickLabels);

    for (let year = this.startYear; year <= this.endYear; year++) {
      if ((year - this.startYear) % xTickSkip === 0) {
        let x = this.mapYearToWidth(year);
        stroke(150); // Color for grid lines; adjust as needed.
        line(x, this.layout.topMargin, x, this.layout.bottomMargin);
        noStroke();
        fill(255); // Color for text; adjust as needed.
        text(year, x, this.layout.bottomMargin + 15);
      }
    }

    // For each region, draw a line connecting its data points.
    for (let region in this.data) {
      let regionData = this.data[region].filter(
        (d) => d.year >= this.startYear
      );
      if (regionData.length < 2) continue;

      stroke(this.regionColors[region]);
      strokeWeight(2);
      noFill();

      beginShape();
      let yearCount = 0; // Counter to limit animation

      for (let i = 0; i < regionData.length; i++) {
        if (yearCount >= this.frameCount) break; // Stop drawing when reaching frame limit
        let pt = regionData[i];
        let x = this.mapYearToWidth(pt.year);
        let y = this.mapRateToHeight(pt.rate);
        vertex(x, y);
        yearCount++;
      }
      endShape();
    }

    this.frameCount++; // Increment animation frame count

    if (this.frameCount >= numYears) {
      this.frameCount = numYears; // Stop when all years are drawn
    }
  };

  // Helper function to map a given year to an x-coordinate.
  this.mapYearToWidth = function (value) {
    return map(
      value,
      this.startYear,
      this.endYear,
      this.layout.leftMargin,
      this.layout.rightMargin
    );
  };

  // Helper function to map a given rate value to a y-coordinate.
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
