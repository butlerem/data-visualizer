import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
// import { PieChart } from "./pie-chart.js"; // not used in this 3D code

export function TechDiversityRace3D() {
  const self = this;

  self.name = "Tech Race Diversity 3D";
  self.id = "tech-diversity-race-3d";
  self.title = "Tech Diversity by Race (3D)";

  // We'll store Firestore docs in "raceDocs" and the inverted data in "dataByCompany"
  self.raceDocs = [];
  self.dataByCompany = [];
  self.loaded = false;

  // Three.js variables
  let scene, camera, renderer, controls, raceGroup;

  // Colors for slices
  const raceColors = [0xab52d5, 0x84d7d9, 0x2a9d8f, 0x4f9df7, 0xf4a261];

  // ------------------------------------------------
  // 1) PRELOAD: load docs from Firestore
  // ------------------------------------------------
  this.preload = function () {
    // USE A REAL URL OR RELATIVE PATH HERE:
    import("https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js")
      .then(({ getFirestore, collection, getDocs }) => {
        const db = getFirestore(window.app);
        return getDocs(collection(db, "tech_diversity_race"));
      })
      .then((querySnapshot) => {
        self.raceDocs = [];
        querySnapshot.forEach((doc) => {
          console.log("Doc ID:", doc.id, " => ", doc.data());
          self.raceDocs.push({ race: doc.id, ...doc.data() });
        });
        console.log("Raw raceDocs array:", self.raceDocs);

        self.dataByCompany = invertData(self.raceDocs);
        console.log("Final dataByCompany array:", self.dataByCompany);

        self.loaded = true;
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

    // For demonstration, pick the first company
    let firstCompanyData = self.dataByCompany[0];
    if (!firstCompanyData) {
      console.log("No company found in dataByCompany.");
      return;
    }
    createRacePie3D(firstCompanyData);

    // Start Three.js loop
    animate();

    // -------------- NEW: Listen for dropdown changes --------------
    this.dropdown.changed(() => {
      // 1) Read which company is selected
      const index = parseInt(this.dropdown.value(), 10);
      const chosenCompany = this.companyNames[index];
      let obj = self.dataByCompany.find((d) => d.company === chosenCompany);
      if (!obj) return;

      // 2) Remove the old 3D pie slices from the scene
      scene.remove(raceGroup);

      // 3) Build a new pie for the newly selected company
      createRacePie3D(obj);
    });
  };

  // ------------------------------------------------
  // 3) DESTROY: revert to p5, remove three.js DOM
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
  };

  // ------------------------------------------------
  // 4) DRAW: p5 calls this each frame, but we do nothing
  // ------------------------------------------------
  this.draw = function () {
    // We could do the updating logic here, but
    // we have a changed() listener instead.
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
    camera.position.set(-10, 10, 0);
    camera.lookAt(0, 0, 0);

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
    // Remove old group if it exists (already done in the dropdown.changed callback)
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
