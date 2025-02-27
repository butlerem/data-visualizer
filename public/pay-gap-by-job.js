import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { fetchData, showElement, hideElement } from "./helper-functions.js";

export function PayGapByJob2017() {
  // Public properties
  const self = this;
  self.name = "Pay Gap By Job";
  self.id = "pay-gap-by-job-2017";
  self.title = "Pay Gap by Job in 2017";
  self.loaded = false;
  self.data = [];

  // Statistics for stats panel
  self.stats = [
    { icon: "trending_down", value: "15%", label: "Average Gap" },
    { icon: "work", value: "$120K", label: "Median Salary" },
    { icon: "insights", value: "75%", label: "Data Coverage" },
  ];

  // Three.js variables
  let scene, camera, renderer, controls, bubblesGroup;

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

  /**
   * Preload: Fetch occupation pay gap data.
   */
  this.preload = async function () {
    try {
      this.data = await fetchData("occupation_pay_gap");
      this.loaded = true;
      console.log("Occupation Data loaded");
    } catch (error) {
      console.error("Error loading Occupation data:", error);
    }
  };

  /**
   * Setup:
   * - Hide the p5 canvas.
   * - Show the Three.js container.
   * - Initialize the Three.js scene.
   */
  this.setup = function () {
    if (!self.loaded || !self.data.length) {
      console.log("PayGapByJob2017: data not loaded yet.");
      return;
    }

    // Hide p5 canvas and show Three.js container using helpers.
    hideElement("canvas");
    showElement("three-canvas");

    // Clear Three.js container.
    const threeCanvasDiv = document.getElementById("three-canvas");
    if (threeCanvasDiv) {
      threeCanvasDiv.innerHTML = "";
    }

    // Initialize Three.js scene.
    initThree();
    createBubbles();
    createAxisLabels();
    animate();
  };

  /**
   * Draw: Empty because Three.js handles rendering via its animation loop.
   */
  this.draw = function () {
    // Three.js rendering handled in animate().
  };

  this.destroy = function () {
    hideElement("three-canvas");
    showElement("canvas");
    if (renderer && renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  };

  // --- THREE.JS SETUP FUNCTIONS ---

  function initThree() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color("#3A3E44");

    camera = new THREE.PerspectiveCamera(55, getAspect(), 0.1, 1000);
    camera.position.set(0, 30, 50);
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

    // Group to hold bubbles
    bubblesGroup = new THREE.Group();
    scene.add(bubblesGroup);

    // OrbitControls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;

    window.addEventListener("resize", onWindowResize);
  }

  function createBubbles() {
    const scaleFactor = 0.05; // For bubble size

    self.data.forEach((doc) => {
      const propFemale = parseFloat(doc.proportion_female) || 0;
      const payGap = parseFloat(doc.pay_gap) || 0;
      const numJobs = parseFloat(doc.num_jobs) || 0;
      const jobType = doc.job_type || "Unknown";

      // Convert these to 3D coordinates.
      const x = (propFemale - 50) / 2; // center around 50%
      const y = payGap;
      const z = (numJobs - 1000) / 100;
      const size = Math.sqrt(numJobs) * scaleFactor;
      const colorValue = jobTypeColors[jobType] || 0xffffff;

      const geometry = new THREE.SphereGeometry(size, 8, 8);
      const material = new THREE.MeshPhongMaterial({
        color: colorValue,
        transparent: true,
        opacity: 0.8,
      });
      const bubble = new THREE.Mesh(geometry, material);
      bubble.position.set(x, y, z);
      bubblesGroup.add(bubble);
    });
  }

  function createAxisLabels() {
    const loader = new FontLoader();
    loader.load(
      "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
      function (font) {
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const labels = [
          {
            text: "Proportion Female (%)",
            position: [23, -2, 0],
            rotation: [0, 0, 0],
          },
          {
            text: "Pay Gap (%)",
            position: [-5, 20, 0],
            rotation: [0, 0, Math.PI / 2],
          },
          {
            text: "Number of Jobs",
            position: [0, 0, -23],
            rotation: [0, Math.PI / 2, 0],
          },
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

        // Optionally add tick marks.
        addTickMarks(font);
      }
    );
  }

  function addTickMarks(font) {
    // Tick marks implementation can be added here if desired.
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
