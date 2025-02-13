function PovertyGap() {
  this.name = "Poverty Gap";
  this.id = "poverty-gap";
  this.title = "Poverty Gap at $3.65 Per Day (%) by Continent";

  this.xAxisLabel = "Year";
  this.yAxisLabel = "Poverty Gap (%)";
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

  this.loaded = false;
  this.continentMap = {};
  this.aggregatedData = {};

  this.loadContinentData = function (callback) {
    fetch("./data/continents.json")
      .then((response) => response.json())
      .then((data) => {
        this.continentMap = data;
        callback();
      })
      .catch((error) => console.error("Error loading continent map:", error));
  };

  this.preload = function () {
    var self = this;
    this.data = loadTable(
      "./data/poverty-gap/poverty_gap.csv",
      "csv",
      "header",
      function (table) {
        self.loaded = true;
      }
    );
  };

  // Helper functions defined outside loops
  this.mapValueToHeight = function (value) {
    return map(
      value,
      0,
      this.maxPovertyGap,
      this.layout.bottomMargin,
      this.layout.topMargin
    );
  };

  this.getContinent = function (country) {
    for (let continent in this.continentMap) {
      if (this.continentMap[continent].includes(country)) {
        return continent;
      }
    }
    return null;
  };

  this.getContinentColor = function (continent) {
    let colors = {
      Africa: color(255, 0, 0),
      Asia: color(0, 255, 0),
      Europe: color(0, 0, 255),
      "North America": color(255, 165, 0),
      "South America": color(128, 0, 128),
      Oceania: color(0, 255, 255),
    };
    return colors[continent] || color(255);
  };

  this.setup = function () {
    textSize(16);
    let years = this.data.columns.slice(1);
    this.startYear = int(years[0]);
    this.endYear = int(years[years.length - 1]);

    this.loadContinentData(() => {
      for (let continent in this.continentMap) {
        this.aggregatedData[continent] = {};
        for (let year of years) {
          this.aggregatedData[continent][year] = { sum: 0, count: 0 };
        }
      }

      for (let i = 0; i < this.data.getRowCount(); i++) {
        let country = this.data.getString(i, "Country Name");
        let continent = this.getContinent(country);
        if (continent) {
          for (let j = 1; j < this.data.getColumnCount(); j++) {
            let year = years[j - 1];
            let value = this.data.getString(i, j);
            if (value !== "" && !isNaN(value)) {
              this.aggregatedData[continent][year].sum += float(value);
              this.aggregatedData[continent][year].count += 1;
            }
          }
        }
      }

      for (let continent in this.aggregatedData) {
        for (let year of years) {
          let dataPoint = this.aggregatedData[continent][year];
          dataPoint.avg =
            dataPoint.count > 0 ? dataPoint.sum / dataPoint.count : 0;
        }
      }

      this.maxPovertyGap = 0;
      for (let continent in this.aggregatedData) {
        for (let year in this.aggregatedData[continent]) {
          let value = this.aggregatedData[continent][year].avg;
          if (value > this.maxPovertyGap) this.maxPovertyGap = value;
        }
      }
      this.maxPovertyGap = max(this.maxPovertyGap, 35);
      console.log("Max Poverty Gap:", this.maxPovertyGap);

      this.yearSlider = createSlider(
        this.startYear,
        this.endYear - 2,
        this.startYear,
        1
      );
      this.yearSlider.position(20, height - 30);
      this.yearSlider.style("width", "200px");
    });
  };

  this.destroy = function () {
    this.yearSlider.remove();
  };

  this.draw = function () {
    if (!this.loaded || Object.keys(this.continentMap).length === 0) {
      console.log("Data not yet loaded");
      return;
    }

    this.startYear = this.yearSlider.value();
    let years = Object.keys(this.aggregatedData["Africa"]).filter(
      (year) => int(year) >= this.startYear
    );

    drawTitle(this.title);
    drawYAxisTickLabels(
      0,
      35,
      this.layout,
      this.mapValueToHeight.bind(this),
      0
    );
    drawAxis(this.layout);
    drawAxisLabels(this.xAxisLabel, this.yAxisLabel, this.layout);

    let barWidth =
      this.layout.plotWidth() /
      (years.length * Object.keys(this.aggregatedData).length);
    let xStart = this.layout.leftMargin;

    for (let yearIndex = 0; yearIndex < years.length; yearIndex++) {
      let year = years[yearIndex];
      let xPos =
        xStart + yearIndex * barWidth * Object.keys(this.aggregatedData).length;

      for (let continent of Object.keys(this.aggregatedData)) {
        let value = this.aggregatedData[continent][year].avg;
        let barHeight = this.mapValueToHeight(value);
        fill(this.getContinentColor(continent));
        rect(xPos, barHeight, barWidth, this.layout.bottomMargin - barHeight);
        xPos += barWidth;
      }
    }
  };
}
