import 'babel-polyfill';
import {parallax} from 'parallax';
import $ from 'jquery';
 import {lettering} from 'lettering';
import  'ScrollMagic';

window.onload = function(){

  var scene = document.getElementById('scene');
  if(scene) {
    var action = new Parallax(scene, {
      relativeInput: true,
      clipRelativeInput: false,
      hoverOnly: false,
      calibrateX: false,
      calibrateY: true,
      invertX: true,
      invertY: true,
      limitX: false,
      limitY: 900,
      scalarX: 40,
      scalarY: 20,
      frictionX: 0.8,
      frictionY: 0.2,
      originX: 0.5,
      originY: 1.0,
      precision: 1,
      pointerEvents: false,
    });
  }


}