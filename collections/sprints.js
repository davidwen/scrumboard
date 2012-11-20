Sprints = new Meteor.Collection('sprints');

var getSprintId = function() {
  return Session.get(SPRINT);
}

var getSprint = function(sprintId) {
  if (!sprintId) {
    sprintId = Session.get(SPRINT);
  }
  return Sprints.findOne({ _id: sprintId });
}

var getSprintByName = function(sprintName) {
  return Sprints.findOne({ name: sprintName });
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
  return Stories.find(
    { sprintId: sprintId },
    { sort: ['idx', 'desc'] }).fetch();
}