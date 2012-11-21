/**
 * View for various dialogs (adding/editing sprints/stories/tasks)
 */

// Parse cells from a copy/paste from a Google Docs spreadsheet (may work for other formats too)
var parseImport = function(input) {
  var rows = [];
  var currentRow = [];
  var cells = input.split('\t');
  for (var ii = 0, len = cells.length; ii < len; ii++) {
    var cell = cells[ii];
    if (cell[0] != '"' && cell.indexOf('\n') != -1) {
      // If cell is not surrounded by quotes and contains a new line, this is the last cell
      // in this row.
      var cellSplit = cell.split('\n');
      currentRow.push(cellSplit[0]);
      rows.push(currentRow);
      currentRow = [cellSplit[1]];
    } else {
      if (cell[0] == '"') {
        // Strip surrounding quotes
        cell = cell.slice(1, -1);
      }
      currentRow.push(cell);
    }
  }
  rows.push(currentRow);
  return rows;
}

// Bind the given inputs to submit the form on enter
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
    var newSprint = {
      name: sprintName,
      days: days,
      hoursRemainingPerDay: []
    }
    Meteor.call('addSprint', newSprint, function(error, sprintId) {
      if (error) {
        $form.find('.error').text(error.reason).show();
      } else {
        var stories = [];
        var storiesImport = $form.find('#sprint-stories-import').val();
        if (storiesImport) {
          var storyRows = parseImport(storiesImport);
          for (var ii = 0, len = storyRows.length; ii < len; ii++) {
            // Hard-coded conversion of imported spreadsheet to stories
            var storyRow = storyRows[ii];
            var story = {
              sprintId: sprintId,
              name: storyRow[0],
              description: storyRow[2],
              acceptanceCriteria: storyRow[3],
              points: Number(storyRow[4]),
              totalHours: 0,
              hoursRemaining: 0,
              tasks: [],
              nextTaskId: 0,
              idx: ii
            };
            stories.push(story);
          }

          var tasksImport = $form.find('#sprint-tasks-import').val();
          if (tasksImport) {
            var taskRows = parseImport(tasksImport);
            var currentStory;
            for (var ii = 0, len = taskRows.length; ii < len; ii++) {
              // Hard-coded conversion of imported spreadsheet to tasks
              var taskRow = taskRows[ii];
              var hours = Number(taskRow[5]);
              var hoursRemaining;
              var status = 'notstarted'

              // Optionally take the hoursRemaining column
              if (taskRow[6] != null) {
                hoursRemaining = Number(taskRow[6]);
                if (hoursRemaining == 0) {
                  status = 'done';
                } else if (hoursRemaining < hours) {
                  status = 'inprogress';
                }
              } else {
                hoursRemaining = Number(taskRow[5]);
              }
              var task = {
                name: taskRow[1],
                description: taskRow[2],
                owner: taskRow[4],
                hours: hours,
                hoursRemaining: hoursRemaining,
                status: status
              }

              // If no storyName is provided on this row, use previous storyName
              var storyName = taskRow[0]
              if (storyName) {
                currentStory = storyName;
              }

              // Add task into associated story
              for (var jj = 0, len2 = stories.length; jj < len2; jj++) {
                var story = stories[jj];
                if (story.name == currentStory) {
                  task.id = story.nextTaskId;
                  story.nextTaskId++;
                  story.tasks.push(task);
                  story.totalHours += task.hours;
                  story.hoursRemaining += task.hoursRemaining;
                  break;
                }
              }
            }
          }
        }
        Meteor.call('addStories', stories, function() {
          $('#add-sprint-dialog').modal('hide');
          window.location = '/' + encodeURIComponent(sprintName);
        });
      }
    });
  }
}

Template.newStoryDialog.rendered = function() {
  submitOnEnter($('form.add-story-form input'), $('.add-story'));
}

Template.newStoryDialog.events = {
  'click .add-story': function() {
    var $form = $('form.add-story-form');
    $form.find('.error').hide();
    var storyName = $form.find('#story-name').val();
    var storyPoints = Number($form.find('#story-points').val());
    var storyDescription = $form.find('#story-description').val();
    var storyAcceptanceCriteria = $form.find('#story-acceptance-criteria').val();
    if (storyName && storyPoints && storyDescription && storyAcceptanceCriteria) {
      var newStory = {
        sprintId: getSprintId(),
        name: storyName,
        points: storyPoints,
        description: storyDescription,
        acceptanceCriteria: storyAcceptanceCriteria,
        tasks: [],
        nextTaskId: 0,
        idx: getLastStoryIndexInSprint(getSprintId()) + 1,
      };
      Meteor.call('addStory', newStory);
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

        // Mark in session so that updated task is emphasized on render
        Session.set(UPDATED_TASK, task.id);
        Session.set(UPDATED_TASK_NAME, task.name);

        Meteor.call('upsertTask', task, story._id, getSprintId());
      } else {
        var newTask = {
          name: taskName,
          owner: taskOwner,
          hours: taskHours,
          hoursRemaining: taskStatus == 'done' ? 0 : taskHours,
          description: taskDescription,
          status: taskStatus,
        };

        // Mark in session so that updated task is emphasized on render
        Session.set(UPDATED_TASK, story.nextTaskId);
        Session.set(UPDATED_TASK_NAME, newTask.name);

        Meteor.call('upsertTask', newTask, story._id, getSprintId());
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
      Meteor.call('deleteTask', taskId, storyId, getSprintId());
      $('#add-task-dialog').modal('hide');
    }
  }
}