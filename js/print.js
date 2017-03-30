'use strict';

// in inches
var default_height = 7.3,
    large_height = 9.5,
    legend_width = 2.5;

const DEFAULT_HEIGHT = default_height * 72;
const DEFAULT_WIDTH = 792;
const DEFAULT_RATIO = DEFAULT_WIDTH / DEFAULT_HEIGHT;

const LARGE_HEIGHT = large_height * 72;
const LARGE_WIDTH = 1224 - (legend_width * 72);
const LARGE_RATIO = LARGE_WIDTH / LARGE_HEIGHT;

const MARGINS = 20;

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
    var _this = this;

    $(document).ready(function() {
        $('input[type=radio][name=dimensions]').change(function() {
            if (this.value === 'default') {
                _this.cropper.cropper('setAspectRatio', DEFAULT_RATIO)
            } else if (this.value == 'large') {
                _this.cropper.cropper('setAspectRatio', LARGE_RATIO)
            }
        });
    });
}


PrintControl.prototype.initializeCropper = function(e) {
    if (this.cropper && this.cropper.cropper()) {
        this.cropper.cropper('destroy');
    }

    var exportView = $('#export-view');
    exportView.attr('src', map.getCanvas().toDataURL());
    exportView.css('max-width', '100%')

    this.cropper = exportView.cropper({
        aspectRatio: DEFAULT_RATIO,
        zoomable: false,
        zoomOnWheel: false,
        minContainerHeight: 300,
        minContainerWidth: 568,
    })
}

PrintControl.prototype.onPrintDown = function(e) {
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

    type === 'png' ? _this.printPNG(size, mapText, zoom, center, bearing) : _this.printPDF(size, mapText, zoom, center, bearing)
}

PrintControl.prototype.printPNG = function(size, mapText, zoom, center, bearing) {
    var mapCanvas = this.cropper.cropper('getCroppedCanvas');

    if (size === 'default') {
        if (mapText.title !== '' && mapText.subtitle !== '' && mapText.disclaimer !== '') {}
        var tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = _this.toPixels(mapCanvas.width);
        tmpCanvas.height = _this.toPixels(mapCanvas[0]);

        var ctx = tmpCanvas.getContext('2d');
        ctx.drawImage(mapCanvas, 10, 10);

        tmpCanvas.toBlob(function(blob) {
            saveAs(blob, 'map.png');
        })
    }
}

