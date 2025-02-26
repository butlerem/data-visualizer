import {
  createLayout,
  createYearSliders,
  removeYearSliders,
  drawYAxisTickLabels,
  drawAxis,
  drawAxisLabels,
} from "./helper-functions.js";

export function ClimateChange() {
  const self = this;
  this.name = "Climate Change";
  this.id = "climate-change";
  this.title = "Climate Change in ℃ Per Year";
  this.loaded = false;
  this.xAxisLabel = "Year";
  this.yAxisLabel = "Change in ℃";
  this.data = [];

  this.stats = [
    { icon: "eco", value: "0.5℃", label: "Avg Increase" },
    { icon: "trending_up", value: "2.0℃", label: "Max Increase" },
    { icon: "trending_down", value: "-1.0℃", label: "Min Increase" },
  ];

  // Global settings for data range
  this.minYear = null;
  this.maxYear = null;
  this.minTemperature = null;
  this.maxTemperature = null;
  this.meanTemperature = null;

  // p5 layout settings
  const marginSize = 35;
  this.layout = createLayout(marginSize, width, height, {
    grid: false,
    numXTickLabels: 8,
    numYTickLabels: 8,
  });

  // UI elements for year range
  this.sliders = null;

  // For animation
  this.frameCount = 0;

  // PRELOAD: fetch temperature data
  this.preload = function () {
    const self = this;
    import("https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js")
      .then(({ getFirestore, collection, getDocs }) => {
        const db = getFirestore(window.app);
        return getDocs(collection(db, "surface_temp"));
      })
      .then((querySnapshot) => {
        self.data = querySnapshot.docs.map((doc) => doc.data());
        self.loaded = true;
        console.log("Climate Change Data loaded:", self.data);
      })
      .catch((error) => {
        console.error("Error loading Climate Change data:", error);
      });
  };

  // SETUP: process data and create UI elements
  this.setup = function () {
    // Update layout in case canvas size changed
    this.layout = createLayout(marginSize, width, height, {
      grid: false,
      numXTickLabels: 8,
      numYTickLabels: 8,
    });
    textSize(16);
    textAlign(CENTER, CENTER);

    if (!this.loaded || !this.data.length) {
      console.warn("ClimateChange: Data not loaded or empty.");
      return;
    }

    // Sort data by year
    this.data.sort((a, b) => a.year - b.year);

    // Set min/max years and temperature values
    const allYears = this.data.map((d) => d.year);
    this.minYear = Math.min(...allYears);
    this.maxYear = Math.max(...allYears);
    const allTemps = this.data.map((d) => d.temperature);
    this.minTemperature = Math.min(...allTemps);
    this.maxTemperature = Math.max(...allTemps);
    this.meanTemperature =
      allTemps.reduce((acc, t) => acc + t, 0) / this.data.length;

    // Create sliders using helper
    this.sliders = createYearSliders(this.minYear, this.maxYear);

    // Reset animation frame count whenever setup is called
    this.frameCount = 0;
  };

  // DESTROY: clean up UI elements
  this.destroy = function () {
    if (this.sliders) removeYearSliders(this.sliders);
  };

  // DRAW: p5 draw loop for rendering climate data
  this.draw = function () {
    if (!this.loaded || !this.data.length) {
      console.log("ClimateChange: Data not ready in draw()");
      return;
    }

    // Ensure valid slider values
    if (this.sliders.startSlider.value() >= this.sliders.endSlider.value()) {
      this.sliders.startSlider.value(this.sliders.endSlider.value() - 1);
    }

    this.startYear = parseInt(this.sliders.startSlider.value());
    this.endYear = parseInt(this.sliders.endSlider.value());
    const numYears = this.endYear - this.startYear;

    // Draw axes and labels
    drawYAxisTickLabels(
      this.minTemperature,
      this.maxTemperature,
      this.layout,
      this.mapTemperatureToHeight.bind(this),
      1
    );
    drawAxis(this.layout);
    drawAxisLabels(this.xAxisLabel, this.yAxisLabel, this.layout);

    // Draw the average temperature line
    stroke(200);
    strokeWeight(1);
    line(
      this.layout.leftMargin,
      this.mapTemperatureToHeight(this.meanTemperature),
      this.layout.rightMargin,
      this.mapTemperatureToHeight(this.meanTemperature)
    );

    // Draw data segments and lines
    const segmentWidth =
      this.layout.plotWidth() / (this.endYear - this.startYear);
    let previous = null;
    let segmentsDrawn = 0;

    for (let i = 0; i < this.data.length; i++) {
      const current = {
        year: Number(this.data[i].year),
        temperature: Number(this.data[i].temperature),
      };

      if (
        previous &&
        current.year > this.startYear &&
        current.year <= this.endYear
      ) {
        if (segmentsDrawn < this.frameCount) {
          // Draw background rectangle for temperature color
          noStroke();
          fill(this.mapTemperatureToColour(current.temperature));
          rect(
            this.mapYearToWidth(previous.year),
            this.layout.topMargin,
            segmentWidth,
            this.layout.plotHeight()
          );
          // Draw connecting line
          stroke(200);
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

    this.frameCount += 2;
    if (this.frameCount >= numYears) {
      this.frameCount = numYears;
    }
  };

  // Helper: Map year to x-coordinate based on current slider values
  this.mapYearToWidth = function (year) {
    return map(
      year,
      this.startYear,
      this.endYear,
      this.layout.leftMargin,
      this.layout.rightMargin
    );
  };

  // Helper: Map temperature to y-coordinate
  this.mapTemperatureToHeight = function (temp) {
    return map(
      temp,
      this.minTemperature,
      this.maxTemperature,
      this.layout.bottomMargin,
      this.layout.topMargin
    );
  };

  // Helper: Map temperature to a color
  this.mapTemperatureToColour = function (temp) {
    const red = map(temp, this.minTemperature, this.maxTemperature, 231, 79); // Coral Red (#e76f51 → RGB(231, 111, 81))
    const green = map(temp, this.minTemperature, this.maxTemperature, 111, 157); // Interpolating green values
    const blue = map(temp, this.minTemperature, this.maxTemperature, 81, 247); // Light Blue (#4f9df7 → RGB(79, 157, 247))
    return color(red, green, blue, 80);
  };
}
