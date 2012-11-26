/**
 * View for the sprint directory
 */

Template.dashboard.sprint = function() {
  return Sprints.find();
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
  }
}