PrintControl.prototype.printPDF = function(size, mapText, zoom, center, bearing) {
    var _this = this;
    var dimensions = (size === 'default') ? [612, 792] : [792, 1224];
    var pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: dimensions
    });

    if (size === 'default') {
        if (mapText.title !== '' && mapText.subtitle !== '' && mapText.disclaimer !== '') {
            pdf.addImage(_this.cropper.cropper('getCroppedCanvas').toDataURL('image/png'),
                'png', 0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);

            var pad1 = 20;
            pdf.setFontSize(pad1 - 5);
            pdf.text(mapText.title, MARGINS, DEFAULT_HEIGHT + pad1);

            var pad2 = 16;
            pdf.setFontSize(pad2 - 2);
            pdf.text(mapText.subtitle, MARGINS, DEFAULT_HEIGHT + pad1 + pad2);

            var pad3 = 13;
            pdf.setFontSize(pad3 - 3);
            var lines = pdf.splitTextToSize(mapText.disclaimer, DEFAULT_WIDTH - (MARGINS * 2));
            pdf.text(MARGINS, DEFAULT_HEIGHT + pad1 + pad2 + pad3, lines);

            //north arrow
            _this.addNorthArrow(DEFAULT_HEIGHT, pad1, DEFAULT_WIDTH, size, pdf);

        } else if (mapText.title !== '' && mapText.disclaimer !== '') {
            var height = DEFAULT_HEIGHT + 4;
            pdf.addImage(_this.cropper.cropper('getCroppedCanvas').toDataURL('image/png'),
                'png', 0, 0, DEFAULT_WIDTH, height);

            var pad1 = 23;
            pdf.setFontSize(pad1 - 8);
            pdf.text(mapText.title, MARGINS, height + pad1);

            var pad2 = 18;
            pdf.setFontSize(pad2 - 8);
            var lines = pdf.splitTextToSize(mapText.disclaimer, DEFAULT_WIDTH - (MARGINS * 2));
            pdf.text(MARGINS, height + pad1 + pad2, lines);

            //north arrow
            _this.addNorthArrow(DEFAULT_HEIGHT, pad1, DEFAULT_WIDTH, size, pdf);
        }
    } else {
        if (mapText.title !== '' && mapText.subtitle !== '' && mapText.disclaimer !== '') {
            pdf.addImage(_this.cropper.cropper('getCroppedCanvas').toDataURL('image/png'),
                'png', 0, 0, LARGE_WIDTH, LARGE_HEIGHT);

            var pad1 = 26;
            pdf.setFontSize(pad1 - 5);
            pdf.text(mapText.title, MARGINS, LARGE_HEIGHT + pad1);

            var pad2 = 22;
            pdf.setFontSize(pad2 - 6);
            pdf.text(mapText.subtitle, MARGINS, LARGE_HEIGHT + pad1 + pad2);

            var pad3 = 19;
            pdf.setFontSize(pad3 - 6);
            var lines = pdf.splitTextToSize(mapText.disclaimer, LARGE_WIDTH - (MARGINS * 2));
            pdf.text(MARGINS, LARGE_HEIGHT + pad1 + pad2 + pad3, lines);

            var pad4 = 23;
            var startLegend = LARGE_WIDTH + 6;
            pdf.setFontSize(pad4 - 6);
            pdf.text('Legend', startLegend, pad4);

            this.buildLegend(startLegend, pad4, pdf);

            //north arrow
            _this.addNorthArrow(DEFAULT_HEIGHT, pad1, DEFAULT_WIDTH, size, pdf);

        } else if (mapText.title !== '' && mapText.disclaimer !== '') {
            var height = LARGE_HEIGHT + 4;
            pdf.addImage(_this.cropper.cropper('getCroppedCanvas').toDataURL('image/png'),
                'png', 0, 0, LARGE_WIDTH, height);

            var pad1 = 29;
            pdf.setFontSize(pad1 - 8);
            pdf.text(mapText.title, MARGINS, height + pad1);

            var pad2 = 22;
            pdf.setFontSize(pad2 - 8);
            var lines = pdf.splitTextToSize(mapText.disclaimer, LARGE_WIDTH - (MARGINS * 2));
            pdf.text(MARGINS, height + pad1 + pad2, lines);

            var pad3 = 23;
            var startLegend = LARGE_WIDTH + 6;
            pdf.setFontSize(pad3 - 6);
            pdf.text('Legend', startLegend, pad3);

            this.buildLegend(startLegend, pad3, pdf);

            //north arrow
            _this.addNorthArrow(DEFAULT_HEIGHT, pad1, DEFAULT_WIDTH, size, pdf);
        }
    }
    setTimeout(function() {
      pdf.save('map.pdf');
    }, 1500);
}

PrintControl.prototype.addNorthArrow = function (height, pad, width, size, pdf) {
    var _this = this;
    var canvas = document.createElement("canvas");
    canvas.id = 'north-arrow-canvas';

    if (size === 'default') {
      canvas.width = 35;
      canvas.height = 35;
    } else {
      canvas.width = 50;
      canvas.height = 50;
    }

    canvas.attributes.h = height + pad;
    canvas.attributes.w = width;
    canvas.attributes.s = size;

    var ctx = canvas.getContext("2d");
    var img = new Image();

    img.onload = function() {
        // roate north arrow
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate(_this._map.getBearing() * -1 * Math.PI/180);
        ctx.drawImage(img, canvas.width / -2, canvas.height / -2, canvas.width, canvas.height);

        var dataURL = canvas.toDataURL('image/png');
        console.log(dataURL)
        if (canvas.attributes.s === 'default') {
          var w = canvas.attributes.w - canvas.width * 3.5;
          var h = canvas.attributes.h - 15;
        } else {
          var w = canvas.attributes.w + canvas.width * 1.5;
          var h = canvas.attributes.h + canvas.height * 2.75;
        }
        pdf.addImage(dataURL, 'png', w , h);
    }
    img.crossOrigin = '';
    img.src = this.options.northArrow;
  }

