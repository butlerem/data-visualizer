function PayGapTimeSeries() {
  this.name = "Pay Gap Over Time";
  this.id = "pay-gap-timeseries";
  this.title = "Percent Difference Between Male and Female Pay Per Year";
  this.loaded = false;

  this.xAxisLabel = "year";
  this.yAxisLabel = "%";
  var marginSize = 35;

  // Layout object to store all common plot layout parameters and methods.
  this.layout = {
    marginSize: marginSize,

    leftMargin: marginSize * 2,
    rightMargin: width - marginSize,
    topMargin: marginSize,
    bottomMargin: height - marginSize * 2,
    pad: 5,

    plotWidth: function () {
      return this.rightMargin - this.leftMargin;
    },

    plotHeight: function () {
      return this.bottomMargin - this.topMargin;
    },

    grid: true,
    numXTickLabels: 10,
    numYTickLabels: 8,
  };

  this.preload = function () {
    var self = this;
    this.data = loadTable(
      "./data/pay-gap/all-employees-hourly-pay-by-gender-1997-2017.csv",
      "csv",
      "header",
      function (table) {
        self.loaded = true;
      }
    );
  };

  this.setup = function () {
    textSize(16);

    // Get full year range
    this.globalStartYear = this.data.getNum(0, "year"); // 1997
    this.globalEndYear = this.data.getNum(this.data.getRowCount() - 1, "year"); // 2017

    this.startYear = this.globalStartYear; // Default start year (1997)
    this.endYear = this.globalEndYear; // Default end year (2017)

    this.minPayGap = 0; // Pay equality (zero pay gap).
    this.maxPayGap = max(this.data.getColumn("pay_gap"));

    // ** Create a slider for zooming into the years **
    this.yearSlider = createSlider(
      this.globalStartYear,
      this.globalEndYear - 2,
      this.globalStartYear,
      1
    );
    this.yearSlider.position(20, height - 30);
    this.yearSlider.style("width", "200px");
  };

  this.destroy = function () {
    this.yearSlider.remove(); // Remove slider when switching visualizations
  };

  this.draw = function () {
    if (!this.loaded) {
      console.log("Data not yet loaded");
      return;
    }

    // Update start year from slider value (end year is always 2017)
    this.startYear = this.yearSlider.value();

    drawYAxisTickLabels(
      this.minPayGap,
      this.maxPayGap,
      this.layout,
      this.mapPayGapToHeight.bind(this),
      0
    );

    drawAxis(this.layout);
    drawAxisLabels(this.xAxisLabel, this.yAxisLabel, this.layout);

    var previous;
    var numYears = this.endYear - this.startYear;

    for (var i = 0; i < this.data.getRowCount(); i++) {
      let year = this.data.getNum(i, "year");

      // Only draw data in the selected range
      if (year < this.startYear) {
        continue;
      }

      var current = {
        year: year,
        payGap: this.data.getNum(i, "pay_gap"),
      };

      if (previous != null) {
        stroke(255);
        line(
          this.mapYearToWidth(previous.year),
          this.mapPayGapToHeight(previous.payGap),
          this.mapYearToWidth(current.year),
          this.mapPayGapToHeight(current.payGap)
        );

        var xLabelSkip = ceil(numYears / this.layout.numXTickLabels);
        if (i % xLabelSkip == 0) {
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
