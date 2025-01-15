function SatelliteLocation() {
  this.name = 'Satellite 2D Map';
  this.id = 'satellite-map';
  this.title = 'Real-time Satellite Position.';

  // Current satellite lat/lon
  this.satLat = null;
  this.satLon = null;

  this.worldMap = null;

  this.layout = {
    marginSize: marginSize,
    leftMargin: marginSize * 2,
    rightMargin: width - marginSize,
    topMargin: marginSize,
    bottomMargin: height - marginSize * 2,
    pad: 5,
    };

    // Boolean to enable/disable background grid.
    grid: true,

  this.setup = function() {
    textSize(16);
  };

  this.destroy = function() {
  };

  this.draw = function() {
    this.drawTitle();

    // Draw all y-axis labels.
    drawYAxisTickLabels(this.minPayGap,
                        this.maxPayGap,
                        this.layout,
                        this.mapPayGapToHeight.bind(this),
                        0);

    // Draw x and y axis.
    drawAxis(this.layout);

    // Draw x and y axis labels.
    drawAxisLabels(this.xAxisLabel,
                   this.yAxisLabel,
                   this.layout);

    // Plot all pay gaps between startYear and endYear using the width
    // of the canvas minus margins.
    var previous;
    var numYears = this.endYear - this.startYear;

    // Loop over all rows and draw a line from the previous value to
    // the current.
    for (var i = 0; i < this.data.getRowCount(); i++) {

      // Create an object to store data for the current year.
      var current = {
        // Convert strings to numbers.
        'year': this.data.getNum(i, 'year'),
        'payGap': this.data.getNum(i, 'pay_gap')
      };

      if (previous != null) {
        // Draw line segment connecting previous year to current
        // year pay gap.
        stroke(0);
        line(this.mapYearToWidth(previous.year),
             this.mapPayGapToHeight(previous.payGap),
             this.mapYearToWidth(current.year),
             this.mapPayGapToHeight(current.payGap));

        // The number of x-axis labels to skip so that only
        // numXTickLabels are drawn.
        var xLabelSkip = ceil(numYears / this.layout.numXTickLabels);

        // Draw the tick label marking the start of the previous year.
        if (i % xLabelSkip == 0) {
          drawXAxisTickLabel(previous.year, this.layout,
                             this.mapYearToWidth.bind(this));
        }
      }

      // Assign current year to previous year so that it is available
      // during the next iteration of this loop to give us the start
      // position of the next line segment.
      previous = current;
    }
  };

  this.drawTitle = function() {
    fill(0);
    noStroke();
    textAlign('center', 'center');
    text(this.title, width / 2, 30);
  };
}