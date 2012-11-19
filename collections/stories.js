Stories = new Meteor.Collection('stories');

var getStory = function(storyId) {
  return Stories.findOne({ _id: storyId });
}

var getTask = function(story, taskId) {
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