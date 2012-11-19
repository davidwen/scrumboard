var SPRINT = 'sprint';
var UPDATED_TASK = 'updated-task';
var UPDATED_TASK_NAME = 'updated-task-name';
var SPRINT_VIEW = 'sprint-view';

var getNameColor = function(name) {
  var letters = '789aabbccddeeff'.split('');
  var color = '#';
  var cur = 0;
  for (var i = 0; i < 6; i++) {
    var charCode = name.charCodeAt(i);
    if (charCode) {
      cur = (cur + charCode) % letters.length;
    }
    color += letters[cur];
  }
  return color;
}