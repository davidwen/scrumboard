Sprints = new Meteor.Collection('sprints');
Stories = new Meteor.Collection('stories');

var SPRINT = 'sprint';
var UPDATED_TASK = 'updated-task';
var SPRINT_VIEW = 'sprint-view';

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
  for (var jj = 0, len = story.tasks.length; jj < len; jj++) {
    var task = story.tasks[jj];
    if (task.id == taskId) {
      return task;
    }
  }
  return null;
}

if (Meteor.is_client) {
  Meteor.startup(function() {
    var pathSplit = window.location.pathname.split('/');
    if (pathSplit.length >= 2 && pathSplit[1] != '') {
      Session.set(SPRINT, decodeURI(pathSplit[1]));
    }
  });

  Template.main.sprint = function() {
    return Session.get(SPRINT);
  }
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