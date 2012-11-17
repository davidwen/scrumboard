if (Meteor.isClient) {
  Template.newStoryDialog.rendered = function() {
    $('form.add-story-form input').unbind('keyup');
    $('form.add-story-form input').keyup(function(e) {
      if (e.which == 13) {
        $('.add-story').click();
      }
    });
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
    $('form.add-task-form input').unbind('keyup');
    $('form.add-task-form input').keyup(function(e) {
      if (e.which == 13) {
        $('.add-task').click();
      }
    })
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