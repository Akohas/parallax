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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJib3dlcl9jb21wb25lbnRzL3BhcmFsbGF4L2RlcGxveS9wYXJhbGxheC5qcyIsImpzL2FwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztBQ0FBLENBQUUsSUFBSSw4QkFBNEIsT0FBaEMsQ0FBd0MsQ0FBQyxTQUFTLGNBQVQsQ0FBd0IsTUFBeEIsRUFBZ0MsT0FBaEMsRUFBeUMsT0FBekMsRUFBa0QsTUFBbEQsRUFBMEQseUNBQTFELEVBQXFHO0FBQ2hKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7Ozs7OztBQU9BLEdBQUMsQ0FBQyxVQUFTLE1BQVQsRUFBaUIsUUFBakIsRUFBMkIsU0FBM0IsRUFBc0M7O0FBRXRDO0FBQ0E7O0FBRUE7O0FBQ0EsUUFBSSxPQUFPLFVBQVg7QUFDQSxRQUFJLGVBQWUsRUFBbkI7QUFDQSxRQUFJLFdBQVc7QUFDYixxQkFBZSxLQURGO0FBRWIseUJBQW1CLEtBRk47QUFHYiw0QkFBc0IsR0FIVDtBQUliLHdCQUFrQixHQUpMO0FBS2Isb0JBQWMsR0FMRDtBQU1iLGtCQUFZLEtBTkM7QUFPYixrQkFBWSxJQVBDO0FBUWIsZUFBUyxJQVJJO0FBU2IsZUFBUyxJQVRJO0FBVWIsY0FBUSxLQVZLO0FBV2IsY0FBUSxLQVhLO0FBWWIsZUFBUyxJQVpJO0FBYWIsZUFBUyxJQWJJO0FBY2IsaUJBQVcsR0FkRTtBQWViLGlCQUFXLEdBZkU7QUFnQmIsZUFBUyxHQWhCSTtBQWlCYixlQUFTO0FBakJJLEtBQWY7O0FBb0JBLGFBQVMsUUFBVCxDQUFrQixPQUFsQixFQUEyQixPQUEzQixFQUFvQzs7QUFFbEM7QUFDQSxX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QVIsQ0FBWSxPQUFaIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIjsgdmFyIF9fYnJvd3NlcmlmeV9zaGltX3JlcXVpcmVfXz1yZXF1aXJlOyhmdW5jdGlvbiBicm93c2VyaWZ5U2hpbShtb2R1bGUsIGV4cG9ydHMsIHJlcXVpcmUsIGRlZmluZSwgYnJvd3NlcmlmeV9zaGltX19kZWZpbmVfX21vZHVsZV9fZXhwb3J0X18pIHtcbi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vL1xuLy8gVGhlIE1JVCBMaWNlbnNlXG4vL1xuLy8gQ29weXJpZ2h0IChDKSAyMDE0IE1hdHRoZXcgV2FnZXJmaWVsZCAtIEB3YWdlcmZpZWxkXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueVxuLy8gcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZFxuLy8gZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlXG4vLyBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uXG4vLyB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSxcbi8vIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0b1xuLy8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvXG4vLyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Vcbi8vIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnNcbi8vIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZXG4vLyBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVFxuLy8gTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1Ncbi8vIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOT1xuLy8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFXG4vLyBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTlxuLy8gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRVxuLy8gT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuLy9cbi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbi8qKlxuICogUGFyYWxsYXguanNcbiAqIEBhdXRob3IgTWF0dGhldyBXYWdlcmZpZWxkIC0gQHdhZ2VyZmllbGRcbiAqIEBkZXNjcmlwdGlvbiBDcmVhdGVzIGEgcGFyYWxsYXggZWZmZWN0IGJldHdlZW4gYW4gYXJyYXkgb2YgbGF5ZXJzLFxuICogICAgICAgICAgICAgIGRyaXZpbmcgdGhlIG1vdGlvbiBmcm9tIHRoZSBneXJvc2NvcGUgb3V0cHV0IG9mIGEgc21hcnRkZXZpY2UuXG4gKiAgICAgICAgICAgICAgSWYgbm8gZ3lyb3Njb3BlIGlzIGF2YWlsYWJsZSwgdGhlIGN1cnNvciBwb3NpdGlvbiBpcyB1c2VkLlxuICovXG47KGZ1bmN0aW9uKHdpbmRvdywgZG9jdW1lbnQsIHVuZGVmaW5lZCkge1xuXG4gIC8vIFN0cmljdCBNb2RlXG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBDb25zdGFudHNcbiAgdmFyIE5BTUUgPSAnUGFyYWxsYXgnO1xuICB2YXIgTUFHSUNfTlVNQkVSID0gMzA7XG4gIHZhciBERUZBVUxUUyA9IHtcbiAgICByZWxhdGl2ZUlucHV0OiBmYWxzZSxcbiAgICBjbGlwUmVsYXRpdmVJbnB1dDogZmFsc2UsXG4gICAgY2FsaWJyYXRpb25UaHJlc2hvbGQ6IDEwMCxcbiAgICBjYWxpYnJhdGlvbkRlbGF5OiA1MDAsXG4gICAgc3VwcG9ydERlbGF5OiA1MDAsXG4gICAgY2FsaWJyYXRlWDogZmFsc2UsXG4gICAgY2FsaWJyYXRlWTogdHJ1ZSxcbiAgICBpbnZlcnRYOiB0cnVlLFxuICAgIGludmVydFk6IHRydWUsXG4gICAgbGltaXRYOiBmYWxzZSxcbiAgICBsaW1pdFk6IGZhbHNlLFxuICAgIHNjYWxhclg6IDEwLjAsXG4gICAgc2NhbGFyWTogMTAuMCxcbiAgICBmcmljdGlvblg6IDAuMSxcbiAgICBmcmljdGlvblk6IDAuMSxcbiAgICBvcmlnaW5YOiAwLjUsXG4gICAgb3JpZ2luWTogMC41XG4gIH07XG5cbiAgZnVuY3Rpb24gUGFyYWxsYXgoZWxlbWVudCwgb3B0aW9ucykge1xuXG4gICAgLy8gRE9NIENvbnRleHRcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMubGF5ZXJzID0gZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdsYXllcicpO1xuXG4gICAgLy8gRGF0YSBFeHRyYWN0aW9uXG4gICAgdmFyIGRhdGEgPSB7XG4gICAgICBjYWxpYnJhdGVYOiB0aGlzLmRhdGEodGhpcy5lbGVtZW50LCAnY2FsaWJyYXRlLXgnKSxcbiAgICAgIGNhbGlicmF0ZVk6IHRoaXMuZGF0YSh0aGlzLmVsZW1lbnQsICdjYWxpYnJhdGUteScpLFxuICAgICAgaW52ZXJ0WDogdGhpcy5kYXRhKHRoaXMuZWxlbWVudCwgJ2ludmVydC14JyksXG4gICAgICBpbnZlcnRZOiB0aGlzLmRhdGEodGhpcy5lbGVtZW50LCAnaW52ZXJ0LXknKSxcbiAgICAgIGxpbWl0WDogdGhpcy5kYXRhKHRoaXMuZWxlbWVudCwgJ2xpbWl0LXgnKSxcbiAgICAgIGxpbWl0WTogdGhpcy5kYXRhKHRoaXMuZWxlbWVudCwgJ2xpbWl0LXknKSxcbiAgICAgIHNjYWxhclg6IHRoaXMuZGF0YSh0aGlzLmVsZW1lbnQsICdzY2FsYXIteCcpLFxuICAgICAgc2NhbGFyWTogdGhpcy5kYXRhKHRoaXMuZWxlbWVudCwgJ3NjYWxhci15JyksXG4gICAgICBmcmljdGlvblg6IHRoaXMuZGF0YSh0aGlzLmVsZW1lbnQsICdmcmljdGlvbi14JyksXG4gICAgICBmcmljdGlvblk6IHRoaXMuZGF0YSh0aGlzLmVsZW1lbnQsICdmcmljdGlvbi15JyksXG4gICAgICBvcmlnaW5YOiB0aGlzLmRhdGEodGhpcy5lbGVtZW50LCAnb3JpZ2luLXgnKSxcbiAgICAgIG9yaWdpblk6IHRoaXMuZGF0YSh0aGlzLmVsZW1lbnQsICdvcmlnaW4teScpXG4gICAgfTtcblxuICAgIC8vIERlbGV0ZSBOdWxsIERhdGEgVmFsdWVzXG4gICAgZm9yICh2YXIga2V5IGluIGRhdGEpIHtcbiAgICAgIGlmIChkYXRhW2tleV0gPT09IG51bGwpIGRlbGV0ZSBkYXRhW2tleV07XG4gICAgfVxuXG4gICAgLy8gQ29tcG9zZSBTZXR0aW5ncyBPYmplY3RcbiAgICB0aGlzLmV4dGVuZCh0aGlzLCBERUZBVUxUUywgb3B0aW9ucywgZGF0YSk7XG5cbiAgICAvLyBTdGF0ZXNcbiAgICB0aGlzLmNhbGlicmF0aW9uVGltZXIgPSBudWxsO1xuICAgIHRoaXMuY2FsaWJyYXRpb25GbGFnID0gdHJ1ZTtcbiAgICB0aGlzLmVuYWJsZWQgPSBmYWxzZTtcbiAgICB0aGlzLmRlcHRocyA9IFtdO1xuICAgIHRoaXMucmFmID0gbnVsbDtcblxuICAgIC8vIEVsZW1lbnQgQm91bmRzXG4gICAgdGhpcy5ib3VuZHMgPSBudWxsO1xuICAgIHRoaXMuZXggPSAwO1xuICAgIHRoaXMuZXkgPSAwO1xuICAgIHRoaXMuZXcgPSAwO1xuICAgIHRoaXMuZWggPSAwO1xuXG4gICAgLy8gRWxlbWVudCBDZW50ZXJcbiAgICB0aGlzLmVjeCA9IDA7XG4gICAgdGhpcy5lY3kgPSAwO1xuXG4gICAgLy8gRWxlbWVudCBSYW5nZVxuICAgIHRoaXMuZXJ4ID0gMDtcbiAgICB0aGlzLmVyeSA9IDA7XG5cbiAgICAvLyBDYWxpYnJhdGlvblxuICAgIHRoaXMuY3ggPSAwO1xuICAgIHRoaXMuY3kgPSAwO1xuXG4gICAgLy8gSW5wdXRcbiAgICB0aGlzLml4ID0gMDtcbiAgICB0aGlzLml5ID0gMDtcblxuICAgIC8vIE1vdGlvblxuICAgIHRoaXMubXggPSAwO1xuICAgIHRoaXMubXkgPSAwO1xuXG4gICAgLy8gVmVsb2NpdHlcbiAgICB0aGlzLnZ4ID0gMDtcbiAgICB0aGlzLnZ5ID0gMDtcblxuICAgIC8vIENhbGxiYWNrc1xuICAgIHRoaXMub25Nb3VzZU1vdmUgPSB0aGlzLm9uTW91c2VNb3ZlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vbkRldmljZU9yaWVudGF0aW9uID0gdGhpcy5vbkRldmljZU9yaWVudGF0aW9uLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vbk9yaWVudGF0aW9uVGltZXIgPSB0aGlzLm9uT3JpZW50YXRpb25UaW1lci5iaW5kKHRoaXMpO1xuICAgIHRoaXMub25DYWxpYnJhdGlvblRpbWVyID0gdGhpcy5vbkNhbGlicmF0aW9uVGltZXIuYmluZCh0aGlzKTtcbiAgICB0aGlzLm9uQW5pbWF0aW9uRnJhbWUgPSB0aGlzLm9uQW5pbWF0aW9uRnJhbWUuYmluZCh0aGlzKTtcbiAgICB0aGlzLm9uV2luZG93UmVzaXplID0gdGhpcy5vbldpbmRvd1Jlc2l6ZS5iaW5kKHRoaXMpO1xuXG4gICAgLy8gSW5pdGlhbGlzZVxuICAgIHRoaXMuaW5pdGlhbGlzZSgpO1xuICB9XG5cbiAgUGFyYWxsYXgucHJvdG90eXBlLmV4dGVuZCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgdmFyIG1hc3RlciA9IGFyZ3VtZW50c1swXTtcbiAgICAgIGZvciAodmFyIGkgPSAxLCBsID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICB2YXIgb2JqZWN0ID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqZWN0KSB7XG4gICAgICAgICAgbWFzdGVyW2tleV0gPSBvYmplY3Rba2V5XTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBQYXJhbGxheC5wcm90b3R5cGUuZGF0YSA9IGZ1bmN0aW9uKGVsZW1lbnQsIG5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5kZXNlcmlhbGl6ZShlbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS0nK25hbWUpKTtcbiAgfTtcblxuICBQYXJhbGxheC5wcm90b3R5cGUuZGVzZXJpYWxpemUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PT0gXCJ0cnVlXCIpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSBpZiAodmFsdWUgPT09IFwiZmFsc2VcIikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSBpZiAodmFsdWUgPT09IFwibnVsbFwiKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9IGVsc2UgaWYgKCFpc05hTihwYXJzZUZsb2F0KHZhbHVlKSkgJiYgaXNGaW5pdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gcGFyc2VGbG9hdCh2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gIH07XG5cbiAgUGFyYWxsYXgucHJvdG90eXBlLmNhbWVsQ2FzZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoLy0rKC4pPy9nLCBmdW5jdGlvbihtYXRjaCwgY2hhcmFjdGVyKXtcbiAgICAgIHJldHVybiBjaGFyYWN0ZXIgPyBjaGFyYWN0ZXIudG9VcHBlckNhc2UoKSA6ICcnO1xuICAgIH0pO1xuICB9O1xuXG4gIFBhcmFsbGF4LnByb3RvdHlwZS50cmFuc2Zvcm1TdXBwb3J0ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHZhciBwcm9wZXJ0eVN1cHBvcnQgPSBmYWxzZTtcbiAgICB2YXIgcHJvcGVydHlWYWx1ZSA9IG51bGw7XG4gICAgdmFyIGZlYXR1cmVTdXBwb3J0ID0gZmFsc2U7XG4gICAgdmFyIGNzc1Byb3BlcnR5ID0gbnVsbDtcbiAgICB2YXIganNQcm9wZXJ0eSA9IG51bGw7XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLnZlbmRvcnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBpZiAodGhpcy52ZW5kb3JzW2ldICE9PSBudWxsKSB7XG4gICAgICAgIGNzc1Byb3BlcnR5ID0gdGhpcy52ZW5kb3JzW2ldWzBdICsgJ3RyYW5zZm9ybSc7XG4gICAgICAgIGpzUHJvcGVydHkgPSB0aGlzLnZlbmRvcnNbaV1bMV0gKyAnVHJhbnNmb3JtJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNzc1Byb3BlcnR5ID0gJ3RyYW5zZm9ybSc7XG4gICAgICAgIGpzUHJvcGVydHkgPSAndHJhbnNmb3JtJztcbiAgICAgIH1cbiAgICAgIGlmIChlbGVtZW50LnN0eWxlW2pzUHJvcGVydHldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcHJvcGVydHlTdXBwb3J0ID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHN3aXRjaCh2YWx1ZSkge1xuICAgICAgY2FzZSAnMkQnOlxuICAgICAgICBmZWF0dXJlU3VwcG9ydCA9IHByb3BlcnR5U3VwcG9ydDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICczRCc6XG4gICAgICAgIGlmIChwcm9wZXJ0eVN1cHBvcnQpIHtcbiAgICAgICAgICB2YXIgYm9keSA9IGRvY3VtZW50LmJvZHkgfHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYm9keScpO1xuICAgICAgICAgIHZhciBkb2N1bWVudEVsZW1lbnQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4gICAgICAgICAgdmFyIGRvY3VtZW50T3ZlcmZsb3cgPSBkb2N1bWVudEVsZW1lbnQuc3R5bGUub3ZlcmZsb3c7XG4gICAgICAgICAgaWYgKCFkb2N1bWVudC5ib2R5KSB7XG4gICAgICAgICAgICBkb2N1bWVudEVsZW1lbnQuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcbiAgICAgICAgICAgIGRvY3VtZW50RWxlbWVudC5hcHBlbmRDaGlsZChib2R5KTtcbiAgICAgICAgICAgIGJvZHkuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcbiAgICAgICAgICAgIGJvZHkuc3R5bGUuYmFja2dyb3VuZCA9ICcnO1xuICAgICAgICAgIH1cbiAgICAgICAgICBib2R5LmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgICAgICAgIGVsZW1lbnQuc3R5bGVbanNQcm9wZXJ0eV0gPSAndHJhbnNsYXRlM2QoMXB4LDFweCwxcHgpJztcbiAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbWVudCkuZ2V0UHJvcGVydHlWYWx1ZShjc3NQcm9wZXJ0eSk7XG4gICAgICAgICAgZmVhdHVyZVN1cHBvcnQgPSBwcm9wZXJ0eVZhbHVlICE9PSB1bmRlZmluZWQgJiYgcHJvcGVydHlWYWx1ZS5sZW5ndGggPiAwICYmIHByb3BlcnR5VmFsdWUgIT09IFwibm9uZVwiO1xuICAgICAgICAgIGRvY3VtZW50RWxlbWVudC5zdHlsZS5vdmVyZmxvdyA9IGRvY3VtZW50T3ZlcmZsb3c7XG4gICAgICAgICAgYm9keS5yZW1vdmVDaGlsZChlbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIGZlYXR1cmVTdXBwb3J0O1xuICB9O1xuXG4gIFBhcmFsbGF4LnByb3RvdHlwZS53dyA9IG51bGw7XG4gIFBhcmFsbGF4LnByb3RvdHlwZS53aCA9IG51bGw7XG4gIFBhcmFsbGF4LnByb3RvdHlwZS53Y3ggPSBudWxsO1xuICBQYXJhbGxheC5wcm90b3R5cGUud2N5ID0gbnVsbDtcbiAgUGFyYWxsYXgucHJvdG90eXBlLndyeCA9IG51bGw7XG4gIFBhcmFsbGF4LnByb3RvdHlwZS53cnkgPSBudWxsO1xuICBQYXJhbGxheC5wcm90b3R5cGUucG9ydHJhaXQgPSBudWxsO1xuICBQYXJhbGxheC5wcm90b3R5cGUuZGVza3RvcCA9ICFuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC8oaVBob25lfGlQb2R8aVBhZHxBbmRyb2lkfEJsYWNrQmVycnl8QkIxMHxtb2JpfHRhYmxldHxvcGVyYSBtaW5pfG5leHVzIDcpL2kpO1xuICBQYXJhbGxheC5wcm90b3R5cGUudmVuZG9ycyA9IFtudWxsLFsnLXdlYmtpdC0nLCd3ZWJraXQnXSxbJy1tb3otJywnTW96J10sWyctby0nLCdPJ10sWyctbXMtJywnbXMnXV07XG4gIFBhcmFsbGF4LnByb3RvdHlwZS5tb3Rpb25TdXBwb3J0ID0gISF3aW5kb3cuRGV2aWNlTW90aW9uRXZlbnQ7XG4gIFBhcmFsbGF4LnByb3RvdHlwZS5vcmllbnRhdGlvblN1cHBvcnQgPSAhIXdpbmRvdy5EZXZpY2VPcmllbnRhdGlvbkV2ZW50O1xuICBQYXJhbGxheC5wcm90b3R5cGUub3JpZW50YXRpb25TdGF0dXMgPSAwO1xuICBQYXJhbGxheC5wcm90b3R5cGUudHJhbnNmb3JtMkRTdXBwb3J0ID0gUGFyYWxsYXgucHJvdG90eXBlLnRyYW5zZm9ybVN1cHBvcnQoJzJEJyk7XG4gIFBhcmFsbGF4LnByb3RvdHlwZS50cmFuc2Zvcm0zRFN1cHBvcnQgPSBQYXJhbGxheC5wcm90b3R5cGUudHJhbnNmb3JtU3VwcG9ydCgnM0QnKTtcbiAgUGFyYWxsYXgucHJvdG90eXBlLnByb3BlcnR5Q2FjaGUgPSB7fTtcblxuICBQYXJhbGxheC5wcm90b3R5cGUuaW5pdGlhbGlzZSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgLy8gQ29uZmlndXJlIENvbnRleHQgU3R5bGVzXG4gICAgaWYgKHRoaXMudHJhbnNmb3JtM0RTdXBwb3J0KSB0aGlzLmFjY2VsZXJhdGUodGhpcy5lbGVtZW50KTtcbiAgICB2YXIgc3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLmVsZW1lbnQpO1xuICAgIGlmIChzdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdwb3NpdGlvbicpID09PSAnc3RhdGljJykge1xuICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgICB9XG5cbiAgICAvLyBTZXR1cFxuICAgIHRoaXMudXBkYXRlTGF5ZXJzKCk7XG4gICAgdGhpcy51cGRhdGVEaW1lbnNpb25zKCk7XG4gICAgdGhpcy5lbmFibGUoKTtcbiAgICB0aGlzLnF1ZXVlQ2FsaWJyYXRpb24odGhpcy5jYWxpYnJhdGlvbkRlbGF5KTtcbiAgfTtcblxuICBQYXJhbGxheC5wcm90b3R5cGUudXBkYXRlTGF5ZXJzID0gZnVuY3Rpb24oKSB7XG5cbiAgICAvLyBDYWNoZSBMYXllciBFbGVtZW50c1xuICAgIHRoaXMubGF5ZXJzID0gdGhpcy5lbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2xheWVyJyk7XG4gICAgdGhpcy5kZXB0aHMgPSBbXTtcblxuICAgIC8vIENvbmZpZ3VyZSBMYXllciBTdHlsZXNcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMubGF5ZXJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgdmFyIGxheWVyID0gdGhpcy5sYXllcnNbaV07XG4gICAgICBpZiAodGhpcy50cmFuc2Zvcm0zRFN1cHBvcnQpIHRoaXMuYWNjZWxlcmF0ZShsYXllcik7XG4gICAgICBsYXllci5zdHlsZS5wb3NpdGlvbiA9IGkgPyAnYWJzb2x1dGUnIDogJ3JlbGF0aXZlJztcbiAgICAgIGxheWVyLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgbGF5ZXIuc3R5bGUubGVmdCA9IDA7XG4gICAgICBsYXllci5zdHlsZS50b3AgPSAwO1xuXG4gICAgICAvLyBDYWNoZSBMYXllciBEZXB0aFxuICAgICAgdGhpcy5kZXB0aHMucHVzaCh0aGlzLmRhdGEobGF5ZXIsICdkZXB0aCcpIHx8IDApO1xuICAgIH1cbiAgfTtcblxuICBQYXJhbGxheC5wcm90b3R5cGUudXBkYXRlRGltZW5zaW9ucyA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMud3cgPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICB0aGlzLndoID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgIHRoaXMud2N4ID0gdGhpcy53dyAqIHRoaXMub3JpZ2luWDtcbiAgICB0aGlzLndjeSA9IHRoaXMud2ggKiB0aGlzLm9yaWdpblk7XG4gICAgdGhpcy53cnggPSBNYXRoLm1heCh0aGlzLndjeCwgdGhpcy53dyAtIHRoaXMud2N4KTtcbiAgICB0aGlzLndyeSA9IE1hdGgubWF4KHRoaXMud2N5LCB0aGlzLndoIC0gdGhpcy53Y3kpO1xuICB9O1xuXG4gIFBhcmFsbGF4LnByb3RvdHlwZS51cGRhdGVCb3VuZHMgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmJvdW5kcyA9IHRoaXMuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICB0aGlzLmV4ID0gdGhpcy5ib3VuZHMubGVmdDtcbiAgICB0aGlzLmV5ID0gdGhpcy5ib3VuZHMudG9wO1xuICAgIHRoaXMuZXcgPSB0aGlzLmJvdW5kcy53aWR0aDtcbiAgICB0aGlzLmVoID0gdGhpcy5ib3VuZHMuaGVpZ2h0O1xuICAgIHRoaXMuZWN4ID0gdGhpcy5ldyAqIHRoaXMub3JpZ2luWDtcbiAgICB0aGlzLmVjeSA9IHRoaXMuZWggKiB0aGlzLm9yaWdpblk7XG4gICAgdGhpcy5lcnggPSBNYXRoLm1heCh0aGlzLmVjeCwgdGhpcy5ldyAtIHRoaXMuZWN4KTtcbiAgICB0aGlzLmVyeSA9IE1hdGgubWF4KHRoaXMuZWN5LCB0aGlzLmVoIC0gdGhpcy5lY3kpO1xuICB9O1xuXG4gIFBhcmFsbGF4LnByb3RvdHlwZS5xdWV1ZUNhbGlicmF0aW9uID0gZnVuY3Rpb24oZGVsYXkpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5jYWxpYnJhdGlvblRpbWVyKTtcbiAgICB0aGlzLmNhbGlicmF0aW9uVGltZXIgPSBzZXRUaW1lb3V0KHRoaXMub25DYWxpYnJhdGlvblRpbWVyLCBkZWxheSk7XG4gIH07XG5cbiAgUGFyYWxsYXgucHJvdG90eXBlLmVuYWJsZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghdGhpcy5lbmFibGVkKSB7XG4gICAgICB0aGlzLmVuYWJsZWQgPSB0cnVlO1xuICAgICAgaWYgKHRoaXMub3JpZW50YXRpb25TdXBwb3J0KSB7XG4gICAgICAgIHRoaXMucG9ydHJhaXQgPSBudWxsO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignZGV2aWNlb3JpZW50YXRpb24nLCB0aGlzLm9uRGV2aWNlT3JpZW50YXRpb24pO1xuICAgICAgICBzZXRUaW1lb3V0KHRoaXMub25PcmllbnRhdGlvblRpbWVyLCB0aGlzLnN1cHBvcnREZWxheSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmN4ID0gMDtcbiAgICAgICAgdGhpcy5jeSA9IDA7XG4gICAgICAgIHRoaXMucG9ydHJhaXQgPSBmYWxzZTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMub25Nb3VzZU1vdmUpO1xuICAgICAgfVxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMub25XaW5kb3dSZXNpemUpO1xuICAgICAgdGhpcy5yYWYgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5vbkFuaW1hdGlvbkZyYW1lKTtcbiAgICB9XG4gIH07XG5cbiAgUGFyYWxsYXgucHJvdG90eXBlLmRpc2FibGUgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5lbmFibGVkKSB7XG4gICAgICB0aGlzLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgIGlmICh0aGlzLm9yaWVudGF0aW9uU3VwcG9ydCkge1xuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignZGV2aWNlb3JpZW50YXRpb24nLCB0aGlzLm9uRGV2aWNlT3JpZW50YXRpb24pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMub25Nb3VzZU1vdmUpO1xuICAgICAgfVxuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMub25XaW5kb3dSZXNpemUpO1xuICAgICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yYWYpO1xuICAgIH1cbiAgfTtcblxuICBQYXJhbGxheC5wcm90b3R5cGUuY2FsaWJyYXRlID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIHRoaXMuY2FsaWJyYXRlWCA9IHggPT09IHVuZGVmaW5lZCA/IHRoaXMuY2FsaWJyYXRlWCA6IHg7XG4gICAgdGhpcy5jYWxpYnJhdGVZID0geSA9PT0gdW5kZWZpbmVkID8gdGhpcy5jYWxpYnJhdGVZIDogeTtcbiAgfTtcblxuICBQYXJhbGxheC5wcm90b3R5cGUuaW52ZXJ0ID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIHRoaXMuaW52ZXJ0WCA9IHggPT09IHVuZGVmaW5lZCA/IHRoaXMuaW52ZXJ0WCA6IHg7XG4gICAgdGhpcy5pbnZlcnRZID0geSA9PT0gdW5kZWZpbmVkID8gdGhpcy5pbnZlcnRZIDogeTtcbiAgfTtcblxuICBQYXJhbGxheC5wcm90b3R5cGUuZnJpY3Rpb24gPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgdGhpcy5mcmljdGlvblggPSB4ID09PSB1bmRlZmluZWQgPyB0aGlzLmZyaWN0aW9uWCA6IHg7XG4gICAgdGhpcy5mcmljdGlvblkgPSB5ID09PSB1bmRlZmluZWQgPyB0aGlzLmZyaWN0aW9uWSA6IHk7XG4gIH07XG5cbiAgUGFyYWxsYXgucHJvdG90eXBlLnNjYWxhciA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICB0aGlzLnNjYWxhclggPSB4ID09PSB1bmRlZmluZWQgPyB0aGlzLnNjYWxhclggOiB4O1xuICAgIHRoaXMuc2NhbGFyWSA9IHkgPT09IHVuZGVmaW5lZCA/IHRoaXMuc2NhbGFyWSA6IHk7XG4gIH07XG5cbiAgUGFyYWxsYXgucHJvdG90eXBlLmxpbWl0ID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIHRoaXMubGltaXRYID0geCA9PT0gdW5kZWZpbmVkID8gdGhpcy5saW1pdFggOiB4O1xuICAgIHRoaXMubGltaXRZID0geSA9PT0gdW5kZWZpbmVkID8gdGhpcy5saW1pdFkgOiB5O1xuICB9O1xuXG4gIFBhcmFsbGF4LnByb3RvdHlwZS5vcmlnaW4gPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgdGhpcy5vcmlnaW5YID0geCA9PT0gdW5kZWZpbmVkID8gdGhpcy5vcmlnaW5YIDogeDtcbiAgICB0aGlzLm9yaWdpblkgPSB5ID09PSB1bmRlZmluZWQgPyB0aGlzLm9yaWdpblkgOiB5O1xuICB9O1xuXG4gIFBhcmFsbGF4LnByb3RvdHlwZS5jbGFtcCA9IGZ1bmN0aW9uKHZhbHVlLCBtaW4sIG1heCkge1xuICAgIHZhbHVlID0gTWF0aC5tYXgodmFsdWUsIG1pbik7XG4gICAgdmFsdWUgPSBNYXRoLm1pbih2YWx1ZSwgbWF4KTtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG5cbiAgUGFyYWxsYXgucHJvdG90eXBlLmNzcyA9IGZ1bmN0aW9uKGVsZW1lbnQsIHByb3BlcnR5LCB2YWx1ZSkge1xuICAgIHZhciBqc1Byb3BlcnR5ID0gdGhpcy5wcm9wZXJ0eUNhY2hlW3Byb3BlcnR5XTtcbiAgICBpZiAoIWpzUHJvcGVydHkpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy52ZW5kb3JzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBpZiAodGhpcy52ZW5kb3JzW2ldICE9PSBudWxsKSB7XG4gICAgICAgICAganNQcm9wZXJ0eSA9IHRoaXMuY2FtZWxDYXNlKHRoaXMudmVuZG9yc1tpXVsxXSArICctJyArIHByb3BlcnR5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBqc1Byb3BlcnR5ID0gcHJvcGVydHk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVsZW1lbnQuc3R5bGVbanNQcm9wZXJ0eV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRoaXMucHJvcGVydHlDYWNoZVtwcm9wZXJ0eV0gPSBqc1Byb3BlcnR5O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGVsZW1lbnQuc3R5bGVbanNQcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgfTtcblxuICBQYXJhbGxheC5wcm90b3R5cGUuYWNjZWxlcmF0ZSA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICB0aGlzLmNzcyhlbGVtZW50LCAndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZTNkKDAsMCwwKScpO1xuICAgIHRoaXMuY3NzKGVsZW1lbnQsICd0cmFuc2Zvcm0tc3R5bGUnLCAncHJlc2VydmUtM2QnKTtcbiAgICB0aGlzLmNzcyhlbGVtZW50LCAnYmFja2ZhY2UtdmlzaWJpbGl0eScsICdoaWRkZW4nKTtcbiAgfTtcblxuICBQYXJhbGxheC5wcm90b3R5cGUuc2V0UG9zaXRpb24gPSBmdW5jdGlvbihlbGVtZW50LCB4LCB5KSB7XG4gICAgeCArPSAncHgnO1xuICAgIHkgKz0gJ3B4JztcbiAgICBpZiAodGhpcy50cmFuc2Zvcm0zRFN1cHBvcnQpIHtcbiAgICAgIHRoaXMuY3NzKGVsZW1lbnQsICd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlM2QoJyt4KycsJyt5KycsMCknKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMudHJhbnNmb3JtMkRTdXBwb3J0KSB7XG4gICAgICB0aGlzLmNzcyhlbGVtZW50LCAndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgnK3grJywnK3krJyknKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZWxlbWVudC5zdHlsZS5sZWZ0ID0geDtcbiAgICAgIGVsZW1lbnQuc3R5bGUudG9wID0geTtcbiAgICB9XG4gIH07XG5cbiAgUGFyYWxsYXgucHJvdG90eXBlLm9uT3JpZW50YXRpb25UaW1lciA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgaWYgKHRoaXMub3JpZW50YXRpb25TdXBwb3J0ICYmIHRoaXMub3JpZW50YXRpb25TdGF0dXMgPT09IDApIHtcbiAgICAgIHRoaXMuZGlzYWJsZSgpO1xuICAgICAgdGhpcy5vcmllbnRhdGlvblN1cHBvcnQgPSBmYWxzZTtcbiAgICAgIHRoaXMuZW5hYmxlKCk7XG4gICAgfVxuICB9O1xuXG4gIFBhcmFsbGF4LnByb3RvdHlwZS5vbkNhbGlicmF0aW9uVGltZXIgPSBmdW5jdGlvbihldmVudCkge1xuICAgIHRoaXMuY2FsaWJyYXRpb25GbGFnID0gdHJ1ZTtcbiAgfTtcblxuICBQYXJhbGxheC5wcm90b3R5cGUub25XaW5kb3dSZXNpemUgPSBmdW5jdGlvbihldmVudCkge1xuICAgIHRoaXMudXBkYXRlRGltZW5zaW9ucygpO1xuICB9O1xuXG4gIFBhcmFsbGF4LnByb3RvdHlwZS5vbkFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy51cGRhdGVCb3VuZHMoKTtcbiAgICB2YXIgZHggPSB0aGlzLml4IC0gdGhpcy5jeDtcbiAgICB2YXIgZHkgPSB0aGlzLml5IC0gdGhpcy5jeTtcbiAgICBpZiAoKE1hdGguYWJzKGR4KSA+IHRoaXMuY2FsaWJyYXRpb25UaHJlc2hvbGQpIHx8IChNYXRoLmFicyhkeSkgPiB0aGlzLmNhbGlicmF0aW9uVGhyZXNob2xkKSkge1xuICAgICAgdGhpcy5xdWV1ZUNhbGlicmF0aW9uKDApO1xuICAgIH1cbiAgICBpZiAodGhpcy5wb3J0cmFpdCkge1xuICAgICAgdGhpcy5teCA9IHRoaXMuY2FsaWJyYXRlWCA/IGR5IDogdGhpcy5peTtcbiAgICAgIHRoaXMubXkgPSB0aGlzLmNhbGlicmF0ZVkgPyBkeCA6IHRoaXMuaXg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubXggPSB0aGlzLmNhbGlicmF0ZVggPyBkeCA6IHRoaXMuaXg7XG4gICAgICB0aGlzLm15ID0gdGhpcy5jYWxpYnJhdGVZID8gZHkgOiB0aGlzLml5O1xuICAgIH1cbiAgICB0aGlzLm14ICo9IHRoaXMuZXcgKiAodGhpcy5zY2FsYXJYIC8gMTAwKTtcbiAgICB0aGlzLm15ICo9IHRoaXMuZWggKiAodGhpcy5zY2FsYXJZIC8gMTAwKTtcbiAgICBpZiAoIWlzTmFOKHBhcnNlRmxvYXQodGhpcy5saW1pdFgpKSkge1xuICAgICAgdGhpcy5teCA9IHRoaXMuY2xhbXAodGhpcy5teCwgLXRoaXMubGltaXRYLCB0aGlzLmxpbWl0WCk7XG4gICAgfVxuICAgIGlmICghaXNOYU4ocGFyc2VGbG9hdCh0aGlzLmxpbWl0WSkpKSB7XG4gICAgICB0aGlzLm15ID0gdGhpcy5jbGFtcCh0aGlzLm15LCAtdGhpcy5saW1pdFksIHRoaXMubGltaXRZKTtcbiAgICB9XG4gICAgdGhpcy52eCArPSAodGhpcy5teCAtIHRoaXMudngpICogdGhpcy5mcmljdGlvblg7XG4gICAgdGhpcy52eSArPSAodGhpcy5teSAtIHRoaXMudnkpICogdGhpcy5mcmljdGlvblk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLmxheWVycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHZhciBsYXllciA9IHRoaXMubGF5ZXJzW2ldO1xuICAgICAgdmFyIGRlcHRoID0gdGhpcy5kZXB0aHNbaV07XG4gICAgICB2YXIgeE9mZnNldCA9IHRoaXMudnggKiBkZXB0aCAqICh0aGlzLmludmVydFggPyAtMSA6IDEpO1xuICAgICAgdmFyIHlPZmZzZXQgPSB0aGlzLnZ5ICogZGVwdGggKiAodGhpcy5pbnZlcnRZID8gLTEgOiAxKTtcbiAgICAgIHRoaXMuc2V0UG9zaXRpb24obGF5ZXIsIHhPZmZzZXQsIHlPZmZzZXQpO1xuICAgIH1cbiAgICB0aGlzLnJhZiA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLm9uQW5pbWF0aW9uRnJhbWUpO1xuICB9O1xuXG4gIFBhcmFsbGF4LnByb3RvdHlwZS5vbkRldmljZU9yaWVudGF0aW9uID0gZnVuY3Rpb24oZXZlbnQpIHtcblxuICAgIC8vIFZhbGlkYXRlIGVudmlyb25tZW50IGFuZCBldmVudCBwcm9wZXJ0aWVzLlxuICAgIGlmICghdGhpcy5kZXNrdG9wICYmIGV2ZW50LmJldGEgIT09IG51bGwgJiYgZXZlbnQuZ2FtbWEgIT09IG51bGwpIHtcblxuICAgICAgLy8gU2V0IG9yaWVudGF0aW9uIHN0YXR1cy5cbiAgICAgIHRoaXMub3JpZW50YXRpb25TdGF0dXMgPSAxO1xuXG4gICAgICAvLyBFeHRyYWN0IFJvdGF0aW9uXG4gICAgICB2YXIgeCA9IChldmVudC5iZXRhICB8fCAwKSAvIE1BR0lDX05VTUJFUjsgLy8gIC05MCA6OiA5MFxuICAgICAgdmFyIHkgPSAoZXZlbnQuZ2FtbWEgfHwgMCkgLyBNQUdJQ19OVU1CRVI7IC8vIC0xODAgOjogMTgwXG5cbiAgICAgIC8vIERldGVjdCBPcmllbnRhdGlvbiBDaGFuZ2VcbiAgICAgIHZhciBwb3J0cmFpdCA9IHRoaXMud2ggPiB0aGlzLnd3O1xuICAgICAgaWYgKHRoaXMucG9ydHJhaXQgIT09IHBvcnRyYWl0KSB7XG4gICAgICAgIHRoaXMucG9ydHJhaXQgPSBwb3J0cmFpdDtcbiAgICAgICAgdGhpcy5jYWxpYnJhdGlvbkZsYWcgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBTZXQgQ2FsaWJyYXRpb25cbiAgICAgIGlmICh0aGlzLmNhbGlicmF0aW9uRmxhZykge1xuICAgICAgICB0aGlzLmNhbGlicmF0aW9uRmxhZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmN4ID0geDtcbiAgICAgICAgdGhpcy5jeSA9IHk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNldCBJbnB1dFxuICAgICAgdGhpcy5peCA9IHg7XG4gICAgICB0aGlzLml5ID0geTtcbiAgICB9XG4gIH07XG5cbiAgUGFyYWxsYXgucHJvdG90eXBlLm9uTW91c2VNb3ZlID0gZnVuY3Rpb24oZXZlbnQpIHtcblxuICAgIC8vIENhY2hlIG1vdXNlIGNvb3JkaW5hdGVzLlxuICAgIHZhciBjbGllbnRYID0gZXZlbnQuY2xpZW50WDtcbiAgICB2YXIgY2xpZW50WSA9IGV2ZW50LmNsaWVudFk7XG5cbiAgICAvLyBDYWxjdWxhdGUgTW91c2UgSW5wdXRcbiAgICBpZiAoIXRoaXMub3JpZW50YXRpb25TdXBwb3J0ICYmIHRoaXMucmVsYXRpdmVJbnB1dCkge1xuXG4gICAgICAvLyBDbGlwIG1vdXNlIGNvb3JkaW5hdGVzIGluc2lkZSBlbGVtZW50IGJvdW5kcy5cbiAgICAgIGlmICh0aGlzLmNsaXBSZWxhdGl2ZUlucHV0KSB7XG4gICAgICAgIGNsaWVudFggPSBNYXRoLm1heChjbGllbnRYLCB0aGlzLmV4KTtcbiAgICAgICAgY2xpZW50WCA9IE1hdGgubWluKGNsaWVudFgsIHRoaXMuZXggKyB0aGlzLmV3KTtcbiAgICAgICAgY2xpZW50WSA9IE1hdGgubWF4KGNsaWVudFksIHRoaXMuZXkpO1xuICAgICAgICBjbGllbnRZID0gTWF0aC5taW4oY2xpZW50WSwgdGhpcy5leSArIHRoaXMuZWgpO1xuICAgICAgfVxuXG4gICAgICAvLyBDYWxjdWxhdGUgaW5wdXQgcmVsYXRpdmUgdG8gdGhlIGVsZW1lbnQuXG4gICAgICB0aGlzLml4ID0gKGNsaWVudFggLSB0aGlzLmV4IC0gdGhpcy5lY3gpIC8gdGhpcy5lcng7XG4gICAgICB0aGlzLml5ID0gKGNsaWVudFkgLSB0aGlzLmV5IC0gdGhpcy5lY3kpIC8gdGhpcy5lcnk7XG5cbiAgICB9IGVsc2Uge1xuXG4gICAgICAvLyBDYWxjdWxhdGUgaW5wdXQgcmVsYXRpdmUgdG8gdGhlIHdpbmRvdy5cbiAgICAgIHRoaXMuaXggPSAoY2xpZW50WCAtIHRoaXMud2N4KSAvIHRoaXMud3J4O1xuICAgICAgdGhpcy5peSA9IChjbGllbnRZIC0gdGhpcy53Y3kpIC8gdGhpcy53cnk7XG4gICAgfVxuICB9O1xuXG4gIC8vIEV4cG9zZSBQYXJhbGxheFxuICB3aW5kb3dbTkFNRV0gPSBQYXJhbGxheDtcblxufSkod2luZG93LCBkb2N1bWVudCk7XG5cbi8qKlxuICogUmVxdWVzdCBBbmltYXRpb24gRnJhbWUgUG9seWZpbGwuXG4gKiBAYXV0aG9yIFRpbm8gWmlqZGVsXG4gKiBAYXV0aG9yIFBhdWwgSXJpc2hcbiAqIEBzZWUgaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vcGF1bGlyaXNoLzE1Nzk2NzFcbiAqL1xuOyhmdW5jdGlvbigpIHtcblxuICB2YXIgbGFzdFRpbWUgPSAwO1xuICB2YXIgdmVuZG9ycyA9IFsnbXMnLCAnbW96JywgJ3dlYmtpdCcsICdvJ107XG5cbiAgZm9yKHZhciB4ID0gMDsgeCA8IHZlbmRvcnMubGVuZ3RoICYmICF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lOyArK3gpIHtcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93W3ZlbmRvcnNbeF0rJ1JlcXVlc3RBbmltYXRpb25GcmFtZSddO1xuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IHdpbmRvd1t2ZW5kb3JzW3hdKydDYW5jZWxBbmltYXRpb25GcmFtZSddIHx8IHdpbmRvd1t2ZW5kb3JzW3hdKydDYW5jZWxSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXTtcbiAgfVxuXG4gIGlmICghd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSkge1xuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaywgZWxlbWVudCkge1xuICAgICAgdmFyIGN1cnJUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICB2YXIgdGltZVRvQ2FsbCA9IE1hdGgubWF4KDAsIDE2IC0gKGN1cnJUaW1lIC0gbGFzdFRpbWUpKTtcbiAgICAgIHZhciBpZCA9IHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjYWxsYmFjayhjdXJyVGltZSArIHRpbWVUb0NhbGwpOyB9LFxuICAgICAgICB0aW1lVG9DYWxsKTtcbiAgICAgIGxhc3RUaW1lID0gY3VyclRpbWUgKyB0aW1lVG9DYWxsO1xuICAgICAgcmV0dXJuIGlkO1xuICAgIH07XG4gIH1cblxuICBpZiAoIXdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSkge1xuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgICBjbGVhclRpbWVvdXQoaWQpO1xuICAgIH07XG4gIH1cblxufSgpKTtcblxuOyBicm93c2VyaWZ5X3NoaW1fX2RlZmluZV9fbW9kdWxlX19leHBvcnRfXyh0eXBlb2YgcGFyYWxsYXggIT0gXCJ1bmRlZmluZWRcIiA/IHBhcmFsbGF4IDogd2luZG93LnBhcmFsbGF4KTtcblxufSkuY2FsbChnbG9iYWwsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgZnVuY3Rpb24gZGVmaW5lRXhwb3J0KGV4KSB7IG1vZHVsZS5leHBvcnRzID0gZXg7IH0pO1xuIiwiaW1wb3J0IHtwYXJhbGxheH0gZnJvbSAncGFyYWxsYXgnO1xuXG5cblxudmFyIHNjZW5lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NjZW5lJyk7XG52YXIgYWN0aW9uID0gbmV3IFBhcmFsbGF4KHNjZW5lLCB7XG4gIHJlbGF0aXZlSW5wdXQ6IHRydWUsXG4gIGNsaXBSZWxhdGl2ZUlucHV0OiBmYWxzZSxcbiAgaG92ZXJPbmx5OiBmYWxzZSxcbiAgY2FsaWJyYXRlWDogZmFsc2UsXG4gIGNhbGlicmF0ZVk6IHRydWUsXG4gIGludmVydFg6IHRydWUsXG4gIGludmVydFk6IHRydWUsXG4gIGxpbWl0WDogZmFsc2UsXG4gIGxpbWl0WTogNTAwLFxuICBzY2FsYXJYOiA0MCxcbiAgc2NhbGFyWTogMTAsXG4gIGZyaWN0aW9uWDogMC44LFxuICBmcmljdGlvblk6IDAuMixcbiAgb3JpZ2luWDogMC41LFxuICBvcmlnaW5ZOiAxLjAsXG4gIHByZWNpc2lvbjogMSxcbiAgcG9pbnRlckV2ZW50czogZmFsc2UsXG4gIG9uUmVhZHk6IGZ1bmN0aW9uKCkgeyBhbGVydCgncmVhZHkhJyk7IH1cbn0pO1xuXG4vLyBhY3Rpb24uZW5hYmxlKCk7XG5cblxuY29uc29sZS5sb2coJ2tlazIwJykiXX0=
