var closeAllEdits = function() {
  $('.task-row-input:visible').each(function() {
    var $td = $(this).closest('td');
    $(this).val($td.find('.task-row-display').text());
    $td.removeClass('editing');
  });
  $('.task-row-edit').hide();
  $('.task-row-display').show();
}

if (Meteor.isClient) {

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
          if ($input.hasClass('name-input')) {
            task.name = $input.val();
          } else if ($input.hasClass('description-input')) {
            task.description = $input.val();
          } else if ($input.hasClass('owner-input')) {
            task.owner = $input.val();
          } else if ($input.hasClass('hours-input')) {
            var inputHours = Number($input.val());
            var hoursDelta = inputHours - task.hours;
            task.hours = inputHours;
            if (task.hoursRemaining < task.hours) {
              task.status = 'inprogress';
            } else if (task.hoursRemaining == task.hours) {
              task.status = 'notstarted';
            }
            var sprint = getSprint();
            Sprints.update({_id: sprint._id}, {$inc: {totalHours: hoursDelta}});
          } else if ($input.hasClass('hours-remaining-input')) {
            var inputHoursRemaining = Number($input.val());
            var hoursRemainingDelta = inputHoursRemaining - task.hoursRemaining;
            task.hoursRemaining = inputHoursRemaining;
            if (task.hoursRemaining == 0) {
              task.status = 'done'
            } else if (task.hoursRemaining < task.hours) {
              task.status = 'inprogress';
            } else if (task.hoursRemaining == task.hours) {
              task.status = 'notstarted';
            }
            var sprint = getSprint();
            Sprints.update({_id: sprint._id}, {$inc: {hoursRemaining: hoursRemainingDelta}});
          }
        }
        for (var ii = 0, len = story.tasks.length; ii < len; ii++) {
          if (story.tasks[ii].id == task.id) {
            story.tasks[ii] = task;
            break;
          }
        }
        Stories.update({_id: story._id}, {$set: {tasks: story.tasks}});
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
}