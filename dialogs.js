var parseImport = function(input) {
  var rows = [];
  var currentRow = [];
  var rowSplit = input.split('\t');
  for (var ii = 0; ii < rowSplit.length; ii++) {
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

if (Meteor.isClient) {
  Template.addSprintDialog.rendered = function() {
    submitOnEnter($('form.add-sprint-form input'), $('.add-sprint'));
  }

  Template.addSprintDialog.events = {
    'click .add-sprint': function() {
      var $form = $('form.add-sprint-form');
      $form.find('.error').hide();
      var sprintName = $form.find('#sprint-name').val();
      var days = Number($form.find('#sprint-days').val());
      var totalHours = 0;
      if (sprintName && days) {
        if (getSprint(sprintName)) {
          $form.find('.error').text('Sprint with that name already exists').show();
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
                tasks: [],
                nextTaskId: 0
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
                  hoursRemaining: Number(taskRow[5]),
                  status: 'notstarted'
                }
                var storyName = taskRow[0]
                if (storyName) {
                  currentStory = storyName;
                }
                for (var jj = 0; jj < stories.length; jj++) {
                  var story = stories[jj];
                  if (story.name == currentStory) {
                    task.id = story.nextTaskId;
                    story.nextTaskId++;
                    story.tasks.push(task);
                    totalHours += task.hours;
                    break;
                  }
                }
              }
            }
          }

          var sprintStories = [];
          for (var ii = 0; ii < stories.length; ii++) {
            var story = stories[ii];
            var storyId = Stories.insert(story);
            sprintStories.push({
              id: storyId,
              name: story.name
            });
          }
          Sprints.insert({
            name: sprintName,
            stories: sprintStories,
            days: days,
            totalHours: totalHours,
            hoursRemaining: totalHours,
            hoursRemainingPerDay: []
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
        var storyId = Stories.insert(newStory);
        Sprints.update(
          {_id: sprint._id},
          {$push: {stories: {
            id: storyId,
            name: storyName
          }}});
        $('#add-story-dialog').modal('hide');
      } else {
        $form.find('.error').text('All fields required').show();
      }
    }
  }

  Template.newTaskDialog.rendered = function() {
    submitOnEnter($('form.add-task-form input'), $('.add-task'));
  }

  Template.newTaskDialog.events = {
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
          var hoursDelta = taskHours - task.hours;
          var hoursRemainingDelta = taskHoursRemaining - task.hoursRemaining;
          task.name = taskName;
          task.owner = taskOwner;
          task.hours = taskHours;
          task.hoursRemaining = taskHoursRemaining;
          task.description = taskDescription;
          task.status = taskStatus;
          Session.set(UPDATED_TASK, task.id);
          Stories.update(
            {_id: story._id},
            {$set: {tasks: story.tasks}});
          Sprints.update(
            {_id: sprint._id},
            {$set: {
              totalHours: sprint.totalHours + hoursDelta,
              hoursRemaining: sprint.hoursRemaining + hoursRemainingDelta
            }});
        } else {
          var newTask = {
            name: taskName,
            owner: taskOwner,
            hours: taskHours,
            hoursRemaining: taskStatus == 'done' ? 0 : taskHours,
            description: taskDescription,
            status: taskStatus,
            id: story.nextTaskId
          };
          Session.set(UPDATED_TASK, newTask.id);
          Stories.update(
            {_id: story._id},
            {$push: {tasks: newTask}, $inc: {nextTaskId: 1}});
          Sprints.update(
            {_id: sprint._id},
            {$set: {
              totalHours: sprint.totalHours + newTask.hours,
              hoursRemaining: sprint.hoursRemaining + newTask.hoursRemaining
            }});
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
        var story = getStory(storyId);
        if (story) {
          for (var ii = 0; ii < story.tasks.length; ii++) {
            if (story.tasks[ii].id == taskId) {
              var taskHours = story.tasks[ii].hours;
              var taskHoursRemaining = story.tasks[ii].hoursRemaining;
              story.tasks.splice(ii, 1);
              Stories.update(
                {_id: story._id},
                {$set: {tasks: story.tasks}});
              var sprint = getSprint();
              Sprints.update(
                {_id: sprint._id},
                {$set: {
                  totalHours: sprint.totalHours - taskHours,
                  hoursRemaining: sprint.hoursRemaining - taskHoursRemaining
                }});
              break;
            }
          }
        }
        $('#add-task-dialog').modal('hide');
      }
    }
  }
}