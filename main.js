Sprints = new Meteor.Collection("sprints");
Stories = new Meteor.Collection("stories");

var SPRINT = "sprint";

var getSprint = function(name) {
  if (!name) {
    name = Session.get(SPRINT);
  }
  return Sprints.findOne({ name: name });
}

var getStory = function(storyId) {
  return Stories.findOne({ _id: storyId });
}

var getTask = function(story, taskId) {
  if (!story) {
    return null;
  }
  for (var jj = 0; jj < story.tasks.length; jj++) {
    var task = story.tasks[jj];
    if (task.id == taskId) {
      return task;
    }
  }
  return null;
}

if (Meteor.is_server) {
  Sprints.allow({
    'insert': function (userId, doc) {
      return true; 
    },
    'update': function (userId, doc) {
      return true; 
    },
  });

  Stories.allow({
    'insert': function (userId, doc) {
      return true; 
    },
    'update': function (userId, doc) {
      return true; 
    },
  });
}