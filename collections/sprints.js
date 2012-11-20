Sprints = new Meteor.Collection('sprints');

var getSprint = function(name) {
  if (!name) {
    name = Session.get(SPRINT);
  }
  return Sprints.findOne({ name: name });
}

var getSprintTotalHours = function(sprint) {
  if (!sprint) {
    return 0;
  }
  var result = 0;
  for (var ii = 0, len = sprint.stories.length; ii < len; ii++) {
    var story = getStory(sprint.stories[ii].id);
    if (story) {
      result += story.totalHours;
    }
  }
  return result;
}

var getSprintHoursRemaining = function(sprint) {
  if (!sprint) {
    return 0;
  }
  var result = 0;
  for (var ii = 0, len = sprint.stories.length; ii < len; ii++) {
    var story = getStory(sprint.stories[ii].id);
    if (story) {
      result += story.hoursRemaining;
    }
  }
  return result;
}