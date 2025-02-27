import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { fetchData } from "./helper-functions.js";

export function TechDiversityRace() {
  // Public properties
  const self = this;
  self.name = "Tech Race Diversity";
  self.id = "tech-diversity-race";
  self.title = "Tech Diversity by Race";

  // We'll store Firestore docs in "raceDocs" and the inverted data in "dataByCompany"
  self.raceDocs = [];
  self.dataByCompany = [];
  self.loaded = false;

  self.stats = [
    { icon: "groups", value: "50%", label: "White Representation" },
    { icon: "groups", value: "25%", label: "Black Representation" },
    { icon: "groups", value: "25%", label: "Other Representation" },
  ];

  // Three.js variables
  let scene, camera, renderer, controls, raceGroup, legend3DGroup;

  // Colors for slices (as hex numbers)
  const raceColors = [0xab52d5, 0x84d7d9, 0x2a9d8f, 0x4f9df7, 0xf4a261];

  // ------------------------------------------------
  // 1) PRELOAD: load docs from Firestore
  // ------------------------------------------------
  this.preload = function () {
    import("https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js")
      .then(({ getFirestore, collection, getDocs }) => {
        const db = getFirestore(window.app);
        return getDocs(collection(db, "tech_diversity_race"));
      })
      .then((querySnapshot) => {
        self.raceDocs = [];
        querySnapshot.forEach((doc) => {
          self.raceDocs.push({ race: doc.id, ...doc.data() });
        });
        self.dataByCompany = invertData(self.raceDocs);
        self.loaded = true;
        console.log("Tech Diversity Race data loaded");
      })
      .catch((error) => {
        console.error("Error loading TechDiversityRace3D data:", error);
      });
  };

  // ------------------------------------------------
  // 2) SETUP: hide p5 canvas, show #three-canvas, etc.
  // ------------------------------------------------
  this.setup = function () {
    if (!self.loaded || !self.dataByCompany.length) {
      console.log("TechDiversityRace3D: no data yet in setup.");
      return;
    }
    // If we already created our dropdown, skip re-creating
    if (this.dropdown) return;

    // Build an array of company names
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
    // Attach to an existing element with id="sliders", or wherever you want:
    this.dropdown.parent("sliders");
    this.dropdown.class("menu-item");

    // Populate the dropdown with all companies
    for (let i = 0; i < this.companyNames.length; i++) {
      this.dropdown.option(this.companyNames[i], i);
    }
    // Default to the first company
    this.dropdown.selected("0");

    // Hide p5 #canvas
    const p5CanvasDiv = document.getElementById("canvas");
    if (p5CanvasDiv) p5CanvasDiv.style.display = "none";

    // Show #three-canvas
    const threeCanvasDiv = document.getElementById("three-canvas");
    if (threeCanvasDiv) threeCanvasDiv.style.display = "block";

    initThree();

    // Create the 3D legend (added into the scene)
    createLegend3D();

    // For demonstration, pick the first company
    let firstCompanyData = self.dataByCompany[0];
    if (!firstCompanyData) {
      console.log("No company found in dataByCompany.");
      return;
    }
    createRacePie3D(firstCompanyData);

    // Start Three.js loop
    animate();

    // Listen for dropdown changes
    this.dropdown.changed(() => {
      // 1) Retrieve the selected company index and name.
      const index = parseInt(self.dropdown.value(), 10);
      const chosenCompany = self.companyNames[index];

      // 2) Update the title property to include the company name.
      self.title = `Tech Diversity by Race (3D) at ${chosenCompany}`;

      // 3) Update the HTML element with id "visual-title"
      let titleEl = select("#visual-title");
      if (titleEl) {
        titleEl.html(self.title);
      }

      // 4) Update the 3D visualization: remove old slices and create a new pie.
      let obj = self.dataByCompany.find((d) => d.company === chosenCompany);
      if (!obj) return;
      scene.remove(raceGroup);
      createRacePie3D(obj);
    });
  };

  // ------------------------------------------------
  // 3) DESTROY: revert to p5, remove three.js DOM, and remove legend
  // ------------------------------------------------
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

  // ------------------------------------------------
  // 4) DRAW: p5 calls this each frame, but we do nothing here
  // ------------------------------------------------
  this.draw = function () {
    // No drawing code here; updates are handled via the Three.js animation loop.
  };

  // ------------------------------------------------
  // invertData(raceDocs): from "by race" to "by company"
  // ------------------------------------------------
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

  // ------------------------------------------------
  // initThree(): set up scene, camera, lights, controls
  // ------------------------------------------------
  function initThree() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color("#3A3E44");

    camera = new THREE.PerspectiveCamera(75, getAspect(), 0.1, 1000);
    // Move the camera to a position that gives a good view of the legend
    camera.position.set(6, 12, 10);
    // Make the camera look at the legend (adjust these values as needed)
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

    window.addEventListener("resize", onWindowResize);
  }

  // ------------------------------------------------
  // createRacePie3D(companyObj) - build an extruded arc for each race
  // ------------------------------------------------
  function createRacePie3D(companyObj) {
    // Remove old group if it exists
    if (raceGroup) {
      scene.remove(raceGroup);
    }

    raceGroup = new THREE.Group();
    scene.add(raceGroup);

    // Adjust these to match your doc fields
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

  // ------------------------------------------------
  // createLegend3D(): builds a 3D legend using planes for swatches and TextGeometry for labels
  // ------------------------------------------------
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
        const legendSpacing = 1.2; // vertical spacing between legend entries

        for (let i = 0; i < categories.length; i++) {
          // Create a swatch using a PlaneGeometry
          const swatchGeom = new THREE.PlaneGeometry(0.5, 0.5);
          const swatchMat = new THREE.MeshBasicMaterial({
            color: raceColorsHex[i],
          });
          const swatchMesh = new THREE.Mesh(swatchGeom, swatchMat);
          swatchMesh.position.set(0, -i * legendSpacing, 0);
          legend3DGroup.add(swatchMesh);

          // Create text geometry for the label
          const textGeom = new TextGeometry(categories[i], {
            font: font,
            size: 0.3,
            height: 0.05,
          });
          const textMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

          const textMesh = new THREE.Mesh(textGeom, textMat);
          // Position the text to the right of the swatch
          textMesh.position.set(0.6, -i * legendSpacing - 0.2, 0);
          legend3DGroup.add(textMesh);
        }
      }
    );
    // Position the legend group in the scene (adjust as needed)
    legend3DGroup.position.set(7, 4, -5);

    scene.add(legend3DGroup);
  }

  // ------------------------------------------------
  // animate: standard Three.js loop
  // ------------------------------------------------
  function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  // ------------------------------------------------
  // onWindowResize
  // ------------------------------------------------
  function onWindowResize() {
    camera.aspect = getAspect();
    camera.updateProjectionMatrix();
    renderer.setSize(getWidth(), getHeight());
  }

  // Helpers for #three-canvas size
  function getWidth() {
    const el = document.getElementById("three-canvas");
    return el ? el.clientWidth : window.innerWidth;
  }
  function getHeight() {
    const el = document.getElementById("three-canvas");
    return el ? el.clientHeight : window.innerHeight;
  }
  function getAspect() {
    return getWidth() / getHeight();
  }
}