PrintControl.prototype.buildLegend = function(width, height, pdf) {
    var _this = this;
    var map = _this._map;

    // map layers
    var layers = map.getStyle().layers.filter(function(lyr) {
        return (lyr.source && lyr.source !== 'composite' && lyr.source.indexOf('mapbox-gl-draw') == -1 && lyr.layout.visibility === 'visible')
    });

    // layer config
    var lyrConfig = map.lyrs;
    var labelSize = 14;
    var startingWidth = width + 2;
    var startingHeight = height + 8;

    var groupLayers = lyrConfig.filter(function(lyr) {
        return (lyr.hasOwnProperty('layerGroup'))
    })

    var groupLayerTracker = [];

    pdf.setFontSize(labelSize);

    for (var i = layers.length - 1; i >= 0; i--) {
        var startingHeight = startingHeight + labelSize;
        var layer = layers[i];
        var nonGroupedLayer = lyrConfig.filter(function(lyr) {
            return (lyr.id === layer.id)
        })

        if (nonGroupedLayer.length) {
            var mapLayer = nonGroupedLayer[0];
            var id = mapLayer.id;

            var elm = document.querySelector('#' + id + ' i');
            var imgElm = document.querySelector('#' + id + ' img');

            // font-awesome icon?
            if (elm) {
                _this.addFontAwesome(elm, id, pdf, startingWidth, startingHeight);
            // custom images?
            } else if (imgElm) {
                _this.addImage(imgElm, id, pdf, startingWidth, startingHeight);
            }

            pdf.text(mapLayer.name, startingWidth + 18, startingHeight);
        } else {
            var foundParent = groupLayers.filter(function(lay) {
                return lay.layerGroup.filter(function(ly) {
                    if (ly.id === layer.name) {
                        return lay;
                    }
                })
            })

            if (foundParent.length > 0) {
                // have we added this group of layers yet?
                if (groupLayerTracker.indexOf(layer.id) === -1) {
                    pdf.text(foundParent[0].name, startingWidth + 18, startingHeight);

                    var layerGroup = foundParent[0].layerGroup;
                    var childLayers = [];

                    //get childLayers within a specific layerGroup
                    for (var ml = layers.length - 1; ml >= 0; ml--) {
                        for (var lg = 0; lg < layerGroup.length; lg++) {
                          if (layers[ml].id === layerGroup[lg].id) {
                            childLayers.push(layerGroup[lg]);
                          }
                        };
                    };

                    for (var c = 0; c < childLayers.length; c++) {
                        var id = childLayers[c].id;

                        var childHeight = startingHeight + (c * labelSize) + ((c + 1) * 6);
                        groupLayerTracker.push(childLayers[c].id);

                        var elm = document.querySelector('#' + id + ' i');
                        var imgElm = document.querySelector('#' + id + ' img');

                        // font awesome icon?
                        if (elm) {
                            _this.addFontAwesome(elm, id, pdf, startingWidth + 22, childHeight + labelSize);
                        // custom image icon?
                        } else if (imgElm) {
                            _this.addImage(imgElm, id, pdf, startingWidth + 22, childHeight + labelSize);
                        }

                        pdf.text(childLayers[c].name, startingWidth + 40, childHeight + labelSize);
                    };

                    startingHeight = childHeight;
                }
            }
        }
        startingHeight = startingHeight + 4;
    }
}

PrintControl.prototype.addImage = function(imgElm, id, pdf, startingWidth, startingHeight) {
    var canvas = document.createElement("canvas");
    canvas.id = id + '-canvas';
    canvas.width = 18;
    canvas.height = 18;

    var ctx = canvas.getContext("2d");

    var img = new Image();
    img.onload = function() {
        ctx.drawImage(img, 0, 0, 18, 18);
        var dataURL = canvas.toDataURL('image/png');
        pdf.addImage(dataURL, 'png', startingWidth + 1, startingHeight - (canvas.height / 2) - 2);
    }
    img.crossOrigin = '';
    img.src = imgElm.src;
}

PrintControl.prototype.addFontAwesome = function(elm, id, pdf, startingWidth, startingHeight) {
    var character = window.getComputedStyle(
        elm, ':before'
    ).getPropertyValue('content').replace(/['"]+/g, '');

    var canvas = document.createElement("canvas");
    canvas.id = id + '-canvas';
    canvas.width = 36;
    canvas.height = 36;

    var ctx = canvas.getContext("2d");
    ctx.fillStyle = elm.style.color;
    ctx.font = "18px FontAwesome";
    ctx.textBaseline = "top";
    ctx.textAlign = "start";
    ctx.fillText(character, 9, 9);

    var dataURL = canvas.toDataURL('image/png')
    pdf.addImage(dataURL, 'png', startingWidth - 4, startingHeight - (canvas.height / 2));
}
