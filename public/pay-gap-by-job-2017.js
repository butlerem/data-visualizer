function PayGapByJob2017() {
  this.name = "Pay Gap By Job";
  this.id = "pay-gap-by-job-2017";
  this.title = "Pay Gap by Job in 2017";
  this.loaded = false;

  this.xAxisLabel = "% Female in Role";
  this.yAxisLabel = "Pay Gap (Women vs. Men)";

  this.pad = 20;
  this.dotSizeMin = 15;
  this.dotSizeMax = 40;

  // Clors for points
  this.colors = [
    color(70, 70, 140, 255), // Deep steel blue
    color(50, 100, 140, 255), // Cool teal blue
    color(50, 140, 80, 255), // Rich forest green
    color(140, 140, 50, 255), // Muted mustard yellow
    color(140, 30, 50, 255), // Deep crimson red
  ];

  // Preload the data
  this.preload = function () {
    var self = this;
    this.data = loadTable(
      "./data/pay-gap/occupation-hourly-pay-by-gender-2017.csv",
      "csv",
      "header",
      function (table) {
        self.loaded = true;
      }
    );
  };

  this.setup = function () {};

  this.destroy = function () {};

  this.draw = function () {
    if (!this.loaded) {
      console.log("Data not yet loaded");
      return;
    }

    // Draw the centered axes with tick marks and labels
    this.addAxes();

    // Get data from the table object
    let propFemale = stringsToNumbers(this.data.getColumn("proportion_female"));
    let payGap = stringsToNumbers(this.data.getColumn("pay_gap"));
    let numJobs = stringsToNumbers(this.data.getColumn("num_jobs"));

    // Find the smallest and largest number of jobs
    let numJobsMin = min(numJobs);
    let numJobsMax = max(numJobs);

    // Draw data points
    fill(40);
    stroke(255);
    strokeWeight(1);

    for (let i = 0; i < this.data.getRowCount(); i++) {
      fill(this.colors[i % this.colors.length]); // Cycle through pastel colors
      ellipse(
        map(propFemale[i], 0, 100, this.pad, width - this.pad),
        map(payGap[i], -20, 20, height - this.pad, this.pad),
        map(
          numJobs[i],
          numJobsMin,
          numJobsMax,
          this.dotSizeMin,
          this.dotSizeMax
        )
      );
    }
  };

  this.addAxes = function () {
    fill(255);
    stroke(255);
    textSize(12);
    textAlign(CENTER, CENTER);

    // Draw vertical axis (y-axis) at the center
    line(width / 2, this.pad, width / 2, height - this.pad);

    // Draw horizontal axis (x-axis) at the center
    line(this.pad, height / 2, width - this.pad, height / 2);

    // Draw y-axis tick marks and labels
    let yTicks = 10;
    for (let i = 0; i <= yTicks; i++) {
      let y = map(i, 0, yTicks, height - this.pad, this.pad);
      let value = map(i, 0, yTicks, -20, 20).toFixed(0); // Pay gap range
      // Tick marks
      line(width / 2 - 5, y, width / 2 + 5, y);
      // Labels
      text(value, width / 2 - 25, y);
    }

    // Draw x-axis tick marks and labels
    let xTicks = 10;
    for (let i = 0; i <= xTicks; i++) {
      let x = map(i, 0, xTicks, this.pad, width - this.pad);
      let value = map(i, 0, xTicks, 0, 100).toFixed(0); // % female range
      // Tick marks
      line(x, height / 2 - 5, x, height / 2 + 5);
      // Labels
      text(value, x, height / 2 + 20);
    }

    // Draw axis labels
    textSize(16);

    // X-axis label
    text(this.xAxisLabel, width / 2, height - this.pad / 2);

    // Y-axis label (rotated)
    push();
    translate(this.pad / 2, height / 2);
    rotate(-PI / 2);
    text(this.yAxisLabel, 0, 0);
    pop();
  };
}
