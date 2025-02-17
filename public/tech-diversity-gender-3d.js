// tech-diversity-gender-3d.js
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export function TechDiversityGender3D() {
  // Basic info for the gallery
  this.name = "Tech Diversity: Gender (3D)";
  this.id = "tech-diversity-gender-3d";
  this.title = "3D Tech Diversity by Gender Percentage";
  this.loaded = false; // We'll set this to true after data loads.

  // Three.js objects
  let scene, camera, renderer, controls, barsGroup;
  let dataTable; // p5 table for CSV data.

  // Chart configuration parameters
  const barWidth = 0.5;
  const barDepth = 0.6;
  const gapBetweenBars = 0.1;
  const gapBetweenCompanies = 1.3;
  const scaleFactor = 0.1;

  const femaleColor = 0x32788c; // p5's color(50,120,140)
  const maleColor = 0x46468c; // p5's color(70,70,140)

  // -------------------- p5 Lifecycle Methods --------------------

  // 1) preload() => Loads data using p5's loadTable().
  this.preload = function () {
    dataTable = loadTable(
      "./data/tech-diversity/gender-2018.csv",
      "csv",
      "header",
      () => {
        this.loaded = true;
      }
    );
  };

  // 2) setup() => Called once after preload() by the gallery.
  //    We hide #canvas and show #three-canvas, then init three.js.
  this.setup = function () {
    // Hide the p5 container.
    const p5CanvasDiv = document.getElementById("canvas");
    if (p5CanvasDiv) {
      p5CanvasDiv.style.display = "none";
    }

    // Show the three.js container.
    const threeCanvasDiv = document.getElementById("three-canvas");
    if (threeCanvasDiv) {
      threeCanvasDiv.style.display = "block";
      // (Optional) If re-initializing, clear out any old renderer.
      // threeCanvasDiv.innerHTML = "";
    }

    // Initialize our three.js scene and build the bars.
    initThree();
    createBars();
    animate();
  };

  // 3) draw() => Called every frame in the p5 draw loop.
  //    But three.js has its own requestAnimationFrame, so we typically do nothing here.
  this.draw = function () {
    // No-op, or minimal logic if needed.
  };

  // 4) destroy() => Called when the user switches visuals in the gallery.
  //    We hide #three-canvas, show #canvas, and remove the three.js canvas.
  this.destroy = function () {
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

  // -------------------- THREE.JS Code (from main.js) --------------------

  function initThree() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, getAspect(), 0.1, 1000);
    camera.position.set(10, 10, 20);
    camera.lookAt(0, 0, 0);

    // Create the renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(getWidth(), getHeight());

    // Attach the renderer's canvas to <div id="three-canvas">
    const threeCanvasDiv = document.getElementById("three-canvas");
    if (threeCanvasDiv) {
      threeCanvasDiv.appendChild(renderer.domElement);
    }

    // Add basic lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Add a grid helper (20x20)
    const gridHelper = new THREE.GridHelper(20, 20);
    scene.add(gridHelper);

    // Group for bars
    barsGroup = new THREE.Group();
    scene.add(barsGroup);

    // OrbitControls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;

    // Handle window resizing
    window.addEventListener("resize", onWindowResize);
  }

  function createBars() {
    // Remove existing bars if any
    while (barsGroup.children.length > 0) {
      barsGroup.remove(barsGroup.children[0]);
    }

    // Make sure data is loaded
    if (!this.loaded) {
      console.log("Data not yet loaded.");
      return;
    }

    const numCompanies = dataTable.getRowCount();
    const offsetZ = ((numCompanies - 1) * gapBetweenCompanies) / 2;

    // Build bar groups from CSV rows
    for (let i = 0; i < numCompanies; i++) {
      const row = dataTable.getRow(i);
      const femaleVal = parseFloat(row.getString("female"));
      const maleVal = parseFloat(row.getString("male"));

      const companyGroup = new THREE.Group();

      // Female bar
      const femaleHeight = femaleVal * scaleFactor;
      const femaleGeom = new THREE.BoxGeometry(
        barWidth,
        femaleHeight,
        barDepth
      );
      const femaleMat = new THREE.MeshStandardMaterial({ color: femaleColor });
      const femaleBar = new THREE.Mesh(femaleGeom, femaleMat);
      femaleBar.position.y = femaleHeight / 2;
      femaleBar.position.x = -(barWidth / 2 + gapBetweenBars / 2);
      companyGroup.add(femaleBar);

      // Male bar
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

    // Scale down the entire chart
    barsGroup.scale.set(0.5, 0.5, 0.5);
  }

  // Three.js animation loop
  function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  // Handle window resizing
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
