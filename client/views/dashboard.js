/**
 * View for the sprint directory
 */

Template.dashboard.sprint = function() {
  return Sprints.find(
    {},
    { sort:{ timestamp : -1 } }
  );
}

Template.dashboardSprint.nameUriDecoded = function() {
  return encodeURIComponent(this.name);
}

Template.dashboardSprint.stories = function() {
  return getSprintStories(this._id);
}

Template.dashboard.events = {
  'click #show-add-sprint-dialog': function() {
    $('#add-sprint-form')[0].reset();
  },

  'mouseenter .sprint-wrapper': function() {
    $(event.target).find('.edit-sprint').show();
  },

  'mouseleave .sprint-wrapper': function() {
    $(event.target).find('.edit-sprint').hide();
  },

  'click .state-icon' : function() {
    if ($(event.target).hasClass('open')) {
      $(event.target).removeClass('open');
      $(event.target).text("+");
    } else {
      $(event.target).addClass('open');
      $(event.target).text("-");
    }
    $(event.target)
    .closest('.sprint-wrapper')
    .find('.stories')
    .slideToggle();
  },

  'click .edit-sprint': function() {
    var sprint = getSprint($(event.target).closest('.sprint-wrapper').attr('data-sprint-id'));
    var $dialog = $('#edit-sprint-dialog');
    $dialog.attr('data-sprint-id', sprint._id);
    $dialog.find('#sprint-name').val(sprint.name);
    $dialog.find('.error').empty().hide();
  }
}
