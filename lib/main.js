SPRINT = 'sprint';
SPRINT_NAME = 'sprint-name';
UPDATED_TASK = 'updated-task';
UPDATED_TASK_NAME = 'updated-task-name';
SPRINT_VIEW = 'sprint-view';

// Return a color specific to the given name
getNameColor = function(name) {
  if (!name) {
    return '#fff';
  }
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