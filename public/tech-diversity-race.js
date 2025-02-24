import { PieChart } from "./pie-chart.js";

export function TechDiversityRace() {
  this.name = "Tech Race Diversity";
  this.id = "tech-diversity-race";
  this.title = "Tech Diversity by Race";

  // Data flags
  this.loaded = false;
  this.rawRaceDocs = [];
  this.data = [];

  // UI elements
  this.slider = null; // <-- We'll use a slider now
  this.pie = null;

  // ----------------------------------------------------------------------
  // 1) PRELOAD: Load from Firestore (async)
  // ----------------------------------------------------------------------
  this.preload = function () {
    const self = this;
    import("https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js")
      .then(({ getFirestore, collection, getDocs }) => {
        const db = getFirestore(window.app); // Adjust if your Firebase app is named differently
        return getDocs(collection(db, "tech_diversity_race"));
      })
      .then((querySnapshot) => {
        const temp = [];
        querySnapshot.forEach((doc) => {
          // doc.id = "white", "black", etc.
          // doc.data() = { "Amazon": "13.0", ... }
          temp.push({ race: doc.id, ...doc.data() });
        });
        self.rawRaceDocs = temp;
        self.data = self.invertData(self.rawRaceDocs);
        self.loaded = true;

        console.log("TechDiversityRace data loaded:", self.data);
      })
      .catch((error) => {
        console.error("Error loading TechDiversityRace data:", error);
      });
  };

  // ----------------------------------------------------------------------
  // 2) INVERT DATA: from "by race" to "by company"
  // ----------------------------------------------------------------------
  this.invertData = function (rawRaceDocs) {
    const companiesMap = {};

    rawRaceDocs.forEach((raceDoc) => {
      const raceName = raceDoc.race; // e.g. "white", "black"
      Object.entries(raceDoc).forEach(([key, value]) => {
        if (key === "race") return; // skip the 'race' field

        const companyName = key;
        const numVal = parseFloat(value) || 0;

        if (!companiesMap[companyName]) {
          companiesMap[companyName] = { company: companyName };
        }
        companiesMap[companyName][raceName] = numVal;
      });
    });

    return Object.values(companiesMap); // turn the object into an array
  };

  // ----------------------------------------------------------------------
  // 3) SETUP: Called by gallery.selectVisual("tech-diversity-race")
  // ----------------------------------------------------------------------
  this.setup = function () {
    // If we already created our slider, skip re-creating
    if (this.slider) return;

    // Build an array of company names
    this.companyNames = [];
    if (this.data && this.data.length) {
      this.companyNames = this.data.map((d) => d.company).filter(Boolean);
    }

    // Create a new slider that goes from 0 to (companyNames.length - 1)
    this.slider = createSlider(0, this.companyNames.length - 1, 0, 1);

    // Attach it to the existing div#sliders
    this.slider.parent("sliders");

    // Optional: give it some CSS styles
    this.slider.style("width", "300px");
    this.slider.class("menu-item");

    // Create the PieChart
    this.pie = new PieChart(width / 2, height / 2, width * 0.4);
  };

  // ----------------------------------------------------------------------
  // 4) DESTROY: remove the slider if switching visuals
  // ----------------------------------------------------------------------
  this.destroy = function () {
    if (this.slider) {
      this.slider.remove();
      this.slider = null;
    }
  };

  // ----------------------------------------------------------------------
  // 5) DRAW: Runs every frame. Draw the pie if data is ready.
  // ----------------------------------------------------------------------
  this.draw = function () {
    // If data isn’t loaded yet, just skip for now—try again next frame.
    if (!this.loaded || !this.data.length) {
      return;
    }

    // If we never built the slider, build it now (data is ready).
    if (!this.slider) {
      this.setup();
    }

    // If there's still no slider or no PieChart, bail.
    if (!this.slider || !this.pie) {
      return;
    }

    // Figure out which company index is selected from the slider
    const index = this.slider.value();

    // Get the company name from the array of companyNames
    const chosenCompany = this.companyNames[index];

    // Safely find the data object for that company
    let obj = this.data.find((d) => d.company === chosenCompany);

    // If no company (or not in data), skip
    if (!obj) {
      return;
    }

    // Races to display
    let races = ["white", "black", "asian", "latino", "other"];
    let values = races.map((r) => obj[r] || 0);
    let labels = races.map(
      (r) => r.charAt(0).toUpperCase() + r.slice(1) // Capitalize
    );
    let colours = ["#5e81ac", "#8fbcbb", "#a3be8c", "#b48ead", "#e9a17c"];

    // Draw the pie
    this.pie.draw(values, labels, colours);
  };
}
