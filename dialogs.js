if (Meteor.isClient) {
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
      var storyId = $form.find('#story-id').val();
      var taskId = $form.find('#task-id').val();
      if (taskName && taskOwner && taskHours && taskDescription && taskStatus) {
        var story = getStory(storyId);
        if (taskId) {
          var task = getTask(story, taskId);
          var hoursDelta = taskHours - task.hours;
          task.name = taskName;
          task.owner = taskOwner;
          task.hours = taskHours;
          task.hoursRemaining = Number($form.find('#task-hours-remaining').val());
          task.description = taskDescription;
          task.status = taskStatus;
          Session.set(UPDATED_TASK, task.id);
          Stories.update(
            {_id: story._id},
            {$set: {tasks: story.tasks}});
          Sprints.update(
            {_id: sprint._id},
            {$set: {totalHours: sprint.totalHours + hoursDelta}});
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
            {$set: {totalHours: sprint.totalHours + newTask.hours}});
        }
        $('#add-task-dialog').modal('hide');
      } else {
        alert('All fields required');
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
              story.tasks.splice(ii, 1);
              Stories.update(
                {_id: story._id},
                {$set: {tasks: story.tasks}});
              var sprint = getSprint();
              Sprints.update(
                {_id: sprint._id},
                {$set: {totalHours: sprint.totalHours - taskHours}});
              break;
            }
          }
        }
        $('#add-task-dialog').modal('hide');
      }
    }
  }
}