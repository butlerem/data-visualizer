function TechDiversityRace() {
  this.name = "Tech Diversity: Race";
  this.id = "tech-diversity-race";
  this.title = "Tech Diversity by Race";
  this.loaded = false;

  this.preload = function () {
    var self = this;
    this.data = loadTable(
      "./data/tech-diversity/race-2018.csv",
      "csv",
      "header",
      // Callback function to set the value
      // this.loaded to true.
      function (table) {
        self.loaded = true;
      }
    );
  };

  this.setup = function () {
    if (!this.loaded) {
      console.log("Data not yet loaded");
      return;
    }

    // Create a select DOM element.
    this.select = createSelect();
    this.select.position(1000, 120);
    this.select.class("menu-item");
    this.select.style("width", "120px");
    this.select.style("height", "30px");

    // Fill the options with all company names.
    var companies = this.data.columns;
    // First entry is empty.
    for (let i = 1; i < companies.length; i++) {
      this.select.option(companies[i]);
    }
  };

  this.destroy = function () {
    this.select.remove();
  };

  // Create a new pie chart object.
  this.pie = new PieChart(width / 2, height / 2, width * 0.4);

  this.draw = function () {
    if (!this.loaded) {
      console.log("Data not yet loaded");
      return;
    }

    var companyName = this.select.value();

    // Get the column of raw data for companyName.
    var col = this.data.getColumn(companyName);

    // Convert all data strings to numbers.
    col = stringsToNumbers(col);

    // Copy the row labels from the table (the first item of each row).
    var labels = this.data.getColumn(0);

    // Colour to use for each category.
    var colours = [
      color(70, 70, 140, 255), // Deep steel blue
      color(50, 100, 140, 255), // Cool teal blue
      color(50, 140, 80, 255), // Rich forest green
      color(140, 140, 50, 255), // Muted mustard yellow
      color(140, 90, 50, 255), // Warm copper brown
      color(140, 30, 50, 255), // Deep crimson red
    ];

    // Draw the pie chart!
    this.pie.draw(col, labels, colours);
  };
}
