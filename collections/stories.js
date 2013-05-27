Stories = new Meteor.Collection('stories');

getStory = function(storyId) {
  return Stories.findOne({ _id: storyId });
}

getTask = function(story, taskId) {
  if (!story) {
    return null;
  }
  for (var jj = 0, len = story.tasks.length; jj < len; jj++) {
    var task = story.tasks[jj];
    if (task.id == taskId) {
      return task;
    }
  }
  return null;
}

getStoryHours = function(story) {
  var hours = 0;
  for (var ii = 0, len = story.tasks.length; ii < len; ii++) {
    hours += story.tasks[ii].hours;
  }
  return hours;
}

getStoryHoursRemaining = function(story) {
  var hoursRemaining = 0;
  for (var ii = 0, len = story.tasks.length; ii < len; ii++) {
    hoursRemaining += story.tasks[ii].hoursRemaining;
  }
  return hoursRemaining;
}

getLastStoryIndexInSprint = function(sprintId) {
  var story = Stories.findOne(
    { sprintId: sprintId },
    { sort: {idx: -1} }
  );
  if (story) {
    return story.idx;
  } else {
    return 0;
  }
}