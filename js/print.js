'use strict';

function PrintControl(options) {
  this.options = options;
}

PrintControl.prototype.onAdd = function(map) {
    this._map = map;

    this._container = document.createElement('div');
    this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';

    this._printBtn = document.createElement('button');
    this._printBtn.className = 'mapboxgl-ctrl-icon mapboxgl-ctrl-print';

    this._printBtn.setAttribute('data-toggle', 'modal');
    this._printBtn.setAttribute('data-target', '#map-print-modal') // #map-print-modal is the DOM  ID

    this._printBtn.addEventListener('mousedown', this.initializeCropper.bind(this));

    // export-map is the primary button within the map-print-modal
    document.querySelector('#export-map').addEventListener('mousedown', this.onPrintDown.bind(this));

    this._container.appendChild(this._printBtn);
    return this._container;
}

PrintControl.prototype.onRemove = function() {
    this.container.parentNode.removeChild(this.container);
    this._map = null;
    return this;
}

PrintControl.prototype.initializeCropper = function (e) {
    var _this = this;

    var exportView = $('#export-view');
    exportView.attr('src', map.getCanvas().toDataURL());
    exportView.css('max-width', '100%')

    _this.cropper = exportView.cropper({
        aspectRatio: 1.5/1,
        zoomable: false,
        zoomOnWheel: false,
        minContainerHeight: 300,
        minContainerWidth: 568,

    })
}

PrintControl.prototype.onPrintDown = function (e) {
    var _this = this;

    var type = $("form#print-form .format input[type='radio']:checked").val();
    var size = $("form#print-form .size input[type='radio']:checked").val();
    var zoom = map.getZoom();
    var center = map.getCenter();
    var bearing = map.getBearing();

    _this.printCanvas(type, size, zoom, center, bearing);
}

PrintControl.prototype.printCanvas = function(type, size, zoom, center, bearing) {
    var _this = this;

    //based on Print Maps - https://github.com/mpetroff/print-maps
    var actualPixelRatio = window.devicePixelRatio;
    Object.defineProperty(window, 'devicePixelRatio', {
        get: function() {return dpi / 96}
    });

    if (type == 'png') {
        var mapCanvas = map.getCanvas();
        var tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = _this.toPixels(width);
        tmpCanvas.height = _this.toPixels(height);

        var ctx = tmpCanvas.getContext('2d');
        ctx.drawImage(mapCanvas,0,0,mapCanvas.width,mapCanvas.height,0,0,_this.toPixels(width),_this.toPixels(height));

        tmpCanvas.toBlob(function(blob) {
            saveAs(blob, 'map.png');
        });
    } else {
        var pdf = new jsPDF({
            orientation: width > height ? 'l' : 'p',
            unit: unit,
            format: [width, height],
            compress: true
        });

        pdf.addImage(map.getCanvas().toDataURL('image/png'),
            'png', 0, 0, width, height, null, 'FAST');
        pdf.save('map.pdf');
    }

    Object.defineProperty(window, 'devicePixelRatio', {
        get: function() {return actualPixelRatio}
    });
}

PrintControl.prototype.toPixels = function(val) {
    var conversionFactor = 96;
    return conversionFactor * val;
}


