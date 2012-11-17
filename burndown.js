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

    $('.hours-input').unbind('keyup');
    $('.hours-input').keyup(function(e) {
      if (e.which == 13) {
        var hoursRemainingPerDay = [];
        $('.hours-input').each(function() {
          var value = $(this).val();
          if (value != null && value != '' && !isNaN(value)) {
            hoursRemainingPerDay.push(Number(value));
          } else {
            hoursRemainingPerDay.push(null);
          }
        });
        Sprints.update({_id: sprint._id}, {$set: {hoursRemainingPerDay: hoursRemainingPerDay}});
      }
    })
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
        if (day.hoursActual == null) {
          day.hoursActual = '--';
        }
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

  Template.burndown.noMoreDays = function() {
    var sprint = getSprint();
    if (sprint) {
      if (sprint.hoursRemainingPerDay.length < sprint.days) {
        return false;
      }
      for (var ii = 0; ii < sprint.days; ii++) {
        if (sprint.hoursRemainingPerDay[ii] == null) {
          return false;
        }
      }
    }
    return true;
  }

  Template.burndown.events = {
    'click .log-day': function() {
      var sprint = getSprint();
      var hoursRemainingPerDay = sprint.hoursRemainingPerDay;
      var added = false;
      for (var ii = 0; ii < hoursRemainingPerDay.length; ii++) {
        if (hoursRemainingPerDay[ii] == null) {
          hoursRemainingPerDay[ii] = sprint.hoursRemaining;
          added = true;
          break;
        }
      }
      if (!added && hoursRemainingPerDay.length < sprint.days) {
        hoursRemainingPerDay.push(sprint.hoursRemaining);
      }
      Sprints.update({_id: sprint._id}, {$set: {hoursRemainingPerDay: hoursRemainingPerDay}});
    },

    'dblclick td.hours-actual': function() {
      $('.hours-edit:visible').each(function() {
        $(this).val($(this).closest('td').find('.hours-display').text());
      });
      $('.hours-edit').hide();
      $('.hours-display').show();
      var $target = $(event.target).closest('td');
      if ($target.find('.hours-display').is(':visible')) {
        $target.find('.hours-display').hide();
        $target.find('.hours-edit').show();
        $target.find('.hours-input').focus();
      }
    }
  }
}