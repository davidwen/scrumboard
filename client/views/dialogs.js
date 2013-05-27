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

Template.addSprintDialog.events = {
  'keyup #add-sprint-form input': function() {
    if (event.which == 13) {
      $('#add-sprint-button').click();
    }
  },

  'click #add-sprint-button': function() {
    var $form = $('#add-sprint-form');
    $form.find('.error').hide();
    var sprintName = $form.find('#sprint-name').val();
    var days = Number($form.find('#sprint-days').val());
    var newSprint = {
      name: sprintName,
      days: days,
      hoursRemainingPerDay: [],
      timestamp: new Date().getTime()
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

Template.newStoryDialog.events = {
  'keyup #add-story-form input': function() {
    if (event.which == 13) {
      $('#add-story-button').click();
    }
  },

  'click #add-story-button': function() {
    var $form = $('#add-story-form');
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
        totalHours: 0,
        hoursRemaining: 0,
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

Template.taskDialog.events = {
  'keyup #add-task-form input': function() {
    if (event.which == 13) {
      $('#add-task-button').click();
    }
  },

  'click #add-task-button': function() {
    var $form = $('#add-task-form');
    $form.find('.error').hide();
    var taskName = $form.find('#task-name').val();
    var taskOwner = $form.find('#task-owner').val();
    var taskHours = Number($form.find('#task-hours').val());
    var taskDescription = $form.find('#task-description').val();
    var taskStatus = $form.find('#task-status').val();
    var storyId = $form.find('#story-id').val();
    var taskId = $form.find('#task-id').val();
    if (taskName && taskHours && taskDescription && taskStatus) {
      var story = getStory(storyId);
      if (taskId) {
        var task = getTask(story, taskId);
        var taskHoursRemaining = Number($form.find('#task-hours-remaining').val());
        task.name = taskName;
        if (taskOwner) {
          task.owner = taskOwner;
        }
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
      $form.find('.error').text('All fields except Owner required').show();
    }
  },

  'click #delete-task-button': function() {
    if (confirm('Are you sure you would like to delete this task?')) {
      var $form = $('#add-task-form');
      var storyId = $form.find('#story-id').val();
      var taskId = $form.find('#task-id').val();
      Meteor.call('deleteTask', taskId, storyId, getSprintId());
      $('#add-task-dialog').modal('hide');
    }
  }
}

Template.storyDetailsDialog.events = {
  'click #delete-story-button': function() {
    if (confirm('Are you sure you would like to delete this story?')) {
      var storyId = $('#story-details-dialog').attr('data-story-id');
      Meteor.call('deleteStory', storyId);
      $('#story-details-dialog').modal('hide');
    }
  },

  'click #save-story-button': function() {
    var $dialog = $('#story-details-dialog');
    $dialog.find('.error').hide();
    var storyId = $('#story-details-dialog').attr('data-story-id');
    var storyName = $dialog.find('#story-name').val();
    var storyPoints = Number($dialog.find('#story-points').val());
    var storyDescription = $dialog.find('#story-description').val();
    var storyAcceptanceCriteria = $dialog.find('#story-acceptance-criteria').val();
    if (storyName && storyPoints && storyDescription && storyAcceptanceCriteria) {
      Meteor.call('updateStory', storyId, storyName, storyPoints, storyDescription, storyAcceptanceCriteria);
      $('#story-details-dialog').modal('hide');
    } else {
      $dialog.find('.error').text('All fields required').show();
    }
  }
}

Template.editSprintDialog.events = {
  'click #delete-sprint-button': function() {
    if (confirm('Are you sure you would like to delete this sprint?')) {
      var sprintId = $('#edit-sprint-dialog').attr('data-sprint-id');
      Meteor.call('deleteSprint', sprintId);
      $('#edit-sprint-dialog').modal('hide');
    }
  },

  'click #save-sprint-button': function() {
    var sprintId = $('#edit-sprint-dialog').attr('data-sprint-id');
    var name = $('#edit-sprint-dialog').find('#sprint-name').val();
    Meteor.call('editSprintName', sprintId, name, function(error) {
      if (error) {
        $('#edit-sprint-form').find('.error').text(error.reason).show();
      } else {
        $('#edit-sprint-dialog').modal('hide');
      }
    });
  },
}
