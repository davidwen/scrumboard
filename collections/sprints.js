Sprints = new Meteor.Collection('sprints');

var getSprint = function(name) {
  if (!name) {
    name = Session.get(SPRINT);
  }
  return Sprints.findOne({ name: name });
}

var getSprintTotalHours = function(sprintId) {
  if (!sprintId) {
    return 0;
  }
  var result = 0;
  var sprintStories = getSprintStories(sprintId);
  for (var ii = 0, len = sprintStories.length; ii < len; ii++) {
    result += sprintStories[ii].totalHours;
  }
  return result;
}

var getSprintHoursRemaining = function(sprintId) {
  if (!sprintId) {
    return 0;
  }
  var result = 0;
  var sprintStories = getSprintStories(sprintId);
  for (var ii = 0, len = sprintStories.length; ii < len; ii++) {
    result += sprintStories[ii].hoursRemaining;
  }
  return result;
}

var getSprintStories = function(sprintId) {
  return Stories.find({sprintId: sprintId}).fetch();
}