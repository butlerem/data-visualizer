import {
  createLayout,
  createYearSliders,
  removeYearSliders,
  fetchData,
} from "./helper-functions.js";

export function EducationGenderRadar() {
  this.name = "Education Gender Radar";
  this.id = "education-gender-radar";
  this.title = "Education Gender Distribution";
  this.collectionName = "education_gender";
  this.loaded = false;
  this.data = [];
  this.categories = [];
  this.maleValues = [];
  this.femaleValues = [];

  // Default year range
  this.globalStartYear = 1996;
  this.globalEndYear = 2023;

  this.stats = [
    { icon: "school", value: "60%", label: "Female Participation" },
    { icon: "school", value: "40%", label: "Male Participation" },
    { icon: "pie_chart", value: "100%", label: "Total Enrollment" },
  ];

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
    textAlign(CENTER, CENTER);

    this.sliders = createYearSliders(this.globalStartYear, this.globalEndYear);
    this.frameCount = 0;
    this.filterData();
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

    if (this.sliders.startSlider.value() >= this.sliders.endSlider.value()) {
      this.sliders.startSlider.value(this.sliders.endSlider.value() - 1);
    }

    this.startYear = parseInt(this.sliders.startSlider.value());
    this.endYear = parseInt(this.sliders.endSlider.value());
    this.filterData();

    let n = this.categories.length;
    if (n === 0) return;
    let angleStep = TWO_PI / n;

    // Draw radar chart grid
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
    fill(255);
    textAlign(CENTER, CENTER);
    for (let i = 0; i < n; i++) {
      let angle = i * angleStep - PI / 2;
      let x = width / 2 + cos(angle) * 220;
      let y = height / 2 + sin(angle) * 220;
      text(this.categories[i], x, y);
    }

    // Draw male data polygon (filled with transparency)
    fill(132, 215, 217, 100);
    stroke(132, 215, 217);
    beginShape();
    for (let i = 0; i < n; i++) {
      let val = this.maleValues[i];
      let r = map(val, 0, 100, 0, 200);
      let angle = i * angleStep - PI / 2;
      vertex(width / 2 + cos(angle) * r, height / 2 + sin(angle) * r);
    }
    endShape(CLOSE);

    // Draw female data polygon (filled with transparency)
    fill(171, 82, 213, 100);
    stroke(171, 82, 213);
    beginShape();
    for (let i = 0; i < n; i++) {
      let val = this.femaleValues[i];
      let r = map(val, 0, 100, 0, 200);
      let angle = i * angleStep - PI / 2;
      vertex(width / 2 + cos(angle) * r, height / 2 + sin(angle) * r);
    }
    endShape(CLOSE);
  };
}
