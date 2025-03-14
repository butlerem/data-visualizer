import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

// --------------------------------------------------------------------
// Layout and Setup
// --------------------------------------------------------------------

/**
 * Creates a layout configuration for graphs.
 */
export const createLayout = (
  marginSize,
  canvasWidth,
  canvasHeight,
  options = {}
) => {
  const leftMargin = marginSize * 2;
  const rightMargin = canvasWidth - marginSize * 2;
  const topMargin = marginSize;
  const bottomMargin = canvasHeight - marginSize * 2;

  return {
    marginSize,
    leftMargin,
    rightMargin,
    topMargin,
    bottomMargin,
    pad: 5,
    grid: options.grid || false,
    numXTickLabels: options.numXTickLabels || 10,
    numYTickLabels: options.numYTickLabels || 8,
    plotWidth: () => rightMargin - leftMargin,
    plotHeight: () => bottomMargin - topMargin,
  };
};

/**
 * Creates year range sliders for selecting a start and end year.
 */
export const createYearSliders = (
  minYear,
  maxYear,
  parentId = "sliders",
  sliderWidth = "300px"
) => {
  const startSlider = createSlider(minYear, maxYear - 1, minYear, 1);
  startSlider.parent(parentId);
  startSlider.style("width", sliderWidth);
  startSlider.class("slider");

  const endSlider = createSlider(minYear + 1, maxYear, maxYear, 1);
  endSlider.parent(parentId);
  endSlider.style("width", sliderWidth);
  endSlider.class("slider");

  const yearLabel = createP(`Start Year: ${minYear} | End Year: ${maxYear}`);
  yearLabel.parent(parentId);

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

/**
 * Removes year sliders from the DOM.
 */
export const removeYearSliders = (sliderObj) => {
  ["startSlider", "endSlider", "yearLabel"].forEach((key) => {
    if (sliderObj[key]) sliderObj[key].remove();
  });

  // Clear parent container if it exists
  const slidersDiv = document.getElementById("sliders");
  if (slidersDiv) {
    slidersDiv.innerHTML = "";
  }
};

// --------------------------------------------------------------------
// Data Processing Helpers
// --------------------------------------------------------------------

/**
 * Converts an array of strings to numbers.
 */
export const stringsToNumbers = (array) => array.map(Number);

/**
 * Calculates the sum of a numerical dataset.
 */
export const sum = (data) => {
  const numbers = stringsToNumbers(data);
  return numbers.reduce((total, value) => total + value, 0);
};

/**
 * Computes the mean (average) of a dataset.
 */
export const mean = (data) => sum(data) / data.length;

/**
 * Extracts a range of numbers from a row object.
 */
export const sliceRowNumbers = (row, start = 0, end) => {
  const rowData = [];
  end = end || row.arr.length; // Use row length if no end is specified

  for (let i = start; i < end; i++) {
    rowData.push(row.getNum(i));
  }
  return rowData;
};

// --------------------------------------------------------------------
// Plotting Helper Functions
// --------------------------------------------------------------------

/**
 * Draws x and y axis.
 */
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

/**
 * Draws axis labels for x and y axes.
 */
export const drawAxisLabels = (xLabel, yLabel, layout) => {
  fill(255);
  noStroke();

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
  noStroke(); // Ensure no stroke for rotated text
  fill(255);
  text(yLabel, 0, 0);
  pop();
};

/**
 * Draws y-axis tick labels.
 */
export const drawYAxisTickLabels = (
  min,
  max,
  layout,
  mapFunction,
  decimalPlaces = 0
) => {
  const range = max - min;
  const yTickStep = range / layout.numYTickLabels;
  fill(150);
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

/**
 * Draws x-axis tick labels.
 */
export const drawXAxisTickLabels = (value, layout, mapFunction) => {
  const x = mapFunction(value);
  fill(150);
  noStroke();
  text(value, x, layout.bottomMargin + layout.marginSize / 2);
  if (layout.grid) {
    stroke(220);
    line(x, layout.topMargin, x, layout.bottomMargin);
  }
};

// --------------------------------------------------------------------
// DOM Utilities
// --------------------------------------------------------------------

/**
 * Display an HTML element
 */
export const showElement = (id) => {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = "block";
  }
};

/**
 * Hide an HTML element
 */
export const hideElement = (id) => {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = "none";
  }
};

// --------------------------------------------------------------------
// Three.js
// --------------------------------------------------------------------

/**
 * Fetches data from Firestore.
 */
// Now updated to include the document ID
export const fetchData = async (collectionName) => {
  try {
    const { getFirestore, collection, getDocs } = await import(
      "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js"
    );
    const db = getFirestore(window.app);
    const querySnapshot = await getDocs(collection(db, collectionName));
    // Return each id as "race" with its data
    return querySnapshot.docs.map((doc) => ({ race: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Error loading data from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Three.js layout helpers
 */
export function getWidth() {
  const el = document.getElementById("three-canvas");
  return el ? el.clientWidth : window.innerWidth;
}

export function getHeight() {
  const el = document.getElementById("three-canvas");
  return el ? el.clientHeight : window.innerHeight;
}

export function getAspect() {
  return getWidth() / getHeight();
}

/**
 * Creates mesh
 */
export function createTextMesh(text, options, onLoad) {
  const loader = new FontLoader();
  loader.load(options.fontUrl, (font) => {
    const geometry = new TextGeometry(text, {
      font: font,
      size: options.size || 0.5,
      height: options.height || 0.1,
    });
    const material =
      options.material || new THREE.MeshBasicMaterial({ color: 0xffffff });
    const mesh = new THREE.Mesh(geometry, material);
    onLoad(mesh);
  });
}
