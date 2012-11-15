if (Meteor.isClient) {
  Meteor.startup(function() {
    var pathSplit = window.location.pathname.split('/');
    if (pathSplit.length == 2 && pathSplit[1] != '') {
      Session.set(SPRINT, decodeURI(pathSplit[1]));
    }
  });

  Template.scrumboard.sprint = function() {
    return Session.get(SPRINT);
  }

  Template.sprint.sprint = function() {
    return getSprint();
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

    $('.sprint-table').on('mouseenter', '.task', function() {
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
  }

  Template.sprint.events = {
    'click .show-add-story-dialog': function() {
      $('form.add-story-form')[0].reset();
    },

    'click .show-add-task-dialog': function() {
      var $form = $('form.add-task-form');
      var $dialog = $('#add-task-dialog');
      $form[0].reset();
      $form.find('#story-id').val(this.id);
      $dialog.find('.add-task').text('Add Task To ' + this.name);
      $dialog.find('.task-header').hide();
      $dialog.find('.new-task-header').show();
    },

    'click .show-story-details-dialog': function() {
      var $dialog = $('#story-details-dialog');
      $dialog.find('#story-name').text(this.name);
      $dialog.find('#story-description').text(this.description);
      $dialog.find('#story-acceptance-criteria').text(this.acceptanceCriteria);
      $dialog.find('#story-points').text(this.points);
      $dialog.modal({
        backdrop: true,
        keyboard: true
      }).addClass('big-modal');
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
          task.status = newStatus;
          Stories.update(
            {_id: story._id},
            {$set: {tasks: story.tasks}});
        }
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
        $form.find('#story-id').val(story._id);
        $form.find('#task-id').val(taskId);
        $form.find('#task-name').val(task.name);
        $form.find('#task-owner').val(task.owner);
        $form.find('#task-hours').val(task.hours);
        $form.find('#task-description').val(task.description);
        $form.find('#task-status').val(task.status);
        $dialog.find('.add-task').text('Save');
        $dialog.find('.task-header').hide();
        $dialog.find('.edit-task-header').show();
        $dialog.modal({});
      }
    });
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