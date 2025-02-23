export function ClimateChange() {
  this.name = "Climate Change";
  this.id = "climate-change";
  this.title = "Climate Change in ℃ Per Year";

  this.loaded = false;
  this.xAxisLabel = "Year";
  this.yAxisLabel = "Change in ℃";

  // We'll set margins after p5 is ready (in setup).
  let marginSize = 35;

  this.layout = {
    marginSize: marginSize,
    leftMargin: null,
    rightMargin: null,
    topMargin: null,
    bottomMargin: null,
    pad: 5,
    grid: false,
    numXTickLabels: 8,
    numYTickLabels: 8,

    plotWidth: function () {
      return this.rightMargin - this.leftMargin;
    },
    plotHeight: function () {
      return this.bottomMargin - this.topMargin;
    },
  };

  // Firestore data will go here as an array of objects.
  // e.g. [{ year: 1890, temperature: 0.2 }, ...]
  this.data = [];

  // ------------------
  // 1) Preload: fetch data from Firestore
  // ------------------
  this.preload = function () {
    const self = this;
    import("https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js")
      .then(({ getFirestore, collection, getDocs }) => {
        const db = getFirestore(window.app); // Make sure window.app is your initialized Firebase app
        return getDocs(collection(db, "surface_temp"));
      })
      .then((querySnapshot) => {
        // Store an array of doc.data() in self.data
        self.data = querySnapshot.docs.map((doc) => doc.data());
        self.loaded = true;
        console.log("Data loaded from Firestore:", self.data);
      })
      .catch((error) => {
        console.error("Error loading data:", error);
      });
  };

  // ------------------
  // 2) Setup: do all your p5-related initialization
  // ------------------
  this.setup = function () {
    // Because we are in p5, let's set up margins only after p5 has given us width/height.
    // If you have a createCanvas(...) somewhere else, that's fine—just ensure width/height exist.
    this.layout.leftMargin = marginSize * 2;
    this.layout.rightMargin = width - marginSize * 2;
    this.layout.topMargin = marginSize;
    this.layout.bottomMargin = height - marginSize * 2;

    textSize(16);
    textAlign(CENTER, CENTER);

    // Make sure we have data before calculating stats
    if (!this.loaded || !this.data.length) {
      console.warn("Data is not loaded yet or is empty");
      return;
    }

    // Sort data by year (if it’s not already sorted)
    this.data.sort((a, b) => a.year - b.year);

    // 1. Find min/max year
    let allYears = this.data.map((d) => d.year);
    this.minYear = Math.min(...allYears);
    this.maxYear = Math.max(...allYears);

    // 2. Find min/max temperature
    let allTemps = this.data.map((d) => d.temperature);
    this.minTemperature = Math.min(...allTemps);
    this.maxTemperature = Math.max(...allTemps);

    // 3. Mean temperature
    let sumTemps = allTemps.reduce((acc, val) => acc + val, 0);
    this.meanTemperature = sumTemps / this.data.length;

    // 4. We’ll count frames for animation
    this.frameCount = 0;

    // 5. Create sliders
    this.startSlider = createSlider(
      this.minYear,
      this.maxYear - 1,
      this.minYear,
      1
    );
    this.startSlider.parent("sliders");
    this.startSlider.style("width", "300px");

    this.endSlider = createSlider(
      this.minYear + 1,
      this.maxYear,
      this.maxYear,
      1
    );
    this.endSlider.parent("sliders");
    this.endSlider.style("width", "300px");

    // 6. Single label for both sliders
    this.yearLabel = createP("Start Year: 0 | End Year: 0");
    this.yearLabel.parent("sliders");
    this.yearLabel.style("color", "#fff");

    // Update label dynamically
    const updateLabel = () => {
      this.yearLabel.html(
        "Start Year: " +
          this.startSlider.value() +
          " | End Year: " +
          this.endSlider.value()
      );
    };
    this.startSlider.input(updateLabel);
    this.endSlider.input(updateLabel);
    updateLabel(); // set initial label text
  };

  // ------------------
  // 3) Destroy: remove slider UI, etc.
  // ------------------
  this.destroy = function () {
    // Only remove if they exist
    if (this.startSlider) this.startSlider.remove();
    if (this.endSlider) this.endSlider.remove();
    if (this.yearLabel) this.yearLabel.remove();
  };

  // ------------------
  // 4) Draw: main p5 loop
  // ------------------
  this.draw = function () {
    // If data not loaded yet, skip drawing
    if (!this.loaded || !this.data.length) {
      console.log("Data not yet loaded or empty");
      return;
    }

    // Make sure slider constraints are valid (start < end)
    if (this.startSlider.value() >= this.endSlider.value()) {
      this.startSlider.value(this.endSlider.value() - 1);
    }

    this.startYear = parseInt(this.startSlider.value());
    this.endYear = parseInt(this.endSlider.value());
    let numYears = this.endYear - this.startYear;

    // Draw your axes, labels, etc.
    drawYAxisTickLabels(
      this.minTemperature,
      this.maxTemperature,
      this.layout,
      this.mapTemperatureToHeight.bind(this),
      1
    );
    drawAxis(this.layout);
    drawAxisLabels(this.xAxisLabel, this.yAxisLabel, this.layout);

    // Plot average line
    stroke(200);
    strokeWeight(1);
    line(
      this.layout.leftMargin,
      this.mapTemperatureToHeight(this.meanTemperature),
      this.layout.rightMargin,
      this.mapTemperatureToHeight(this.meanTemperature)
    );

    // For the animation effect
    let segmentWidth = this.layout.plotWidth() / numYears;
    let previous = null;
    let yearCount = 0;

    // Because it’s an array, we use i < this.data.length
    for (let i = 0; i < this.data.length; i++) {
      // current object
      let current = {
        year: Number(this.data[i].year),
        temperature: Number(this.data[i].temperature),
      };

      // We only start drawing if previous is set and the year is in slider range
      if (
        previous &&
        current.year > this.startYear &&
        current.year <= this.endYear
      ) {
        // 1. Background rectangle for the “heat” color
        noStroke();
        fill(this.mapTemperatureToColour(current.temperature));
        rect(
          this.mapYearToWidth(previous.year),
          this.layout.topMargin,
          segmentWidth,
          this.layout.plotHeight()
        );

        // 2. Line from previous point to current
        stroke(200);
        line(
          this.mapYearToWidth(previous.year),
          this.mapTemperatureToHeight(previous.temperature),
          this.mapYearToWidth(current.year),
          this.mapTemperatureToHeight(current.temperature)
        );

        // 3. Possibly draw X-axis tick labels
        let xLabelSkip = ceil(numYears / this.layout.numXTickLabels);
        if (yearCount % xLabelSkip === 0) {
          drawXAxisTickLabel(
            previous.year,
            this.layout,
            this.mapYearToWidth.bind(this)
          );
        }
        // Draw final x tick label if only a few years
        if (numYears <= 6 && yearCount === numYears - 1) {
          drawXAxisTickLabel(
            current.year,
            this.layout,
            this.mapYearToWidth.bind(this)
          );
        }

        yearCount++;
      }

      // Stop after a certain number of frames for animation
      if (yearCount >= this.frameCount) {
        break;
      }

      // Move on
      previous = current;
    }

    this.frameCount++;
    if (this.frameCount >= numYears) {
      // noLoop(); // optional if you want to stop animating
    }
  };

  // ------------------
  // 5) Helper functions
  // ------------------
  this.mapYearToWidth = function (year) {
    return map(
      year,
      this.startYear,
      this.endYear,
      this.layout.leftMargin,
      this.layout.rightMargin
    );
  };

  this.mapTemperatureToHeight = function (temp) {
    return map(
      temp,
      this.minTemperature,
      this.maxTemperature,
      this.layout.bottomMargin, // lower temps at bottom
      this.layout.topMargin // higher temps at top
    );
  };

  this.mapTemperatureToColour = function (temp) {
    let red = map(temp, this.minTemperature, this.maxTemperature, 255, 180);
    let blue = map(temp, this.minTemperature, this.maxTemperature, 180, 255);
    return color(red, 160, blue, 80);
  };
}
