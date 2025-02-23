export function TechDiversityGender() {
  this.name = "Tech Diversity: Gender";
  this.id = "tech-diversity-gender";
  this.title = "Tech Diversity by Gender Percentage";
  this.loaded = false;

  this.xAxisLabel = " ";
  this.yAxisLabel = "";

  this.layout = {
    // Locations of margin positions. Left and bottom have double margin
    // size due to axis and tick labels.
    leftMargin: 120,
    rightMargin: width,
    topMargin: 60,
    bottomMargin: height,
    pad: 5,

    plotWidth: function () {
      return this.rightMargin - this.leftMargin;
    },

    // Boolean to enable/disable background grid.
    grid: true,

    // Number of axis tick labels to draw so that they are not drawn on
    // top of one another.
    numXTickLabels: 10,
    numYTickLabels: 8,
  };

  // Middle of the plot: for 50% line.
  this.midX = this.layout.plotWidth() / 2 + this.layout.leftMargin;

  // Default visualisation colours.
  this.femaleColour = color(50, 120, 140, 255);
  this.maleColour = color(70, 70, 140, 255);

  this.preload = function () {
    var self = this;
    import("https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js")
      .then(({ getFirestore, collection, getDocs }) => {
        const db = getFirestore(window.app);
        return getDocs(collection(db, "tech_diversity_gender"));
      })
      .then((querySnapshot) => {
        self.data = querySnapshot.docs.map((doc) => doc.data());
        self.loaded = true;
        console.log(
          "Tech Diversity Gender data loaded from Firestore:",
          self.data
        );
      })
      .catch((error) => {
        console.error("Error loading Tech Diversity Gender data:", error);
      });
  };

  this.setup = function () {
    // Font defaults.
    textSize(16);
  };

  this.destroy = function () {};

  this.draw = function () {
    if (!this.loaded) {
      console.log("Data not yet loaded");
      return;
    }

    // Draw Female/Male labels at the top of the plot.
    this.drawCategoryLabels();

    var lineHeight = (height - this.layout.topMargin) / this.data.getRowCount();

    for (var i = 0; i < this.data.getRowCount(); i++) {
      // Calculate the y position for each company.
      var lineY = lineHeight * i + this.layout.topMargin;

      // Create an object that stores data from the current row.
      var company = {
        // Convert strings to numbers.
        name: this.data.getString(i, "company"),
        female: this.data.getNum(i, "female"),
        male: this.data.getNum(i, "male"),
      };

      // Draw the company name in the left margin.
      fill(255);
      noStroke();
      textAlign("right", "top");
      text(company.name, this.layout.leftMargin - this.layout.pad, lineY);

      // Draw female employees rectangle.
      fill(this.femaleColour);
      rect(
        this.layout.leftMargin,
        lineY,
        this.mapPercentToWidth(company.female),
        lineHeight - this.layout.pad
      );

      // Draw male employees rectangle.
      fill(this.maleColour);
      rect(
        this.layout.leftMargin + this.mapPercentToWidth(company.female),
        lineY,
        this.mapPercentToWidth(company.male),
        lineHeight - this.layout.pad
      );
    }

    // Draw 50% line
    stroke(150);
    strokeWeight(1);
    line(this.midX, this.layout.topMargin, this.midX, this.layout.bottomMargin);
  };

  this.drawCategoryLabels = function () {
    fill(255);
    noStroke();
    textAlign("left", "top");
    text("Female", this.layout.leftMargin, this.layout.pad + 35); // Move down by 30px
    textAlign("center", "top");
    text("50%", this.midX, this.layout.pad + 35); // Move down by 30px
    textAlign("right", "top");
    text("Male", this.layout.rightMargin, this.layout.pad + 35); // Move down by 30px
  };

  this.mapPercentToWidth = function (percent) {
    return map(percent, 0, 100, 0, this.layout.plotWidth());
  };
}
