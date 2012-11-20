var closeAllEdits = function() {
  $('.task-row-input:visible').each(function() {
    var $td = $(this).closest('td');
    $(this).val($td.find('.task-row-display').text());
    $td.removeClass('editing');
  });
  $('.task-row-edit').hide();
  $('.task-row-display').show();
}

Template.table.totalHours = function() {
  return getSprintTotalHours(getSprint());
}

Template.table.hoursRemaining = function() {
  return getSprintHoursRemaining(getSprint());
}

Template.table.rendered = function() {
  $(window).unbind('keyup');
  $(window).keyup(function(e) {
    if (e.which == 27) {
      closeAllEdits();
    }
  });
}

Template.storyTable.firstTask = function() {
  var story = getStory(this.id);
  if (story) {
    var firstTask = story.tasks[0];
    if (firstTask) {
      firstTask.storyId = story._id;
      firstTask.storyName = story.name;
      firstTask.numTasks = story.tasks.length;
      return firstTask;
    } else {
      return {
        storyId: story._id,
        storyName: story.name,
        numTasks: 1
      }
    }
  }
}

Template.storyTable.otherTasks = function() {
  var story = getStory(this.id);
  if (story && story.tasks.length > 1) {
    story.tasks.splice(0, 1);
    for (var ii = 0, len = story.tasks.length; ii < len; ii++) {
      story.tasks[ii].storyId = story._id;
    }
    return story.tasks;
  }
}

Template.storyTable.rendered = function() {
  var $inputs = $(this.findAll('.task-row-input'));
  $inputs.unbind('keyup');
  $inputs.keyup(function(e) {
    if (e.which == 13) {
      var $input = $(this);
      var $tr = $input.closest('tr');
      var storyId = $tr.attr('data-story-id');
      var story = getStory(storyId);
      var taskId = Number($tr.attr('data-task-id'));
      var task = getTask(story, taskId);
      if ($input.val()) {
        var changed = false;
        if ($input.hasClass('name-input')) {
          if (task.name != $input.val()) {
            task.name = $input.val();
            changed = true;
          }
        } else if ($input.hasClass('description-input')) {
          if (task.description != $input.val()) {
            task.description = $input.val();
            changed = true;
          }
        } else if ($input.hasClass('owner-input')) {
          if (task.owner != $input.val()) {
            task.owner = $input.val();
            changed = true;
          }
        } else if ($input.hasClass('hours-input')) {
          var inputHours = Number($input.val());
          if (task.hours != inputHours) {
            task.hours = inputHours;
            if (task.status != 'inprogress' && task.hoursRemaining < task.hours) {
              task.status = 'inprogress';
            }
            changed = true;
          }
        } else if ($input.hasClass('hours-remaining-input')) {
          var inputHoursRemaining = Number($input.val());
          if (task.hoursRemaining != inputHoursRemaining) {
            task.hoursRemaining = inputHoursRemaining;
            if (task.hoursRemaining == 0) {
              task.status = 'done'
            } else if (task.hoursRemaining < task.hours) {
              task.status = 'inprogress';
            } else if (task.status == 'done' && task.hoursRemaining == task.hours) {
              task.status = 'notstarted';
            }
            changed = true;
          }
        }
        if (changed) {
          var sprint = getSprint();
          Meteor.call('upsertTask', task, story._id, sprint._id);
        }
      }
    }
  });
}

Template.storyTable.events = {
  'dblclick .task-row-cell': function() {
    closeAllEdits();
    var $target = $(event.target).closest('td');
    if ($target.find('.task-row-display').is(':visible')) {
      $target.find('.task-row-display').hide();
      $target.find('.task-row-input').width('100%');
      $target.find('.task-row-edit').show();
      $target.find('.task-row-input').focus();
      $target.addClass('editing');
    }
  }
}

Template.taskRow.nameColor = function(name) {
  return getNameColor(name);
}

Template.taskRow.hoursRemainingColor = function(hoursRemaining) {
  if (hoursRemaining == 0) {
    return '#d9ead3';
  } else if (hoursRemaining > 0) {
    return '#fce5cd';
  }
}
