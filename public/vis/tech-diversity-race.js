import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import {
  fetchData,
  getAspect,
  getHeight,
  getWidth,
} from "../helper-functions.js";

export function TechDiversityRace() {
  // Public properties
  const self = this;
  self.name = "Tech Race Diversity";
  self.id = "tech-diversity-race";
  self.title = "Tech Diversity by Race";
  this.collectionName = "tech_diversity_race";

  // Firestore docs stored in raceDocs
  self.raceDocs = [];
  self.dataByCompany = [];
  self.loaded = false;

  self.stats = [
    { icon: "groups", value: "52%", label: "Average White Representation" },
    { icon: "groups", value: "7%", label: "Average Black Representation" },
    { icon: "groups", value: "3%", label: "Average Other Representation" },
  ];

  // Three.js variables
  let scene, camera, renderer, controls, raceGroup, legend3DGroup;

  // Helpers for canvas dimensions
  const width = getWidth();
  const height = getHeight();
  const aspect = getAspect();

  // Colors for slices (hex values)
  const raceColors = [0xab52d5, 0x84d7d9, 0x2a9d8f, 0x4f9df7, 0xf4a261];

  // Preload data from Firestore
  this.preload = async function () {
    try {
      const data = await fetchData("tech_diversity_race");
      self.raceDocs = data;
      self.dataByCompany = invertData(self.raceDocs);
      self.loaded = true;
      console.log("Tech Diversity Race data loaded");
    } catch (error) {
      console.error("Error loading TechDiversityRace3D data:", error);
    }
  };

  /**
   * Setup the visualization: hides the p5 canvas, shows the Three.js canvas
   */
  this.setup = function () {
    if (!self.loaded || !self.dataByCompany.length) {
      console.log("TechDiversityRace3D: no data yet in setup");
      return;
    }
    // If dropdown already exists, skip re-creating
    if (this.dropdown) return;

    // Build array of company names
    this.companyNames = [];
    if (self.dataByCompany && self.dataByCompany.length) {
      this.companyNames = self.dataByCompany
        .map((d) => d.company)
        .filter(Boolean);
    }

    // Create a dropdown (select)
    this.dropdown = createSelect();
    // Assign an ID
    this.dropdown.id("company-dropdown");
    // Attach to element with id="sliders" or as needed
    this.dropdown.parent("sliders");
    this.dropdown.class("menu-item");

    // Populate dropdown with companies
    for (let i = 0; i < this.companyNames.length; i++) {
      this.dropdown.option(this.companyNames[i], i);
    }
    // Default to first company
    this.dropdown.selected("0");

    // Hide p5 canvas
    const p5CanvasDiv = document.getElementById("canvas");
    if (p5CanvasDiv) p5CanvasDiv.style.display = "none";

    // Show Three.js canvas
    const threeCanvasDiv = document.getElementById("three-canvas");
    if (threeCanvasDiv) threeCanvasDiv.style.display = "block";

    // Draw: empty function for Three.js but required to prevent errors
    this.draw = function () {};

    initThree();

    // Create the 3D legend
    createLegend3D();

    // Pick the first company
    let firstCompanyData = self.dataByCompany[0];
    if (!firstCompanyData) {
      console.log("No company found in dataByCompany");
      return;
    }
    createRacePie3D(firstCompanyData);

    // Start loop
    animate();

    // Listen for dropdown changes
    this.dropdown.changed(() => {
      // Retrieve selected company index and name
      const index = parseInt(self.dropdown.value(), 10);
      const chosenCompany = self.companyNames[index];

      // Update title to include company name
      self.title = `Tech Diversity by Race (3D) at ${chosenCompany}`;

      // Update HTML element with id "visual-title"
      let titleEl = select("#visual-title");
      if (titleEl) {
        titleEl.html(self.title);
      }

      // Update 3D visualization: remove old slices and create new pie
      let obj = self.dataByCompany.find((d) => d.company === chosenCompany);
      if (!obj) return;
      scene.remove(raceGroup);
      createRacePie3D(obj);
    });
  };

  // Cleanup when destroyed
  this.destroy = function () {
    if (this.dropdown) {
      this.dropdown.remove();
      this.dropdown = null;
    }
    const threeCanvasDiv = document.getElementById("three-canvas");
    if (threeCanvasDiv) {
      threeCanvasDiv.style.display = "none";
    }
    const p5CanvasDiv = document.getElementById("canvas");
    if (p5CanvasDiv) {
      p5CanvasDiv.style.display = "block";
    }
    if (renderer && renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    // Remove 3D legend group if it exists
    if (legend3DGroup) {
      scene.remove(legend3DGroup);
      legend3DGroup = null;
    }
  };

  /**
  // invertData(raceDocs): from by race to by company
   */
  function invertData(raceDocs) {
    let companiesMap = {};
    raceDocs.forEach((doc) => {
      const raceName = doc.race;
      Object.entries(doc).forEach(([key, val]) => {
        if (key === "race") return;
        let numVal = parseFloat(val) || 0;
        if (!companiesMap[key]) {
          companiesMap[key] = { company: key };
        }
        companiesMap[key][raceName] = numVal;
      });
    });
    return Object.values(companiesMap);
  }

  /** 
  // initThree(): set up scene, camera, lights, controls
   */
  function initThree() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color("#ffffff");

    camera = new THREE.PerspectiveCamera(75, getAspect(), 0.1, 1000);
    // Position camera for a good view of the legend
    camera.position.set(2, 10, 10);
    // Make camera look at the legend (adjust values as needed)
    camera.lookAt(new THREE.Vector3(8, 7, 7));

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(getWidth(), getHeight());
    const threeCanvasDiv = document.getElementById("three-canvas");
    if (threeCanvasDiv) {
      threeCanvasDiv.appendChild(renderer.domElement);
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
  }

  /**
  // createRacePie3D(companyObj): build arc for each race slice
   */
  function createRacePie3D(companyObj) {
    // Remove old group if it exists
    if (raceGroup) {
      scene.remove(raceGroup);
    }
    raceGroup = new THREE.Group();
    scene.add(raceGroup);

    // match document fields
    let categories = ["white", "black", "asian", "latino", "other"];
    let values = categories.map((cat) => companyObj[cat] || 0);
    let total = values.reduce((a, b) => a + b, 0);

    let startAngle = 0;
    const radius = 5;
    const height = 1;

    values.forEach((val, index) => {
      const proportion = total > 0 ? val / total : 0;
      if (proportion <= 0) return;

      const angle = proportion * Math.PI * 2;
      const color = raceColors[index % raceColors.length];

      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.absarc(0, 0, radius, startAngle, startAngle + angle, false);
      shape.lineTo(0, 0);

      const extrudeSettings = { depth: height, bevelEnabled: false };
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      const material = new THREE.MeshStandardMaterial({
        color,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      raceGroup.add(mesh);

      startAngle += angle;
    });
  }

  /**
  // createLegend3D(): builds 3D legend with swatches and labels
   */
  function createLegend3D() {
    legend3DGroup = new THREE.Group();

    // Load a font to create 3D text
    const loader = new FontLoader();
    loader.load(
      "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
      function (font) {
        const categories = ["White", "Black", "Asian", "Latino", "Other"];
        const raceColorsHex = [
          "#ab52d5",
          "#84d7d9",
          "#2a9d8f",
          "#4f9df7",
          "#f4a261",
        ];
        const legendSpacing = 1.2; // Vertical spacing between legend entries

        for (let i = 0; i < categories.length; i++) {
          // Create a swatch using a PlaneGeometry
          const swatchGeom = new THREE.PlaneGeometry(0.5, 0.5);
          const swatchMat = new THREE.MeshBasicMaterial({
            color: raceColorsHex[i],
          });
          const swatchMesh = new THREE.Mesh(swatchGeom, swatchMat);
          swatchMesh.position.set(0, -i * legendSpacing, 0);
          legend3DGroup.add(swatchMesh);

          // Text geometry for the label
          const textGeom = new TextGeometry(categories[i], {
            font: font,
            size: 0.3,
            height: 0.05,
          });
          const textMat = new THREE.MeshBasicMaterial({ color: 0xa9b5c6 });
          const textMesh = new THREE.Mesh(textGeom, textMat);
          // Position text to the right of the swatch
          textMesh.position.set(0.6, -i * legendSpacing - 0.2, 0);
          legend3DGroup.add(textMesh);
        }
      }
    );
    // Position legend group in scene
    legend3DGroup.position.set(7, 4, -5);
    scene.add(legend3DGroup);
  }

  // Update controls and render the scene!
  function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }
}
