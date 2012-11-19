Template.dashboard.sprint = function() {
  return Sprints.find();
}

Template.dashboardSprint.nameUriDecoded = function() {
  return encodeURIComponent(this.name);
}

Template.dashboard.events = {
  'click .show-add-sprint-dialog': function() {
    $('form.add-sprint-form')[0].reset();
  }
}