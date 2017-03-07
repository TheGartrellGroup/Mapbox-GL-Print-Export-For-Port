'use strict';

function PrintControl(options) {
  this.options = options;
}

PrintControl.prototype.onAdd = function(map) {
    this._map = map;

    this._container = document.createElement('div');
    this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';

    this._printBtn = document.createElement('button');
    this._printBtn.className = 'mapboxgl-ctrl-icon mapboxgl-ctrl-print'
    this._printBtn.addEventListener('mousedown', this.onPrintDown.bind(this));

    this._container.appendChild(this._printBtn);
    return this._container;
}

PrintControl.prototype.onRemove = function() {
    this.container.parentNode.removeChild(this.container);
    this._map = null;
    return this;
}

PrintControl.prototype.onPrintDown = function (e) {
    var _this = this;

    bootbox.confirm(_this.createForm(), function(result) {
      if (result) {
        var type = $("form#printForm input[type='radio']:checked").val();
        var dpi = $("form#printForm #dpiInput").val();
        var width = parseInt($("form#printForm #widthInput ").val(), 10);
        var height = parseInt($("form#printForm #heightInput").val(), 10);
        var unit = 'in';

        var zoom = map.getZoom();
        var center = map.getCenter();
        var bearing = map.getBearing();

        _this.printCanvas(width, height, dpi, type, unit, zoom, center, bearing);
      }
    });
}

PrintControl.prototype.createForm = function() {
    var form="";
    form += "<form id=\"printForm\">";
    form += "  <fieldset id=\"config-fields\">";
    form += "  <div class=\"row\">";
    form += "    <div class=\"col-sm-6 col-md-6\">";
    form += "      <div class=\"form-group\">";
    form += "        <label>Output format<\/label><br>";
    form += "        <label class=\"radio-inline\">";
    form += "          <input type=\"radio\" name=\"outputOptions\" value=\"png\" checked> PNG";
    form += "        <\/label>";
    form += "        <label class=\"radio-inline\">";
    form += "          <input type=\"radio\" name=\"outputOptions\" value=\"pdf\"> PDF";
    form += "        <\/label>";
    form += "      <\/div>";
    form += "    <\/div>";
    form += "    <div class=\"col-sm-6 col-md-6\">";
    form += "      <div class=\"form-group\" id=\"dpiGroup\">";
    form += "        <label for=\"dpiInput\">DPI<\/label>";
    form += "        <input type=\"text\" class=\"form-control\" id=\"dpiInput\" autocomplete=\"off\" value=\"300\">";
    form += "      <\/div>";
    form += "    <\/div>";
    form += "  <\/div>";
    form += "  <div class=\"row\">";
    form += "    <div class=\"col-sm-6 col-md-6\">";
    form += "      <div class=\"form-group\" id=\"widthGroup\">";
    form += "        <label for=\"widthInput\">Width<\/label>";
    form += "        <input type=\"text\" class=\"form-control\" id=\"widthInput\" autocomplete=\"off\" value=\"8\">";
    form += "      <\/div>";
    form += "    <\/div>";
    form += "    <div class=\"col-sm-6 col-md-6\">";
    form += "      <div class=\"form-group\" id=\"heightGroup\">";
    form += "        <label for=\"heightInput\">Height<\/label>";
    form += "        <input type=\"text\" class=\"form-control\" id=\"heightInput\" autocomplete=\"off\" value=\"6\">";
    form += "      <\/div>";
    form += "    <\/div>";
    form += "  <\/div>";
    form += "  <\/fieldset>";
    form += "<\/form>";

    return form;
}

PrintControl.prototype.printCanvas = function(width, height, dpi, type, unit, zoom, center, bearing) {
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


