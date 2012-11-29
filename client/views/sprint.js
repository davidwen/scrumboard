/**
 * Top-level view for a sprint, controlling which specific view should be shown
 */

Template.sprint.sprint = function() {
  return getSprint();
}

Template.sprint.sprintView = function(view) {
  currentView = 'scrumboard';
  if (Session.get(SPRINT_VIEW)) {
    currentView = Session.get(SPRINT_VIEW);
  }
  return currentView == view;
}

Template.sprint.rendered = function() {
  $('#sprint-table, #table-view').on('mouseenter', '.task', function() {
    $(this).find('.edit-task').css('visibility', 'visible');
  }).on('mouseleave', '.task', function() {
    $(this).find('.edit-task').css('visibility', 'hidden');
  }).on('mouseenter', 'td.story-cell', function() {
    $(this).find('.story-controls').css('visibility', 'visible');
  }).on('mouseleave', 'td.story-cell', function() {
    $(this).find('.story-controls').css('visibility', 'hidden');
  }).on('mouseenter', 'tr.add-story-row', function() {
    $(this).find('#show-add-story-dialog').css('visibility', 'visible');
  }).on('mouseleave', 'tr.add-story-row', function() {
    $(this).find('#show-add-story-dialog').css('visibility', 'hidden');
  });

  $('#add-task-dialog, #add-story-dialog').on('shown', function () {
      $(this).find('input:visible:first').focus();
  });
}

Template.sprint.events = {
  'click #show-add-story-dialog': function() {
    var $form = $('#add-story-form');
    $form[0].reset();
    $form.find('.error').hide();
  },

  'click #show-add-task-dialog': function() {
    var $form = $('#add-task-form');
    var $dialog = $('#add-task-dialog');
    $form[0].reset();
    $form.find('.error').hide();
    $form.find('#story-id').val($(event.target).closest('tr').attr('data-story-id'));
    $form.find('#task-id').val('');
    $dialog.find('#add-task-button').text('Add Task To ' + this.name);
    $dialog.find('.show-on-edit').hide();
    $dialog.find('.show-on-add').show();
  },

  'click #show-story-details-dialog': function() {
    var storyId = $(event.target).closest('tr').attr('data-story-id');
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

  'click #show-burndown': function() {
    event.preventDefault();
    Session.set(SPRINT_VIEW, 'burndown');
  },

  'click #show-table': function() {
    event.preventDefault();
    Session.set(SPRINT_VIEW, 'table');
  },

  'click #show-scrumboard': function() {
    event.preventDefault();
    Session.set(SPRINT_VIEW, 'scrumboard');
  },

  'click #upload-retrospective-button': function() {
    filepicker.setKey('AXszezHiITlaaapCUz0wkz');
    filepicker.pick(function(fpfile) {
      Meteor.call('setSprintRetrospectiveImage', getSprintId(), fpfile.url);
    });
  },
}