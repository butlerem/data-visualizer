function EducationCompletionRate() {
  this.name = 'Education Completion Rate';
  this.id = 'education-completion-rate';
  this.title = 'Female Primary Education Completion Rate Over Time';

  this.xAxisLabel = 'year';
  this.yAxisLabel = '%';
  var marginSize = 35;

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
      './data/education/primary_education_completion.csv', 'csv', 'header',
      function (table) {
        self.loaded = true;
      });
  };

  this.setup = function () {
    textSize(16);

    let years = this.data.columns.slice(1); // Ignore 'Country Name' column
    this.startYear = int(years[0]);
    this.endYear = int(years[years.length - 1]);

    this.aggregatedData = {};
    this.countData = {}; // To count valid entries per year

    // Initialize aggregated data object
    for (let year of years) {
      this.aggregatedData[year] = 0;
      this.countData[year] = 0;
    }

    // Sum up values across all countries and count valid values
    for (let i = 0; i < this.data.getRowCount(); i++) {
      for (let j = 1; j < this.data.getColumnCount(); j++) { // Start from 1 to ignore 'Country Name'
        let value = this.data.getString(i, j);
        if (value !== '' && !isNaN(value)) { // Ignore empty and non-numeric values
          this.aggregatedData[years[j - 1]] += float(value);
          this.countData[years[j - 1]] += 1;
        }
      }
    }

    // Convert sum to average
    for (let year of years) {
      if (this.countData[year] > 0) {
        this.aggregatedData[year] /= this.countData[year]; // Compute average
      }
    }

    // Get min/max values for scaling
    this.minEducation = 65;
    this.maxEducation = 100;
  };

  this.destroy = function () { };

  this.draw = function () {
    if (!this.loaded) {
      console.log('Data not yet loaded');
      return;
    }

    drawTitle(this.title);
    drawYAxisTickLabels(this.minEducation,
      this.maxEducation,
      this.layout,
      this.mapEducationToHeight.bind(this),
      0);

    drawAxis(this.layout);
    drawAxisLabels(this.xAxisLabel, this.yAxisLabel, this.layout);

    var previous;
    var numYears = this.endYear - this.startYear;
    let years = Object.keys(this.aggregatedData);

    for (let i = 0; i < years.length; i++) {
      let year = int(years[i]);
      let current = {
        'year': year,
        'education': this.aggregatedData[year]
      };

      if (previous != null) {
        stroke(255);
        line(this.mapYearToWidth(previous.year),
          this.mapEducationToHeight(previous.education),
          this.mapYearToWidth(current.year),
          this.mapEducationToHeight(current.education));

        var xLabelSkip = ceil(numYears / this.layout.numXTickLabels);
        if (i % xLabelSkip == 0) {
          drawXAxisTickLabel(previous.year, this.layout,
            this.mapYearToWidth.bind(this));
        }
      }

      previous = current;
    }
  };

  this.mapYearToWidth = function (value) {
    return map(value,
      this.startYear,
      this.endYear,
      this.layout.leftMargin,
      this.layout.rightMargin);
  };

  this.mapEducationToHeight = function (value) {
    return map(value,
      this.minEducation,
      this.maxEducation,
      this.layout.bottomMargin,
      this.layout.topMargin);
  };
}
