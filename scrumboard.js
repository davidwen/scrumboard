Sprints = new Meteor.Collection("sprints");
Stories = new Meteor.Collection("stories");

var SPRINT = "sprint";

var getSprint = function(name) {
  if (!name) {
    name = Session.get(SPRINT);
  }
  return Sprints.findOne({ name: name });
}

var getStory = function(storyId) {
  return Stories.findOne({ _id: storyId });
}

var getTask = function(story, taskId) {
  if (!story) {
    return null;
  }
  for (var jj = 0; jj < story.tasks.length; jj++) {
    var task = story.tasks[jj];
    if (task.id == taskId) {
      return task;
    }
  }
  return null;
}

if (Meteor.isClient) {
  Meteor.startup(function() {
    var pathSplit = window.location.pathname.split('/');
    if (pathSplit.length == 2 && pathSplit[1] != '') {
      Session.set(SPRINT, decodeURI(pathSplit[1]));
    }
  });

  Template.scrumboard.sprint = function() {
    return getSprint();
  }

  Template.sprint.sprint = function() {
    return getSprint();
  }

  Template.sprint.rendered = function() {
    $(window).unbind('resize');
    $(window).resize(function() {
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
          {stories: {$push: {
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
          task.name = taskName;
          task.owner = taskOwner;
          task.hours = taskHours;
          task.description = taskDescription;
          task.status = taskStatus;
          Stories.update(
            {_id: story._id},
            {$set: {tasks: story.tasks}});
        } else {
          var newTask = {
            name: taskName,
            owner: taskOwner,
            hours: taskHours,
            description: taskDescription,
            status: taskStatus,
            id: story.nextTaskId
          };
          Stories.update(
            {_id: story._id},
            {$push: {tasks: newTask}, $inc: {nextTaskId: 1}});
        }
        $('#add-task-dialog').modal('hide');
      } else {
        alert('All fields required');
      }
    }
  }

  Template.story.taskStatus = function(status) {
    return this.status == status;
  }

  Template.story.story = function() {
    return Stories.findOne({_id: this.id});
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

        var sprint = getSprint();
        var storyId = $(this).closest('tr').find('#story-id').val();
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

    $tr.find('.edit-task').click(function() {
      var storyId = $(this).closest('tr').find('#story-id').val();
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

if(Meteor.is_server) {

  Sprints.allow({
    'insert': function (userId,doc) {
      return true; 
    },
    'update': function (userId,doc) {
      return true; 
    },
  });

  Stories.allow({
    'insert': function (userId,doc) {
      return true; 
    },
    'update': function (userId,doc) {
      return true; 
    },
  });
}