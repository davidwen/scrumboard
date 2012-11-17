var closeAllEdits = function() {
  $('.task-row-input:visible').each(function() {
    $(this).val($(this).closest('td').find('.task-row-display').text());
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
      for (var ii = 0; ii < story.tasks.length; ii++) {
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
        var storyId = $tr.attr('data-id');
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
            task.hours = Number($input.val());
          } else if ($input.hasClass('hours-remaining-input')) {
            task.hoursRemaining = Number($input.val());
          }
        }
        for (var ii = 0; ii < story.tasks.length; ii++) {
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
    'dblclick .task-row-display': function() {
      closeAllEdits();
      var $target = $(event.target).closest('td');
      if ($target.find('.task-row-display').is(':visible')) {
        $target.find('.task-row-display').hide();
        $target.find('.task-row-input').width($target.width());
        $target.find('.task-row-edit').show();
        $target.find('.task-row-input').focus();
      }
    }
  }

}