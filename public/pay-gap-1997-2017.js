function PayGapTimeSeries() {
  this.name = "Pay Gap Over Time";
  this.id = "pay-gap-timeseries";
  this.title = "Percent Difference Between Male and Female Pay Per Year";
  this.loaded = false;
  this.xAxisLabel = "Year";
  this.yAxisLabel = "%";
  var marginSize = 35;

  this.layout = {
    marginSize: marginSize,
    leftMargin: marginSize * 2,
    rightMargin: width - marginSize * 2,
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

  this.preload = function () {
    var self = this;
    this.data = loadTable(
      "./data/pay-gap/all-employees-hourly-pay-by-gender-1997-2017.csv",
      "csv",
      "header",
      function () {
        self.loaded = true;
        console.log("Data loaded!");
      }
    );
  };

  this.setup = function () {
    textSize(16);
    textAlign("center", "center");

    this.globalStartYear = this.data ? this.data.getNum(0, "year") : 1997;
    this.globalEndYear = this.data
      ? this.data.getNum(this.data.getRowCount() - 1, "year")
      : 2017;

    this.startYear = this.globalStartYear;
    this.endYear = this.globalEndYear;

    // Define min/max pay gap
    this.minPayGap = 0;
    this.maxPayGap = this.data ? max(this.data.getColumn("pay_gap")) : 30;

    // Create the slider in #sliders
    this.yearSlider = createSlider(
      this.globalStartYear,
      this.globalEndYear - 2,
      this.globalStartYear,
      1
    );
    this.yearSlider.parent("sliders");
    this.yearSlider.style("width", "300px");

    this.frameCount = 0; // Initialize animation frame counter
  };

  // 3) destroy => remove any UI
  this.destroy = function () {
    console.log("PayGapTimeSeries: destroy()");
    if (this.yearSlider) {
      this.yearSlider.remove();
    }
    const slidersDiv = document.getElementById("sliders");
    if (slidersDiv) {
      slidersDiv.innerHTML = "";
    }
  };

  // 4) draw => called every frame
  this.draw = function () {
    if (!this.loaded) {
      console.log("PayGapTimeSeries: data not yet loaded in draw()");
      return;
    }

    // Use slider's current value
    this.startYear = this.yearSlider.value();

    // Draw axis
    drawYAxisTickLabels(
      this.minPayGap,
      this.maxPayGap,
      this.layout,
      this.mapPayGapToHeight.bind(this),
      0
    );
    drawAxis(this.layout);
    drawAxisLabels(this.xAxisLabel, this.yAxisLabel, this.layout);

    let numYears = this.endYear - this.startYear;
    let maxFrames = this.data.getRowCount(); // Total data points

    stroke(200);
    strokeWeight(2);
    noFill();

    // 🔹 **Fix: Ensure Grid Lines Always Render**
    let xTickSkip = ceil(numYears / this.layout.numXTickLabels);
    for (let year = this.startYear; year <= this.endYear; year++) {
      if ((year - this.startYear) % xTickSkip === 0) {
        let x = this.mapYearToWidth(year);
        stroke(150); // Grid color
        line(x, this.layout.topMargin, x, this.layout.bottomMargin); // Vertical grid lines
        noStroke();
        fill(255);
        text(year, x, this.layout.bottomMargin + 15);
      }
    }

    // 🔹 **Now, Draw the Animated Line**
    let previous = null;
    let yearCount = 0; // Controls animation speed

    for (let i = 0; i < this.data.getRowCount(); i++) {
      let year = this.data.getNum(i, "year");
      if (year < this.startYear) continue;

      if (yearCount >= this.frameCount) break; // Stop drawing after reaching frame limit

      let current = {
        year: year,
        payGap: this.data.getNum(i, "pay_gap"),
      };

      if (previous) {
        // Draw line progressively
        stroke(255);
        line(
          this.mapYearToWidth(previous.year),
          this.mapPayGapToHeight(previous.payGap),
          this.mapYearToWidth(current.year),
          this.mapPayGapToHeight(current.payGap)
        );
      }

      previous = current;
      yearCount++;
    }

    this.frameCount++; // Increment animation frame count

    if (this.frameCount >= maxFrames) {
      this.frameCount = maxFrames; // Stop animation when fully drawn
    }
  };

  // Helpers
  this.mapYearToWidth = function (value) {
    return map(
      value,
      this.startYear,
      this.endYear,
      this.layout.leftMargin,
      this.layout.rightMargin
    );
  };

  this.mapPayGapToHeight = function (value) {
    return map(
      value,
      this.minPayGap,
      this.maxPayGap,
      this.layout.bottomMargin,
      this.layout.topMargin
    );
  };
}
