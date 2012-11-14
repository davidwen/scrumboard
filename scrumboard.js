Sprints = new Meteor.Collection("sprints");

var SPRINT = "sprint";

var getSprint = function(name) {
  if (!name) {
    name = Session.get(SPRINT);
  }
  return Sprints.findOne({ name: name });
}

var getStory = function(sprint, storyName) {
  if (!sprint) {
    return null;
  }
  for (var ii = 0; ii < sprint.stories.length; ii++) {
    var story = sprint.stories[ii];
    if (story.name == storyName) {
      return story;
    }
  }
  return null;
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

  Template.scrumboard.rendered = function() {
    $('.sprint-table').on('mouseenter', 'td.story-cell', function() {
      $(this).find('.show-add-task-dialog').css('visibility', 'visible');
    }).on('mouseleave', 'td.story-cell', function() {
      $(this).find('.show-add-task-dialog').css('visibility', 'hidden');
    });

    $('.sprint-table').on('mouseenter', 'tr.add-story-row', function() {
      $(this).find('.show-add-story-dialog').css('visibility', 'visible');
    }).on('mouseleave', 'tr.add-story-row', function() {
      $(this).find('.show-add-story-dialog').css('visibility', 'hidden');
    });
  }

  Template.sprint.story = function() {
    var sprint = getSprint();
    if (sprint) {
      return sprint.stories;
    }
    return [];
  };

  Template.sprint.sprintName = function() {
    return getSprint().name;
  }

  Template.sprint.events = {
    'click .show-add-story-dialog': function() {
      $('form.add-story-form')[0].reset();
    },

    'click .show-add-task-dialog': function() {
      var $form = $('form.add-task-form');
      var $dialog = $('#add-task-dialog');
      $form[0].reset();
      $form.find('#story-name').val(this.name);
      $dialog.find('.add-task').text('Add Task To ' + this.name);
      $dialog.find('.task-header').hide();
      $dialog.find('.new-task-header').show();
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
        var newStories = sprint.stories;
        newStories.push(newStory);
        Sprints.update({_id: sprint._id}, {$set: {stories: newStories}});
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
      var storyName = $form.find('#story-name').val();
      var taskId = $form.find('#task-id').val();
      if (taskName && taskOwner && taskHours && taskDescription && taskStatus) {
        if (taskId) {
          var story = getStory(sprint, storyName);
          var task = getTask(story, taskId);
          task.name = taskName;
          task.owner = taskOwner;
          task.hours = taskHours;
          task.description = taskDescription;
          task.status = taskStatus;
        } else {
          var newTask = {
            name: taskName,
            owner: taskOwner,
            hours: taskHours,
            description: taskDescription,
            status: taskStatus
          };
          var story = getStory(sprint, storyName);
          if (story) {
            newTask.id = story.nextTaskId;
            story.nextTaskId++;
            story.tasks.push(newTask);
          }
        }
        Sprints.update({_id: sprint._id}, {$set: {stories: sprint.stories}});
        $('#add-task-dialog').modal('hide');
      } else {
        alert('All fields required');
      }
    }
  }

  Template.story.taskStatus = function(status) {
    return this.status == status;
  }

  Template.story.rendered = function() {
    var $container = $(this.findAll('.tasks-container'));
    $(window).resize(function() {
      $container.masonry({
        itemSelector : '.task',
      });
    });
    $(window).trigger('resize');

    var $tr = $(this.find('tr'));
    $(this.findAll('.task')).draggable({
      cancel: '.edit-task',
      containment: $tr[0],
      cursor: 'move',
      revert: 'invalid',
      revertDuration: 80,
      zIndex: 100
    });

    $(this.findAll('td:not(.story-cell)')).droppable({
      drop: function(event, ui) {
        var taskId = $(ui.draggable).find('input[name=taskId]').val();
        var newStatus = $(this).find('input[name=status]').val();

        var sprint = getSprint();
        var storyName = $(this).closest('tr').find('.story-name').text();
        var story = getStory(sprint, storyName);
        var task = getTask(story, taskId);
        if (task && task.status != newStatus) {
          task.status = newStatus;
          Sprints.update({_id: sprint._id}, {$set: {stories: sprint.stories}});
        }
      },
      hoverClass: 'task-hover'
    });

    $tr.on('mouseenter', '.task', function() {
      $(this).find('.edit-task').css('visibility', 'visible');
    }).on('mouseleave', '.task', function() {
      $(this).find('.edit-task').css('visibility', 'hidden');
    });

    $('.edit-task').click(function() {
      var storyName = $(this).closest('tr').find('.story-name').text();
      var taskId = $(this).closest('.task').find('input[name=taskId]').val();

      var sprint = getSprint();
      var story = getStory(sprint, storyName);
      var task = getTask(story, taskId);
      if (task) {
        var $form = $('form.add-task-form');
        var $dialog = $('#add-task-dialog');
        $form[0].reset();
        $form.find('#story-name').val(storyName);
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

}