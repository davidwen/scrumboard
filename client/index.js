Template.main.sprint = function() {
  var sprintName = Session.get(SPRINT_NAME);
  if (sprintName) {
    var sprint = getSprintByName(sprintName);
    if (sprint) {
      Session.set(SPRINT, sprint._id);  
    }
    return true;
  }
  return false;
}