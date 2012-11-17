if (Meteor.isClient) {

  Template.burndown.rendered = function() {
    var sprint = getSprint();
    var expected = [];
    var actual = [];
    if (sprint) {
      for (var ii = 0; ii < sprint.days + 1; ii++) {
        var expectedDay = [ii, sprint.totalHours * (sprint.days - ii) / sprint.days];
        expected.push(expectedDay);
        if (sprint.hoursRemainingPerDay[ii]) {
          var actualDay = [ii, sprint.hoursRemainingPerDay[ii]];
          actual.push(actualDay);
        }
      }
    }
    var plot = $.plot(
      $('.burndown-graph')[0],
      [{label: 'Expected', data: expected}, {label: 'Actual', data: actual}],
      {
        lines: { show: true },
        points: { show: true }
      });
  }

  Template.burndown.days = function() {
    var days = [];
    var sprint = getSprint();
    if (sprint) {
      for (var ii = 0; ii < sprint.days + 1; ii++) {
        var day = {};
        day.day = ii;
        day.hoursExpected = Math.round(sprint.totalHours * (sprint.days - ii) / sprint.days * 10) / 10;
        day.hoursActual = sprint.hoursRemainingPerDay[ii];
        days.push(day);
      }
    }
    return days;
  }

  Template.burndown.hoursRemaining = function() {
    var sprint = getSprint();
    if (sprint) {
      return sprint.hoursRemaining;
    }
  }

  Template.burndown.events = {
    'click .log-day': function() {
      var sprint = getSprint();
      Sprints.update({_id: sprint._id}, {$push: {hoursRemainingPerDay: sprint.hoursRemaining}});
    }
  }
}