// gallery.js
import { PieChart } from "./pie-chart.js";

export function TechDiversityRace() {
  this.name = "Tech Diversity: Race";
  this.id = "tech-diversity-race";
  this.title = "Tech Diversity by Race (inverted docs)";
  this.loaded = false;

  // Storing data in two forms:
  // this.rawData: array of docs from Firestore
  // this.data: object grouped by company

  this.rawRata = [];
  this.data = [];

  // A <select> to let user pick which company to visualize
  this.select = null;

  // A PieChart object (optional—depends on your code)
  this.pie = null;

  // ----------------------------------------------------------------------
  // 1) PRELOAD: Load from Firestore. Each doc.id = "white"/"black"/"asian"/etc.
  // ----------------------------------------------------------------------
  this.preload = function () {
    const self = this;
    import("https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js")
      .then(({ getFirestore, collection, getDocs }) => {
        const db = getFirestore(window.app); // make sure window.app is your Firebase app
        return getDocs(collection(db, "tech_diversity_race"));
      })
      .then((querySnapshot) => {
        self.rawRaceDocs = []; // Just in case
        querySnapshot.forEach((doc) => {
          // doc.id might be "white", "black", "asian", ...
          // doc.data() is an object like { "AirBnB": "36.3309", "Amazon": "13.0", ... }
          self.rawRaceDocs.push({ race: doc.id, ...doc.data() });
        });
        // Now invert that data into "by company" form
        self.data = self.invertData(self.rawRaceDocs);

        self.loaded = true;
        console.log("TechDiversityRace data loaded and inverted:", self.data);
      })
      .catch((error) => {
        console.error("Error loading Tech Diversity Race data:", error);
      });
  };

  // ----------------------------------------------------------------------
  // 2) A helper to invert the docs from "by race" -> "by company"
  //    rawRaceDocs is an array like:
  //    [
  //      { race: "white", AirBnB:"36.33", Amazon:"13.0", Apple:"20.79", ... },
  //      { race: "black", AirBnB:"...", Amazon:"...", Apple:"...", ... },
  //      ...
  //    ]
  // ----------------------------------------------------------------------
  this.invertData = function (rawRaceDocs) {
    const companiesMap = {};
    // Go through each doc (which is a race)
    rawRaceDocs.forEach((raceDoc) => {
      const raceName = raceDoc.race; // "white", "black", "asian", ...
      // For each key in raceDoc, except 'race' itself
      Object.entries(raceDoc).forEach(([key, value]) => {
        if (key === "race") return; // skip the "race" field

        // key might be "AirBnB", "Amazon", etc.
        // value is a string percentage like "36.3309"
        const companyName = key;
        let numVal = parseFloat(value) || 0;

        // Make sure we have an object in companiesMap for this company
        if (!companiesMap[companyName]) {
          companiesMap[companyName] = { company: companyName };
        }
        // Assign e.g. companiesMap["AirBnB"]["white"] = 36.3309
        companiesMap[companyName][raceName] = numVal;
      });
    });

    // Convert companiesMap object -> array
    // e.g. { "AirBnB": {company:"AirBnB", white:36.33, black:??, ...}, "Amazon":{...}, ... }
    return Object.values(companiesMap);
  };

  // ----------------------------------------------------------------------
  // 3) SETUP: Create a <select> for companies and maybe a PieChart
  // ----------------------------------------------------------------------
  this.setup = function () {
    if (!this.loaded || !this.data.length) {
      console.log("No data in TechDiversityRace setup yet.");
      return;
    }

    // Extract company names from this.data
    let companyNames = this.data.map((d) => d.company).filter(Boolean);

    // Build a p5 <select>
    this.select = createSelect();
    this.select.position(1000, 120);
    this.select.class("menu-item");
    this.select.style("width", "120px");
    this.select.style("height", "30px");

    companyNames.forEach((c) => this.select.option(c));

    // If you have a PieChart class (adjust if not)
    this.pie = new PieChart(width / 2, height / 2, width * 0.4);
  };

  // ----------------------------------------------------------------------
  // 4) DESTROY: remove <select> when user changes visuals
  // ----------------------------------------------------------------------
  this.destroy = function () {
    if (this.select) {
      this.select.remove();
    }
  };

  // ----------------------------------------------------------------------
  // 5) DRAW: pick the doc for whichever company is selected and draw a pie
  // ----------------------------------------------------------------------
  this.draw = function () {
    if (!this.loaded || !this.data.length) {
      console.log("Data still not ready in TechDiversityRace draw.");
      return;
    }
    if (!this.select || !this.pie) {
      return; // UI not set up yet
    }

    background("#1c1c20");

    let chosenCompany = this.select.value();
    // find that object's data
    let obj = this.data.find((d) => d.company === chosenCompany);
    if (!obj) {
      console.log("No record for company:", chosenCompany);
      return;
    }

    // Now you have something like:
    // { company:"AirBnB", white:36.33, black:??, asian:??, latio:??, other:?? }
    // We just need to build arrays for the pie

    // Races we expect (they match doc IDs from Firestore)
    let races = ["white", "black", "asian", "latino", "other"];
    // (If you have "latino" spelled differently, change it.)

    let values = races.map((r) => obj[r] || 0);
    let labels = races.map((r) => r.charAt(0).toUpperCase() + r.slice(1)); // to label slices
    let colours = ["#5e81ac", "#8fbcbb", "#a3be8c", "#b48ead", "#e9a17c"];

    // Draw the pie (assuming your PieChart supports draw(values, labels, colours))
    this.pie.draw(values, labels, colours);
  };
}
