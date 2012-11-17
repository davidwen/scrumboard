if (Meteor.isClient) {

  Template.burndown.days = function() {
    var days = [];
    var sprint = getSprint();
    if (sprint) {
      for (var ii = 0; ii < sprint.days; ii++) {
        var day = {};
        day.day = ii;
        day.hoursExpected = sprint.totalHours * (sprint.days - ii) / sprint.days;
        day.hoursActual = sprint.hoursRemaining[ii];
        days.push(day);
      }
    }
    return days;
  }
}