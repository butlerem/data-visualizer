export function PayGapTimeSeries() {
  this.name = "Pay Gap Over Time";
  this.id = "pay-gap-timeseries";
  this.title = "Percent Difference Between Male and Female Pay Per Year";

  this.loaded = false;
  this.xAxisLabel = "Year";
  this.yAxisLabel = "%";

  // We'll store Firestore array here
  this.data = [];

  // p5 layout
  let marginSize = 35;
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

  // We'll keep track of the year range and pay gap range
  this.globalStartYear = 1997;
  this.globalEndYear = 2017;
  this.minPayGap = 0;
  this.maxPayGap = 30;

  // We'll make a slider for startYear
  this.yearSlider = null;

  // For animation
  this.frameCount = 0;

  // -----------
  // 1) PRELOAD
  // -----------
  this.preload = function () {
    const self = this;
    import("https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js")
      .then(({ getFirestore, collection, getDocs }) => {
        const db = getFirestore(window.app);
        return getDocs(collection(db, "pay_gap_by_year"));
      })
      .then((querySnapshot) => {
        self.data = querySnapshot.docs.map((doc) => doc.data());
        self.loaded = true;
        console.log("Pay Gap By Year Data loaded from Firestore:", self.data);
      })
      .catch((error) => {
        console.error("Error loading Pay Gap By Year data:", error);
      });
  };

  // -----------
  // 2) SETUP
  // -----------
  this.setup = function () {
    textSize(16);
    textAlign(CENTER, CENTER);

    if (!this.loaded || !this.data.length) {
      console.log("PayGapTimeSeries: no data yet in setup.");
      return;
    }

    // Sort data by year
    this.data.forEach((d) => {
      d.year = parseFloat(d.year) || 2000; // convert year to number
      d.pay_gap = parseFloat(d.pay_gap) || 0;
    });
    this.data.sort((a, b) => a.year - b.year);

    // globalStartYear = earliest year
    this.globalStartYear = this.data[0].year;
    this.globalEndYear = this.data[this.data.length - 1].year;

    // min/max pay gap
    let payGaps = this.data.map((d) => d.pay_gap);
    this.minPayGap = Math.min(...payGaps);
    this.maxPayGap = Math.max(...payGaps);

    // Create a slider for choosing startYear
    this.yearSlider = createSlider(
      this.globalStartYear,
      this.globalEndYear - 2,
      this.globalStartYear,
      1
    );
    this.yearSlider.parent("sliders");
    this.yearSlider.style("width", "300px");

    this.frameCount = 0; // reset animation
  };

  // 3) DESTROY
  this.destroy = function () {
    if (this.yearSlider) {
      this.yearSlider.remove();
    }
    const slidersDiv = document.getElementById("sliders");
    if (slidersDiv) {
      slidersDiv.innerHTML = "";
    }
  };

  // 4) DRAW
  this.draw = function () {
    if (!this.loaded || !this.data.length) {
      console.log("PayGapTimeSeries: data not yet loaded in draw()");
      return;
    }

    // Which startYear did we pick?
    let startYear = parseInt(this.yearSlider.value());
    let endYear = this.globalEndYear;

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

    // Draw X tick lines/labels
    let numYears = endYear - startYear;
    let xTickSkip = ceil(numYears / this.layout.numXTickLabels);
    for (let y = startYear; y <= endYear; y++) {
      if ((y - startYear) % xTickSkip === 0) {
        let x = this.mapYearToWidth(y, startYear, endYear);
        stroke(150);
        line(x, this.layout.topMargin, x, this.layout.bottomMargin);
        noStroke();
        fill(255);
        text(y, x, this.layout.bottomMargin + 15);
      }
    }

    // Animation: we gradually show more data points
    let maxFrames = this.data.length;
    stroke(255);
    strokeWeight(2);
    noFill();

    let previous = null;
    let yearCount = 0; // how many we have drawn so far
    for (let i = 0; i < this.data.length; i++) {
      let d = this.data[i];
      if (d.year < startYear) continue; // skip earlier years
      if (yearCount >= this.frameCount) break; // animation limit

      if (!previous && d.year >= startYear) {
        previous = d;
        yearCount++;
        continue;
      }

      // draw line from previous to d
      if (previous) {
        line(
          this.mapYearToWidth(previous.year, startYear, endYear),
          this.mapPayGapToHeight(previous.pay_gap),
          this.mapYearToWidth(d.year, startYear, endYear),
          this.mapPayGapToHeight(d.pay_gap)
        );
      }
      previous = d;
      yearCount++;
    }

    this.frameCount++;
    if (this.frameCount > maxFrames) {
      this.frameCount = maxFrames;
    }
  };

  // Helpers
  this.mapYearToWidth = function (year, startYear, endYear) {
    return map(
      year,
      startYear,
      endYear,
      this.layout.leftMargin,
      this.layout.rightMargin
    );
  };

  this.mapPayGapToHeight = function (gap) {
    return map(
      gap,
      this.minPayGap,
      this.maxPayGap,
      this.layout.bottomMargin,
      this.layout.topMargin
    );
  };
}
