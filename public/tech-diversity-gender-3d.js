import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

export function TechDiversityGender3D() {
  const self = this;

  self.name = "Tech Diversity: Gender";
  self.id = "tech-diversity-gender-3d";
  self.title = "Tech Diversity by Gender Percentage";
  self.loaded = false; // We'll set this to true after data loads.

  let scene, camera, renderer, controls, barsGroup;
  let dataTable;

  // Chart configuration parameters
  const barWidth = 0.5;
  const barDepth = 0.6;
  const gapBetweenBars = 0.1;
  const gapBetweenCompanies = 1.3;
  const scaleFactor = 0.1;

  const femaleColor = 0xf2b5a0;
  const maleColor = 0x8fbcbb;

  // 1) preload() => Loads data using p5's loadTable().
  self.preload = function () {
    dataTable = loadTable(
      "./data/tech-diversity/gender-2018.csv",
      "csv",
      "header",
      () => {
        self.loaded = true;
      }
    );
  };

  self.setup = function () {
    // Hide the p5 container.
    const p5CanvasDiv = document.getElementById("canvas");
    if (p5CanvasDiv) {
      p5CanvasDiv.style.display = "none";
    }

    // Show the three.js container.
    const threeCanvasDiv = document.getElementById("three-canvas");
    if (threeCanvasDiv) {
      threeCanvasDiv.style.display = "block";
    }

    // Initialize our three.js scene and build the bars.
    initThree();
    createBars();
    createAxisLabels();
    animate();
  };

  self.draw = function () {};

  // 4) destroy() => Called when the user switches visuals in the gallery.
  //    We hide #three-canvas, show #canvas, and remove the three.js canvas.
  self.destroy = function () {
    const threeCanvasDiv = document.getElementById("three-canvas");
    if (threeCanvasDiv) {
      threeCanvasDiv.style.display = "none";
    }

    const p5CanvasDiv = document.getElementById("canvas");
    if (p5CanvasDiv) {
      p5CanvasDiv.style.display = "block";
    }

    // Remove the three.js canvas from the DOM so it doesn't accumulate.
    if (renderer && renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  };

  function initThree() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);

    // Camera Setuo
    camera = new THREE.PerspectiveCamera(75, getAspect(), 0.1, 1000);
    camera.position.set(-25, 10, 0);
    camera.lookAt(0, 0, 0);

    // Renderer Setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(getWidth(), getHeight());

    const threeCanvasDiv = document.getElementById("three-canvas");
    if (threeCanvasDiv) {
      threeCanvasDiv.appendChild(renderer.domElement);
    }

    // Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // **Dynamically Calculate Grid Size Based on Dataset**
    const numCompanies = dataTable.getRowCount();
    const gridSize = (numCompanies - 1) * gapBetweenCompanies + 2; // +2 for padding

    // **Updated GridHelper**
    const gridHelper = new THREE.GridHelper(gridSize, numCompanies);
    scene.add(gridHelper);

    // Group to hold all the bars
    barsGroup = new THREE.Group();
    scene.add(barsGroup);

    // Orbit Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;

    // Handle window resizing
    window.addEventListener("resize", onWindowResize);
  }

  function createBars() {
    const numCompanies = dataTable.getRowCount();
    const offsetZ = ((numCompanies - 1) * gapBetweenCompanies) / 2; // Center the bars

    // Build bar groups from CSV rows
    for (let i = 0; i < numCompanies; i++) {
      const row = dataTable.getRow(i);
      const femaleVal = parseFloat(row.getString("female"));
      const maleVal = parseFloat(row.getString("male"));

      const companyGroup = new THREE.Group();

      // **Female bar**
      const femaleHeight = femaleVal * scaleFactor;
      const femaleGeom = new THREE.BoxGeometry(
        barWidth,
        femaleHeight,
        barDepth
      );
      const femaleMat = new THREE.MeshStandardMaterial({ color: femaleColor });
      const femaleBar = new THREE.Mesh(femaleGeom, femaleMat);
      femaleBar.position.y = femaleHeight / 2; // Center on Y-axis
      femaleBar.position.x = -(barWidth / 2 + gapBetweenBars / 2);
      companyGroup.add(femaleBar);

      // **Male bar**
      const maleHeight = maleVal * scaleFactor;
      const maleGeom = new THREE.BoxGeometry(barWidth, maleHeight, barDepth);
      const maleMat = new THREE.MeshStandardMaterial({ color: maleColor });
      const maleBar = new THREE.Mesh(maleGeom, maleMat);
      maleBar.position.y = maleHeight / 2;
      maleBar.position.x = barWidth / 2 + gapBetweenBars / 2;
      companyGroup.add(maleBar);

      // Position the entire company group
      companyGroup.position.z = -i * gapBetweenCompanies + offsetZ;
      barsGroup.add(companyGroup);
    }
  }

  function createAxisLabels() {
    const loader = new FontLoader();
    loader.load(
      "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
      function (font) {
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

        const yAxisLabelGeo = new TextGeometry("Male and Female (%)", {
          font: font,
          size: 0.5,
          height: 0.1,
        });
        const yAxisLabel = new THREE.Mesh(yAxisLabelGeo, textMaterial);

        yAxisLabel.position.set(0, 1, -22);
        yAxisLabel.rotation.set(0, (3 * Math.PI) / 2, Math.PI / 2);
        scene.add(yAxisLabel);

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
    const numTicks = 5; // 0%, 20%, 40%, 60%, 80%, 100%
    const tickSpacing = (maxPercentage * scaleFactor) / numTicks;

    for (let i = 0; i <= numTicks; i++) {
      const yValue = i * (maxPercentage / numTicks);
      const yPos = i * tickSpacing;

      const tickGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, yPos, -20),
        new THREE.Vector3(-0.5, yPos, -20),
      ]);
      const tick = new THREE.Line(tickGeometry, tickMaterial);
      scene.add(tick);

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

  function addCompanyLabels(font) {
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const numCompanies = dataTable.getRowCount();
    const offsetZ = ((numCompanies - 1) * gapBetweenCompanies) / 2;

    for (let i = 0; i < numCompanies; i++) {
      const companyName = dataTable.getString(i, "company");

      const labelGeometry = new TextGeometry(companyName, {
        font: font,
        size: 0.5,
        height: 0.05,
      });

      const label = new THREE.Mesh(labelGeometry, textMaterial);

      label.position.set(0, -1, -i * gapBetweenCompanies + offsetZ);

      label.rotation.set(0, (3 * Math.PI) / 2, -Math.PI / 2);

      scene.add(label);
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  function onWindowResize() {
    camera.aspect = getAspect();
    camera.updateProjectionMatrix();
    renderer.setSize(getWidth(), getHeight());
  }

  // Helpers to get the width/height of #three-canvas
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
