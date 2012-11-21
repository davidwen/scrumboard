/**
 * Burndown view for a sprint, displaying a burndown chart and expected/actual hours remaining for
 * each day in the sprint.
 */

// Close all visible burndown hour inputs and revert them to display mode
var closeAllBurndownEdits = function() {
  $('.burndown-hours-input:visible').each(function() {
    var $td = $(this).closest('td');
    $(this).val($td.find('.burndown-hours-display').text());
    $td.removeClass('editing');
  });
  $('.burndown-hours-edit').hide();
  $('.burndown-hours-display').show();
}

Template.burndown.rendered = function() {
  var sprint = getSprint();

  // Accumulate hours expected/actual per day in the sprint
  var expected = [];
  var actual = [];
  if (sprint) {
    var sprintTotalHours = getSprintTotalHours(sprint._id);
    for (var ii = 0; ii < sprint.days + 1; ii++) {
      var expectedDay = [ii, sprintTotalHours * (sprint.days - ii) / sprint.days];
      expected.push(expectedDay);
      if (sprint.hoursRemainingPerDay[ii] != null) {
        var actualDay = [ii, sprint.hoursRemainingPerDay[ii]];
        actual.push(actualDay);
      }
    }
  }

  // Generate burndown graph
  var plot = $.plot(
    $('.burndown-graph')[0],
    [{label: 'Expected', data: expected}, {label: 'Actual', data: actual}],
    {
      lines: { show: true },
      points: { show: true }
    });

  // Bind saving hours on hitting enter
  $('.burndown-hours-input').unbind('keyup');
  $('.burndown-hours-input').keyup(function(e) {
    if (e.which == 13) {
      var hoursRemainingPerDay = [];
      $('.burndown-hours-input').each(function() {
        var value = $(this).val();
        if (value != null && value != '' && !isNaN(value)) {
          hoursRemainingPerDay.push(Number(value));
        } else {
          hoursRemainingPerDay.push(null);
        }
      });
      Meteor.call('setSprintHoursRemainingPerDay', sprint._id, hoursRemainingPerDay);
    }
  });

  // Bind closing all edits on hitting escape
  $(window).unbind('keyup');
  $(window).keyup(function(e) {
    if (e.which == 27) {
      closeAllBurndownEdits();
    }
  });
}

Template.burndown.days = function() {
  var days = [];
  var sprint = getSprint();
  if (sprint) {
    var sprintTotalHours = getSprintTotalHours(sprint._id);
    for (var ii = 0; ii < sprint.days + 1; ii++) {
      var day = {};
      day.day = ii;
      day.hoursExpected = Math.round(sprintTotalHours * (sprint.days - ii) / sprint.days);
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
  return getSprintHoursRemaining(getSprintId());
}

// Returns true if all hoursRemainingPerDay have been set for eachd ay in the sprint
Template.burndown.noMoreDays = function() {
  var sprint = getSprint();
  if (sprint) {
    if (sprint.hoursRemainingPerDay.length < sprint.days) {
      return false;
    }
    for (var ii = 0; ii < sprint.days + 1; ii++) {
      if (sprint.hoursRemainingPerDay[ii] == null) {
        return false;
      }
    }
  }
  return true;
}

Template.burndown.events = {

  // Assigns the current hours remaining left in the sprint into the next open day
  'click .log-day': function() {
    var sprint = getSprint();
    var hoursRemainingPerDay = sprint.hoursRemainingPerDay;
    var sprintHoursRemaining = getSprintHoursRemaining(sprint._id);
    var added = false;
    for (var ii = 0, len = hoursRemainingPerDay.length; ii < len; ii++) {
      if (hoursRemainingPerDay[ii] == null) {
        hoursRemainingPerDay[ii] = sprintHoursRemaining;
        added = true;
        break;
      }
    }
    if (!added && hoursRemainingPerDay.length < sprint.days) {
      hoursRemainingPerDay.push(sprintHoursRemaining);
      added = true;
    }
    if (added) {
      Meteor.call('setSprintHoursRemainingPerDay', sprint._id, hoursRemainingPerDay);
    }
  },

  // Shade next open day on hover over the log-day button 
  'mouseenter .log-day': function() {
    if (!$(event.target).attr('disabled')) {
      $('.burndown-hours-display:contains("--"):first').closest('td')
        .addClass('burndown-hours-hover');
    }
  },
  'mouseleave .log-day': function() {
    $('.burndown-hours-hover').removeClass('burndown-hours-hover');
  },

  // Show edit mode when double clicking actual hours
  'dblclick .burndown-hours-actual': function() {
    closeAllBurndownEdits();
    var $target = $(event.target).closest('td');
    if ($target.find('.burndown-hours-display').is(':visible')) {
      $target.find('.burndown-hours-display').hide();
      $target.find('.burndown-hours-input').width('100%');
      $target.find('.burndown-hours-edit').show();
      $target.find('.burndown-hours-input').focus();
      $target.addClass('editing');
    }
  }
}