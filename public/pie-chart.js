import { sum } from "./helper-functions.js";

// --------------------------------------------------------------------
// PieChart.js - 2D Pie Chart Class
// --------------------------------------------------------------------
// NOTE: This file is not currently used in the project because we are
// using a 3D Pie Chart instead. However, it is being kept for potential
// future use in case a 2D pie chart is needed again. :)
// --------------------------------------------------------------------

/**
 * PieChart constructor function to create a 2D pie chart visualization.
 */
export function PieChart(x, y, diameter) {
  this.x = x; // X position of the pie chart
  this.y = y; // Y position of the pie chart
  this.diameter = diameter; // Diameter of the pie chart
  this.labelSpace = 30; // Space between legend labels

  // --------------------------------------------------------------------
  // Converts numerical data into proportional radians for pie slices.
  // --------------------------------------------------------------------
  this.getRadians = function (data) {
    const total = sum(data);
    return data.map((value) => (value / total) * TWO_PI);
  };

  // --------------------------------------------------------------------
  // Draws the pie chart using data, labels, and colors.
  // --------------------------------------------------------------------
  this.draw = function (data, labels, colours) {
    // Validate that the data array is not empty
    if (data.length === 0) {
      alert("Error: Data array is empty!");
      return;
    }

    // Validate that labels and colors match the length of the data array
    if (![labels, colours].every((arr) => arr.length === data.length)) {
      alert(`Data (length: ${data.length})
Labels (length: ${labels.length})
Colours (length: ${colours.length})
Error: Arrays must have the same length!`);
      return;
    }

    // Convert data to angles in radians
    const angles = this.getRadians(data);
    let lastAngle = 0;

    // Loop through data points and draw pie chart slices
    for (let i = 0; i < data.length; i++) {
      const colour = colours ? colours[i] : map(i, 0, data.length, 0, 255); // Assign color

      fill(colour);
      stroke(255);
      strokeWeight(1);

      // Draw arc segment for the slice
      arc(
        this.x,
        this.y,
        this.diameter,
        this.diameter,
        lastAngle,
        lastAngle + angles[i] + 0.001 // Small offset to prevent gaps
      );

      // Draw legend item if labels exist
      if (labels) {
        this.makeLegendItem(labels[i], i, colour);
      }

      // Update lastAngle for next slice
      lastAngle += angles[i];
    }
  };

  // --------------------------------------------------------------------
  // Draws a legend item for the pie chart.
  // --------------------------------------------------------------------
  this.makeLegendItem = function (label, i, colour) {
    // Calculate position for legend box and text
    const x = this.x + 50 + this.diameter / 2;
    const y = this.y + this.labelSpace * i - this.diameter / 3;
    const boxSize = this.labelSpace / 2;

    // Draw legend color box
    fill(colour);
    rect(x, y, boxSize, boxSize);

    // Draw label text
    fill(255);
    noStroke();
    textAlign("left", "center");
    textSize(12);
    text(label, x + boxSize + 10, y + boxSize / 2);
  };
}
