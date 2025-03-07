import {
  createLayout,
  createYearSliders,
  removeYearSliders,
  fetchData,
} from "./helper-functions.js";

export function EducationGenderRadar() {
  this.name = "Education Distribution";
  this.id = "education-gender-radar";
  this.title = "Education Gender Distribution";
  this.collectionName = "education_gender";
  this.loaded = false;
  this.data = [];
  this.categories = [];
  this.maleValues = [];
  this.femaleValues = [];

  // Default year range
  this.StartYear = 1996;
  this.EndYear = 2023;

  this.stats = [
    { icon: "school", value: "60%", label: "Female Participation" },
    { icon: "school", value: "40%", label: "Male Participation" },
    { icon: "pie_chart", value: "92%", label: "Literacy Rate Overall" },
  ];

  // Separate animation progress variables for male and female polygons (0 to 1)
  this.maleProgress = 0;
  this.femaleProgress = 0;

  this.preload = async function () {
    try {
      this.data = await fetchData("education_gender");
      this.loaded = true;
      console.log("Education Gender Data loaded");
    } catch (error) {
      console.error("Error loading Education Gender data:", error);
    }
  };

  this.setup = function () {
    if (!this.loaded || !this.data.length) {
      console.warn("EducationGenderRadar: Data not loaded or empty.");
      return;
    }
    textSize(16);
    this.sliders = createYearSliders(this.StartYear, this.EndYear);
    this.frameCount = 0;
    this.filterData();

    // Reset animation progress on setup
    this.maleProgress = 0;
    this.femaleProgress = 0;
  };

  this.destroy = function () {
    if (this.sliders) removeYearSliders(this.sliders);
  };

  this.filterData = function () {
    if (!this.loaded) return;

    let startYear = parseInt(this.sliders.startSlider.value());
    let endYear = parseInt(this.sliders.endSlider.value());

    let filteredData = this.data.filter((d) => {
      let year = parseInt(d["Year"]);
      return year >= startYear && year <= endYear;
    });

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

    this.categories = [];
    this.maleValues = [];
    this.femaleValues = [];

    for (let category in aggregated) {
      let group = aggregated[category];
      this.categories.push(category);
      this.maleValues.push(group.sumMale / group.count);
      this.femaleValues.push(group.sumFemale / group.count);
    }
  };

  this.draw = function () {
    if (!this.loaded) {
      console.log("Education Gender data not loaded yet.");
      return;
    }
    textFont("DM Sans");
    textSize(14);
    textStyle(NORMAL);

    this.startYear = parseInt(this.sliders.startSlider.value());
    this.endYear = parseInt(this.sliders.endSlider.value());
    this.filterData();

    let n = this.categories.length;
    if (n === 0) return;
    let angleStep = TWO_PI / n;

    // Update maleProgress until fully animated
    if (this.maleProgress < 1) {
      this.maleProgress += 0.02;
      if (this.maleProgress > 1) this.maleProgress = 1;
    } else {
      // Once male animation is complete, animate female polygon
      if (this.femaleProgress < 1) {
        this.femaleProgress += 0.02;
        if (this.femaleProgress > 1) this.femaleProgress = 1;
      }
    }

    // Draw radar chart grid (static background)
    stroke(150);
    noFill();
    for (let r = 0.2; r <= 1; r += 0.2) {
      beginShape();
      for (let i = 0; i < n; i++) {
        let angle = i * angleStep - PI / 2;
        let x = width / 2 + cos(angle) * 200 * r;
        let y = height / 2 + sin(angle) * 200 * r;
        vertex(x, y);
      }
      endShape(CLOSE);
    }

    // Draw category labels
    textAlign(CENTER);
    textSize(12);
    textStyle(NORMAL);
    for (let i = 0; i < n; i++) {
      let angle = i * angleStep - PI / 2;
      let x = width / 2 + cos(angle) * 220;
      let y = height / 2 + sin(angle) * 220;
      text(this.categories[i], x, y);
    }

    // Draw male data polygon with animation
    fill(132, 215, 217, 100);
    stroke(132, 215, 217);
    beginShape();
    for (let i = 0; i < n; i++) {
      let val = this.maleValues[i];
      // Map value to radius, then apply male animation progress
      let r = map(val, 0, 100, 0, 200) * this.maleProgress;
      let angle = i * angleStep - PI / 2;
      vertex(width / 2 + cos(angle) * r, height / 2 + sin(angle) * r);
    }
    endShape(CLOSE);

    // Draw female data polygon with animation (starts only after male is complete)
    fill(170, 80, 210, 100);
    stroke(170, 80, 210);
    beginShape();
    for (let i = 0; i < n; i++) {
      let val = this.femaleValues[i];
      // Map value to radius, then apply female animation progress
      let r = map(val, 0, 100, 0, 200) * this.femaleProgress;
      let angle = i * angleStep - PI / 2;
      vertex(width / 2 + cos(angle) * r, height / 2 + sin(angle) * r);
    }
    endShape(CLOSE);
  };
}
