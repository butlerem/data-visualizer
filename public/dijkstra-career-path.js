import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export function DijkstraCareerPath() {
  const self = this;
  self.name = "Dijkstra Career Path";
  self.id = "dijkstra-career-path";
  self.title = "Dijkstra Career Path";
  self.loaded = false;
  self.data = [];
  self.graph = {}; // Graph structure

  let scene, camera, renderer, controls;
  let nodes = [],
    edges = []; // Global scope
  let graphGroup;

  this.preload = function () {
    import("https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js")
      .then(({ getFirestore, collection, getDocs }) => {
        const db = getFirestore(window.app);
        return getDocs(collection(db, "occupation_pay_gap"));
      })
      .then((querySnapshot) => {
        self.data = querySnapshot.docs.map((doc) => doc.data());
        self.loaded = true;

        // Convert to Graph Structure
        self.graph = buildGraph(self.data);
        console.log("Graph structure:", self.graph);
      })
      .catch((error) => {
        console.error("Error loading data:", error);
      });
  };

  function buildGraph(data) {
    let graph = {};

    data.forEach((job) => {
      let jobType = job.job_type;
      let jobSubtype = job.job_subtype;
      let payGap = parseFloat(job.pay_gap) || 0;

      if (!graph[jobType]) {
        graph[jobType] = {};
      }

      if (!graph[jobSubtype]) {
        graph[jobSubtype] = {}; // Ensure subtype exists in graph
      }

      // Link job_type to job_subtype as a possible career path
      graph[jobType][jobSubtype] = payGap;
      graph[jobSubtype][jobType] = payGap; // Bi-directional
    });

    return graph;
  }

  function dijkstra(graph, start, end) {
    let distances = {};
    let previous = {};
    let pq = new PriorityQueue();

    for (let node in graph) {
      distances[node] = node === start ? 0 : Infinity;
      previous[node] = null;
      pq.enqueue(node, distances[node]);
    }

    while (!pq.isEmpty()) {
      let smallest = pq.dequeue().val;

      if (smallest === end) {
        let path = [];
        while (previous[smallest]) {
          path.push(smallest);
          smallest = previous[smallest];
        }
        return path.reverse();
      }

      for (let neighbor in graph[smallest]) {
        let candidate = distances[smallest] + graph[smallest][neighbor];
        if (candidate < distances[neighbor]) {
          distances[neighbor] = candidate;
          previous[neighbor] = smallest;
          pq.enqueue(neighbor, candidate);
        }
      }
    }

    return [];
  }

  class PriorityQueue {
    constructor() {
      this.values = [];
    }
    enqueue(val, priority) {
      this.values.push({ val, priority });
      this.sort();
    }
    dequeue() {
      return this.values.shift();
    }
    sort() {
      this.values.sort((a, b) => a.priority - b.priority);
    }
    isEmpty() {
      return this.values.length === 0;
    }
  }

  this.setup = function () {
    if (!self.loaded || !self.data.length) {
      console.log("DijkstraCareerPath: data not loaded yet.");
      return;
    }

    const p5CanvasDiv = document.getElementById("canvas");
    if (p5CanvasDiv) p5CanvasDiv.style.display = "none";

    const threeCanvasDiv = document.getElementById("three-canvas");
    if (threeCanvasDiv) {
      threeCanvasDiv.style.display = "block";
      threeCanvasDiv.innerHTML = "";
    }

    initThree();
    createGraphNodes();
    createGraphEdges();
    animate();

    document.addEventListener("click", onNodeClick);
  };

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

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;

    window.addEventListener("resize", onWindowResize);
  }

  function createGraphNodes() {
    graphGroup = new THREE.Group();

    Object.keys(self.graph).forEach((jobType) => {
      let geometry = new THREE.SphereGeometry(1, 16, 16);
      let material = new THREE.MeshPhongMaterial({
        color: Math.random() * 0xffffff,
      });
      let node = new THREE.Mesh(geometry, material);

      node.position.set(
        Math.random() * 20 - 10,
        Math.random() * 20 - 10,
        Math.random() * 20 - 10
      );
      node.jobType = jobType;

      nodes.push(node);
      graphGroup.add(node);
    });

    scene.add(graphGroup);
  }

  function createGraphEdges() {
    Object.keys(self.graph).forEach((jobType) => {
      let sourceNode = nodes.find((n) => n.jobType === jobType);

      Object.keys(self.graph[jobType]).forEach((subType) => {
        let targetNode = nodes.find((n) => n.jobType === subType);
        if (targetNode) {
          let edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
          let edgeGeometry = new THREE.BufferGeometry().setFromPoints([
            sourceNode.position,
            targetNode.position,
          ]);
          let edge = new THREE.Line(edgeGeometry, edgeMaterial);

          edges.push(edge);
          graphGroup.add(edge);
        }
      });
    });
  }

  function onNodeClick(event) {
    let mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    let raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    let intersects = raycaster.intersectObjects(nodes);
    if (intersects.length > 0) {
      let selectedJob = intersects[0].object.jobType;
      let path = dijkstra(
        self.graph,
        "Administrative occupations",
        selectedJob
      );

      console.log("Best career path:", path);
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    renderer.render(scene, camera);
  }

  function onWindowResize() {
    camera.aspect = getAspect();
    camera.updateProjectionMatrix();
    renderer.setSize(getWidth(), getHeight());
  }

  function getWidth() {
    return window.innerWidth;
  }
  function getHeight() {
    return window.innerHeight;
  }
  function getAspect() {
    return getWidth() / getHeight();
  }
}
