var parseImport = function(input) {
  var rows = [];
  var currentRow = [];
  var rowSplit = input.split('\t');
  for (var ii = 0; ii < rowSplit.length; ii++) {
    var cell = rowSplit[ii];
    if (cell[0] == '"' || cell.indexOf('\n') == -1) {
      if (cell[0] == '"') {
        // Strip surrounding quotes
        cell = cell.slice(1, -1);
      }
      currentRow.push(cell);
    } else {
      var cellSplit = cell.split('\n');
      currentRow.push(cellSplit[0]);
      rows.push(currentRow);
      currentRow = [cellSplit[1]];
    }
  }
  rows.push(currentRow);
  return rows;
}

var submitAddSprintForm = function() {
  var $form = $('form.add-sprint-form');
  var sprintName = $form.find('#sprint-name').val();
  var days = Number($form.find('#sprint-days').val());
  var totalHours = 0;
  if (sprintName) {
    if (getSprint(sprintName)) {
      alert('Sprint with that name already exists');
    } else {
      var stories = [];
      var storiesImport = $form.find('#sprint-stories-import').val();
      if (storiesImport) {
        var storyRows = parseImport(storiesImport);
        for (var ii = 0; ii < storyRows.length; ii++) {
          var storyRow = storyRows[ii];
          var story = {
            name: storyRow[0],
            description: storyRow[2],
            acceptanceCriteria: storyRow[3],
            points: Number(storyRow[4]),
            tasks: [],
            nextTaskId: 0
          };
          stories.push(story);
        }

        var tasksImport = $form.find('#sprint-tasks-import').val();
        if (tasksImport) {
          var taskRows = parseImport(tasksImport);
          var currentStory;
          for (var ii = 0; ii < taskRows.length; ii++) {
            var taskRow = taskRows[ii];
            var task = {
              name: taskRow[1],
              description: taskRow[2],
              owner: taskRow[4],
              hours: Number(taskRow[5]),
              hoursRemaining: Number(taskRow[5]),
              status: 'notstarted'
            }
            var storyName = taskRow[0]
            if (storyName) {
              currentStory = storyName;
            }
            for (var jj = 0; jj < stories.length; jj++) {
              var story = stories[jj];
              if (story.name == currentStory) {
                task.id = story.nextTaskId;
                story.nextTaskId++;
                story.tasks.push(task);
                totalHours += task.hours;
                break;
              }
            }
          }
        }
      }

      var sprintStories = [];
      for (var ii = 0; ii < stories.length; ii++) {
        var story = stories[ii];
        var storyId = Stories.insert(story);
        sprintStories.push({
          id: storyId,
          name: story.name
        });
      }
      Sprints.insert({
        name: sprintName,
        stories: sprintStories,
        days: days,
        totalHours: totalHours,
        hoursRemaining: []
      });
      $('#add-sprint-dialog').modal('hide');
    }
  } else {
    alert('Name required');
  }
}

if (Meteor.isClient) {
  Template.dashboard.sprint = function() {
    return Sprints.find();
  }

  Template.dashboard.events = {
    'click .show-add-sprint-dialog': function() {
      $('form.add-sprint-form')[0].reset();
    }
  }

  Template.dashboardSprint.nameUriDecoded = function() {
    return encodeURIComponent(this.name);
  }

  Template.addSprintDialog.events = {
    'submit .add-sprint-form': function() {
      submitAddSprintForm();
      return false;
    },

    'click .add-sprint': function() {
      submitAddSprintForm(); 
    }
  }
}