(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
'use strict';

;var __browserify_shim_require__ = require;(function browserifyShim(module, exports, require, define, browserify_shim__define__module__export__) {
  //============================================================
  //
  // The MIT License
  //
  // Copyright (C) 2014 Matthew Wagerfield - @wagerfield
  //
  // Permission is hereby granted, free of charge, to any
  // person obtaining a copy of this software and associated
  // documentation files (the "Software"), to deal in the
  // Software without restriction, including without limitation
  // the rights to use, copy, modify, merge, publish, distribute,
  // sublicense, and/or sell copies of the Software, and to
  // permit persons to whom the Software is furnished to do
  // so, subject to the following conditions:
  //
  // The above copyright notice and this permission notice
  // shall be included in all copies or substantial portions
  // of the Software.
  //
  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY
  // OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
  // LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
  // FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO
  // EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
  // FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
  // AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  // OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
  // OR OTHER DEALINGS IN THE SOFTWARE.
  //
  //============================================================

  /**
   * Parallax.js
   * @author Matthew Wagerfield - @wagerfield
   * @description Creates a parallax effect between an array of layers,
   *              driving the motion from the gyroscope output of a smartdevice.
   *              If no gyroscope is available, the cursor position is used.
   */
  ;(function (window, document, undefined) {

    // Strict Mode
    'use strict';

    // Constants

    var NAME = 'Parallax';
    var MAGIC_NUMBER = 30;
    var DEFAULTS = {
      relativeInput: false,
      clipRelativeInput: false,
      calibrationThreshold: 100,
      calibrationDelay: 500,
      supportDelay: 500,
      calibrateX: false,
      calibrateY: true,
      invertX: true,
      invertY: true,
      limitX: false,
      limitY: false,
      scalarX: 10.0,
      scalarY: 10.0,
      frictionX: 0.1,
      frictionY: 0.1,
      originX: 0.5,
      originY: 0.5
    };

    function Parallax(element, options) {

      // DOM Context
      this.element = element;
      this.layers = element.getElementsByClassName('layer');

      // Data Extraction
      var data = {
        calibrateX: this.data(this.element, 'calibrate-x'),
        calibrateY: this.data(this.element, 'calibrate-y'),
        invertX: this.data(this.element, 'invert-x'),
        invertY: this.data(this.element, 'invert-y'),
        limitX: this.data(this.element, 'limit-x'),
        limitY: this.data(this.element, 'limit-y'),
        scalarX: this.data(this.element, 'scalar-x'),
        scalarY: this.data(this.element, 'scalar-y'),
        frictionX: this.data(this.element, 'friction-x'),
        frictionY: this.data(this.element, 'friction-y'),
        originX: this.data(this.element, 'origin-x'),
        originY: this.data(this.element, 'origin-y')
      };

      // Delete Null Data Values
      for (var key in data) {
        if (data[key] === null) delete data[key];
      }

      // Compose Settings Object
      this.extend(this, DEFAULTS, options, data);

      // States
      this.calibrationTimer = null;
      this.calibrationFlag = true;
      this.enabled = false;
      this.depths = [];
      this.raf = null;

      // Element Bounds
      this.bounds = null;
      this.ex = 0;
      this.ey = 0;
      this.ew = 0;
      this.eh = 0;

      // Element Center
      this.ecx = 0;
      this.ecy = 0;

      // Element Range
      this.erx = 0;
      this.ery = 0;

      // Calibration
      this.cx = 0;
      this.cy = 0;

      // Input
      this.ix = 0;
      this.iy = 0;

      // Motion
      this.mx = 0;
      this.my = 0;

      // Velocity
      this.vx = 0;
      this.vy = 0;

      // Callbacks
      this.onMouseMove = this.onMouseMove.bind(this);
      this.onDeviceOrientation = this.onDeviceOrientation.bind(this);
      this.onOrientationTimer = this.onOrientationTimer.bind(this);
      this.onCalibrationTimer = this.onCalibrationTimer.bind(this);
      this.onAnimationFrame = this.onAnimationFrame.bind(this);
      this.onWindowResize = this.onWindowResize.bind(this);

      // Initialise
      this.initialise();
    }

    Parallax.prototype.extend = function () {
      if (arguments.length > 1) {
        var master = arguments[0];
        for (var i = 1, l = arguments.length; i < l; i++) {
          var object = arguments[i];
          for (var key in object) {
            master[key] = object[key];
          }
        }
      }
    };

    Parallax.prototype.data = function (element, name) {
      return this.deserialize(element.getAttribute('data-' + name));
    };

    Parallax.prototype.deserialize = function (value) {
      if (value === "true") {
        return true;
      } else if (value === "false") {
        return false;
      } else if (value === "null") {
        return null;
      } else if (!isNaN(parseFloat(value)) && isFinite(value)) {
        return parseFloat(value);
      } else {
        return value;
      }
    };

    Parallax.prototype.camelCase = function (value) {
      return value.replace(/-+(.)?/g, function (match, character) {
        return character ? character.toUpperCase() : '';
      });
    };

    Parallax.prototype.transformSupport = function (value) {
      var element = document.createElement('div');
      var propertySupport = false;
      var propertyValue = null;
      var featureSupport = false;
      var cssProperty = null;
      var jsProperty = null;
      for (var i = 0, l = this.vendors.length; i < l; i++) {
        if (this.vendors[i] !== null) {
          cssProperty = this.vendors[i][0] + 'transform';
          jsProperty = this.vendors[i][1] + 'Transform';
        } else {
          cssProperty = 'transform';
          jsProperty = 'transform';
        }
        if (element.style[jsProperty] !== undefined) {
          propertySupport = true;
          break;
        }
      }
      switch (value) {
        case '2D':
          featureSupport = propertySupport;
          break;
        case '3D':
          if (propertySupport) {
            var body = document.body || document.createElement('body');
            var documentElement = document.documentElement;
            var documentOverflow = documentElement.style.overflow;
            if (!document.body) {
              documentElement.style.overflow = 'hidden';
              documentElement.appendChild(body);
              body.style.overflow = 'hidden';
              body.style.background = '';
            }
            body.appendChild(element);
            element.style[jsProperty] = 'translate3d(1px,1px,1px)';
            propertyValue = window.getComputedStyle(element).getPropertyValue(cssProperty);
            featureSupport = propertyValue !== undefined && propertyValue.length > 0 && propertyValue !== "none";
            documentElement.style.overflow = documentOverflow;
            body.removeChild(element);
          }
          break;
      }
      return featureSupport;
    };

    Parallax.prototype.ww = null;
    Parallax.prototype.wh = null;
    Parallax.prototype.wcx = null;
    Parallax.prototype.wcy = null;
    Parallax.prototype.wrx = null;
    Parallax.prototype.wry = null;
    Parallax.prototype.portrait = null;
    Parallax.prototype.desktop = !navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|BB10|mobi|tablet|opera mini|nexus 7)/i);
    Parallax.prototype.vendors = [null, ['-webkit-', 'webkit'], ['-moz-', 'Moz'], ['-o-', 'O'], ['-ms-', 'ms']];
    Parallax.prototype.motionSupport = !!window.DeviceMotionEvent;
    Parallax.prototype.orientationSupport = !!window.DeviceOrientationEvent;
    Parallax.prototype.orientationStatus = 0;
    Parallax.prototype.transform2DSupport = Parallax.prototype.transformSupport('2D');
    Parallax.prototype.transform3DSupport = Parallax.prototype.transformSupport('3D');
    Parallax.prototype.propertyCache = {};

    Parallax.prototype.initialise = function () {

      // Configure Context Styles
      if (this.transform3DSupport) this.accelerate(this.element);
      var style = window.getComputedStyle(this.element);
      if (style.getPropertyValue('position') === 'static') {
        this.element.style.position = 'relative';
      }

      // Setup
      this.updateLayers();
      this.updateDimensions();
      this.enable();
      this.queueCalibration(this.calibrationDelay);
    };

    Parallax.prototype.updateLayers = function () {

      // Cache Layer Elements
      this.layers = this.element.getElementsByClassName('layer');
      this.depths = [];

      // Configure Layer Styles
      for (var i = 0, l = this.layers.length; i < l; i++) {
        var layer = this.layers[i];
        if (this.transform3DSupport) this.accelerate(layer);
        layer.style.position = i ? 'absolute' : 'relative';
        layer.style.display = 'block';
        layer.style.left = 0;
        layer.style.top = 0;

        // Cache Layer Depth
        this.depths.push(this.data(layer, 'depth') || 0);
      }
    };

    Parallax.prototype.updateDimensions = function () {
      this.ww = window.innerWidth;
      this.wh = window.innerHeight;
      this.wcx = this.ww * this.originX;
      this.wcy = this.wh * this.originY;
      this.wrx = Math.max(this.wcx, this.ww - this.wcx);
      this.wry = Math.max(this.wcy, this.wh - this.wcy);
    };

    Parallax.prototype.updateBounds = function () {
      this.bounds = this.element.getBoundingClientRect();
      this.ex = this.bounds.left;
      this.ey = this.bounds.top;
      this.ew = this.bounds.width;
      this.eh = this.bounds.height;
      this.ecx = this.ew * this.originX;
      this.ecy = this.eh * this.originY;
      this.erx = Math.max(this.ecx, this.ew - this.ecx);
      this.ery = Math.max(this.ecy, this.eh - this.ecy);
    };

    Parallax.prototype.queueCalibration = function (delay) {
      clearTimeout(this.calibrationTimer);
      this.calibrationTimer = setTimeout(this.onCalibrationTimer, delay);
    };

    Parallax.prototype.enable = function () {
      if (!this.enabled) {
        this.enabled = true;
        if (this.orientationSupport) {
          this.portrait = null;
          window.addEventListener('deviceorientation', this.onDeviceOrientation);
          setTimeout(this.onOrientationTimer, this.supportDelay);
        } else {
          this.cx = 0;
          this.cy = 0;
          this.portrait = false;
          window.addEventListener('mousemove', this.onMouseMove);
        }
        window.addEventListener('resize', this.onWindowResize);
        this.raf = requestAnimationFrame(this.onAnimationFrame);
      }
    };

    Parallax.prototype.disable = function () {
      if (this.enabled) {
        this.enabled = false;
        if (this.orientationSupport) {
          window.removeEventListener('deviceorientation', this.onDeviceOrientation);
        } else {
          window.removeEventListener('mousemove', this.onMouseMove);
        }
        window.removeEventListener('resize', this.onWindowResize);
        cancelAnimationFrame(this.raf);
      }
    };

    Parallax.prototype.calibrate = function (x, y) {
      this.calibrateX = x === undefined ? this.calibrateX : x;
      this.calibrateY = y === undefined ? this.calibrateY : y;
    };

    Parallax.prototype.invert = function (x, y) {
      this.invertX = x === undefined ? this.invertX : x;
      this.invertY = y === undefined ? this.invertY : y;
    };

    Parallax.prototype.friction = function (x, y) {
      this.frictionX = x === undefined ? this.frictionX : x;
      this.frictionY = y === undefined ? this.frictionY : y;
    };

    Parallax.prototype.scalar = function (x, y) {
      this.scalarX = x === undefined ? this.scalarX : x;
      this.scalarY = y === undefined ? this.scalarY : y;
    };

    Parallax.prototype.limit = function (x, y) {
      this.limitX = x === undefined ? this.limitX : x;
      this.limitY = y === undefined ? this.limitY : y;
    };

    Parallax.prototype.origin = function (x, y) {
      this.originX = x === undefined ? this.originX : x;
      this.originY = y === undefined ? this.originY : y;
    };

    Parallax.prototype.clamp = function (value, min, max) {
      value = Math.max(value, min);
      value = Math.min(value, max);
      return value;
    };

    Parallax.prototype.css = function (element, property, value) {
      var jsProperty = this.propertyCache[property];
      if (!jsProperty) {
        for (var i = 0, l = this.vendors.length; i < l; i++) {
          if (this.vendors[i] !== null) {
            jsProperty = this.camelCase(this.vendors[i][1] + '-' + property);
          } else {
            jsProperty = property;
          }
          if (element.style[jsProperty] !== undefined) {
            this.propertyCache[property] = jsProperty;
            break;
          }
        }
      }
      element.style[jsProperty] = value;
    };

    Parallax.prototype.accelerate = function (element) {
      this.css(element, 'transform', 'translate3d(0,0,0)');
      this.css(element, 'transform-style', 'preserve-3d');
      this.css(element, 'backface-visibility', 'hidden');
    };

    Parallax.prototype.setPosition = function (element, x, y) {
      x += 'px';
      y += 'px';
      if (this.transform3DSupport) {
        this.css(element, 'transform', 'translate3d(' + x + ',' + y + ',0)');
      } else if (this.transform2DSupport) {
        this.css(element, 'transform', 'translate(' + x + ',' + y + ')');
      } else {
        element.style.left = x;
        element.style.top = y;
      }
    };

    Parallax.prototype.onOrientationTimer = function (event) {
      if (this.orientationSupport && this.orientationStatus === 0) {
        this.disable();
        this.orientationSupport = false;
        this.enable();
      }
    };

    Parallax.prototype.onCalibrationTimer = function (event) {
      this.calibrationFlag = true;
    };

    Parallax.prototype.onWindowResize = function (event) {
      this.updateDimensions();
    };

    Parallax.prototype.onAnimationFrame = function () {
      this.updateBounds();
      var dx = this.ix - this.cx;
      var dy = this.iy - this.cy;
      if (Math.abs(dx) > this.calibrationThreshold || Math.abs(dy) > this.calibrationThreshold) {
        this.queueCalibration(0);
      }
      if (this.portrait) {
        this.mx = this.calibrateX ? dy : this.iy;
        this.my = this.calibrateY ? dx : this.ix;
      } else {
        this.mx = this.calibrateX ? dx : this.ix;
        this.my = this.calibrateY ? dy : this.iy;
      }
      this.mx *= this.ew * (this.scalarX / 100);
      this.my *= this.eh * (this.scalarY / 100);
      if (!isNaN(parseFloat(this.limitX))) {
        this.mx = this.clamp(this.mx, -this.limitX, this.limitX);
      }
      if (!isNaN(parseFloat(this.limitY))) {
        this.my = this.clamp(this.my, -this.limitY, this.limitY);
      }
      this.vx += (this.mx - this.vx) * this.frictionX;
      this.vy += (this.my - this.vy) * this.frictionY;
      for (var i = 0, l = this.layers.length; i < l; i++) {
        var layer = this.layers[i];
        var depth = this.depths[i];
        var xOffset = this.vx * depth * (this.invertX ? -1 : 1);
        var yOffset = this.vy * depth * (this.invertY ? -1 : 1);
        this.setPosition(layer, xOffset, yOffset);
      }
      this.raf = requestAnimationFrame(this.onAnimationFrame);
    };

    Parallax.prototype.onDeviceOrientation = function (event) {

      // Validate environment and event properties.
      if (!this.desktop && event.beta !== null && event.gamma !== null) {

        // Set orientation status.
        this.orientationStatus = 1;

        // Extract Rotation
        var x = (event.beta || 0) / MAGIC_NUMBER; //  -90 :: 90
        var y = (event.gamma || 0) / MAGIC_NUMBER; // -180 :: 180

        // Detect Orientation Change
        var portrait = this.wh > this.ww;
        if (this.portrait !== portrait) {
          this.portrait = portrait;
          this.calibrationFlag = true;
        }

        // Set Calibration
        if (this.calibrationFlag) {
          this.calibrationFlag = false;
          this.cx = x;
          this.cy = y;
        }

        // Set Input
        this.ix = x;
        this.iy = y;
      }
    };

    Parallax.prototype.onMouseMove = function (event) {

      // Cache mouse coordinates.
      var clientX = event.clientX;
      var clientY = event.clientY;

      // Calculate Mouse Input
      if (!this.orientationSupport && this.relativeInput) {

        // Clip mouse coordinates inside element bounds.
        if (this.clipRelativeInput) {
          clientX = Math.max(clientX, this.ex);
          clientX = Math.min(clientX, this.ex + this.ew);
          clientY = Math.max(clientY, this.ey);
          clientY = Math.min(clientY, this.ey + this.eh);
        }

        // Calculate input relative to the element.
        this.ix = (clientX - this.ex - this.ecx) / this.erx;
        this.iy = (clientY - this.ey - this.ecy) / this.ery;
      } else {

        // Calculate input relative to the window.
        this.ix = (clientX - this.wcx) / this.wrx;
        this.iy = (clientY - this.wcy) / this.wry;
      }
    };

    // Expose Parallax
    window[NAME] = Parallax;
  })(window, document);

  /**
   * Request Animation Frame Polyfill.
   * @author Tino Zijdel
   * @author Paul Irish
   * @see https://gist.github.com/paulirish/1579671
   */
  ;(function () {

    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];

    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
      window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = function (callback, element) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function () {
          callback(currTime + timeToCall);
        }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
      };
    }

    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = function (id) {
        clearTimeout(id);
      };
    }
  })();

  ;browserify_shim__define__module__export__(typeof parallax != "undefined" ? parallax : window.parallax);
}).call(global, undefined, undefined, undefined, undefined, function defineExport(ex) {
  module.exports = ex;
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],2:[function(require,module,exports){
'use strict';

var _parallax = require('parallax');

var scene = document.getElementById('scene');
var action = new Parallax(scene, {
  relativeInput: true,
  clipRelativeInput: false,
  hoverOnly: false,
  calibrateX: false,
  calibrateY: true,
  invertX: true,
  invertY: true,
  limitX: false,
  limitY: 500,
  scalarX: 40,
  scalarY: 10,
  frictionX: 0.8,
  frictionY: 0.2,
  originX: 0.5,
  originY: 1.0,
  precision: 1,
  pointerEvents: false,
  onReady: function onReady() {
    alert('ready!');
  }
});

// action.enable();


console.log('kek20');

},{"parallax":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJib3dlcl9jb21wb25lbnRzXFxwYXJhbGxheFxcZGVwbG95XFxib3dlcl9jb21wb25lbnRzXFxwYXJhbGxheFxcZGVwbG95XFxwYXJhbGxheC5qcyIsImpzXFxhcHAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7QUNBQSxDQUFFLElBQUksOEJBQTRCLE9BQWhDLENBQXdDLENBQUMsU0FBUyxjQUFULENBQXdCLE1BQXhCLEVBQWdDLE9BQWhDLEVBQXlDLE9BQXpDLEVBQWtELE1BQWxELEVBQTBELHlDQUExRCxFQUFxRztBQUNoSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7Ozs7Ozs7QUFPQSxHQUFDLENBQUMsVUFBUyxNQUFULEVBQWlCLFFBQWpCLEVBQTJCLFNBQTNCLEVBQXNDOztBQUV0QztBQUNBOztBQUVBOztBQUNBLFFBQUksT0FBTyxVQUFYO0FBQ0EsUUFBSSxlQUFlLEVBQW5CO0FBQ0EsUUFBSSxXQUFXO0FBQ2IscUJBQWUsS0FERjtBQUViLHlCQUFtQixLQUZOO0FBR2IsNEJBQXNCLEdBSFQ7QUFJYix3QkFBa0IsR0FKTDtBQUtiLG9CQUFjLEdBTEQ7QUFNYixrQkFBWSxLQU5DO0FBT2Isa0JBQVksSUFQQztBQVFiLGVBQVMsSUFSSTtBQVNiLGVBQVMsSUFUSTtBQVViLGNBQVEsS0FWSztBQVdiLGNBQVEsS0FYSztBQVliLGVBQVMsSUFaSTtBQWFiLGVBQVMsSUFiSTtBQWNiLGlCQUFXLEdBZEU7QUFlYixpQkFBVyxHQWZFO0FBZ0JiLGVBQVMsR0FoQkk7QUFpQmIsZUFBUztBQWpCSSxLQUFmOztBQW9CQSxhQUFTLFFBQVQsQ0FB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QjtBQWxCVCxDQUFwQixDQUFiOztBQXFCQTs7O0FBR0EsUUFBUSxHQUFSLENBQVksT0FBWiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCI7IHZhciBfX2Jyb3dzZXJpZnlfc2hpbV9yZXF1aXJlX189cmVxdWlyZTsoZnVuY3Rpb24gYnJvd3NlcmlmeVNoaW0obW9kdWxlLCBleHBvcnRzLCByZXF1aXJlLCBkZWZpbmUsIGJyb3dzZXJpZnlfc2hpbV9fZGVmaW5lX19tb2R1bGVfX2V4cG9ydF9fKSB7XG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy9cbi8vIFRoZSBNSVQgTGljZW5zZVxuLy9cbi8vIENvcHlyaWdodCAoQykgMjAxNCBNYXR0aGV3IFdhZ2VyZmllbGQgLSBAd2FnZXJmaWVsZFxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnlcbi8vIHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWRcbi8vIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZVxuLy8gU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvblxuLy8gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsXG4vLyBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG9cbi8vIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkb1xuLy8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlXG4vLyBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zXG4vLyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWVxuLy8gT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1Rcbi8vIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTXG4vLyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk9cbi8vIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRVxuLy8gRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU5cbi8vIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0Vcbi8vIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbi8vXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4vKipcbiAqIFBhcmFsbGF4LmpzXG4gKiBAYXV0aG9yIE1hdHRoZXcgV2FnZXJmaWVsZCAtIEB3YWdlcmZpZWxkXG4gKiBAZGVzY3JpcHRpb24gQ3JlYXRlcyBhIHBhcmFsbGF4IGVmZmVjdCBiZXR3ZWVuIGFuIGFycmF5IG9mIGxheWVycyxcbiAqICAgICAgICAgICAgICBkcml2aW5nIHRoZSBtb3Rpb24gZnJvbSB0aGUgZ3lyb3Njb3BlIG91dHB1dCBvZiBhIHNtYXJ0ZGV2aWNlLlxuICogICAgICAgICAgICAgIElmIG5vIGd5cm9zY29wZSBpcyBhdmFpbGFibGUsIHRoZSBjdXJzb3IgcG9zaXRpb24gaXMgdXNlZC5cbiAqL1xuOyhmdW5jdGlvbih3aW5kb3csIGRvY3VtZW50LCB1bmRlZmluZWQpIHtcblxuICAvLyBTdHJpY3QgTW9kZVxuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gQ29uc3RhbnRzXG4gIHZhciBOQU1FID0gJ1BhcmFsbGF4JztcbiAgdmFyIE1BR0lDX05VTUJFUiA9IDMwO1xuICB2YXIgREVGQVVMVFMgPSB7XG4gICAgcmVsYXRpdmVJbnB1dDogZmFsc2UsXG4gICAgY2xpcFJlbGF0aXZlSW5wdXQ6IGZhbHNlLFxuICAgIGNhbGlicmF0aW9uVGhyZXNob2xkOiAxMDAsXG4gICAgY2FsaWJyYXRpb25EZWxheTogNTAwLFxuICAgIHN1cHBvcnREZWxheTogNTAwLFxuICAgIGNhbGlicmF0ZVg6IGZhbHNlLFxuICAgIGNhbGlicmF0ZVk6IHRydWUsXG4gICAgaW52ZXJ0WDogdHJ1ZSxcbiAgICBpbnZlcnRZOiB0cnVlLFxuICAgIGxpbWl0WDogZmFsc2UsXG4gICAgbGltaXRZOiBmYWxzZSxcbiAgICBzY2FsYXJYOiAxMC4wLFxuICAgIHNjYWxhclk6IDEwLjAsXG4gICAgZnJpY3Rpb25YOiAwLjEsXG4gICAgZnJpY3Rpb25ZOiAwLjEsXG4gICAgb3JpZ2luWDogMC41LFxuICAgIG9yaWdpblk6IDAuNVxuICB9O1xuXG4gIGZ1bmN0aW9uIFBhcmFsbGF4KGVsZW1lbnQsIG9wdGlvbnMpIHtcblxuICAgIC8vIERPTSBDb250ZXh0XG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLmxheWVycyA9IGVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnbGF5ZXInKTtcblxuICAgIC8vIERhdGEgRXh0cmFjdGlvblxuICAgIHZhciBkYXRhID0ge1xuICAgICAgY2FsaWJyYXRlWDogdGhpcy5kYXRhKHRoaXMuZWxlbWVudCwgJ2NhbGlicmF0ZS14JyksXG4gICAgICBjYWxpYnJhdGVZOiB0aGlzLmRhdGEodGhpcy5lbGVtZW50LCAnY2FsaWJyYXRlLXknKSxcbiAgICAgIGludmVydFg6IHRoaXMuZGF0YSh0aGlzLmVsZW1lbnQsICdpbnZlcnQteCcpLFxuICAgICAgaW52ZXJ0WTogdGhpcy5kYXRhKHRoaXMuZWxlbWVudCwgJ2ludmVydC15JyksXG4gICAgICBsaW1pdFg6IHRoaXMuZGF0YSh0aGlzLmVsZW1lbnQsICdsaW1pdC14JyksXG4gICAgICBsaW1pdFk6IHRoaXMuZGF0YSh0aGlzLmVsZW1lbnQsICdsaW1pdC15JyksXG4gICAgICBzY2FsYXJYOiB0aGlzLmRhdGEodGhpcy5lbGVtZW50LCAnc2NhbGFyLXgnKSxcbiAgICAgIHNjYWxhclk6IHRoaXMuZGF0YSh0aGlzLmVsZW1lbnQsICdzY2FsYXIteScpLFxuICAgICAgZnJpY3Rpb25YOiB0aGlzLmRhdGEodGhpcy5lbGVtZW50LCAnZnJpY3Rpb24teCcpLFxuICAgICAgZnJpY3Rpb25ZOiB0aGlzLmRhdGEodGhpcy5lbGVtZW50LCAnZnJpY3Rpb24teScpLFxuICAgICAgb3JpZ2luWDogdGhpcy5kYXRhKHRoaXMuZWxlbWVudCwgJ29yaWdpbi14JyksXG4gICAgICBvcmlnaW5ZOiB0aGlzLmRhdGEodGhpcy5lbGVtZW50LCAnb3JpZ2luLXknKVxuICAgIH07XG5cbiAgICAvLyBEZWxldGUgTnVsbCBEYXRhIFZhbHVlc1xuICAgIGZvciAodmFyIGtleSBpbiBkYXRhKSB7XG4gICAgICBpZiAoZGF0YVtrZXldID09PSBudWxsKSBkZWxldGUgZGF0YVtrZXldO1xuICAgIH1cblxuICAgIC8vIENvbXBvc2UgU2V0dGluZ3MgT2JqZWN0XG4gICAgdGhpcy5leHRlbmQodGhpcywgREVGQVVMVFMsIG9wdGlvbnMsIGRhdGEpO1xuXG4gICAgLy8gU3RhdGVzXG4gICAgdGhpcy5jYWxpYnJhdGlvblRpbWVyID0gbnVsbDtcbiAgICB0aGlzLmNhbGlicmF0aW9uRmxhZyA9IHRydWU7XG4gICAgdGhpcy5lbmFibGVkID0gZmFsc2U7XG4gICAgdGhpcy5kZXB0aHMgPSBbXTtcbiAgICB0aGlzLnJhZiA9IG51bGw7XG5cbiAgICAvLyBFbGVtZW50IEJvdW5kc1xuICAgIHRoaXMuYm91bmRzID0gbnVsbDtcbiAgICB0aGlzLmV4ID0gMDtcbiAgICB0aGlzLmV5ID0gMDtcbiAgICB0aGlzLmV3ID0gMDtcbiAgICB0aGlzLmVoID0gMDtcblxuICAgIC8vIEVsZW1lbnQgQ2VudGVyXG4gICAgdGhpcy5lY3ggPSAwO1xuICAgIHRoaXMuZWN5ID0gMDtcblxuICAgIC8vIEVsZW1lbnQgUmFuZ2VcbiAgICB0aGlzLmVyeCA9IDA7XG4gICAgdGhpcy5lcnkgPSAwO1xuXG4gICAgLy8gQ2FsaWJyYXRpb25cbiAgICB0aGlzLmN4ID0gMDtcbiAgICB0aGlzLmN5ID0gMDtcblxuICAgIC8vIElucHV0XG4gICAgdGhpcy5peCA9IDA7XG4gICAgdGhpcy5peSA9IDA7XG5cbiAgICAvLyBNb3Rpb25cbiAgICB0aGlzLm14ID0gMDtcbiAgICB0aGlzLm15ID0gMDtcblxuICAgIC8vIFZlbG9jaXR5XG4gICAgdGhpcy52eCA9IDA7XG4gICAgdGhpcy52eSA9IDA7XG5cbiAgICAvLyBDYWxsYmFja3NcbiAgICB0aGlzLm9uTW91c2VNb3ZlID0gdGhpcy5vbk1vdXNlTW92ZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMub25EZXZpY2VPcmllbnRhdGlvbiA9IHRoaXMub25EZXZpY2VPcmllbnRhdGlvbi5iaW5kKHRoaXMpO1xuICAgIHRoaXMub25PcmllbnRhdGlvblRpbWVyID0gdGhpcy5vbk9yaWVudGF0aW9uVGltZXIuYmluZCh0aGlzKTtcbiAgICB0aGlzLm9uQ2FsaWJyYXRpb25UaW1lciA9IHRoaXMub25DYWxpYnJhdGlvblRpbWVyLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vbkFuaW1hdGlvbkZyYW1lID0gdGhpcy5vbkFuaW1hdGlvbkZyYW1lLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vbldpbmRvd1Jlc2l6ZSA9IHRoaXMub25XaW5kb3dSZXNpemUuYmluZCh0aGlzKTtcblxuICAgIC8vIEluaXRpYWxpc2VcbiAgICB0aGlzLmluaXRpYWxpc2UoKTtcbiAgfVxuXG4gIFBhcmFsbGF4LnByb3RvdHlwZS5leHRlbmQgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgIHZhciBtYXN0ZXIgPSBhcmd1bWVudHNbMF07XG4gICAgICBmb3IgKHZhciBpID0gMSwgbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgdmFyIG9iamVjdCA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIG9iamVjdCkge1xuICAgICAgICAgIG1hc3RlcltrZXldID0gb2JqZWN0W2tleV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgUGFyYWxsYXgucHJvdG90eXBlLmRhdGEgPSBmdW5jdGlvbihlbGVtZW50LCBuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMuZGVzZXJpYWxpemUoZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtJytuYW1lKSk7XG4gIH07XG5cbiAgUGFyYWxsYXgucHJvdG90eXBlLmRlc2VyaWFsaXplID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT09IFwidHJ1ZVwiKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKHZhbHVlID09PSBcImZhbHNlXCIpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKHZhbHVlID09PSBcIm51bGxcIikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSBlbHNlIGlmICghaXNOYU4ocGFyc2VGbG9hdCh2YWx1ZSkpICYmIGlzRmluaXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIHBhcnNlRmxvYXQodmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICB9O1xuXG4gIFBhcmFsbGF4LnByb3RvdHlwZS5jYW1lbENhc2UgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZS5yZXBsYWNlKC8tKyguKT8vZywgZnVuY3Rpb24obWF0Y2gsIGNoYXJhY3Rlcil7XG4gICAgICByZXR1cm4gY2hhcmFjdGVyID8gY2hhcmFjdGVyLnRvVXBwZXJDYXNlKCkgOiAnJztcbiAgICB9KTtcbiAgfTtcblxuICBQYXJhbGxheC5wcm90b3R5cGUudHJhbnNmb3JtU3VwcG9ydCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB2YXIgcHJvcGVydHlTdXBwb3J0ID0gZmFsc2U7XG4gICAgdmFyIHByb3BlcnR5VmFsdWUgPSBudWxsO1xuICAgIHZhciBmZWF0dXJlU3VwcG9ydCA9IGZhbHNlO1xuICAgIHZhciBjc3NQcm9wZXJ0eSA9IG51bGw7XG4gICAgdmFyIGpzUHJvcGVydHkgPSBudWxsO1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy52ZW5kb3JzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgaWYgKHRoaXMudmVuZG9yc1tpXSAhPT0gbnVsbCkge1xuICAgICAgICBjc3NQcm9wZXJ0eSA9IHRoaXMudmVuZG9yc1tpXVswXSArICd0cmFuc2Zvcm0nO1xuICAgICAgICBqc1Byb3BlcnR5ID0gdGhpcy52ZW5kb3JzW2ldWzFdICsgJ1RyYW5zZm9ybSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjc3NQcm9wZXJ0eSA9ICd0cmFuc2Zvcm0nO1xuICAgICAgICBqc1Byb3BlcnR5ID0gJ3RyYW5zZm9ybSc7XG4gICAgICB9XG4gICAgICBpZiAoZWxlbWVudC5zdHlsZVtqc1Byb3BlcnR5XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHByb3BlcnR5U3VwcG9ydCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBzd2l0Y2godmFsdWUpIHtcbiAgICAgIGNhc2UgJzJEJzpcbiAgICAgICAgZmVhdHVyZVN1cHBvcnQgPSBwcm9wZXJ0eVN1cHBvcnQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnM0QnOlxuICAgICAgICBpZiAocHJvcGVydHlTdXBwb3J0KSB7XG4gICAgICAgICAgdmFyIGJvZHkgPSBkb2N1bWVudC5ib2R5IHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2JvZHknKTtcbiAgICAgICAgICB2YXIgZG9jdW1lbnRFbGVtZW50ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICAgICAgICAgIHZhciBkb2N1bWVudE92ZXJmbG93ID0gZG9jdW1lbnRFbGVtZW50LnN0eWxlLm92ZXJmbG93O1xuICAgICAgICAgIGlmICghZG9jdW1lbnQuYm9keSkge1xuICAgICAgICAgICAgZG9jdW1lbnRFbGVtZW50LnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG4gICAgICAgICAgICBkb2N1bWVudEVsZW1lbnQuYXBwZW5kQ2hpbGQoYm9keSk7XG4gICAgICAgICAgICBib2R5LnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG4gICAgICAgICAgICBib2R5LnN0eWxlLmJhY2tncm91bmQgPSAnJztcbiAgICAgICAgICB9XG4gICAgICAgICAgYm9keS5hcHBlbmRDaGlsZChlbGVtZW50KTtcbiAgICAgICAgICBlbGVtZW50LnN0eWxlW2pzUHJvcGVydHldID0gJ3RyYW5zbGF0ZTNkKDFweCwxcHgsMXB4KSc7XG4gICAgICAgICAgcHJvcGVydHlWYWx1ZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpLmdldFByb3BlcnR5VmFsdWUoY3NzUHJvcGVydHkpO1xuICAgICAgICAgIGZlYXR1cmVTdXBwb3J0ID0gcHJvcGVydHlWYWx1ZSAhPT0gdW5kZWZpbmVkICYmIHByb3BlcnR5VmFsdWUubGVuZ3RoID4gMCAmJiBwcm9wZXJ0eVZhbHVlICE9PSBcIm5vbmVcIjtcbiAgICAgICAgICBkb2N1bWVudEVsZW1lbnQuc3R5bGUub3ZlcmZsb3cgPSBkb2N1bWVudE92ZXJmbG93O1xuICAgICAgICAgIGJvZHkucmVtb3ZlQ2hpbGQoZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiBmZWF0dXJlU3VwcG9ydDtcbiAgfTtcblxuICBQYXJhbGxheC5wcm90b3R5cGUud3cgPSBudWxsO1xuICBQYXJhbGxheC5wcm90b3R5cGUud2ggPSBudWxsO1xuICBQYXJhbGxheC5wcm90b3R5cGUud2N4ID0gbnVsbDtcbiAgUGFyYWxsYXgucHJvdG90eXBlLndjeSA9IG51bGw7XG4gIFBhcmFsbGF4LnByb3RvdHlwZS53cnggPSBudWxsO1xuICBQYXJhbGxheC5wcm90b3R5cGUud3J5ID0gbnVsbDtcbiAgUGFyYWxsYXgucHJvdG90eXBlLnBvcnRyYWl0ID0gbnVsbDtcbiAgUGFyYWxsYXgucHJvdG90eXBlLmRlc2t0b3AgPSAhbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvKGlQaG9uZXxpUG9kfGlQYWR8QW5kcm9pZHxCbGFja0JlcnJ5fEJCMTB8bW9iaXx0YWJsZXR8b3BlcmEgbWluaXxuZXh1cyA3KS9pKTtcbiAgUGFyYWxsYXgucHJvdG90eXBlLnZlbmRvcnMgPSBbbnVsbCxbJy13ZWJraXQtJywnd2Via2l0J10sWyctbW96LScsJ01veiddLFsnLW8tJywnTyddLFsnLW1zLScsJ21zJ11dO1xuICBQYXJhbGxheC5wcm90b3R5cGUubW90aW9uU3VwcG9ydCA9ICEhd2luZG93LkRldmljZU1vdGlvbkV2ZW50O1xuICBQYXJhbGxheC5wcm90b3R5cGUub3JpZW50YXRpb25TdXBwb3J0ID0gISF3aW5kb3cuRGV2aWNlT3JpZW50YXRpb25FdmVudDtcbiAgUGFyYWxsYXgucHJvdG90eXBlLm9yaWVudGF0aW9uU3RhdHVzID0gMDtcbiAgUGFyYWxsYXgucHJvdG90eXBlLnRyYW5zZm9ybTJEU3VwcG9ydCA9IFBhcmFsbGF4LnByb3RvdHlwZS50cmFuc2Zvcm1TdXBwb3J0KCcyRCcpO1xuICBQYXJhbGxheC5wcm90b3R5cGUudHJhbnNmb3JtM0RTdXBwb3J0ID0gUGFyYWxsYXgucHJvdG90eXBlLnRyYW5zZm9ybVN1cHBvcnQoJzNEJyk7XG4gIFBhcmFsbGF4LnByb3RvdHlwZS5wcm9wZXJ0eUNhY2hlID0ge307XG5cbiAgUGFyYWxsYXgucHJvdG90eXBlLmluaXRpYWxpc2UgPSBmdW5jdGlvbigpIHtcblxuICAgIC8vIENvbmZpZ3VyZSBDb250ZXh0IFN0eWxlc1xuICAgIGlmICh0aGlzLnRyYW5zZm9ybTNEU3VwcG9ydCkgdGhpcy5hY2NlbGVyYXRlKHRoaXMuZWxlbWVudCk7XG4gICAgdmFyIHN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUodGhpcy5lbGVtZW50KTtcbiAgICBpZiAoc3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgncG9zaXRpb24nKSA9PT0gJ3N0YXRpYycpIHtcbiAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG4gICAgfVxuXG4gICAgLy8gU2V0dXBcbiAgICB0aGlzLnVwZGF0ZUxheWVycygpO1xuICAgIHRoaXMudXBkYXRlRGltZW5zaW9ucygpO1xuICAgIHRoaXMuZW5hYmxlKCk7XG4gICAgdGhpcy5xdWV1ZUNhbGlicmF0aW9uKHRoaXMuY2FsaWJyYXRpb25EZWxheSk7XG4gIH07XG5cbiAgUGFyYWxsYXgucHJvdG90eXBlLnVwZGF0ZUxheWVycyA9IGZ1bmN0aW9uKCkge1xuXG4gICAgLy8gQ2FjaGUgTGF5ZXIgRWxlbWVudHNcbiAgICB0aGlzLmxheWVycyA9IHRoaXMuZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdsYXllcicpO1xuICAgIHRoaXMuZGVwdGhzID0gW107XG5cbiAgICAvLyBDb25maWd1cmUgTGF5ZXIgU3R5bGVzXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLmxheWVycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHZhciBsYXllciA9IHRoaXMubGF5ZXJzW2ldO1xuICAgICAgaWYgKHRoaXMudHJhbnNmb3JtM0RTdXBwb3J0KSB0aGlzLmFjY2VsZXJhdGUobGF5ZXIpO1xuICAgICAgbGF5ZXIuc3R5bGUucG9zaXRpb24gPSBpID8gJ2Fic29sdXRlJyA6ICdyZWxhdGl2ZSc7XG4gICAgICBsYXllci5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgIGxheWVyLnN0eWxlLmxlZnQgPSAwO1xuICAgICAgbGF5ZXIuc3R5bGUudG9wID0gMDtcblxuICAgICAgLy8gQ2FjaGUgTGF5ZXIgRGVwdGhcbiAgICAgIHRoaXMuZGVwdGhzLnB1c2godGhpcy5kYXRhKGxheWVyLCAnZGVwdGgnKSB8fCAwKTtcbiAgICB9XG4gIH07XG5cbiAgUGFyYWxsYXgucHJvdG90eXBlLnVwZGF0ZURpbWVuc2lvbnMgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnd3ID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgdGhpcy53aCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICB0aGlzLndjeCA9IHRoaXMud3cgKiB0aGlzLm9yaWdpblg7XG4gICAgdGhpcy53Y3kgPSB0aGlzLndoICogdGhpcy5vcmlnaW5ZO1xuICAgIHRoaXMud3J4ID0gTWF0aC5tYXgodGhpcy53Y3gsIHRoaXMud3cgLSB0aGlzLndjeCk7XG4gICAgdGhpcy53cnkgPSBNYXRoLm1heCh0aGlzLndjeSwgdGhpcy53aCAtIHRoaXMud2N5KTtcbiAgfTtcblxuICBQYXJhbGxheC5wcm90b3R5cGUudXBkYXRlQm91bmRzID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5ib3VuZHMgPSB0aGlzLmVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgdGhpcy5leCA9IHRoaXMuYm91bmRzLmxlZnQ7XG4gICAgdGhpcy5leSA9IHRoaXMuYm91bmRzLnRvcDtcbiAgICB0aGlzLmV3ID0gdGhpcy5ib3VuZHMud2lkdGg7XG4gICAgdGhpcy5laCA9IHRoaXMuYm91bmRzLmhlaWdodDtcbiAgICB0aGlzLmVjeCA9IHRoaXMuZXcgKiB0aGlzLm9yaWdpblg7XG4gICAgdGhpcy5lY3kgPSB0aGlzLmVoICogdGhpcy5vcmlnaW5ZO1xuICAgIHRoaXMuZXJ4ID0gTWF0aC5tYXgodGhpcy5lY3gsIHRoaXMuZXcgLSB0aGlzLmVjeCk7XG4gICAgdGhpcy5lcnkgPSBNYXRoLm1heCh0aGlzLmVjeSwgdGhpcy5laCAtIHRoaXMuZWN5KTtcbiAgfTtcblxuICBQYXJhbGxheC5wcm90b3R5cGUucXVldWVDYWxpYnJhdGlvbiA9IGZ1bmN0aW9uKGRlbGF5KSB7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuY2FsaWJyYXRpb25UaW1lcik7XG4gICAgdGhpcy5jYWxpYnJhdGlvblRpbWVyID0gc2V0VGltZW91dCh0aGlzLm9uQ2FsaWJyYXRpb25UaW1lciwgZGVsYXkpO1xuICB9O1xuXG4gIFBhcmFsbGF4LnByb3RvdHlwZS5lbmFibGUgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRoaXMuZW5hYmxlZCkge1xuICAgICAgdGhpcy5lbmFibGVkID0gdHJ1ZTtcbiAgICAgIGlmICh0aGlzLm9yaWVudGF0aW9uU3VwcG9ydCkge1xuICAgICAgICB0aGlzLnBvcnRyYWl0ID0gbnVsbDtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2RldmljZW9yaWVudGF0aW9uJywgdGhpcy5vbkRldmljZU9yaWVudGF0aW9uKTtcbiAgICAgICAgc2V0VGltZW91dCh0aGlzLm9uT3JpZW50YXRpb25UaW1lciwgdGhpcy5zdXBwb3J0RGVsYXkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5jeCA9IDA7XG4gICAgICAgIHRoaXMuY3kgPSAwO1xuICAgICAgICB0aGlzLnBvcnRyYWl0ID0gZmFsc2U7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLm9uTW91c2VNb3ZlKTtcbiAgICAgIH1cbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aGlzLm9uV2luZG93UmVzaXplKTtcbiAgICAgIHRoaXMucmFmID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMub25BbmltYXRpb25GcmFtZSk7XG4gICAgfVxuICB9O1xuXG4gIFBhcmFsbGF4LnByb3RvdHlwZS5kaXNhYmxlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuZW5hYmxlZCkge1xuICAgICAgdGhpcy5lbmFibGVkID0gZmFsc2U7XG4gICAgICBpZiAodGhpcy5vcmllbnRhdGlvblN1cHBvcnQpIHtcbiAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2RldmljZW9yaWVudGF0aW9uJywgdGhpcy5vbkRldmljZU9yaWVudGF0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLm9uTW91c2VNb3ZlKTtcbiAgICAgIH1cbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aGlzLm9uV2luZG93UmVzaXplKTtcbiAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMucmFmKTtcbiAgICB9XG4gIH07XG5cbiAgUGFyYWxsYXgucHJvdG90eXBlLmNhbGlicmF0ZSA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICB0aGlzLmNhbGlicmF0ZVggPSB4ID09PSB1bmRlZmluZWQgPyB0aGlzLmNhbGlicmF0ZVggOiB4O1xuICAgIHRoaXMuY2FsaWJyYXRlWSA9IHkgPT09IHVuZGVmaW5lZCA/IHRoaXMuY2FsaWJyYXRlWSA6IHk7XG4gIH07XG5cbiAgUGFyYWxsYXgucHJvdG90eXBlLmludmVydCA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICB0aGlzLmludmVydFggPSB4ID09PSB1bmRlZmluZWQgPyB0aGlzLmludmVydFggOiB4O1xuICAgIHRoaXMuaW52ZXJ0WSA9IHkgPT09IHVuZGVmaW5lZCA/IHRoaXMuaW52ZXJ0WSA6IHk7XG4gIH07XG5cbiAgUGFyYWxsYXgucHJvdG90eXBlLmZyaWN0aW9uID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIHRoaXMuZnJpY3Rpb25YID0geCA9PT0gdW5kZWZpbmVkID8gdGhpcy5mcmljdGlvblggOiB4O1xuICAgIHRoaXMuZnJpY3Rpb25ZID0geSA9PT0gdW5kZWZpbmVkID8gdGhpcy5mcmljdGlvblkgOiB5O1xuICB9O1xuXG4gIFBhcmFsbGF4LnByb3RvdHlwZS5zY2FsYXIgPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgdGhpcy5zY2FsYXJYID0geCA9PT0gdW5kZWZpbmVkID8gdGhpcy5zY2FsYXJYIDogeDtcbiAgICB0aGlzLnNjYWxhclkgPSB5ID09PSB1bmRlZmluZWQgPyB0aGlzLnNjYWxhclkgOiB5O1xuICB9O1xuXG4gIFBhcmFsbGF4LnByb3RvdHlwZS5saW1pdCA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICB0aGlzLmxpbWl0WCA9IHggPT09IHVuZGVmaW5lZCA/IHRoaXMubGltaXRYIDogeDtcbiAgICB0aGlzLmxpbWl0WSA9IHkgPT09IHVuZGVmaW5lZCA/IHRoaXMubGltaXRZIDogeTtcbiAgfTtcblxuICBQYXJhbGxheC5wcm90b3R5cGUub3JpZ2luID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIHRoaXMub3JpZ2luWCA9IHggPT09IHVuZGVmaW5lZCA/IHRoaXMub3JpZ2luWCA6IHg7XG4gICAgdGhpcy5vcmlnaW5ZID0geSA9PT0gdW5kZWZpbmVkID8gdGhpcy5vcmlnaW5ZIDogeTtcbiAgfTtcblxuICBQYXJhbGxheC5wcm90b3R5cGUuY2xhbXAgPSBmdW5jdGlvbih2YWx1ZSwgbWluLCBtYXgpIHtcbiAgICB2YWx1ZSA9IE1hdGgubWF4KHZhbHVlLCBtaW4pO1xuICAgIHZhbHVlID0gTWF0aC5taW4odmFsdWUsIG1heCk7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9O1xuXG4gIFBhcmFsbGF4LnByb3RvdHlwZS5jc3MgPSBmdW5jdGlvbihlbGVtZW50LCBwcm9wZXJ0eSwgdmFsdWUpIHtcbiAgICB2YXIganNQcm9wZXJ0eSA9IHRoaXMucHJvcGVydHlDYWNoZVtwcm9wZXJ0eV07XG4gICAgaWYgKCFqc1Byb3BlcnR5KSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMudmVuZG9ycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgaWYgKHRoaXMudmVuZG9yc1tpXSAhPT0gbnVsbCkge1xuICAgICAgICAgIGpzUHJvcGVydHkgPSB0aGlzLmNhbWVsQ2FzZSh0aGlzLnZlbmRvcnNbaV1bMV0gKyAnLScgKyBwcm9wZXJ0eSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAganNQcm9wZXJ0eSA9IHByb3BlcnR5O1xuICAgICAgICB9XG4gICAgICAgIGlmIChlbGVtZW50LnN0eWxlW2pzUHJvcGVydHldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aGlzLnByb3BlcnR5Q2FjaGVbcHJvcGVydHldID0ganNQcm9wZXJ0eTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBlbGVtZW50LnN0eWxlW2pzUHJvcGVydHldID0gdmFsdWU7XG4gIH07XG5cbiAgUGFyYWxsYXgucHJvdG90eXBlLmFjY2VsZXJhdGUgPSBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgdGhpcy5jc3MoZWxlbWVudCwgJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUzZCgwLDAsMCknKTtcbiAgICB0aGlzLmNzcyhlbGVtZW50LCAndHJhbnNmb3JtLXN0eWxlJywgJ3ByZXNlcnZlLTNkJyk7XG4gICAgdGhpcy5jc3MoZWxlbWVudCwgJ2JhY2tmYWNlLXZpc2liaWxpdHknLCAnaGlkZGVuJyk7XG4gIH07XG5cbiAgUGFyYWxsYXgucHJvdG90eXBlLnNldFBvc2l0aW9uID0gZnVuY3Rpb24oZWxlbWVudCwgeCwgeSkge1xuICAgIHggKz0gJ3B4JztcbiAgICB5ICs9ICdweCc7XG4gICAgaWYgKHRoaXMudHJhbnNmb3JtM0RTdXBwb3J0KSB7XG4gICAgICB0aGlzLmNzcyhlbGVtZW50LCAndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZTNkKCcreCsnLCcreSsnLDApJyk7XG4gICAgfSBlbHNlIGlmICh0aGlzLnRyYW5zZm9ybTJEU3VwcG9ydCkge1xuICAgICAgdGhpcy5jc3MoZWxlbWVudCwgJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyt4KycsJyt5KycpJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsZW1lbnQuc3R5bGUubGVmdCA9IHg7XG4gICAgICBlbGVtZW50LnN0eWxlLnRvcCA9IHk7XG4gICAgfVxuICB9O1xuXG4gIFBhcmFsbGF4LnByb3RvdHlwZS5vbk9yaWVudGF0aW9uVGltZXIgPSBmdW5jdGlvbihldmVudCkge1xuICAgIGlmICh0aGlzLm9yaWVudGF0aW9uU3VwcG9ydCAmJiB0aGlzLm9yaWVudGF0aW9uU3RhdHVzID09PSAwKSB7XG4gICAgICB0aGlzLmRpc2FibGUoKTtcbiAgICAgIHRoaXMub3JpZW50YXRpb25TdXBwb3J0ID0gZmFsc2U7XG4gICAgICB0aGlzLmVuYWJsZSgpO1xuICAgIH1cbiAgfTtcblxuICBQYXJhbGxheC5wcm90b3R5cGUub25DYWxpYnJhdGlvblRpbWVyID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICB0aGlzLmNhbGlicmF0aW9uRmxhZyA9IHRydWU7XG4gIH07XG5cbiAgUGFyYWxsYXgucHJvdG90eXBlLm9uV2luZG93UmVzaXplID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICB0aGlzLnVwZGF0ZURpbWVuc2lvbnMoKTtcbiAgfTtcblxuICBQYXJhbGxheC5wcm90b3R5cGUub25BbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMudXBkYXRlQm91bmRzKCk7XG4gICAgdmFyIGR4ID0gdGhpcy5peCAtIHRoaXMuY3g7XG4gICAgdmFyIGR5ID0gdGhpcy5peSAtIHRoaXMuY3k7XG4gICAgaWYgKChNYXRoLmFicyhkeCkgPiB0aGlzLmNhbGlicmF0aW9uVGhyZXNob2xkKSB8fCAoTWF0aC5hYnMoZHkpID4gdGhpcy5jYWxpYnJhdGlvblRocmVzaG9sZCkpIHtcbiAgICAgIHRoaXMucXVldWVDYWxpYnJhdGlvbigwKTtcbiAgICB9XG4gICAgaWYgKHRoaXMucG9ydHJhaXQpIHtcbiAgICAgIHRoaXMubXggPSB0aGlzLmNhbGlicmF0ZVggPyBkeSA6IHRoaXMuaXk7XG4gICAgICB0aGlzLm15ID0gdGhpcy5jYWxpYnJhdGVZID8gZHggOiB0aGlzLml4O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm14ID0gdGhpcy5jYWxpYnJhdGVYID8gZHggOiB0aGlzLml4O1xuICAgICAgdGhpcy5teSA9IHRoaXMuY2FsaWJyYXRlWSA/IGR5IDogdGhpcy5peTtcbiAgICB9XG4gICAgdGhpcy5teCAqPSB0aGlzLmV3ICogKHRoaXMuc2NhbGFyWCAvIDEwMCk7XG4gICAgdGhpcy5teSAqPSB0aGlzLmVoICogKHRoaXMuc2NhbGFyWSAvIDEwMCk7XG4gICAgaWYgKCFpc05hTihwYXJzZUZsb2F0KHRoaXMubGltaXRYKSkpIHtcbiAgICAgIHRoaXMubXggPSB0aGlzLmNsYW1wKHRoaXMubXgsIC10aGlzLmxpbWl0WCwgdGhpcy5saW1pdFgpO1xuICAgIH1cbiAgICBpZiAoIWlzTmFOKHBhcnNlRmxvYXQodGhpcy5saW1pdFkpKSkge1xuICAgICAgdGhpcy5teSA9IHRoaXMuY2xhbXAodGhpcy5teSwgLXRoaXMubGltaXRZLCB0aGlzLmxpbWl0WSk7XG4gICAgfVxuICAgIHRoaXMudnggKz0gKHRoaXMubXggLSB0aGlzLnZ4KSAqIHRoaXMuZnJpY3Rpb25YO1xuICAgIHRoaXMudnkgKz0gKHRoaXMubXkgLSB0aGlzLnZ5KSAqIHRoaXMuZnJpY3Rpb25ZO1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5sYXllcnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2YXIgbGF5ZXIgPSB0aGlzLmxheWVyc1tpXTtcbiAgICAgIHZhciBkZXB0aCA9IHRoaXMuZGVwdGhzW2ldO1xuICAgICAgdmFyIHhPZmZzZXQgPSB0aGlzLnZ4ICogZGVwdGggKiAodGhpcy5pbnZlcnRYID8gLTEgOiAxKTtcbiAgICAgIHZhciB5T2Zmc2V0ID0gdGhpcy52eSAqIGRlcHRoICogKHRoaXMuaW52ZXJ0WSA/IC0xIDogMSk7XG4gICAgICB0aGlzLnNldFBvc2l0aW9uKGxheWVyLCB4T2Zmc2V0LCB5T2Zmc2V0KTtcbiAgICB9XG4gICAgdGhpcy5yYWYgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5vbkFuaW1hdGlvbkZyYW1lKTtcbiAgfTtcblxuICBQYXJhbGxheC5wcm90b3R5cGUub25EZXZpY2VPcmllbnRhdGlvbiA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cbiAgICAvLyBWYWxpZGF0ZSBlbnZpcm9ubWVudCBhbmQgZXZlbnQgcHJvcGVydGllcy5cbiAgICBpZiAoIXRoaXMuZGVza3RvcCAmJiBldmVudC5iZXRhICE9PSBudWxsICYmIGV2ZW50LmdhbW1hICE9PSBudWxsKSB7XG5cbiAgICAgIC8vIFNldCBvcmllbnRhdGlvbiBzdGF0dXMuXG4gICAgICB0aGlzLm9yaWVudGF0aW9uU3RhdHVzID0gMTtcblxuICAgICAgLy8gRXh0cmFjdCBSb3RhdGlvblxuICAgICAgdmFyIHggPSAoZXZlbnQuYmV0YSAgfHwgMCkgLyBNQUdJQ19OVU1CRVI7IC8vICAtOTAgOjogOTBcbiAgICAgIHZhciB5ID0gKGV2ZW50LmdhbW1hIHx8IDApIC8gTUFHSUNfTlVNQkVSOyAvLyAtMTgwIDo6IDE4MFxuXG4gICAgICAvLyBEZXRlY3QgT3JpZW50YXRpb24gQ2hhbmdlXG4gICAgICB2YXIgcG9ydHJhaXQgPSB0aGlzLndoID4gdGhpcy53dztcbiAgICAgIGlmICh0aGlzLnBvcnRyYWl0ICE9PSBwb3J0cmFpdCkge1xuICAgICAgICB0aGlzLnBvcnRyYWl0ID0gcG9ydHJhaXQ7XG4gICAgICAgIHRoaXMuY2FsaWJyYXRpb25GbGFnID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gU2V0IENhbGlicmF0aW9uXG4gICAgICBpZiAodGhpcy5jYWxpYnJhdGlvbkZsYWcpIHtcbiAgICAgICAgdGhpcy5jYWxpYnJhdGlvbkZsYWcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5jeCA9IHg7XG4gICAgICAgIHRoaXMuY3kgPSB5O1xuICAgICAgfVxuXG4gICAgICAvLyBTZXQgSW5wdXRcbiAgICAgIHRoaXMuaXggPSB4O1xuICAgICAgdGhpcy5peSA9IHk7XG4gICAgfVxuICB9O1xuXG4gIFBhcmFsbGF4LnByb3RvdHlwZS5vbk1vdXNlTW92ZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cbiAgICAvLyBDYWNoZSBtb3VzZSBjb29yZGluYXRlcy5cbiAgICB2YXIgY2xpZW50WCA9IGV2ZW50LmNsaWVudFg7XG4gICAgdmFyIGNsaWVudFkgPSBldmVudC5jbGllbnRZO1xuXG4gICAgLy8gQ2FsY3VsYXRlIE1vdXNlIElucHV0XG4gICAgaWYgKCF0aGlzLm9yaWVudGF0aW9uU3VwcG9ydCAmJiB0aGlzLnJlbGF0aXZlSW5wdXQpIHtcblxuICAgICAgLy8gQ2xpcCBtb3VzZSBjb29yZGluYXRlcyBpbnNpZGUgZWxlbWVudCBib3VuZHMuXG4gICAgICBpZiAodGhpcy5jbGlwUmVsYXRpdmVJbnB1dCkge1xuICAgICAgICBjbGllbnRYID0gTWF0aC5tYXgoY2xpZW50WCwgdGhpcy5leCk7XG4gICAgICAgIGNsaWVudFggPSBNYXRoLm1pbihjbGllbnRYLCB0aGlzLmV4ICsgdGhpcy5ldyk7XG4gICAgICAgIGNsaWVudFkgPSBNYXRoLm1heChjbGllbnRZLCB0aGlzLmV5KTtcbiAgICAgICAgY2xpZW50WSA9IE1hdGgubWluKGNsaWVudFksIHRoaXMuZXkgKyB0aGlzLmVoKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ2FsY3VsYXRlIGlucHV0IHJlbGF0aXZlIHRvIHRoZSBlbGVtZW50LlxuICAgICAgdGhpcy5peCA9IChjbGllbnRYIC0gdGhpcy5leCAtIHRoaXMuZWN4KSAvIHRoaXMuZXJ4O1xuICAgICAgdGhpcy5peSA9IChjbGllbnRZIC0gdGhpcy5leSAtIHRoaXMuZWN5KSAvIHRoaXMuZXJ5O1xuXG4gICAgfSBlbHNlIHtcblxuICAgICAgLy8gQ2FsY3VsYXRlIGlucHV0IHJlbGF0aXZlIHRvIHRoZSB3aW5kb3cuXG4gICAgICB0aGlzLml4ID0gKGNsaWVudFggLSB0aGlzLndjeCkgLyB0aGlzLndyeDtcbiAgICAgIHRoaXMuaXkgPSAoY2xpZW50WSAtIHRoaXMud2N5KSAvIHRoaXMud3J5O1xuICAgIH1cbiAgfTtcblxuICAvLyBFeHBvc2UgUGFyYWxsYXhcbiAgd2luZG93W05BTUVdID0gUGFyYWxsYXg7XG5cbn0pKHdpbmRvdywgZG9jdW1lbnQpO1xuXG4vKipcbiAqIFJlcXVlc3QgQW5pbWF0aW9uIEZyYW1lIFBvbHlmaWxsLlxuICogQGF1dGhvciBUaW5vIFppamRlbFxuICogQGF1dGhvciBQYXVsIElyaXNoXG4gKiBAc2VlIGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL3BhdWxpcmlzaC8xNTc5NjcxXG4gKi9cbjsoZnVuY3Rpb24oKSB7XG5cbiAgdmFyIGxhc3RUaW1lID0gMDtcbiAgdmFyIHZlbmRvcnMgPSBbJ21zJywgJ21veicsICd3ZWJraXQnLCAnbyddO1xuXG4gIGZvcih2YXIgeCA9IDA7IHggPCB2ZW5kb3JzLmxlbmd0aCAmJiAhd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZTsgKyt4KSB7XG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvd1t2ZW5kb3JzW3hdKydSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXTtcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSB3aW5kb3dbdmVuZG9yc1t4XSsnQ2FuY2VsQW5pbWF0aW9uRnJhbWUnXSB8fCB3aW5kb3dbdmVuZG9yc1t4XSsnQ2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XG4gIH1cblxuICBpZiAoIXdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUpIHtcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oY2FsbGJhY2ssIGVsZW1lbnQpIHtcbiAgICAgIHZhciBjdXJyVGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgdmFyIHRpbWVUb0NhbGwgPSBNYXRoLm1heCgwLCAxNiAtIChjdXJyVGltZSAtIGxhc3RUaW1lKSk7XG4gICAgICB2YXIgaWQgPSB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2FsbGJhY2soY3VyclRpbWUgKyB0aW1lVG9DYWxsKTsgfSxcbiAgICAgICAgdGltZVRvQ2FsbCk7XG4gICAgICBsYXN0VGltZSA9IGN1cnJUaW1lICsgdGltZVRvQ2FsbDtcbiAgICAgIHJldHVybiBpZDtcbiAgICB9O1xuICB9XG5cbiAgaWYgKCF3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUpIHtcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihpZCkge1xuICAgICAgY2xlYXJUaW1lb3V0KGlkKTtcbiAgICB9O1xuICB9XG5cbn0oKSk7XG5cbjsgYnJvd3NlcmlmeV9zaGltX19kZWZpbmVfX21vZHVsZV9fZXhwb3J0X18odHlwZW9mIHBhcmFsbGF4ICE9IFwidW5kZWZpbmVkXCIgPyBwYXJhbGxheCA6IHdpbmRvdy5wYXJhbGxheCk7XG5cbn0pLmNhbGwoZ2xvYmFsLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGZ1bmN0aW9uIGRlZmluZUV4cG9ydChleCkgeyBtb2R1bGUuZXhwb3J0cyA9IGV4OyB9KTtcbiIsImltcG9ydCB7cGFyYWxsYXh9IGZyb20gJ3BhcmFsbGF4JztcclxuXHJcblxyXG5cclxudmFyIHNjZW5lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NjZW5lJyk7XHJcbnZhciBhY3Rpb24gPSBuZXcgUGFyYWxsYXgoc2NlbmUsIHtcclxuICByZWxhdGl2ZUlucHV0OiB0cnVlLFxyXG4gIGNsaXBSZWxhdGl2ZUlucHV0OiBmYWxzZSxcclxuICBob3Zlck9ubHk6IGZhbHNlLFxyXG4gIGNhbGlicmF0ZVg6IGZhbHNlLFxyXG4gIGNhbGlicmF0ZVk6IHRydWUsXHJcbiAgaW52ZXJ0WDogdHJ1ZSxcclxuICBpbnZlcnRZOiB0cnVlLFxyXG4gIGxpbWl0WDogZmFsc2UsXHJcbiAgbGltaXRZOiA1MDAsXHJcbiAgc2NhbGFyWDogNDAsXHJcbiAgc2NhbGFyWTogMTAsXHJcbiAgZnJpY3Rpb25YOiAwLjgsXHJcbiAgZnJpY3Rpb25ZOiAwLjIsXHJcbiAgb3JpZ2luWDogMC41LFxyXG4gIG9yaWdpblk6IDEuMCxcclxuICBwcmVjaXNpb246IDEsXHJcbiAgcG9pbnRlckV2ZW50czogZmFsc2UsXHJcbiAgb25SZWFkeTogZnVuY3Rpb24oKSB7IGFsZXJ0KCdyZWFkeSEnKTsgfVxyXG59KTtcclxuXHJcbi8vIGFjdGlvbi5lbmFibGUoKTtcclxuXHJcblxyXG5jb25zb2xlLmxvZygna2VrMjAnKSJdfQ==
