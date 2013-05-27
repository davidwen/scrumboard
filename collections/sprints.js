Sprints = new Meteor.Collection('sprints');

getSprintId = function() {
  return Session.get(SPRINT);
}

getSprint = function(sprintId) {
  if (!sprintId) {
    sprintId = Session.get(SPRINT);
  }
  return Sprints.findOne({ _id: sprintId });
}

getSprintByName = function(sprintName) {
  return Sprints.findOne({ name: sprintName });
}

getSprintTotalHours = function(sprintId) {
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

getSprintHoursRemaining = function(sprintId) {
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

getSprintStories = function(sprintId) {
  return Stories.find(
    { sprintId: sprintId },
    { sort: { idx: 1 } }).fetch();
}