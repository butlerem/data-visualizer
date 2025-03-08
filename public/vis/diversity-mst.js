import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import {
  fetchData,
  getAspect,
  getHeight,
  getWidth,
} from "../helper-functions.js";

export function TechDiversityMST() {
  // Public properties
  const self = this;
  self.name = "Tech Diversity MST";
  self.id = "tech-diversity-mst-3d";
  self.title = "Tech Diversity by Gender and Race Minimum Spanning Tree";
  self.collectionName = "tech_diversity_mst";
  self.loaded = false;
  self.data = [];

  // Stats panel data is stored later in this case because they are computed

  // Three.js variables
  let scene, camera, renderer, controls, nodesGroup, edgesGroup;

  // Helpers for canvas dimensions
  const width = getWidth();
  const height = getHeight();
  const aspect = getAspect();

  // Chart configuration
  const nodeRadius = 0.4;
  const sphereSegments = 16;

  const nodeColor = 0xab52d5;
  const edgeColor = 0x84d7d9;

  // Preload data from Firestore and merge it
  this.preload = async function () {
    try {
      const genderData = await fetchData("tech_diversity_gender");
      const raceData = await fetchData("tech_diversity_race");

      // Merge the datasets and ensure records have a company property
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
          ...(matchingRace || {}), // Merge data if available
        };
      });

      self.loaded = true;
      console.log("Combined diversity data loaded");
    } catch (error) {
      console.error("Error loading diversity data:", error);
    }
  };

  // Setup: hide p5 canvas, show Three.js canvas
  this.setup = function () {
    // If data not loaded, skip
    if (!self.loaded || !self.data.length) {
      console.log("TechDiversityMST3D: no data loaded yet");
      return;
    }

    // Hide p5 canvas
    const p5CanvasDiv = document.getElementById("canvas");
    if (p5CanvasDiv) {
      p5CanvasDiv.style.display = "none";
    }

    // Show Three.js canvas
    const threeCanvasDiv = document.getElementById("three-canvas");
    if (threeCanvasDiv) {
      threeCanvasDiv.style.display = "block";
    }

    // Initialize Three.js and build groups
    initThree();
    const nodes = createNodes();
    const mstEdges = computeMST(nodes);
    createEdges(nodes, mstEdges);
    createLabels(nodes);
    animate();

    // Compute stats using the nodes and MST edges
    const diversityScores = nodes.map((node) => node.diversityScore || 0);
    const avgDiversityScore =
      diversityScores.reduce((sum, s) => sum + s, 0) / diversityScores.length;

    const totalMSTLength = mstEdges.reduce((sum, edge) => sum + edge.weight, 0);
    const longestMSTEdge = Math.max(...mstEdges.map((edge) => edge.weight));

    // Update stats panel
    self.stats = [
      {
        icon: "star",
        value: avgDiversityScore.toFixed(2),
        label: "Average Diversity Score",
      },
      {
        icon: "timeline",
        value: totalMSTLength.toFixed(1),
        label: "Total MST Length",
      },
      {
        icon: "arrow_upward",
        value: longestMSTEdge.toFixed(1),
        label: "Largest Difference",
      },
    ];
  };

  // Destroy: remove Three.js DOM elements, revert to p5 canvas
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

  // Draw: empty function for Three.js but required to prevent errors
  this.draw = function () {};

  // Initialize Three.js scene, camera, renderer, lights, and controls
  function initThree() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color("#ffffff"); // white background
    camera = new THREE.PerspectiveCamera(75, getAspect(), 0.1, 1000);
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 0);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(getWidth(), getHeight());
    const threeCanvasDiv = document.getElementById("three-canvas");
    if (threeCanvasDiv) {
      threeCanvasDiv.appendChild(renderer.domElement);
    }

    // Add light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Add groups for nodes and edges
    nodesGroup = new THREE.Group();
    scene.add(nodesGroup);
    edgesGroup = new THREE.Group();
    scene.add(edgesGroup);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
  }

  // Define computeDiversityScore to used to create nodes
  function computeDiversityScore(company) {
    // For gender we will assume an ideal of 50/50
    const female = parseFloat(company.female) || 0;
    const male = parseFloat(company.male) || 0;
    const genderDeviation = Math.abs(female - 50) + Math.abs(male - 50);

    // For race we will assume an equal distribution among all 6 categories
    const raceCategories = [
      "white",
      "asian",
      "latino",
      "black",
      "multi",
      "other",
    ];
    let totalRace = 0;
    raceCategories.forEach((key) => {
      totalRace += parseFloat(company[key]) || 0;
    });
    const idealRace = totalRace / raceCategories.length;
    let raceDeviation = 0;
    raceCategories.forEach((key) => {
      raceDeviation += Math.abs((parseFloat(company[key]) || 0) - idealRace);
    });

    const totalDeviation = genderDeviation + raceDeviation;
    return 1 / (totalDeviation + 0.001);
  }

  // Create nodes in a circle
  // Each node includes its position and attribute vector
  function createNodes() {
    const numCompanies = self.data.length;
    const radius = Math.max(numCompanies * 0.6, 10);
    const nodes = [];
    const angleStep = (2 * Math.PI) / numCompanies;

    for (let i = 0; i < numCompanies; i++) {
      const doc = self.data[i];
      // Define vector of attributes for each category
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

      // Position on a circle (x,z plane)
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

      // Compute diversity score for this node
      const diversityScore = computeDiversityScore(doc);

      // Store information about the node
      nodes.push({
        id: i,
        company: doc.company || "Unknown",
        pos: position,
        attr: attr,
        diversityScore: diversityScore,
      });
    }
    return nodes;
  }

  // Compute the Euclidean distance between two attribute vectors
  function distance(attrA, attrB) {
    let sum = 0;
    for (let i = 0; i < attrA.length; i++) {
      const diff = attrA[i] - attrB[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  // Compute a minimum spanning tree using Kruskal's algorithm
  function computeMST(nodes) {
    const numNodes = nodes.length;
    const edges = [];
    for (let i = 0; i < numNodes; i++) {
      for (let j = i + 1; j < numNodes; j++) {
        const d = distance(nodes[i].attr, nodes[j].attr);
        edges.push({ a: i, b: j, weight: d });
      }
    }
    edges.sort((e1, e2) => e1.weight - e2.weight);

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

  // Create edges between nodes for the MST
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

  // Create labels for each company node
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
          label.position.copy(node.pos);
          label.position.y += nodeRadius + 0.2;
          label.rotation.y = -Math.PI / 4;
          scene.add(label);
        });
      }
    );
  }

  // Update controls and render the scene!
  function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }
}
