Meteor.methods({
  addSprint: function(sprint) {
    Sprints.insert(sprint);
    return sprint.name;
  }
});