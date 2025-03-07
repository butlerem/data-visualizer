import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { fetchData } from "./helper-functions.js";

export function TechDiversityGender() {
  // Public properties
  const self = this;
  self.name = "Tech Gender Diversity";
  self.id = "tech-diversity-gender-3d";
  self.title = "Tech Diversity by Gender Percentage";
  this.collectionName = "tech_diversity_gender";
  self.loaded = false;
  self.data = [];

  // Stats to be displayed in the stats panel
  self.stats = [
    { icon: "female", value: "23%", label: "Average Female Representation" },
    { icon: "male", value: "77%", label: "Average Male Representation" },
    { icon: "groups", value: "49%", label: "Highest Female Representation" },
  ];

  // Three.js variables
  let scene, camera, renderer, controls, barsGroup;

  // Chart configuration
  const barWidth = 0.5;
  const barDepth = 0.6;
  const gapBetweenBars = 0.1;
  const gapBetweenCompanies = 1.3;
  const scaleFactor = 0.1;

  const femaleColor = 0xab52d5;
  const maleColor = 0x84d7d9;

  // Preload data from Firestore
  this.preload = function () {
    fetchData("tech_diversity_gender")
      .then((data) => {
        self.data = data;
        self.loaded = true;
        console.log("Tech Diversity Gender data loaded");
      })
      .catch((error) => {
        console.error("Error loading Tech Diversity Gender data:", error);
      });
  };

  // Setup: hide p5 canvas, show Three.js canvas
  this.setup = function () {
    // If data not loaded, skip
    if (!self.loaded || !self.data.length) {
      console.log("TechDiversityGender3D: no data loaded yet");
      return;
    }

    // Hide p5 canvas
    const p5CanvasDiv = document.getElementById("canvas");
    if (p5CanvasDiv) {
      p5CanvasDiv.style.display = "none";
    }

    // Show Three.js canvas
    const threeCanvasDiv = document.getElementById("three-canvas");
    if (threeCanvasDiv) {
      threeCanvasDiv.style.display = "block";
    }

    // Initialize Three.js and build chart
    initThree();
    createBars();
    createAxisLabels(); // Axis labels and company labels will be added
    animate();
  };

  // Draw is called by p5 but Three.js handles its own loop
  this.draw = function () {};

  // Destroy: revert to p5 and remove Three.js DOM elements
  this.destroy = function () {
    // Hide Three.js container
    const threeCanvasDiv = document.getElementById("three-canvas");
    if (threeCanvasDiv) {
      threeCanvasDiv.style.display = "none";
    }
    renderer.domElement.parentNode.removeChild(renderer.domElement);
    // Show p5 canvas
    const p5CanvasDiv = document.getElementById("canvas");
    if (p5CanvasDiv) {
      p5CanvasDiv.style.display = "block";
    }
  };

  // Initialize Three.js scene, camera, render, lights, grid, controls
  function initThree() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color("0xfff");
    camera = new THREE.PerspectiveCamera(75, getAspect(), 0.1, 1000);
    camera.position.set(-20, 10, 0);
    camera.lookAt(0, 0, 0);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(getWidth(), getHeight());

    const threeCanvasDiv = document.getElementById("three-canvas");
    if (threeCanvasDiv) {
      threeCanvasDiv.appendChild(renderer.domElement);
    }

    // Add light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    /* Add a grid helper - Not needed right now for this chart

    // Compute grid size from data length
    let numCompanies = self.data.length;
    let gridSize = (numCompanies - 1) * gapBetweenCompanies + 2;

    const gridHelper = new THREE.GridHelper(
      gridSize,
      numCompanies,
      0xa9b5c6,
      0xa9b5c6
    );
    scene.add(gridHelper); */

    // Group to hold bars
    barsGroup = new THREE.Group();
    scene.add(barsGroup);

    // Set up orbit controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
  }

  // Create bars for each company data
  function createBars() {
    let numCompanies = self.data.length;
    let offsetZ = ((numCompanies - 1) * gapBetweenCompanies) / 2;

    for (let i = 0; i < numCompanies; i++) {
      const doc = self.data[i];
      // Convert values to numbers
      let femaleVal = parseFloat(doc.female) || 0;
      let maleVal = parseFloat(doc.male) || 0;

      // Create a group for the company's bars
      const companyGroup = new THREE.Group();

      // Female bar
      let femaleHeight = femaleVal * scaleFactor;
      let femaleGeo = new THREE.BoxGeometry(barWidth, femaleHeight, barDepth);
      let femaleMat = new THREE.MeshStandardMaterial({ color: femaleColor });
      let femaleBar = new THREE.Mesh(femaleGeo, femaleMat);
      femaleBar.position.y = femaleHeight / 2;
      femaleBar.position.x = -(barWidth / 2 + gapBetweenBars / 2);
      companyGroup.add(femaleBar);

      // Male bar
      let maleHeight = maleVal * scaleFactor;
      let maleGeom = new THREE.BoxGeometry(barWidth, maleHeight, barDepth);
      let maleMat = new THREE.MeshStandardMaterial({ color: maleColor });
      let maleBar = new THREE.Mesh(maleGeom, maleMat);
      maleBar.position.y = maleHeight / 2;
      maleBar.position.x = barWidth / 2 + gapBetweenBars / 2;
      companyGroup.add(maleBar);

      // Position the company group along the Z-axis
      companyGroup.position.z = -i * gapBetweenCompanies + offsetZ;

      barsGroup.add(companyGroup);
    }
  }

  // Create axis labels and company labels
  function createAxisLabels() {
    const loader = new FontLoader();
    loader.load(
      "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
      function (font) {
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xa9b5c6 });

        // Y-axis label
        const yAxisLabelGeo = new TextGeometry("Male and Female (%)", {
          font: font,
          size: 0.5,
          height: 0.1,
        });
        const yAxisLabel = new THREE.Mesh(yAxisLabelGeo, textMaterial);
        yAxisLabel.position.set(0, 1, -22);
        yAxisLabel.rotation.set(0, (3 * Math.PI) / 2, Math.PI / 2);
        scene.add(yAxisLabel);

        // X-axis label
        const xAxisLabelGeo = new TextGeometry("Company", {
          font: font,
          size: 0.5,
          height: 0.1,
        });
        const xAxisLabel = new THREE.Mesh(xAxisLabelGeo, textMaterial);
        xAxisLabel.position.set(0, -7, 0);
        xAxisLabel.rotation.set(0, (3 * Math.PI) / 2, 0);
        scene.add(xAxisLabel);

        addCompanyLabels(font);
        addYAxisTicks(font);

        // TODO -- add a legend for color coding
      }
    );
  }

  // Add Y-axis tick marks and labels
  function addYAxisTicks(font) {
    const tickMaterial = new THREE.LineBasicMaterial({ color: 0xa9b5c6 });
    const tickTextMaterial = new THREE.MeshBasicMaterial({ color: 0xa9b5c6 });

    const maxPercentage = 100;
    const numTicks = 5; // e.g. 0%, 20%, 40%, 60%, 80%, 100%
    const tickSpacing = (maxPercentage * scaleFactor) / numTicks;

    for (let i = 0; i <= numTicks; i++) {
      let yValue = i * (maxPercentage / numTicks); // e.g. 0, 20, 40, 60, 80, 100
      let yPos = i * tickSpacing;

      // Create a small line segment as a tick mark
      const tickGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, yPos, -20),
        new THREE.Vector3(-0.5, yPos, -20),
      ]);
      const tick = new THREE.Line(tickGeometry, tickMaterial);
      scene.add(tick);

      // Create tick label text
      const tickLabelGeo = new TextGeometry(yValue.toFixed(0), {
        font: font,
        size: 0.5,
        height: 0.05,
      });
      const tickLabel = new THREE.Mesh(tickLabelGeo, tickTextMaterial);
      tickLabel.position.set(0, yPos - 0.3, -20);
      tickLabel.rotation.set(0, (3 * Math.PI) / 2, Math.PI / 2);
      scene.add(tickLabel);
    }
  }

  // Add company labels
  function addCompanyLabels(font) {
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xa9b5c6 });
    let numCompanies = self.data.length;
    let offsetZ = ((numCompanies - 1) * gapBetweenCompanies) / 2;

    for (let i = 0; i < numCompanies; i++) {
      let companyName = self.data[i].company || "Unknown";
      const labelGeometry = new TextGeometry(companyName, {
        font: font,
        size: 0.6,
        height: 0.06,
      });
      const label = new THREE.Mesh(labelGeometry, textMaterial);
      label.position.set(0, -1, -i * gapBetweenCompanies + offsetZ);
      label.rotation.set(0, (3 * Math.PI) / 2, -Math.PI / 2);
      scene.add(label);
    }
  }

  // Update controls and render the scene
  function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  // Get container width and height
  function getWidth() {
    const el = document.getElementById("three-canvas");
    return el ? el.clientWidth : window.innerWidth;
  }

  function getHeight() {
    const el = document.getElementById("three-canvas");
    return el ? el.clientHeight : window.innerHeight;
  }

  // Compute aspect ratio
  function getAspect() {
    return getWidth() / getHeight();
  }
}
