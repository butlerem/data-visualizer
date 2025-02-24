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
  self.data = [];

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

  // Preload: load Firestore docs
  this.preload = function () {
    import("https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js")
      .then(({ getFirestore, collection, getDocs }) => {
        const db = getFirestore(window.app);
        return getDocs(collection(db, "occupation_pay_gap"));
      })
      .then((querySnapshot) => {
        // Convert docs to array
        self.data = querySnapshot.docs.map((doc) => doc.data());
        self.loaded = true;
        console.log("occupation_pay_gap data:", self.data);
      })
      .catch((error) => {
        console.error("Error loading data:", error);
      });
  };

  // Setup: hide p5 canvas, show three.js container, init scene
  this.setup = function () {
    // If data not loaded or empty, skip
    if (!self.loaded || !self.data.length) {
      console.log("PayGapByJob2017: data not loaded yet.");
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
      threeCanvasDiv.innerHTML = "";
    }

    // Init Three.js
    // Create bubbles  & labels
    // Start the render loop
    initThree();
    createBubbles();
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

  // Create Bubbles
  function createBubbles() {
    // Interpret these fields from each doc:
    // proportion_female, pay_gap, num_jobs, job_type, ...
    // Adjust the scale
    const scaleFactor = 0.05; // For bubble size

    for (let i = 0; i < self.data.length; i++) {
      const doc = self.data[i];

      let propFemale = parseFloat(doc.proportion_female) || 0;
      let payGap = parseFloat(doc.pay_gap) || 0;
      let numJobs = parseFloat(doc.num_jobs) || 0;
      let jobType = doc.job_type || "Unknown";

      // Convert these to 3D coords:
      // x => around 0 for 50% female, so shift by 50
      // y => direct from payGap
      // z => from numJobs
      const x = (propFemale - 50) / 2; // center around 50
      const y = payGap;
      const z = (numJobs - 1000) / 100;
      // bubble size
      const size = Math.sqrt(numJobs) * scaleFactor;

      // Color based on jobType
      let color = jobTypeColors[jobType] || 0xffffff;

      // Create geometry
      let geometry = new THREE.SphereGeometry(size, 8, 8);
      let material = new THREE.MeshPhongMaterial({
        color,
        transparent: true,
        opacity: 0.8,
      });
      let bubble = new THREE.Mesh(geometry, material);

      bubble.position.set(x, y, z);
      bubblesGroup.add(bubble);
    }
  }

  // Create Axis Labels
  function createAxisLabels() {
    const loader = new FontLoader();
    loader.load(
      "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
      function (font) {
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

        // Axis labels
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

        addTickMarks(font);
      }
    );
  }

  function addTickMarks(font) {
    // This code is mostly decorative for drawing ticks on x,y,z
    // You can adjust or remove as needed
    const tickMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const tickTextMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const gridSize = 40;
    const numTicks = 10;
    const tickSpacing = gridSize / numTicks;

    // Example X-axis ticks from -20..20 => labeled (value + 50)
    // etc...
    // You can keep or simplify, but the key is we no longer rely on a CSV or p5.Table
    // Just drawing lines and text in 3D space.
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
