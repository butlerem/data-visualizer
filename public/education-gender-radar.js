export function EducationGenderRadar() {
  this.name = "Education Gender Radar";
  this.id = "education-gender-radar";
  this.title = "Education Gender Distribution";
  this.loaded = false;
  this.data = [];

  // Hold aggregated values.
  this.categories = [];
  this.maleValues = [];
  this.femaleValues = [];

  // Define available year range (adjust as needed)
  this.minYear = 1996;
  this.maxYear = 2023;

  // Preload: Query the "education_gender" collection from Firestore.
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
        console.log("Education Gender data loaded from Firestore:", self.data);
        // Do an initial filter after data loads.
        self.filterData();
      })
      .catch((error) => {
        console.error("Error loading Education Gender data:", error);
      });
  };

  // Setup: Create sliders, set chart dimensions, and filter data.
  this.setup = function () {
    // Create sliders and label only once.
    if (!this.startSlider) {
      this.startSlider = createSlider(
        this.minYear,
        this.maxYear - 1,
        this.minYear,
        1
      );
      this.startSlider.parent("sliders");
      this.startSlider.style("width", "300px");
    }
    if (!this.endSlider) {
      this.endSlider = createSlider(
        this.minYear + 1,
        this.maxYear,
        this.maxYear,
        1
      );
      this.endSlider.parent("sliders");
      this.endSlider.style("width", "300px");
    }
    if (!this.yearLabel) {
      this.yearLabel = createP(
        "Start Year: " +
          this.startSlider.value() +
          " | End Year: " +
          this.endSlider.value()
      );
      this.yearLabel.parent("sliders");
      this.yearLabel.style("color", "#fff");
    }
    // When slider values change, update label and re-filter data.
    const updateLabelAndFilter = () => {
      this.yearLabel.html(
        "Start Year: " +
          this.startSlider.value() +
          " | End Year: " +
          this.endSlider.value()
      );
      this.filterData();
    };
    this.startSlider.input(updateLabelAndFilter);
    this.endSlider.input(updateLabelAndFilter);

    // Set chart dimensions.
    this.chartCenterX = width / 2;
    this.chartCenterY = height / 2;
    this.chartRadius = min(width, height) * 0.35;

    // Filter data based on the current slider values.
    this.filterData();
  };

  // Filter and aggregate data based on selected year range.
  this.filterData = function () {
    if (!this.loaded) return;
    // Use slider values if they exist; otherwise use default years.
    let startYear = this.startSlider
      ? parseInt(this.startSlider.value())
      : this.minYear;
    let endYear = this.endSlider
      ? parseInt(this.endSlider.value())
      : this.maxYear;

    // Filter records within the selected year range.
    let filteredData = this.data.filter((d) => {
      let year = parseInt(d["Year"]);
      return year >= startYear && year <= endYear;
    });

    // Aggregate data by category. Average male and female percentages for each category.
    let aggregated = {};
    filteredData.forEach((rec) => {
      let category = rec["Category"];
      let male = parseFloat(rec["Male (%)"]);
      let female = parseFloat(rec["Female (%)"]);
      if (category) {
        if (!aggregated[category]) {
          aggregated[category] = { sumMale: 0, sumFemale: 0, count: 0 };
        }
        aggregated[category].sumMale += male;
        aggregated[category].sumFemale += female;
        aggregated[category].count++;
      }
    });

    // Reset arrays.
    this.categories = [];
    this.maleValues = [];
    this.femaleValues = [];

    // Populate arrays with the aggregated (average) values.
    for (let category in aggregated) {
      let group = aggregated[category];
      let avgMale = group.sumMale / group.count;
      let avgFemale = group.sumFemale / group.count;
      this.categories.push(category);
      this.maleValues.push(avgMale);
      this.femaleValues.push(avgFemale);
    }
  };

  // Destroy: Remove slider UI elements.
  this.destroy = function () {
    if (this.startSlider) {
      this.startSlider.remove();
      this.startSlider = null;
    }
    if (this.endSlider) {
      this.endSlider.remove();
      this.endSlider = null;
    }
    if (this.yearLabel) {
      this.yearLabel.remove();
      this.yearLabel = null;
    }
  };

  // Draw: Render the radar chart using p5.js functions.
  this.draw = function () {
    if (!this.loaded) {
      console.log("Education Gender data not loaded yet.");
      return;
    }

    let n = this.categories.length;
    if (n === 0) return;
    let angleStep = TWO_PI / n;

    // Draw the axes and category labels.
    stroke(200);
    for (let i = 0; i < n; i++) {
      let angle = i * angleStep - PI / 2;
      let x = this.chartCenterX + cos(angle) * this.chartRadius;
      let y = this.chartCenterY + sin(angle) * this.chartRadius;
      line(this.chartCenterX, this.chartCenterY, x, y);
      noStroke();
      fill(255);
      textAlign(CENTER, CENTER);
      text(this.categories[i], x, y);
    }

    // Draw concentric circles for reference.
    noFill();
    stroke(150);
    for (let r = 1; r <= 5; r++) {
      let rad = map(r, 0, 5, 0, this.chartRadius);
      ellipse(this.chartCenterX, this.chartCenterY, rad * 2, rad * 2);
    }

    // Draw the male data polygon (blue).
    fill(0, 0, 255, 100);
    stroke(0, 0, 255);
    beginShape();
    for (let i = 0; i < n; i++) {
      let val = this.maleValues[i];
      let r = map(val, 0, 100, 0, this.chartRadius);
      let angle = i * angleStep - PI / 2;
      let x = this.chartCenterX + cos(angle) * r;
      let y = this.chartCenterY + sin(angle) * r;
      vertex(x, y);
    }
    endShape(CLOSE);

    // Draw the female data polygon (red).
    fill(255, 0, 0, 100);
    stroke(255, 0, 0);
    beginShape();
    for (let i = 0; i < n; i++) {
      let val = this.femaleValues[i];
      let r = map(val, 0, 100, 0, this.chartRadius);
      let angle = i * angleStep - PI / 2;
      let x = this.chartCenterX + cos(angle) * r;
      let y = this.chartCenterY + sin(angle) * r;
      vertex(x, y);
    }
    endShape(CLOSE);
  };
}
