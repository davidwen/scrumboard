/**
 * View for the sprint directory
 */

Template.dashboard.sprint = function() {
  Scrumboard.UI.sprintDashboard.init();
  return Sprints.find(
    {},
    { sort:{ $natural : -1 } }
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

  'mouseenter .sprint-row': function() {
    $(event.target).find('.edit-sprint').show();
  },

  'mouseleave .sprint-row': function() {
    $(event.target).find('.edit-sprint').hide();
  },

  'click .edit-sprint': function() {
    var sprint = getSprint($(event.target).closest('tr').attr('data-sprint-id'));
    var $dialog = $('#edit-sprint-dialog');
    $dialog.attr('data-sprint-id', sprint._id);
    $dialog.find('#sprint-name').val(sprint.name);
    $dialog.find('.error').empty().hide();
  }
}
