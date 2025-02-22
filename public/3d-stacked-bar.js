import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

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
    const p5CanvasDiv = document.getElementById("canvas");
    if (p5CanvasDiv) p5CanvasDiv.style.display = "none";

    const threeCanvasDiv = document.getElementById("three-canvas");
    if (threeCanvasDiv) threeCanvasDiv.style.display = "block";

    initThree();
    createRaceBars();
    animate();
  };

  self.destroy = function () {
    const threeCanvasDiv = document.getElementById("three-canvas");
    if (threeCanvasDiv) threeCanvasDiv.style.display = "none";

    const p5CanvasDiv = document.getElementById("canvas");
    if (p5CanvasDiv) p5CanvasDiv.style.display = "block";

    if (renderer && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  };

  function initThree() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);

    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 20, 30);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("three-canvas").appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
  }

  function createRaceBars() {
    raceGroup = new THREE.Group();
    scene.add(raceGroup);

    const numCompanies = dataTable.getColumnCount() - 1;
    const labels = dataTable.getColumn(0);
    const barWidth = 1;
    const gap = 2;
    const scaleFactor = 0.1;

    for (let i = 1; i < numCompanies; i++) {
      const companyName = dataTable.columns[i];
      const col = dataTable.getColumn(companyName);
      const values = col.map(parseFloat);

      let totalHeight = 0;
      const barGroup = new THREE.Group();

      values.forEach((val, index) => {
        const height = val * scaleFactor;
        const color = raceColors[index % raceColors.length];

        const geometry = new THREE.BoxGeometry(barWidth, height, barWidth);
        const material = new THREE.MeshStandardMaterial({ color });
        const bar = new THREE.Mesh(geometry, material);
        bar.position.y = totalHeight + height / 2;

        barGroup.add(bar);
        totalHeight += height;
      });

      barGroup.position.x = (i - numCompanies / 2) * gap;
      raceGroup.add(barGroup);
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
}
