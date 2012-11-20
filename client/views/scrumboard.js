Template.scrumboard.sprint = function() {
  return getSprint();
}

Template.story.taskStatus = function(status) {
  return this.status == status;
}

Template.story.story = function() {
  return getStory(this.id);
}

Template.story.rendered = function() {
  var $tasks = $(this.findAll('.task'));
  var $tr = $(this.find('tr'));
  $tasks.removeData('ui-draggable');
  $tasks.draggable({
    cancel: '.edit-task',
    containment: $tr[0],
    cursor: 'move',
    revert: 'invalid',
    revertDuration: 80,
    zIndex: 100
  });

  var $td = $(this.findAll('td.droppable'));
  $td.removeData('ui-droppable');
  $td.droppable({
    drop: function(event, ui) {
      var taskId = $(ui.draggable).attr('data-task-id');
      var newStatus = $(this).attr('data-status');

      var storyId = $(this).closest('tr').attr('data-story-id');
      var story = getStory(storyId);
      var task = getTask(story, taskId);
      if (task && task.status != newStatus) {
        if (task.status == 'done' && task.hoursRemaining == 0) {
          // If moving task from done and there were no hours
          // remaining, replenish hours.
          task.hoursRemaining = task.hours;
        } else if (newStatus == 'done') {
          task.hoursRemaining = 0;
        }
        task.status = newStatus;
        var sprint = getSprint();
        Meteor.call('upsertTask', task, story._id, sprint._id);
        Session.set(UPDATED_TASK, taskId);
        Session.set(UPDATED_TASK_NAME, task.name);
      }
    },
    hoverClass: 'task-hover'
  });

  var $edits = $tr.find('.edit-task');
  $edits.unbind('click');
  $edits.click(function() {
    var storyId = $(this).closest('tr').attr('data-story-id');
    var taskId = $(this).closest('.task').attr('data-task-id');

    var story = getStory(storyId);
    var task = getTask(story, taskId);
    if (task) {
      var $form = $('form.add-task-form');
      var $dialog = $('#add-task-dialog');
      $form[0].reset();
      $form.find('.error').hide();
      $form.find('#story-id').val(story._id);
      $form.find('#task-id').val(taskId);
      $form.find('#task-name').val(task.name);
      $form.find('#task-owner').val(task.owner);
      $form.find('#task-hours').val(task.hours);
      $form.find('#task-hours-remaining').val(task.hoursRemaining);
      $form.find('#task-description').val(task.description);
      $form.find('#task-status').val(task.status);
      $dialog.find('.add-task').text('Save');
      $dialog.find('.show-on-add').hide();
      $dialog.find('.show-on-edit').show();
      $dialog.modal({});
    }
  });
}

Template.task.rendered = function() {
  if (this.data.id == Session.get(UPDATED_TASK) &&
      this.data.name == Session.get(UPDATED_TASK_NAME)) {
    Session.set(UPDATED_TASK, null);
    Session.set(UPDATED_TASK_NAME, null);
    $(this.find('.task')).hide().fadeIn('slow');
  }
}

/* Return random color based on task owner */
Template.task.color = function() {
  return getNameColor(this.owner);
}