Sprints = new Meteor.Collection("sprints");

var SPRINT = "sprint";

var getSprint = function(name) {
  if (!name) {
    name = Session.get(SPRINT);
  }
  return Sprints.findOne({ name: name });
}

var parseImport = function(input) {
  var rows = [];
  var currentRow = [];
  var rowSplit = input.split('\t');
  for (var ii = 0; ii < rowSplit.length; ii++) {
    var cell = rowSplit[ii];
    if (cell[0] == '"' || cell.indexOf('\n') == -1) {
      if (cell[0] == '"') {
        cell = cell.slice(1, -1);
      }
      currentRow.push(cell);
    } else {
      var cellSplit = cell.split('\n');
      currentRow.push(cellSplit[0]);
      rows.push(currentRow);
      currentRow = [cellSplit[1]];
    }
  }
  rows.push(currentRow);
  return rows;
}

if (Meteor.isClient) {
  Meteor.startup(function() {
    var pathSplit = window.location.pathname.split('/');
    if (pathSplit.length == 2 && pathSplit[1] != '') {
      Session.set(SPRINT, decodeURI(pathSplit[1]));
    }

    $('body').on('mouseenter', 'td.story-cell', function() {
      $(this).find('.show-add-task-dialog').css('visibility', 'visible');
    }).on('mouseleave', 'td.story-cell', function() {
      $(this).find('.show-add-task-dialog').css('visibility', 'hidden');
    });

    $('body').on('mouseenter', 'tr.add-story-row', function() {
      $(this).find('.show-add-story-dialog').css('visibility', 'visible');
    }).on('mouseleave', 'tr.add-story-row', function() {
      $(this).find('.show-add-story-dialog').css('visibility', 'hidden');
    });
  });

  Template.dashboard.sprint = function() {
    return Sprints.find();
  }

  Template.dashboard.events = {
    'click .show-add-sprint-dialog': function() {
      $('form.add-sprint-form')[0].reset();
    }
  }

  Template.addSprintDialog.events = {
    'submit .add-sprint-form': function() {
      var $form = $('form.add-sprint-form');
      var sprintName = $form.find('#sprint-name').val();
      if (sprintName) {
        if (getSprint(sprintName)) {
          alert('Sprint with that name already exists');
        } else {
          var stories = [];
          var storiesImport = $form.find('#sprint-stories-import').val();
          if (storiesImport) {
            var storyRows = parseImport(storiesImport);
            for (var ii = 0; ii < storyRows.length; ii++) {
              var storyRow = storyRows[ii];
              var story = {
                name: storyRow[0],
                description: storyRow[2],
                acceptanceCriteria: storyRow[3],
                points: Number(storyRow[4]),
                tasks: []
              };
              stories.push(story);
            }

            var tasksImport = $form.find('#sprint-tasks-import').val();
            if (tasksImport) {
              var taskRows = parseImport(tasksImport);
              var currentStory;
              for (var ii = 0; ii < taskRows.length; ii++) {
                var taskRow = taskRows[ii];
                var task = {
                  name: taskRow[1],
                  description: taskRow[2],
                  owner: taskRow[4],
                  hours: Number(taskRow[5]),
                  status: 'notstarted'
                }
                var storyName = taskRow[0]
                if (storyName) {
                  currentStory = storyName;
                }
                for (var jj = 0; jj < stories.length; jj++) {
                  if (stories[jj].name == currentStory) {
                    stories[jj].tasks.push(task);
                    break;
                  }
                }
              }
            }
          }

          Sprints.insert(
            {name: sprintName, stories: stories},
            function(error, result) {
              if (result) {
                window.location = '/' + sprintName;
              }
            });
          $('#import-sprint-dialog').modal('hide');
        }
      } else {
        alert('Name required');
      }
      return false;
    },

    'click .add-sprint': function() {
      $('form.add-sprint-form').submit();
    }
  }

  Template.scrumboard.sprint = function() {
    return getSprint();
  }

  Template.sprint.story = function() {
    var sprint = getSprint();
    if (sprint) {
      return sprint.stories;
    }
    return [];
  };

  Template.sprint.sprintName = function() {
    return getSprint().name;
  }

  Template.sprint.events = {
    'click .show-add-story-dialog': function() {
      $('form.add-story-form')[0].reset();
    },

    'click .show-add-task-dialog': function() {
      $('form.add-task-form')[0].reset();
      $('#add-task-dialog').find('.add-task').text('Add Task To ' + this.name);
      $('form.add-task-form').find('#story-name').val(this.name);
    }
  }

  Template.newStoryDialog.events = {
    'click .add-story': function() {
      var sprint = getSprint();
      var $form = $('form.add-story-form');
      var storyName = $form.find('#story-name').val();
      var storyPoints = Number($form.find('#story-points').val());
      var storyDescription = $form.find('#story-description').val();
      var storyAcceptanceCriteria = $form.find('#story-acceptance-criteria').val();
      if (storyName && storyPoints && storyDescription && storyAcceptanceCriteria) {
        var newStory = {
          name: storyName,
          points: storyPoints,
          description: storyDescription,
          acceptanceCriteria: storyAcceptanceCriteria,
          tasks: []
        };
        var newStories = sprint.stories;
        newStories.push(newStory);
        Sprints.update({_id: sprint._id}, {$set: {stories: newStories}});
        $('#add-story-dialog').modal('hide');
      } else {
        alert('All fields required');
      }
    }
  }

  Template.newTaskDialog.events = {
    'click .add-task': function() {
      var sprint = getSprint();
      var $form = $('form.add-task-form');
      var taskName = $form.find('#task-name').val();
      var taskOwner = $form.find('#task-owner').val();
      var taskHours = Number($form.find('#task-hours').val());
      var taskDescription = $form.find('#task-description').val();
      var taskStatus = $form.find('#task-status').val();
      var storyName = $form.find('#story-name').val();
      if (taskName && taskOwner && taskHours && taskDescription && taskStatus) {
        var newTask = {
          name: taskName,
          owner: taskOwner,
          hours: taskHours,
          description: taskDescription,
          status: taskStatus
        };
        var newStories = sprint.stories;
        var numStories = newStories.length;
        for (var ii = 0; ii < numStories; ii++) {
          var story = newStories[ii];
          if (story.name == storyName) {
            story.tasks.push(newTask);
            break;
          }
        }
        Sprints.update({_id: sprint._id}, {$set: {stories: newStories}});
        $('#add-task-dialog').modal('hide');
      } else {
        alert('All fields required');
      }
    }
  }

  Template.story.taskStatus = function(status) {
    return this.status == status;
  }

}

if(Meteor.is_server) {

  Sprints.allow({
    'insert': function (userId,doc) {
      return true; 
    },
    'update': function (userId,doc) {
      return true; 
    },
  });

}