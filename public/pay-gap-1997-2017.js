function PayGapTimeSeries() {
  this.name = "Pay Gap Over Time";
  this.id = "pay-gap-timeseries";
  this.title = "Percent Difference Between Male and Female Pay Per Year";
  this.loaded = false;

  this.xAxisLabel = "year";
  this.yAxisLabel = "%";
  this.layout = null;
  this.data = null;

  // 1) preload
  this.preload = function () {
    console.log("PayGapTimeSeries: preload()");
    const self = this;
    this.data = loadTable(
      "./data/pay-gap/all-employees-hourly-pay-by-gender-1997-2017.csv",
      "csv",
      "header",
      function () {
        self.loaded = true;
        console.log("PayGapTimeSeries: data loaded!");
      }
    );
  };

  // 2) setup => called after preload finishes
  this.setup = function () {
    console.log("PayGapTimeSeries: setup()");

    // Build the layout object based on current p5 canvas width/height
    const marginSize = 35;
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

    // Set up default years
    if (!this.loaded) {
      console.log("PayGapTimeSeries: data not ready in setup()");
    }
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

    // Optional label or instructions
    const label = createP("Start Year:");
    label.parent("sliders");
    label.style("color", "#fff");
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

    background(0);

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

    let previous = null;
    let numYears = this.endYear - this.startYear;

    for (let i = 0; i < this.data.getRowCount(); i++) {
      let year = this.data.getNum(i, "year");

      if (year < this.startYear) continue;

      let current = {
        year: year,
        payGap: this.data.getNum(i, "pay_gap"),
      };

      if (previous) {
        stroke(255);
        line(
          this.mapYearToWidth(previous.year),
          this.mapPayGapToHeight(previous.payGap),
          this.mapYearToWidth(current.year),
          this.mapPayGapToHeight(current.payGap)
        );

        let xLabelSkip = ceil(numYears / this.layout.numXTickLabels);
        if (i % xLabelSkip === 0) {
          drawXAxisTickLabel(
            previous.year,
            this.layout,
            this.mapYearToWidth.bind(this)
          );
        }
      }
      previous = current;
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
