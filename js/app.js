import {parallax} from 'parallax';



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
  onReady: function() { alert('ready!'); }
});

// action.enable();


console.log('kek20')