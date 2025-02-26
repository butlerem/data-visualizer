import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

export function TechDiversityGender() {
  const self = this;
  self.name = "Tech Gender Diversity 3D";
  self.id = "tech-diversity-gender-3d";
  self.title = "Tech Diversity by Gender Percentage";
  self.loaded = false;
  self.data = [];

  // Stats to be displayed in the stats panel
  self.stats = [
    { icon: "female", value: "30%", label: "Female Representation" },
    { icon: "male", value: "70%", label: "Male Representation" },
    { icon: "groups", value: "85%", label: "Overall Diversity Index" },
  ];

  // Three.js variables
  let scene, camera, renderer, controls, barsGroup;

  // Chart config
  const barWidth = 0.5;
  const barDepth = 0.6;
  const gapBetweenBars = 0.1;
  const gapBetweenCompanies = 1.3;
  const scaleFactor = 0.1;

  const femaleColor = 0xab52d5;
  const maleColor = 0x84d7d9;

  // Preload: load Firestore docs
  this.preload = function () {
    import("https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js")
      .then(({ getFirestore, collection, getDocs }) => {
        const db = getFirestore(window.app); // Ensure window.app is your Firebase app
        return getDocs(collection(db, "tech_diversity_gender"));
      })
      .then((querySnapshot) => {
        // Convert docs to a JS array
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

  // Setup: hide p5 canvas, show three.js container, init scene
  this.setup = function () {
    // If data not loaded or empty, skip
    if (!self.loaded || !self.data.length) {
      console.log("TechDiversityGender3D: no data loaded yet.");
      return;
    }

    // Hide p5 #canvas
    const p5CanvasDiv = document.getElementById("canvas");
    if (p5CanvasDiv) {
      p5CanvasDiv.style.display = "none";
    }

    // Show #three-canvas
    const threeCanvasDiv = document.getElementById("three-canvas");
    if (threeCanvasDiv) {
      threeCanvasDiv.style.display = "block";
    }

    // Init Three.js
    // Build bars & labels
    // Start the render loop
    initThree();
    createBars();
    createAxisLabels();
    animate();
  };

  // Draw: p5 calls this, but we do nothing in Three.js
  this.draw = function () {
    // Empty. We rely on Three.js's animate() with requestAnimationFrame.
  };

  // 4) DESTROY: revert to p5, remove Three.js DOM
  this.destroy = function () {
    // Hide Three.js
    const threeCanvasDiv = document.getElementById("three-canvas");
    if (threeCanvasDiv) {
      threeCanvasDiv.style.display = "none";
    }
    // Show p5 canvas
    const p5CanvasDiv = document.getElementById("canvas");
    if (p5CanvasDiv) {
      p5CanvasDiv.style.display = "block";
    }
    // Remove Three.js canvas
    if (renderer && renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  };

  // --- THREE.JS INIT ---
  function initThree() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color("#3A3E44");

    camera = new THREE.PerspectiveCamera(75, getAspect(), 0.1, 1000);
    camera.position.set(-25, 10, 0);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(getWidth(), getHeight());

    const threeCanvasDiv = document.getElementById("three-canvas");
    if (threeCanvasDiv) {
      threeCanvasDiv.appendChild(renderer.domElement);
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Compute grid size from this.data length
    let numCompanies = self.data.length;
    let gridSize = (numCompanies - 1) * gapBetweenCompanies + 2; // a bit of padding

    // Add a grid helper
    const gridHelper = new THREE.GridHelper(gridSize, numCompanies);
    scene.add(gridHelper);

    // Group to hold bars
    barsGroup = new THREE.Group();
    scene.add(barsGroup);

    // OrbitControls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;

    window.addEventListener("resize", onWindowResize);
  }

  // Create Bars
  function createBars() {
    let numCompanies = self.data.length;
    let offsetZ = ((numCompanies - 1) * gapBetweenCompanies) / 2; // center them

    for (let i = 0; i < numCompanies; i++) {
      const doc = self.data[i];

      // Convert from strings to numbers (if needed)
      let femaleVal = parseFloat(doc.female) || 0;
      let maleVal = parseFloat(doc.male) || 0;

      // A group for each company's bars
      const companyGroup = new THREE.Group();

      // -- Female Bar --
      let femaleHeight = femaleVal * scaleFactor;
      let femaleGeom = new THREE.BoxGeometry(barWidth, femaleHeight, barDepth);
      let femaleMat = new THREE.MeshStandardMaterial({ color: femaleColor });
      let femaleBar = new THREE.Mesh(femaleGeom, femaleMat);
      femaleBar.position.y = femaleHeight / 2; // center it
      femaleBar.position.x = -(barWidth / 2 + gapBetweenBars / 2);
      companyGroup.add(femaleBar);

      // -- Male Bar --
      let maleHeight = maleVal * scaleFactor;
      let maleGeom = new THREE.BoxGeometry(barWidth, maleHeight, barDepth);
      let maleMat = new THREE.MeshStandardMaterial({ color: maleColor });
      let maleBar = new THREE.Mesh(maleGeom, maleMat);
      maleBar.position.y = maleHeight / 2;
      maleBar.position.x = barWidth / 2 + gapBetweenBars / 2;
      companyGroup.add(maleBar);

      // Position this company's group along Z
      companyGroup.position.z = -i * gapBetweenCompanies + offsetZ;

      barsGroup.add(companyGroup);
    }
  }
  // Create Axis Labels
  function createAxisLabels() {
    const loader = new FontLoader();
    loader.load(
      "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
      function (font) {
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

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
      }
    );
  }

  function addYAxisTicks(font) {
    const tickMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const tickTextMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const maxPercentage = 100;
    const numTicks = 5; // e.g., 0%, 20%, 40%, 60%, 80%, 100%
    const tickSpacing = (maxPercentage * scaleFactor) / numTicks;

    for (let i = 0; i <= numTicks; i++) {
      let yValue = i * (maxPercentage / numTicks); // e.g. 0, 20, 40, 60, 80, 100
      let yPos = i * tickSpacing;

      // A small line segment for the tick mark
      const tickGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, yPos, -20),
        new THREE.Vector3(-0.5, yPos, -20),
      ]);
      const tick = new THREE.Line(tickGeometry, tickMaterial);
      scene.add(tick);

      // The tick label (text)
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

  // X-Axis: Display each company's name near its bars
  function addCompanyLabels(font) {
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    let numCompanies = self.data.length;
    let offsetZ = ((numCompanies - 1) * gapBetweenCompanies) / 2;

    for (let i = 0; i < numCompanies; i++) {
      let companyName = self.data[i].company || "Unknown";

      const labelGeometry = new TextGeometry(companyName, {
        font: font,
        size: 0.5,
        height: 0.05,
      });
      const label = new THREE.Mesh(labelGeometry, textMaterial);

      // Position the label near the bars
      label.position.set(0, -1, -i * gapBetweenCompanies + offsetZ);
      label.rotation.set(0, (3 * Math.PI) / 2, -Math.PI / 2);

      scene.add(label);
    }
  }

  // animate: main Three.js loop

  function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  // onWindowResize

  function onWindowResize() {
    camera.aspect = getAspect();
    camera.updateProjectionMatrix();
    renderer.setSize(getWidth(), getHeight());
  }

  // Helper: #three-canvas dims
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
