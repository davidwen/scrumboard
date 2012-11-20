var parseImport = function(input) {
  var rows = [];
  var currentRow = [];
  var rowSplit = input.split('\t');
  for (var ii = 0, len = rowSplit.length; ii < len; ii++) {
    var cell = rowSplit[ii];
    if (cell[0] == '"' || cell.indexOf('\n') == -1) {
      if (cell[0] == '"') {
        // Strip surrounding quotes
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

var submitOnEnter = function($inputs, $button) {
  $inputs.unbind('keyup');
  $inputs.keyup(function(e) {
    if (e.which == 13) {
      $button.click();
    }
  });
}

Template.addSprintDialog.rendered = function() {
  submitOnEnter($('form.add-sprint-form input'), $('.add-sprint'));
}

Template.addSprintDialog.events = {
  'click .add-sprint': function() {
    var $form = $('form.add-sprint-form');
    $form.find('.error').hide();
    var sprintName = $form.find('#sprint-name').val();
    var days = Number($form.find('#sprint-days').val());
    if (sprintName && days) {
      if (getSprint(sprintName)) {
        $form.find('.error').text('Sprint with that name already exists').show();
      } else {
        var stories = [];
        var storiesImport = $form.find('#sprint-stories-import').val();
        if (storiesImport) {
          var storyRows = parseImport(storiesImport);
          for (var ii = 0, len = storyRows.length; ii < len; ii++) {
            var storyRow = storyRows[ii];
            var story = {
              name: storyRow[0],
              description: storyRow[2],
              acceptanceCriteria: storyRow[3],
              points: Number(storyRow[4]),
              totalHours: 0,
              hoursRemaining: 0,
              tasks: [],
              nextTaskId: 0
            };
            stories.push(story);
          }

          var tasksImport = $form.find('#sprint-tasks-import').val();
          if (tasksImport) {
            var taskRows = parseImport(tasksImport);
            var currentStory;
            for (var ii = 0, len = taskRows.length; ii < len; ii++) {
              var taskRow = taskRows[ii];
              var task = {
                name: taskRow[1],
                description: taskRow[2],
                owner: taskRow[4],
                hours: Number(taskRow[5]),
                hoursRemaining: Number(taskRow[5]),
                status: 'notstarted'
              }
              var storyName = taskRow[0]
              if (storyName) {
                currentStory = storyName;
              }
              for (var jj = 0, len2 = stories.length; jj < len2; jj++) {
                var story = stories[jj];
                if (story.name == currentStory) {
                  task.id = story.nextTaskId;
                  story.nextTaskId++;
                  story.tasks.push(task);
                  story.totalHours += task.hours;
                  story.hoursRemaining += task.hours;
                  break;
                }
              }
            }
          }
        }

        Meteor.call('addStories', stories, function(error, sprintStories) {
          var newSprint = {
            name: sprintName,
            stories: sprintStories,
            days: days,
            hoursRemainingPerDay: []
          };
          Meteor.call('addSprint', newSprint, function(error, sprintName){
            window.location = '/' + encodeURIComponent(sprintName);
          });
        });
        $('#add-sprint-dialog').modal('hide');
      }
    } else {
      $form.find('.error').text('Name and number of days required').show();
    }
  }
}

Template.newStoryDialog.rendered = function() {
  submitOnEnter($('form.add-story-form input'), $('.add-story'));
}

Template.newStoryDialog.events = {
  'click .add-story': function() {
    var sprint = getSprint();
    var $form = $('form.add-story-form');
    $form.find('.error').hide();
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
        tasks: [],
        nextTaskId: 0
      };
      Meteor.call('addStory', newStory, function(error, storyId) {
        newStory._id = storyId;
        Meteor.call('addStoryToSprint', newStory, sprint._id);
      });
      $('#add-story-dialog').modal('hide');
    } else {
      $form.find('.error').text('All fields required').show();
    }
  }
}

Template.taskDialog.rendered = function() {
  submitOnEnter($('form.add-task-form input'), $('.add-task'));
}

Template.taskDialog.events = {
  'click .add-task': function() {
    var sprint = getSprint();
    var $form = $('form.add-task-form');
    $form.find('.error').hide();
    var taskName = $form.find('#task-name').val();
    var taskOwner = $form.find('#task-owner').val();
    var taskHours = Number($form.find('#task-hours').val());
    var taskDescription = $form.find('#task-description').val();
    var taskStatus = $form.find('#task-status').val();
    var storyId = $form.find('#story-id').val();
    var taskId = $form.find('#task-id').val();
    if (taskName && taskOwner && taskHours && taskDescription && taskStatus) {
      var story = getStory(storyId);
      if (taskId) {
        var task = getTask(story, taskId);
        var taskHoursRemaining = Number($form.find('#task-hours-remaining').val());
        task.name = taskName;
        task.owner = taskOwner;
        task.hours = taskHours;
        task.hoursRemaining = taskHoursRemaining;
        task.description = taskDescription;
        task.status = taskStatus;
        Session.set(UPDATED_TASK, task.id);
        Meteor.call('upsertTask', task, story._id, sprint._id);
      } else {
        var newTask = {
          name: taskName,
          owner: taskOwner,
          hours: taskHours,
          hoursRemaining: taskStatus == 'done' ? 0 : taskHours,
          description: taskDescription,
          status: taskStatus,
        };
        Session.set(UPDATED_TASK, story.nextTaskId);
        Meteor.call('upsertTask', newTask, story._id, sprint._id);
      }
      $('#add-task-dialog').modal('hide');
    } else {
      $form.find('.error').text('All fields required').show();
    }
  },

  'click .delete-task': function() {
    if (confirm('Are you sure you would like to delete this task?')) {
      var $form = $('form.add-task-form');
      var storyId = $form.find('#story-id').val();
      var taskId = $form.find('#task-id').val();
      var sprint = getSprint();
      Meteor.call('deleteTask', taskId, storyId, sprint._id);
      $('#add-task-dialog').modal('hide');
    }
  }
}