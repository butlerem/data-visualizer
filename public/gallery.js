export function Gallery() {
  this.visuals = [];
  this.selectedVisual = null;
  this.selectedVisual2 = null; // New property for the second visual
  var self = this;

  // Add a new visualisation to the navigation bar.
  this.addVisual = function (vis) {
    // Check that the vis object has an id and name.
    if (!vis.hasOwnProperty("id") && !vis.hasOwnProperty("name")) {
      alert("Make sure your visualisation has an id and name!");
    }

    // Check that the vis object has a unique id.
    if (this.findVisIndex(vis.id) != null) {
      alert(`Vis '${vis.name}' has a duplicate id: '${vis.id}'`);
    }

    this.visuals.push(vis); // Add the visual to the visuals array

    // Create menu item without text
    var menuItem = createElement("li");

    // Create Material Icon span
    var iconSpan = createElement("span");
    iconSpan.addClass("material-icons");

    // Define icons for each visualization name
    var iconMapping = {
      "Tech Race Diversity": "groups",
      "Tech Race Diversity 3D": "diversity_3",
      "Tech Gender Diversity 3D": "female",
      "Pay Gap By Job": "work",
      "Pay Gap Over Time": "timeline",
      "Climate Change": "eco",
      "Education Completion": "school",
      "Education Gender Radar": "radar",
    };

    // Assign the correct icon based on visualization name
    if (iconMapping[vis.name]) {
      iconSpan.html(iconMapping[vis.name]);
    } else {
      iconSpan.html("insights"); // Default icon
    }

    // Create span for the name (to prevent duplication)
    var nameSpan = createElement("span", vis.name);

    // Append elements in the correct order
    menuItem.child(iconSpan); // First, add the icon
    menuItem.child(nameSpan); // Then, add the name

    // Add required classes and ID
    menuItem.addClass("menu-item");
    menuItem.id(vis.id);

    // Add hover effects
    menuItem.mouseOver(function (e) {
      var el = select("#" + e.currentTarget.id);
      el.addClass("hover");
    });

    menuItem.mouseOut(function (e) {
      var el = select("#" + e.currentTarget.id);
      el.removeClass("hover");
    });

    // Add click handler to select the visual
    menuItem.mouseClicked(function (e) {
      // Remove selected class from any other menu-items
      var menuItems = selectAll(".menu-item");
      for (var i = 0; i < menuItems.length; i++) {
        menuItems[i].removeClass("selected");
      }

      var el = select("#" + e.currentTarget.id);
      el.addClass("selected"); // Add the 'selected' class to the clicked item

      // Select the visual and its related visual
      self.selectVisual(e.currentTarget.id);
    });

    var visMenu = select("#visuals-menu");
    visMenu.child(menuItem); // Add the menu item to the visuals menu

    // Preload data if necessary.
    if (vis.hasOwnProperty("preload")) {
      vis.preload();
    }
  };

  this.findVisIndex = function (visId) {
    // Search through the visualisations looking for one with the id matching visId.
    for (var i = 0; i < this.visuals.length; i++) {
      if (this.visuals[i].id == visId) {
        return i; // Return the index if found
      }
    }
    return null; // Visualisation not found.
  };

  this.selectVisual = function (visId) {
    var visIndex = this.findVisIndex(visId);
    var visIndex2 = this.findVisIndex(visId + "-2"); // For a paired second visual

    if (visIndex != null) {
      if (this.selectedVisual && this.selectedVisual.destroy) {
        this.selectedVisual.destroy();
      }
      this.selectedVisual = this.visuals[visIndex];
      if (this.selectedVisual.setup) {
        this.selectedVisual.setup();
      }
    }

    if (visIndex2 != null) {
      if (this.selectedVisual2 && this.selectedVisual2.destroy) {
        this.selectedVisual2.destroy();
      }
      this.selectedVisual2 = this.visuals[visIndex2];
      if (this.selectedVisual2.setup) {
        this.selectedVisual2.setup();
      }
    }

    // Update Title and Axes
    var titleEl = select("#visual-title");
    if (titleEl && this.selectedVisual) {
      titleEl.html(this.selectedVisual.title);
      titleEl.style("visibility", "visible");
    }

    var xAxisEl = select("#x-axis");
    if (xAxisEl && this.selectedVisual) {
      xAxisEl.html("X-Axis: " + this.selectedVisual.xAxisLabel);
    }

    var yAxisEl = select("#y-axis");
    if (yAxisEl && this.selectedVisual) {
      yAxisEl.html("Y-Axis: " + this.selectedVisual.yAxisLabel);
    }

    // --- Update Stats Panel ---
    if (this.selectedVisual && this.selectedVisual.stats) {
      // Use standard DOM querySelectorAll to select the .stat elements.
      var statEls = document.querySelectorAll("#stats-panel .stat");
      for (var i = 0; i < statEls.length; i++) {
        if (this.selectedVisual.stats[i]) {
          var statData = this.selectedVisual.stats[i];
          // Update the h2 element with icon and value
          var h2El = statEls[i].querySelector("h2");
          if (h2El) {
            h2El.innerHTML =
              '<i class="material-icons">' +
              statData.icon +
              "</i> " +
              statData.value;
          }
          // Update the p element with the label
          var pEl = statEls[i].querySelector("p");
          if (pEl) {
            pEl.innerHTML = statData.label;
          }
        } else {
          // Optionally clear any unused stat element
          statEls[i].innerHTML = "";
        }
      }
    }

    // Restart animation if needed
    loop();
  };
}
