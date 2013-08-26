/**
 * Created with JetBrains WebStorm.
 * User: ipark
 * Date: 13. 8. 16.
 * Time: 오후 5:53
 * To change this template use File | Settings | File Templates.
 */
'use strict';

angular.module('pancakeApp')
  .controller('EditorCtrl', function($scope, sharedProperties) {

    $scope.score = sharedProperties.getProperty().score;

    $scope.startComposition = function() {
      $scope.editor.startComposition();
    };

    $scope.endComposition = function() {
      $scope.editor.endComposition();
    };

  })
  .directive('editorVisualization', function() {

    // constants
    var editor;

    return {
      restrict: 'E',
      // 초기화, 템플릿안에 ng-repeat이 없다면 한번만 실행됨.
      link: function(scope, element, attr) {
        editor = initEditor();
        scope.editor = editor;
      }
    };

    function initEditor() {
      return new PanelEditor( d3.select("svg") );
    }

  });

// TODO: Separation of Concerns은 자바스크립트에 대해 좀 더 이해한 후에 진행.
function PanelEditor(svg) {
  this.svg = svg;
  svg.on("mousedown", down)
     .on("mouseup", up)
     .on("mousemove", move);

  var formatter = new MIDIFormatter();

  var colorSet = new ColorSet(d3.scale.category10());
  var circleColorStyle = "none";
  var circleRadius = d3.random.normal(10, 2);
  var pointerCircle;

  // TODO: need to re-calculate event when window size changed
  var svgWidth = parseInt(this.svg.style("width"));
  var svgHeight = parseInt(this.svg.style("height"));
  var xPos = svgWidth/2;
  var sectionCount = 10, pitchCount = 10;
  var volumeRangeList = getVolumeRangeList();
  var circleSizeList = getCircleSizeList();
  var pitchRangeList = getPitchRagneList();

  var mousePosition = [svgWidth, svgHeight];

  // static images
  this.drawBackground = function() {
    var length = pitchCount-1;
    for(var i=0; i<length; i++) {
      this.svg.append("svg:line")
          .attr("x1", 0)
          .attr("y1", pitchRangeList[i])
          .attr("x2", svgWidth)
          .attr("y2", pitchRangeList[i])
          .style("stroke", "rgb(240,250,250)");
    }

    this.svg.append("svg:line")
      .attr("x1", xPos)
      .attr("y1", 0)
      .attr("x2", xPos)
      .attr("y2", svgHeight)
      .style("stroke", "rgb(255,255,255)")
      .style("stroke-width", 3);
  };

  // dynamic images (animation)
  this.startAnimation = function() {
    d3.timer(flowAnimation);
    pointerCircle = this.svg.append("svg:circle")
                        .attr("cx", xPos)
                        .attr("cy", getLocationInSVG(mousePosition[1]))
                        .attr("r", 25)
                        .attr("stroke", colorSet.getColor())
                        .style("stroke-opacity", 1)
                        .style("fill", "none");

    var time = 0, frame = 2, tick = 0;

    function flowAnimation() {
      if( ++tick > frame ) {
        tick = 0;
        drawCircle();

        return isEndAnimation();
      }
      return false;
    }

    function isEndAnimation() {
      if( ++time > 100000000 ) {
        return true;
      }
      return false;
    }

  };

  this.drawBackground();
  this.startAnimation();

  function down() {
    circleColorStyle = colorSet.getColor();
  }

  function up() {
//    colorSet.nextColor();
    circleColorStyle = "none";
  }

  function move() {
    mousePosition = d3.mouse(this);
    circleRadius = getRadiusBaseOnXPos(mousePosition[0]);
    pointerCircle.attr("cy", mousePosition[1]);
  }

  function drawCircle() {
    svg.append("svg:circle")
        .attr("cx", xPos)
        .attr("cy", getLocationInSVG(mousePosition[1]))
        .attr("r", circleRadius)
        .style("stroke", colorSet.getColor())
        .style("stroke-opacity", 1)
        .style("fill", circleColorStyle)
        .transition()
        .attr("cx", -30)
        // 몇 초에 걸쳐서 움직일 것인가?
        .duration("1000")
        // 애니메이션 종류는 어떠한가?
        .ease("linear")
        .remove();
  }

  function getVolumeRangeList() {
    return getListFrom( 0, parseInt(svgWidth/sectionCount), sectionCount );
  }

  function getPitchRagneList() {
    return getListFrom( 0, parseInt(svgHeight/pitchCount), pitchCount );
  }

  function getCircleSizeList() {
    return getListFrom( 3, (23-7)/sectionCount, sectionCount );
  }

  function getListFrom(min, eachValue, count) {
    min = typeof min !== 'undefined' ? min : 0;

    var list = [];
    for(var i=0; i<count; i++) {
      list[i] = min + eachValue*(i+1);
//      printD("list["+i+"] is " + list[i]);
    }
    return list;
  }

  function getRadiusBaseOnXPos(x) {
    for(var idx in volumeRangeList) {
      if(volumeRangeList.hasOwnProperty(idx)) {
        if(x < volumeRangeList[idx]) {
          return circleSizeList[idx];
        }
      }
    }
    return circleSizeList[sectionCount-1];
  }

  function getLocationInSVG(y) {
    if( y < 0 ) {
      return 0;
    } else if (y <= svgHeight) {
      return y;
    } else {
      return svgHeight;
    }
  }

  this.startComposition = function() {
    var event = { type: 'mockOn', note: 'c#', timestamp: '134646', velocity: '0.5' };
    alert("작곡을 시작함돠~\n");
    formatter.createMIDI("Demo");
    formatter.sendEvent(event);
  };

  this.endComposition = function() {
    var event = { type: 'mockOff', note: 'c#', timestamp: '134646', velocity: '0.5' };
    alert("작곡을 끝냄돠~\n");
    formatter.saveMIDI();
    formatter.sendEvent(event);
  }

  function printDataToConsole(d) { console.log(d); }
}

function ColorSet(set) {
  var currentColor = 0;
  this.colors = set;
  this.getColor = function() {
    return this.colors(currentColor);
  };

  this.nextColor = function() {
    ++currentColor;
    return this.getColor();
  }

}

function MIDIFormatter() {
  // mock-up
  this.sendEvent = function(event) {};
  this.createMIDI = function(MIDI_Information) {};
  this.saveMIDI = function() {};
}