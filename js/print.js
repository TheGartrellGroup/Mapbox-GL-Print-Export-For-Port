'use strict';

function PrintControl(options) {
  this.options = options;
}

PrintControl.prototype.onAdd = function(map) {
    this._map = map;
    this._container = document.createElement('div');
    this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group print';

    this._printBtn = document.createElement('button');
    this._printBtn.className = 'mapboxgl-ctrl-icon mapboxgl-ctrl-print';

    this._container.appendChild(this._printBtn);
    this._container.style.display = 'none';

    this.onReady(map);
    return this._container;
}

PrintControl.prototype.onRemove = function() {
    this.container.parentNode.removeChild(this.container);
    this._map = null;
    return this;
}

PrintControl.prototype.onReady = function(map) {
    var that = this;

    var layersLoaded = function() {
        if (map.loaded()) {
            that._printBtn.setAttribute('data-toggle', 'modal');
            that._printBtn.setAttribute('data-target', '#map-print-modal') // #map-print-modal is the DOM  ID
            that._printBtn.addEventListener('mousedown', that.initializeCropper.bind(that));

            // export-map is the primary button within the map-print-modal
            document.querySelector('#export-map').addEventListener('mousedown', that.onPrintDown.bind(that));
            that._container.style.display = 'block';
            map.off('render', layersLoaded)
        }
    }

    map.on('render', layersLoaded);
}


PrintControl.prototype.initializeCropper = function (e) {
    var exportView = $('#export-view');
    exportView.attr('src', map.getCanvas().toDataURL());
    exportView.css('max-width', '100%')

    this.cropper = exportView.cropper({
        aspectRatio: 1.3/1,
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
    var dimensions = (size === 'default') ? [816, 1056] : [1056, 1632];

    if (type === 'png') {
        var mapCanvas = map.getCanvas();
        var tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = _this.toPixels(dimensions[1]);
        tmpCanvas.height = _this.toPixels(dimensions[0]);

        var ctx = tmpCanvas.getContext('2d');
        ctx.drawImage(mapCanvas,0,0,mapCanvas.width,mapCanvas.height,0,0,tmpCanvas.width,tmpCanvas.height);

        tmpCanvas.toBlob(function(blob) {
            saveAs(blob, 'map.png');
        });
    } else {
        var pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: dimensions
        });

        if (size === 'default') {
            pdf.addImage(map.getCanvas().toDataURL('image/png'),
                'png', 5, 5, 1046, 705);
            pdf.save('map.pdf');
        } else {
            pdf.addImage(map.getCanvas().toDataURL('image/png'),
                'png', 5, 5, 1435, 965);
            pdf.save('map.pdf');
        }


    }
}

PrintControl.prototype.toPixels = function(val) {
    var conversionFactor = 96;
    return conversionFactor * val;
}


