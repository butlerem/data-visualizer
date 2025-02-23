import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export function TechDiversityRace3D() {
  const self = this;

  self.name = "Tech Diversity: Race 3D";
  self.id = "tech-diversity-race-3d";
  self.title = "Tech Diversity by Race Percentage";
  self.loaded = false;

  let scene, camera, renderer, controls, raceGroup;
  let dataTable;

  const raceColors = [
    0x5e81ac, // Blue
    0x8fbcbb, // Teal
    0xa3be8c, // Green
    0xb48ead, // Purple
    0xe9a17c, // Orange
    0xf4a6a0, // Pink
  ];

  self.preload = function () {
    dataTable = loadTable(
      "./data/tech-diversity/race-2018.csv",
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

    // Initialize our three.js scene
    initThree();
    createRacePie3D();
    animate();
  };

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
    camera.position.set(-10, 10, 0);
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

    // Orbit Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;

    // Handle window resizing
    window.addEventListener("resize", onWindowResize);
  }

  function createRacePie3D() {
    raceGroup = new THREE.Group();
    scene.add(raceGroup);

    const companyName = dataTable.columns[1];
    const col = dataTable.getColumn(companyName);
    const values = col.map(parseFloat);
    const total = values.reduce((a, b) => a + b, 0);
    let startAngle = 0;
    const radius = 5;
    const height = 1;

    values.forEach((val, index) => {
      const proportion = val / total;
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
