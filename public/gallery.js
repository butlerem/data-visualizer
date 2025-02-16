function Gallery() {
  this.visuals = [];
  this.selectedVisual = null;
  this.selectedVisual2 = null; // New property for the second visual
  var self = this;

  // Add a new visualisation to the navigation bar.
  this.addVisual = function(vis) {
    // Check that the vis object has an id and name.
    if (!vis.hasOwnProperty('id') && !vis.hasOwnProperty('name')) {
      alert('Make sure your visualisation has an id and name!');
    }

    // Check that the vis object has a unique id.
    if (this.findVisIndex(vis.id) != null) {
      alert(`Vis '${vis.name}' has a duplicate id: '${vis.id}'`);
    }

    this.visuals.push(vis); // Add the visual to the visuals array

    // Create menu item.
    var menuItem = createElement('li', vis.name); // Create a list item with the visual's name
    menuItem.addClass('menu-item'); // Add the 'menu-item' class to the list item
    menuItem.id(vis.id); // Set the id of the list item to the visual's id

    menuItem.mouseOver(function(e) {
      var el = select('#' + e.srcElement.id);
      el.addClass("hover"); // Add the 'hover' class when the mouse is over the item
    });

    menuItem.mouseOut(function(e) {
      var el = select('#' + e.srcElement.id);
      el.removeClass("hover"); // Remove the 'hover' class when the mouse is out of the item
    });

    menuItem.mouseClicked(function(e) {
      // Remove selected class from any other menu-items
      var menuItems = selectAll('.menu-item');
      for (var i = 0; i < menuItems.length; i++) {
        menuItems[i].removeClass('selected');
      }

      var el = select('#' + e.srcElement.id);
      el.addClass('selected'); // Add the 'selected' class to the clicked item

      // Select the visual and its related visual
      self.selectVisual(e.srcElement.id);
    });

    var visMenu = select('#visuals-menu');
    visMenu.child(menuItem); // Add the menu item to the visuals menu

    // Preload data if necessary.
    if (vis.hasOwnProperty('preload')) {
      vis.preload();
    }
  };

  this.findVisIndex = function(visId) {
    // Search through the visualisations looking for one with the id
    // matching visId.
    for (var i = 0; i < this.visuals.length; i++) {
      if (this.visuals[i].id == visId) {
        return i; // Return the index of the visual if found
      }
    }

    // Visualisation not found.
    return null;
  };

  this.selectVisual = function(visId) {
    var visIndex = this.findVisIndex(visId);
    var visIndex2 = this.findVisIndex(visId + '-2'); // Assuming the second visual has an id with '-2' appended

    if (visIndex != null) {
      // If the current visualisation has a deselect method run it.
      if (this.selectedVisual != null && this.selectedVisual.hasOwnProperty('destroy')) {
        this.selectedVisual.destroy();
      }

      // Select the visualisation in the gallery.
      this.selectedVisual = this.visuals[visIndex];

      // Initialise visualisation if necessary.
      if (this.selectedVisual.hasOwnProperty('setup')) {
        this.selectedVisual.setup();
      }
    }

    if (visIndex2 != null) {
      // If the current second visualisation has a deselect method run it.
      if (this.selectedVisual2 != null && this.selectedVisual2.hasOwnProperty('destroy')) {
        this.selectedVisual2.destroy();
      }

      // Select the second visualisation in the gallery.
      this.selectedVisual2 = this.visuals[visIndex2];

      // Initialise visualisation if necessary.
      if (this.selectedVisual2.hasOwnProperty('setup')) {
        this.selectedVisual2.setup();
      }
    }

    // Enable animation in case it has been paused by the current visualisation.
    loop();
  };
}
