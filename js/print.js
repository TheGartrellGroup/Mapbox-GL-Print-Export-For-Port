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
            map.off('render', layersLoaded);

            that.watchDimensions();
        }
    }

    map.on('render', layersLoaded);
}

PrintControl.prototype.watchDimensions = function(map) {
    var that = this;

    $(document).ready(function() {
        $('input[type=radio][name=dimensions]').change(function() {
            if (this.value === 'default') {
                that.cropper.cropper('setAspectRatio', 1.294)
            }
            else if (this.value == 'large') {
                that.cropper.cropper('setAspectRatio', 1.545)
            }
        });
    });
}


PrintControl.prototype.initializeCropper = function (e) {
    if (this.cropper && this.cropper.cropper()) {
        this.cropper.cropper('destroy');
    }

    var exportView = $('#export-view');
    exportView.attr('src', map.getCanvas().toDataURL());
    exportView.css('max-width', '100%')

    this.cropper = exportView.cropper({
        aspectRatio: 1.294/1,
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
    var mapText = {
        title: $('#export-title').val(),
        subtitle: $('#export-subtitle').val(),
        disclaimer: _this.options.disclaimer
    };
    var zoom = map.getZoom();
    var center = map.getCenter();
    var bearing = map.getBearing();

    _this.printCanvas(type, size, mapText, zoom, center, bearing);
}

PrintControl.prototype.printCanvas = function(type, size, mapText, zoom, center, bearing) {
    var _this = this;
    var dimensions = (size === 'default') ? [612, 792] : [1056, 1632];

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
            unit: 'pt',
            format: dimensions
        });

        if (size === 'default') {
            if (mapText.title !== '' && mapText.subtitle !== '' && mapText.disclaimer !== '') {
                var mar = 20;

                pdf.addImage(_this.cropper.cropper('getCroppedCanvas').toDataURL('image/png'),
                    'png', 0, 0, 792, 504);
                pdf.setFontSize(20);
                pdf.text(mapText.title, mar, 528);

                pdf.setFontSize(16);
                pdf.text(mapText.subtitle, mar, 548);

                pdf.setFontSize(12);
                var lines = pdf.splitTextToSize(mapText.disclaimer, dimensions[1] - (mar * 2));
                pdf.text(mar, 564, lines);
            }

            pdf.save('foo.pdf');
        } else {
            pdf.addImage(_this.cropper.cropper('getCroppedCanvas').toDataURL('image/png'),
                'png', 10, 10, 1430, 960);
            pdf.save('map.pdf');
        }
    }
}


