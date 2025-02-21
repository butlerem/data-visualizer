import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

export function PayGapByJob2017() {
  const self = this;
  self.name = "Pay Gap By Job";
  self.id = "pay-gap-by-job-2017";
  self.title = "Pay Gap by Job in 2017";
  self.loaded = false;

  // Three.js objects
  let scene, camera, renderer, controls, bubblesGroup;
  let dataTable; // p5 table for CSV data.

  const jobTypeColors = {
    "Process, plant and machine operatives": 0x5e81ac,
    "Skilled trades occupations": 0x81a1c1,
    "Professional occupations": 0x8fbcbb,
    "Associate professional and technical occupations": 0xa3be8c,
    "Managers, directors and senior officials": 0xb48ead,
    "Sales and customer service occupations": 0xd08770,
    "Administrative and secretarial occupations": 0xe9a17c,
    "Elementary occupations": 0xf2b5a0,
    "Caring, leisure and other service occupations": 0xf4a6a0,
  };

  // Preload the data
  self.preload = function () {
    dataTable = loadTable(
      "./data/pay-gap/occupation-hourly-pay-by-gender-2017.csv",
      "csv",
      "header",
      () => {
        self.loaded = true;
      }
    );
  };

  self.setup = function () {
    const p5CanvasDiv = document.getElementById("canvas");
    if (p5CanvasDiv) {
      p5CanvasDiv.style.display = "none";
    }

    const threeCanvasDiv = document.getElementById("three-canvas");
    if (threeCanvasDiv) {
      threeCanvasDiv.style.display = "block";
      threeCanvasDiv.innerHTML = "";
    }

    initThree();
    createBubbles();
    createAxisLabels();
    animate();
  };

  self.draw = function () {};

  self.destroy = function () {
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

  function initThree() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);

    camera = new THREE.PerspectiveCamera(75, getAspect(), 0.1, 1000);
    camera.position.set(30, 30, 50);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(getWidth(), getHeight());

    const threeCanvasDiv = document.getElementById("three-canvas");
    if (threeCanvasDiv) {
      threeCanvasDiv.appendChild(renderer.domElement);
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Grid Helper
    const gridHelper = new THREE.GridHelper(40, 20);
    scene.add(gridHelper);

    bubblesGroup = new THREE.Group();
    scene.add(bubblesGroup);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;

    // Handle window resizing
    window.addEventListener("resize", onWindowResize);
  }

  function createBubbles() {
    // Clear previous bubbles
    while (bubblesGroup.children.length > 0) {
      bubblesGroup.remove(bubblesGroup.children[0]);
    }

    // Make sure data is loaded
    if (!self.loaded) {
      console.log("Data not yet loaded.");
      return;
    }

    const numRows = dataTable.getRowCount();
    const scaleFactor = 0.05; // Scale down the bubbles

    // Build from CSV rows
    for (let i = 0; i < numRows; i++) {
      const row = dataTable.getRow(i);
      const propFemale = parseFloat(row.getString("proportion_female"));
      const payGap = parseFloat(row.getString("pay_gap"));
      const numJobs = parseFloat(row.getString("num_jobs"));
      const jobType = row.getString("job_type");
      const jobSubtype = row.getString("job_subtype");
      const numJobsMale = parseFloat(row.getString("num_jobs_male"));
      const medianMale = parseFloat(row.getString("median_male"));
      const numJobsFemale = parseFloat(row.getString("num_jobs_female"));
      const medianFemale = parseFloat(row.getString("median_female"));

      // Map data to 3D space
      const x = (propFemale - 50) / 2; // Center around 50%
      const y = payGap; // Pay gap already in usable range
      const z = (numJobs - 1000) / 100; // Scale numjobs
      const size = Math.sqrt(numJobs) * scaleFactor; // Bubble size should be proportional to sqrt(numjobs)
      const color = jobTypeColors[jobType];
      const geometry = new THREE.SphereGeometry(size, 8, 8); // Sphere geometry
      const material = new THREE.MeshPhongMaterial({
        color,
        transparent: true,
        opacity: 0.8,
      }); // Sphere material
      const bubble = new THREE.Mesh(geometry, material); // Create bubble

      bubble.position.set(x, y, z); // Set bubble position
      bubblesGroup.add(bubble); // Add bubble to group
    }

    bubblesGroup.scale.set(1, 1, 1); // Scale whole chart
  }

  function createAxisLabels() {
    const loader = new FontLoader();
    loader.load(
      "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
      function (font) {
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

        // Axis Labels (Properly Positioned)
        const labels = [
          {
            text: "Proportion Female (%)",
            position: [23, -2, 0],
            rotation: [0, 0, 0],
          }, // X-Axis
          {
            text: "Pay Gap (%)",
            position: [-5, 20, 0],
            rotation: [0, 0, Math.PI / 2],
          }, // Y-Axis
          {
            text: "Number of Jobs",
            position: [0, 0, -23],
            rotation: [0, Math.PI / 2, 0],
          }, // Z-Axis (Fixed)
        ];

        labels.forEach(({ text, position, rotation }) => {
          const labelGeometry = new TextGeometry(text, {
            font: font,
            size: 1,
            height: 0.1,
          });
          const label = new THREE.Mesh(labelGeometry, textMaterial);
          label.position.set(...position);
          label.rotation.set(...rotation);
          scene.add(label);
        });

        // Add Tick Marks
        addTickMarks(font);
      }
    );
  }

  function addTickMarks(font) {
    const tickMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const tickTextMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const gridSize = 40; // Matches Three.js GridHelper size
    const numTicks = 10; // Number of divisions per axis
    const tickSpacing = gridSize / numTicks;

    // X-Axis Ticks (Proportion Female %)
    for (let i = -gridSize / 2; i <= gridSize / 2; i += tickSpacing) {
      const tickGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(i, 0, -1),
        new THREE.Vector3(i, 0, 1),
      ]);
      const tick = new THREE.Line(tickGeometry, tickMaterial);
      scene.add(tick);

      // X Tick Label
      const tickLabelGeo = new TextGeometry((i + 50).toFixed(0), {
        font: font,
        size: 0.5,
        height: 0.1,
      });
      const tickLabel = new THREE.Mesh(tickLabelGeo, tickTextMaterial);
      tickLabel.position.set(i, -1.5, 2);
      scene.add(tickLabel);
    }

    // Y-Axis Ticks (Pay Gap %)
    for (let i = 0; i <= gridSize; i += tickSpacing) {
      const tickGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-1, i, 0),
        new THREE.Vector3(1, i, 0),
      ]);
      const tick = new THREE.Line(tickGeometry, tickMaterial);
      scene.add(tick);

      // Y Tick Label
      const tickLabelGeo = new TextGeometry(i.toFixed(0), {
        font: font,
        size: 0.5,
        height: 0.1,
      });
      const tickLabel = new THREE.Mesh(tickLabelGeo, tickTextMaterial);
      tickLabel.position.set(-3, i - 0.5, 0);
      scene.add(tickLabel);
    }

    // Z-Axis Ticks (Number of Jobs)
    for (let i = -gridSize / 2; i <= gridSize / 2; i += tickSpacing) {
      const tickGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -1, i),
        new THREE.Vector3(0, 1, i),
      ]);
      const tick = new THREE.Line(tickGeometry, tickMaterial);
      scene.add(tick);

      // Z Tick Label
      const tickLabelGeo = new TextGeometry((i + 1000).toFixed(0), {
        font: font,
        size: 0.5,
        height: 0.1,
      });
      const tickLabel = new THREE.Mesh(tickLabelGeo, tickTextMaterial);
      tickLabel.position.set(0, -1.5, i);
      scene.add(tickLabel);
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
