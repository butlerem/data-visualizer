import { PieChart } from "../public/pie-chart.js";

export function TechDiversityRace() {
  this.name = "Tech Race Diversity";
  this.id = "tech-diversity-race";
  this.title = "Tech Diversity by Race";
  // Data flags
  this.loaded = false;
  this.rawRaceDocs = [];
  this.data = [];

  this.stats = [
    { icon: "groups", value: "50%", label: "White Representation" },
    { icon: "groups", value: "25%", label: "Black Representation" },
    { icon: "groups", value: "25%", label: "Other Representation" },
  ];

  // UI element
  this.dropdown = null;

  // PieChart reference
  this.pie = null;

  // ----------------------------------------------------------------------
  // 1) PRELOAD: Load from Firestore (async)
  // ----------------------------------------------------------------------
  this.preload = function () {
    const self = this;
    import("https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js")
      .then(({ getFirestore, collection, getDocs }) => {
        const db = getFirestore(window.app);
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
    // If we already created our dropdown, skip re-creating
    if (this.dropdown) return;

    // Build an array of company names
    this.companyNames = [];
    if (this.data && this.data.length) {
      this.companyNames = this.data.map((d) => d.company).filter(Boolean);
    }

    // Create a dropdown (select)
    this.dropdown = createSelect();
    // Assign an ID
    this.dropdown.id("company-dropdown");
    this.dropdown.parent("sliders"); // Attach to the same parent where the slider was
    this.dropdown.class("menu-item");

    // Populate the dropdown with all companies
    for (let i = 0; i < this.companyNames.length; i++) {
      // Pass the index as the value, so we can grab it easily
      this.dropdown.option(this.companyNames[i], i);
    }

    // Default to the first company
    this.dropdown.selected("0");

    // Create the PieChart
    this.pie = new PieChart(width / 2, height / 2, width * 0.4);
  };

  // ----------------------------------------------------------------------
  // 4) DESTROY: remove the dropdown if switching visuals
  // ----------------------------------------------------------------------
  this.destroy = function () {
    if (this.dropdown) {
      this.dropdown.remove();
      this.dropdown = null;
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

    // If we never built the dropdown, build it now (data is ready).
    if (!this.dropdown) {
      this.setup();
    }

    // If there's still no dropdown or no PieChart, bail.
    if (!this.dropdown || !this.pie) {
      return;
    }

    // Get the selected index from the dropdown
    const index = parseInt(this.dropdown.value(), 10);

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
    let colours = ["#ab52d5", "#84d7d9", "#f4a261", "#2a9d8f", "#4f9df7"];

    // Draw the pie
    this.pie.draw(values, labels, colours);
  };
}
