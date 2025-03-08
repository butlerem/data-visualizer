import {
  createYearSliders,
  removeYearSliders,
  fetchData,
} from "../helper-functions.js";

export function EducationGenderRadar() {
  // Public properties
  this.name = "Education Distribution";
  this.id = "education-gender-radar";
  this.title = "Education Gender Distribution";
  this.collectionName = "education_gender";
  this.loaded = false;
  this.data = [];
  this.categories = [];
  this.maleValues = [];
  this.femaleValues = [];

  // Default year range for filtering data
  this.StartYear = 1996;
  this.EndYear = 2023;

  // Statistics for stats panel
  this.stats = [
    { icon: "school", value: "60%", label: "Female Participation" },
    { icon: "school", value: "40%", label: "Male Participation" },
    { icon: "pie_chart", value: "92%", label: "Literacy Rate Overall" },
  ];

  // Animation progress variables for the polygons
  this.maleProgress = 0;
  this.femaleProgress = 0;

  // Preload data from Firestore
  this.preload = async function () {
    try {
      this.data = await fetchData("education_gender");
      this.loaded = true;
      console.log("Education Gender Data loaded");
    } catch (error) {
      console.error("Error loading Education Gender data:", error);
    }
  };

  /**
   * Setup: Initialize UI, sort data
   */
  this.setup = function () {
    if (!this.loaded || !this.data.length) {
      console.warn("EducationGenderRadar: Data not loaded or empty.");
      return;
    }
    textSize(16);

    // Create sliders for default start and end years
    this.sliders = createYearSliders(this.StartYear, this.EndYear);
    this.filterData();

    // Reset animation frame counts
    this.frameCount = 0;
    this.maleProgress = 0;
    this.femaleProgress = 0;
  };

  // Destroy visual, clean up UI
  this.destroy = function () {
    if (this.sliders) removeYearSliders(this.sliders);
  };

  // Filter and aggregate data based on the selected year range
  this.filterData = function () {
    if (!this.loaded) return;

    // Get the start and end years from the sliders
    let startYear = parseInt(this.sliders.startSlider.value());
    let endYear = parseInt(this.sliders.endSlider.value());

    // Filter the data for records within the selected year range
    let filteredData = this.data.filter((d) => {
      let year = parseInt(d["Year"]);
      return year >= startYear && year <= endYear;
    });

    // Aggregate data by category, summing male and female percentages and counting records
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

    // Reset category arrays before populating them with new data
    this.categories = [];
    this.maleValues = [];
    this.femaleValues = [];

    // Compute average values for each category and store them
    for (let category in aggregated) {
      let group = aggregated[category];
      this.categories.push(category);
      this.maleValues.push(group.sumMale / group.count);
      this.femaleValues.push(group.sumFemale / group.count);
    }
  };

  // Draw function to render the radar chart visualization
  this.draw = function () {
    // Check if data has been loaded; if not, exit the function
    if (!this.loaded) {
      console.log("Education Gender data not loaded yet.");
      return;
    }
    textFont("DM Sans");
    textSize(14);
    textStyle(NORMAL);

    // Update current year range from slider values and refilter data
    this.startYear = parseInt(this.sliders.startSlider.value());
    this.endYear = parseInt(this.sliders.endSlider.value());
    this.filterData();

    // Determine number of categories
    let n = this.categories.length;
    if (n === 0) return;
    // Calculate the angle between each axis (category) in the radar chart
    let angleStep = TWO_PI / n;

    // Animate the male polygon
    if (this.maleProgress < 1) {
      this.maleProgress += 0.02;
      if (this.maleProgress > 1) this.maleProgress = 1;
    } else {
      // Once male polygon is complete, then animate female polygon
      if (this.femaleProgress < 1) {
        this.femaleProgress += 0.02;
        if (this.femaleProgress > 1) this.femaleProgress = 1;
      }
    }

    // --- Draw Radar Chart Grid ---
    // Draw polygons as a grid background
    stroke(150);
    noFill();
    for (let r = 0.2; r <= 1; r += 0.2) {
      beginShape();
      for (let i = 0; i < n; i++) {
        // Calculate angle for each vertex
        let angle = i * angleStep - PI / 2;
        // Calculate x, y coordinates for the vertex based on the current radius (r)
        let x = width / 2 + cos(angle) * 200 * r;
        let y = height / 2 + sin(angle) * 200 * r;
        vertex(x, y);
      }
      endShape(CLOSE);
    }

    // --- Draw Category Labels ---
    textAlign(CENTER);
    textSize(12);
    textStyle(NORMAL);
    for (let i = 0; i < n; i++) {
      // Calculate the position for each label
      let angle = i * angleStep - PI / 2;
      let x = width / 2 + cos(angle) * 220;
      let y = height / 2 + sin(angle) * 220;
      text(this.categories[i], x, y);
    }

    // --- Draw Male Data Polygon ---
    fill(132, 215, 217, 100);
    stroke(132, 215, 217);
    beginShape();
    for (let i = 0; i < n; i++) {
      // Get the average male percentage
      let val = this.maleValues[i];
      // Map the percentage value (0-100) to a radius (0-200) and apply animation
      let r = map(val, 0, 100, 0, 200) * this.maleProgress;
      let angle = i * angleStep - PI / 2;
      // Calculate the coordinates and add to the shape
      vertex(width / 2 + cos(angle) * r, height / 2 + sin(angle) * r);
    }
    endShape(CLOSE);

    // --- Draw Female Polygon ---
    fill(170, 80, 210, 100);
    stroke(170, 80, 210);
    beginShape();
    for (let i = 0; i < n; i++) {
      // Get the average female percentage
      let val = this.femaleValues[i];
      // Map the percentage value to a radius and apply female animation
      let r = map(val, 0, 100, 0, 200) * this.femaleProgress;
      let angle = i * angleStep - PI / 2;
      // Calculate the coordinates and add to the shape
      vertex(width / 2 + cos(angle) * r, height / 2 + sin(angle) * r);
    }
    endShape(CLOSE);
  };
}
