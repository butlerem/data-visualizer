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

  // Preload data from Firestore
  this.preload = function () {
    var self = this;
    import("https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js")
      .then(({ getFirestore, collection, getDocs }) => {
        const db = getFirestore(window.app);
        return getDocs(collection(db, "education_gender"));
      })
      .then((querySnapshot) => {
        self.data = querySnapshot.docs.map((doc) => doc.data());
        self.loaded = true;
        console.log("Data loaded from Firestore:", self.data);
      })
      .catch((error) => {
        console.error("Error loading data:", error);
      });
  };

  // We'll store processed data here.
  this.data = {};
  this.regionColors = {};

  // Setup: Process the data and group it by region.
  this.setup = function () {
    textSize(16);
    textAlign(CENTER, CENTER);
    if (!this.loaded) return;

    let regionYearValues = {};

    // Iterate over the Firestore data (plain objects)
    for (let i = 0; i < this.data.length; i++) {
      let row = this.data[i]; // Each row is a plain object
      let region = row["Region"];
      if (!region) continue; // Skip rows without a region

      if (!regionYearValues[region]) {
        regionYearValues[region] = {};
      }

      // Loop through each year from 1990 to 2023.
      for (let year = 1990; year <= 2023; year++) {
        let value = row[year.toString()];
        if (value !== undefined && value !== "") {
          let numValue = float(value);
          if (!regionYearValues[region][year]) {
            regionYearValues[region][year] = [];
          }
          regionYearValues[region][year].push(numValue);
        }
      }
    }

    // Compute the average completion rate for each region per year.
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
      // Sort the data points by year.
      this.data[region].sort((a, b) => a.year - b.year);
    }

    // Define start and end years.
    this.globalStartYear = 1990;
    this.globalEndYear = 2023;
    this.startYear = this.globalStartYear;
    this.endYear = this.globalEndYear;

    // Determine the overall min and max rate values.
    let allRates = [];
    for (let region in this.data) {
      for (let i = 0; i < this.data[region].length; i++) {
        allRates.push(this.data[region][i].rate);
      }
    }
    this.minRate = min(allRates);
    this.maxRate = max(allRates);

    // Create a slider for selecting a start year.
    this.yearSlider = createSlider(
      this.globalStartYear,
      this.globalEndYear,
      this.globalStartYear,
      1
    );
    this.yearSlider.parent("sliders");
    this.yearSlider.style("width", "300px");

    // Assign distinct colors to each region.
    let availableColors = [
      color(255, 0, 0),
      color(0, 255, 0),
      color(0, 0, 255),
      color(255, 255, 0),
      color(255, 0, 255),
      color(0, 255, 255),
    ];
    let index = 0;
    for (let region in this.data) {
      this.regionColors[region] =
        availableColors[index % availableColors.length];
      index++;
    }
  };

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

  this.draw = function () {
    if (!this.loaded || Object.keys(this.data).length === 0) {
      console.log("Education data not yet loaded.");
      return;
    }

    this.startYear = this.yearSlider.value();

    // Draw Y axis tick labels, axes, and labels (assume these helper functions exist).
    drawYAxisTickLabels(
      this.minRate,
      this.maxRate,
      this.layout,
      this.mapRateToHeight.bind(this),
      0
    );
    drawAxis(this.layout);
    drawAxisLabels(this.xAxisLabel, this.yAxisLabel, this.layout);

    let numYears = this.endYear - this.startYear;
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

    // Draw lines for each region.
    for (let region in this.data) {
      let regionData = this.data[region].filter(
        (d) => d.year >= this.startYear
      );
      if (regionData.length < 2) continue;
      stroke(this.regionColors[region]);
      strokeWeight(2);
      noFill();
      beginShape();
      for (let i = 0; i < regionData.length; i++) {
        let pt = regionData[i];
        let x = this.mapYearToWidth(pt.year);
        let y = this.mapRateToHeight(pt.rate);
        vertex(x, y);
      }
      endShape();
    }
  };

  this.mapYearToWidth = function (value) {
    return map(
      value,
      this.startYear,
      this.endYear,
      this.layout.leftMargin,
      this.layout.rightMargin
    );
  };

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
