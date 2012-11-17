if (Meteor.isClient) {
  Meteor.startup(function() {
    var pathSplit = window.location.pathname.split('/');
    if (pathSplit.length >= 2 && pathSplit[1] != '') {
      Session.set(SPRINT, decodeURI(pathSplit[1]));
    }
  });

  Template.scrumboard.sprint = function() {
    return Session.get(SPRINT);
  }

  Template.sprint.sprint = function() {
    return getSprint();
  }

  Template.sprint.sprintView = function(view) {
    var currentView = "scrumboard";
    if (Session.get(SPRINT_VIEW)) {
      currentView = Session.get(SPRINT_VIEW);
    }
    return currentView == view;
  }

  Template.sprint.rendered = function() {
    $(window).unbind('resize');
    $(window).resize(function() {
      $('.tasks-container').each(function() {
        if ($(this).data('masonry')) {
          $(this).masonry('destroy');
        } 
      }); 
      $('.tasks-container').masonry({
        itemSelector : '.task',
      });
    }); 
    $(window).trigger('resize');

    if (Session.get(SPRINT_VIEW) == 'burndown') {
      $('.show-on-scrumboard').hide();
      $('.show-on-table').hide();
      $('.show-on-burndown').show();
    } else if (Session.get(SPRINT_VIEW) == 'table') {
      $('.show-on-scrumboard').hide();
      $('.show-on-table').show();
      $('.show-on-burndown').hide();
    }

    $('.sprint-table, .table-view').on('mouseenter', '.task', function() {
      $(this).find('.edit-task').css('visibility', 'visible');
    }).on('mouseleave', '.task', function() {
      $(this).find('.edit-task').css('visibility', 'hidden');
    }).on('mouseenter', 'td.story-cell', function() {
      $(this).find('.story-controls').css('visibility', 'visible');
    }).on('mouseleave', 'td.story-cell', function() {
      $(this).find('.story-controls').css('visibility', 'hidden');
    }).on('mouseenter', 'tr.add-story-row', function() {
      $(this).find('.show-add-story-dialog').css('visibility', 'visible');
    }).on('mouseleave', 'tr.add-story-row', function() {
      $(this).find('.show-add-story-dialog').css('visibility', 'hidden');
    });

    $('#add-task-dialog, #add-story-dialog').on('shown', function () {
        $(this).find('input:visible:first').focus();
    });
  }

  Template.sprint.events = {
    'click .show-add-story-dialog': function() {
      var $form = $('form.add-story-form');
      $form[0].reset();
      $form.find('.error').hide();
    },

    'click .show-add-task-dialog': function() {
      var $form = $('form.add-task-form');
      var $dialog = $('#add-task-dialog');
      $form[0].reset();
      $form.find('.error').hide();
      $form.find('#story-id').val($(event.target).closest('tr').attr('data-id'));
      $form.find('#task-id').val('');
      $dialog.find('.add-task').text('Add Task To ' + this.name);
      $dialog.find('.show-on-edit').hide();
      $dialog.find('.show-on-add').show();
    },

    'click .show-story-details-dialog': function() {
      var storyId = $(event.target).closest('tr').attr('data-id');
      var story = getStory(storyId);
      var $dialog = $('#story-details-dialog');
      $dialog.find('#story-name').text(story.name);
      $dialog.find('#story-description').text(story.description);
      $dialog.find('#story-acceptance-criteria').text(story.acceptanceCriteria);
      $dialog.find('#story-points').text(story.points);
      $dialog.modal({
        backdrop: true,
        keyboard: true
      }).addClass('big-modal');
    },

    'click .show-burndown': function() {
      event.preventDefault();
      $('.nav .active').removeClass('active');
      $(event.target).closest('li').addClass('active');
      $('.show-on-scrumboard').hide();
      $('.show-on-table').hide();
      $('.show-on-burndown').show();
      Session.set(SPRINT_VIEW, 'burndown');
    },

    'click .show-table': function() {
      event.preventDefault();
      $('.nav .active').removeClass('active');
      $(event.target).closest('li').addClass('active');
      $('.show-on-scrumboard').hide();
      $('.show-on-burndown').hide();
      $('.show-on-table').show();
      $(window).trigger('resize');
      Session.set(SPRINT_VIEW, 'table');
    },

    'click .show-scrumboard': function() {
      event.preventDefault();
      $('.nav .active').removeClass('active');
      $(event.target).closest('li').addClass('active');
      $('.show-on-table').hide();
      $('.show-on-burndown').hide();
      $('.show-on-scrumboard').show();
      $(window).trigger('resize');
      Session.set(SPRINT_VIEW, 'scrumboard');
    }
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
        var taskId = $(ui.draggable).attr('data-id');
        var newStatus = $(this).attr('data-status');

        var storyId = $(this).closest('tr').attr('data-id');
        var story = getStory(storyId);
        var task = getTask(story, taskId);
        if (task && task.status != newStatus) {
          var hoursRemainingDelta;
          if (task.status == 'done' && task.hoursRemaining == 0) {
            // If moving task from done and there were no hours
            // remaining, replenish hours.
            hoursRemainingDelta = task.hours;
            task.hoursRemaining = task.hours;
          } else if (newStatus == 'done') {
            hoursRemainingDelta = -task.hoursRemaining;
            task.hoursRemaining = 0;
          }
          task.status = newStatus;
          Stories.update(
            {_id: story._id},
            {$set: {tasks: story.tasks}});
          if (hoursRemainingDelta) {
            var sprint = getSprint();
            Sprints.update(
              {_id: sprint._id},
              {$set: {hoursRemaining: sprint.hoursRemaining + hoursRemainingDelta}});
          }
        }
        Session.set(UPDATED_TASK, taskId);
      },
      hoverClass: 'task-hover'
    });

    var $edits = $tr.find('.edit-task');
    $edits.unbind('click');
    $edits.click(function() {
      var storyId = $(this).closest('tr').attr('data-id');
      var taskId = $(this).closest('.task').attr('data-id');

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
    if (this.data.id == Session.get(UPDATED_TASK)) {
      Session.set(UPDATED_TASK, null);
      $(this.find('.task')).hide().fadeIn('slow');
    }
  }

  /* Return random color based on task owner */
  Template.task.color = function() {
    var letters = '789aabbccddeeff'.split('');
    var color = '#';
    var cur = 0;
    for (var i = 0; i < 6; i++) {
      var charCode = this.owner.charCodeAt(i);
      if (charCode) {
        cur = (cur + charCode) % letters.length;
      }
      color += letters[cur];
    }
    return color;
  }
}