function EducationGenderRadarChart() {
  this.name = "Education Gender Radar";
  this.id = "education-gender-radar";
  this.title = "Education Gender Distribution (2023)";
  this.loaded = false;
  this.chart = null;
  this.chartCanvas = null;
  this.graphics = null;

  this.preload = function () {
    this.data = loadTable(
      "./data/education/education_gender.csv",
      "csv",
      "header",
      () => {
        this.loaded = true;
      }
    );
  };

  this.setup = function () {
    if (!this.loaded) return;

    let categories = [];
    let maleData = [];
    let femaleData = [];

    // Extract 2023 data
    for (let row of this.data.rows) {
      if (row.get("Year") === "2023") {
        categories.push(row.get("Category"));
        maleData.push(parseFloat(row.get("Male (%)")));
        femaleData.push(parseFloat(row.get("Female (%)")));
      }
    }

    // **Create an Offscreen Canvas (p5.Graphics)**
    this.graphics = createGraphics(600, 600); // Chart.js will render here

    // Create Chart.js inside p5.Graphics
    this.createChart(categories, maleData, femaleData);
  };

  this.createChart = function (categories, maleData, femaleData) {
    // Create an HTML canvas inside p5.Graphics
    this.chartCanvas = document.createElement("canvas");
    this.chartCanvas.width = this.graphics.width;
    this.chartCanvas.height = this.graphics.height;

    // Attach Chart.js to the canvas
    this.chart = new Chart(this.chartCanvas.getContext("2d"), {
      type: "radar",
      data: {
        labels: categories,
        datasets: [
          {
            label: "Male (%)",
            data: maleData,
            fill: true,
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            borderColor: "rgb(54, 162, 235)",
            pointBackgroundColor: "rgb(54, 162, 235)",
            pointBorderColor: "rgb(54, 162, 235)", // Changed to match background
            pointHoverBackgroundColor: "transparent",
            pointHoverBorderColor: "rgb(54, 162, 235)",
          },
          {
            label: "Female (%)",
            data: femaleData,
            fill: true,
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            borderColor: "rgb(255, 99, 132)",
            pointBackgroundColor: "rgb(255, 99, 132)",
            pointBorderColor: "rgb(255, 99, 132)", // Changed to match background
            pointHoverBackgroundColor: "transparent",
            pointHoverBorderColor: "rgb(255, 99, 132)",
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        elements: { line: { borderWidth: 3 } },
        scales: {
          r: {
            angleLines: { display: true }, // Enable radial grid lines
            suggestedMin: 50,
            suggestedMax: 100,
            grid: { color: "rgba(255, 255, 255, 0.42)" }, // Lighter grid lines
            ticks: {
              backdropColor: "rgba(0,0,0,0)", // Remove white box behind tick labels
              color: "rgba(255, 255, 255, 0.95)", // Ensure text is visible
              font: { size: 12, weight: "bold" }, // Increase font size and bold
            },
            pointLabels: {
              font: { size: 18 }, // Bigger and bolder category labels
              color: "rgba(255, 255, 255, 0.95)", // Brighter labels
            },
          },
        },
        plugins: {
          legend: {
            labels: {
              color: "rgba(255, 255, 255, 0.95)", // Make legend text brighter
              font: { size: 18 }, // **Increase font size to 18px**
              padding: 15, // Add spacing for better readability
            },
          },
        },
      },
    });
  };

  this.draw = function () {
    background("#1c1c20"); // Set background color

    if (this.chartCanvas) {
      // Copy the Chart.js canvas into the p5.js canvas
      this.graphics.clear();
      this.graphics.drawingContext.drawImage(this.chartCanvas, 0, 0);
      image(this.graphics, width / 2 - 200, height / 2 - 200); // Center in p5 canvas
    }
  };

  this.destroy = function () {
    if (this.chart) {
      this.chart.destroy(); // Destroy the Chart.js instance
    }
    this.chartCanvas = null;
    this.graphics = null;
  };
}
