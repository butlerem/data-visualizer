import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { fetchData } from "./helper-functions.js";

export function TechDiversityMST() {
  // Public properties
  const self = this;
  self.name = "Tech Diversity MST";
  self.id = "tech-diversity-mst-3d";
  self.title = "Tech Diversity by Gender and Race Minimum Spanning Tree";
  self.collectionName = "tech_diversity_mst";
  self.loaded = false;
  self.data = [];

  // Stats to be displayed in the stats panel
  self.stats = [
    { icon: "female", value: "23%", label: "Average Female Representation" },
    { icon: "male", value: "77%", label: "Average Male Representation" },
    { icon: "groups", value: "49%", label: "Highest Female Representation" },
  ];

  // Three.js variables
  let scene, camera, renderer, controls, nodesGroup, edgesGroup;

  // Chart configuration
  const nodeRadius = 0.4;
  const sphereSegments = 16;

  // Colors for nodes and edges
  const nodeColor = 0xab52d5;
  const edgeColor = 0x84d7d9;

  // Preload function to fetch and merge both gender and race data
  this.preload = async function () {
    try {
      const genderData = await fetchData("tech_diversity_gender");
      const raceData = await fetchData("tech_diversity_race");

      // Merge the datasets based on company name.
      // Ensure each race record has a company property before comparing.
      self.data = genderData.map((genderRecord) => {
        const matchingRace = raceData.find((raceRecord) => {
          return (
            raceRecord.company &&
            genderRecord.company &&
            genderRecord.company.trim() === raceRecord.company.trim()
          );
        });
        return {
          ...genderRecord,
          ...(matchingRace || {}), // Merge race data if available.
        };
      });

      self.loaded = true;
      console.log("Combined diversity data loaded");
    } catch (error) {
      console.error("Error loading diversity data:", error);
    }
  };

  // Setup: hide p5 canvas, show Three.js canvas, and build the MST visual
  this.setup = function () {
    if (!self.loaded || !self.data.length) {
      console.log("TechDiversityMST3D: no data loaded yet");
      return;
    }
    // Hide p5 canvas and show Three.js canvas
    const p5CanvasDiv = document.getElementById("canvas");
    if (p5CanvasDiv) p5CanvasDiv.style.display = "none";
    const threeCanvasDiv = document.getElementById("three-canvas");
    if (threeCanvasDiv) threeCanvasDiv.style.display = "block";

    // Initialize Three.js scene and groups
    initThree();
    // Layout nodes in a circle and compute MST edges
    const nodes = createNodes();
    const mstEdges = computeMST(nodes);
    createEdges(nodes, mstEdges);
    createLabels(nodes);
    animate();
  };

  // Draw (not used since Three.js animates its own loop)
  this.draw = function () {};

  // Destroy: clean up and revert to p5 canvas
  this.destroy = function () {
    const threeCanvasDiv = document.getElementById("three-canvas");
    if (threeCanvasDiv) {
      threeCanvasDiv.style.display = "none";
    }
    renderer.domElement.parentNode.removeChild(renderer.domElement);
    const p5CanvasDiv = document.getElementById("canvas");
    if (p5CanvasDiv) {
      p5CanvasDiv.style.display = "block";
    }
  };

  // Initialize Three.js scene, camera, renderer, lights, and controls
  function initThree() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color("0xfff");
    camera = new THREE.PerspectiveCamera(75, getAspect(), 0.1, 1000);
    camera.position.set(0, 15, 20);
    camera.lookAt(0, 0, 0);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(getWidth(), getHeight());
    const threeCanvasDiv = document.getElementById("three-canvas");
    if (threeCanvasDiv) {
      threeCanvasDiv.appendChild(renderer.domElement);
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    nodesGroup = new THREE.Group();
    scene.add(nodesGroup);
    edgesGroup = new THREE.Group();
    scene.add(edgesGroup);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
  }

  // Create node objects (spheres) arranged on a circle.
  // Each node will have a position and a vector of attributes.
  function createNodes() {
    const numCompanies = self.data.length;
    const radius = Math.max(numCompanies * 0.6, 10);
    const nodes = [];
    const angleStep = (2 * Math.PI) / numCompanies;

    for (let i = 0; i < numCompanies; i++) {
      const doc = self.data[i];
      // Define a vector of attributes for distance calculations.
      // Here we assume your document has keys: female, male, white, asian, latino, black, multi, other.
      // You can adjust or add more dimensions as needed.
      const attr = [
        parseFloat(doc.female) || 0,
        parseFloat(doc.male) || 0,
        parseFloat(doc.white) || 0,
        parseFloat(doc.asian) || 0,
        parseFloat(doc.latino) || 0,
        parseFloat(doc.black) || 0,
        parseFloat(doc.multi) || 0,
        parseFloat(doc.other) || 0,
      ];
      // Position on a circle (x,z plane); y can be 0.
      const angle = i * angleStep;
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);
      const position = new THREE.Vector3(x, 0, z);

      // Create a sphere for the node
      const sphereGeo = new THREE.SphereGeometry(
        nodeRadius,
        sphereSegments,
        sphereSegments
      );
      const sphereMat = new THREE.MeshStandardMaterial({ color: nodeColor });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.copy(position);
      nodesGroup.add(sphere);

      // Store node info
      nodes.push({
        id: i,
        company: doc.company || "Unknown",
        pos: position,
        attr: attr,
      });
    }
    return nodes;
  }

  // Compute Euclidean distance between two attribute vectors
  function distance(attrA, attrB) {
    let sum = 0;
    for (let i = 0; i < attrA.length; i++) {
      const diff = attrA[i] - attrB[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  // Compute MST using a simple Kruskal algorithm.
  // Returns an array of edges where each edge is { a: nodeIndex, b: nodeIndex, weight: number }.
  function computeMST(nodes) {
    const numNodes = nodes.length;
    const edges = [];
    // Compute complete graph edges (you may choose to limit this for large datasets)
    for (let i = 0; i < numNodes; i++) {
      for (let j = i + 1; j < numNodes; j++) {
        const d = distance(nodes[i].attr, nodes[j].attr);
        edges.push({ a: i, b: j, weight: d });
      }
    }
    // Sort edges by weight
    edges.sort((e1, e2) => e1.weight - e2.weight);

    // Union-Find (Disjoint Set) structure for cycle detection
    const parent = Array(numNodes)
      .fill(0)
      .map((_, i) => i);

    function find(i) {
      if (parent[i] !== i) parent[i] = find(parent[i]);
      return parent[i];
    }

    function union(i, j) {
      parent[find(i)] = find(j);
    }

    // Kruskal’s algorithm: pick the smallest edge that doesn't create a cycle.
    const mstEdges = [];
    for (let edge of edges) {
      if (find(edge.a) !== find(edge.b)) {
        mstEdges.push(edge);
        union(edge.a, edge.b);
      }
      if (mstEdges.length === numNodes - 1) break;
    }
    return mstEdges;
  }

  // Create edges (lines) between nodes for the MST
  function createEdges(nodes, mstEdges) {
    const material = new THREE.LineBasicMaterial({ color: edgeColor });
    mstEdges.forEach((edge) => {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        nodes[edge.a].pos,
        nodes[edge.b].pos,
      ]);
      const line = new THREE.Line(geometry, material);
      edgesGroup.add(line);
    });
  }

  // Create labels for each company node using the FontLoader
  function createLabels(nodes) {
    const loader = new FontLoader();
    loader.load(
      "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
      function (font) {
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xa9b5c6 });
        nodes.forEach((node) => {
          const labelGeo = new TextGeometry(node.company, {
            font: font,
            size: 0.4,
            height: 0.05,
          });
          const label = new THREE.Mesh(labelGeo, textMaterial);
          // Position the label slightly above the node
          label.position.copy(node.pos);
          label.position.y += nodeRadius + 0.2;
          // Optionally rotate the label for better readability
          label.rotation.y = -Math.PI / 4;
          scene.add(label);
        });
      }
    );
  }

  // Animation loop: update controls and render the scene
  function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  // Helpers to get canvas dimensions and aspect ratio
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
