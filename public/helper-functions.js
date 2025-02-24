// helper-functions.js

// --------------------------------------------------------------------
// Layout and UI Helper Functions
// --------------------------------------------------------------------

export const createLayout = (
  marginSize,
  canvasWidth,
  canvasHeight,
  options = {}
) => {
  return {
    marginSize,
    leftMargin: marginSize * 2,
    rightMargin: canvasWidth - marginSize * 2,
    topMargin: marginSize,
    bottomMargin: canvasHeight - marginSize * 2,
    pad: 5,
    grid: options.grid || false,
    numXTickLabels: options.numXTickLabels || 10,
    numYTickLabels: options.numYTickLabels || 8,
    plotWidth() {
      return this.rightMargin - this.leftMargin;
    },
    plotHeight() {
      return this.bottomMargin - this.topMargin;
    },
  };
};

export const createYearSliders = (
  minYear,
  maxYear,
  parentId = "sliders",
  sliderWidth = "300px"
) => {
  const startSlider = createSlider(minYear, maxYear - 1, minYear, 1);
  startSlider.parent(parentId);
  startSlider.style("width", sliderWidth);

  const endSlider = createSlider(minYear + 1, maxYear, maxYear, 1);
  endSlider.parent(parentId);
  endSlider.style("width", sliderWidth);

  const yearLabel = createP(`Start Year: ${minYear} | End Year: ${maxYear}`);
  yearLabel.parent(parentId);
  yearLabel.style("color", "#fff");

  const updateLabel = () => {
    yearLabel.html(
      `Start Year: ${startSlider.value()} | End Year: ${endSlider.value()}`
    );
  };

  startSlider.input(updateLabel);
  endSlider.input(updateLabel);
  updateLabel();

  return { startSlider, endSlider, yearLabel };
};

export const removeYearSliders = (sliderObj) => {
  if (sliderObj.startSlider) sliderObj.startSlider.remove();
  if (sliderObj.endSlider) sliderObj.endSlider.remove();
  if (sliderObj.yearLabel) sliderObj.yearLabel.remove();

  // Optionally, clear the parent container
  const slidersDiv = document.getElementById("sliders");
  if (slidersDiv) {
    slidersDiv.innerHTML = "";
  }
};

// --------------------------------------------------------------------
// Data Processing Helper Functions
// --------------------------------------------------------------------

export const stringsToNumbers = (array) => array.map(Number);

export const sum = (data) => {
  const numbers = stringsToNumbers(data);
  return numbers.reduce((total, value) => total + value, 0);
};

export const mean = (data) => {
  return sum(data) / data.length;
};

export const sliceRowNumbers = (row, start = 0, end) => {
  const rowData = [];
  // If no end is provided, use row.arr.length
  end = end || row.arr.length;
  for (let i = start; i < end; i++) {
    rowData.push(row.getNum(i));
  }
  return rowData;
};

// --------------------------------------------------------------------
// Plotting Helper Functions
// --------------------------------------------------------------------

export const drawAxis = (layout, colour = 0) => {
  stroke(color(colour));
  // x-axis
  line(
    layout.leftMargin,
    layout.bottomMargin,
    layout.rightMargin,
    layout.bottomMargin
  );
  // y-axis
  line(
    layout.leftMargin,
    layout.topMargin,
    layout.leftMargin,
    layout.bottomMargin
  );
};

export const drawAxisLabels = (xLabel, yLabel, layout) => {
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  // x-axis label
  text(
    xLabel,
    layout.leftMargin + layout.plotWidth() / 2,
    layout.bottomMargin + layout.marginSize * 1.5
  );
  // y-axis label
  push();
  translate(
    layout.leftMargin - layout.marginSize * 1.5,
    layout.topMargin + layout.plotHeight() / 2
  );
  rotate(-PI / 2);
  text(yLabel, 0, 0);
  pop();
};

export const drawYAxisTickLabels = (
  min,
  max,
  layout,
  mapFunction,
  decimalPlaces = 0
) => {
  const range = max - min;
  const yTickStep = range / layout.numYTickLabels;
  fill(255);
  noStroke();
  textAlign(RIGHT, CENTER);

  for (let i = 0; i <= layout.numYTickLabels; i++) {
    const value = min + i * yTickStep;
    const y = mapFunction(value);
    text(value.toFixed(decimalPlaces), layout.leftMargin - layout.pad, y);
    if (layout.grid) {
      stroke(200);
      line(layout.leftMargin, y, layout.rightMargin, y);
    }
  }
};

export const drawXAxisTickLabel = (value, layout, mapFunction) => {
  const x = mapFunction(value);
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  text(value, x, layout.bottomMargin + layout.marginSize / 2);
  if (layout.grid) {
    stroke(220);
    line(x, layout.topMargin, x, layout.bottomMargin);
  }
};

export const drawTitle = (txt, margin = 40) => {
  fill(255);
  noStroke();
  textSize(16);
  text(txt, width / 2, margin / 2);
};
