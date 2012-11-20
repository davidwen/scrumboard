Meteor.methods({
  addSprint: function(sprint) {
    Sprints.insert(sprint);
    return sprint.name;
  },

  addStoryToSprint: function(story, sprintId) {
    Sprints.update(
      {_id: sprintId},
      {
        $push: {stories: {
          id: story._id,
          name: story.name
        }},
        $inc: {
          totalHours: getStoryHours(story),
          hoursRemaining: getStoryHoursRemaining(story)
        }
      });
  },

  setSprintHoursRemainingPerDay: function(sprintId, hoursRemainingPerDay) {
    Sprints.update({_id: sprintId}, {$set: {hoursRemainingPerDay: hoursRemainingPerDay}});
  },

  /* 
    If given task has no ID, assigns ID to task and insert into story.
    If given task has ID, updates the specified task in the story.
    In addition, update sprint hours/hours remaining.
  */
  upsertTask: function(task, storyId, sprintId) {
    var hoursDelta;
    var hoursRemainingDelta;
    var story = getStory(storyId);
    var updated = false;
    if (task.id == null || task.id == story.nextTaskId) {
      task.id = story.nextTaskId;
      story.nextTaskId++;
      story.tasks.push(task);
      hoursDelta = task.hours;
      hoursRemainingDelta = task.hoursRemaining;
      updated = true;
    } else {
      for (var ii = 0, len = story.tasks.length; ii < len; ii++) {
        var oldTask = story.tasks[ii];
        if (oldTask.id == task.id) {
          hoursDelta = task.hours - oldTask.hours;
          hoursRemainingDelta = task.hoursRemaining - oldTask.hoursRemaining;
          story.tasks[ii] = task;
          updated = true;
          break;
        }
      }
    }
    if (updated) {
      Stories.update(
        {_id: story._id},
        {
          $set: {
            tasks: story.tasks,
            nextTaskId: story.nextTaskId
          }
        });
      Sprints.update(
        {_id: sprintId},
        {
          $inc: {
            totalHours: hoursDelta,
            hoursRemaining: hoursRemainingDelta
          }
        });
    }
  },

  deleteTask: function(taskId, storyId, sprintId) {
    var story = getStory(storyId);
    for (var ii = 0, len = story.tasks.length; ii < len; ii++) {
      if (story.tasks[ii].id == taskId) {
        var taskHours = story.tasks[ii].hours;
        var taskHoursRemaining = story.tasks[ii].hoursRemaining;
        story.tasks.splice(ii, 1);
        Stories.update(
          {_id: story._id},
          {$set: {tasks: story.tasks}});
        Sprints.update(
          {_id: sprintId},
          {$inc: {
            totalHours: -taskHours,
            hoursRemaining: -taskHoursRemaining
          }});
        break;
      }
    }
  },

  addStory: function(story) {
    var result = Stories.insert(story);
    return result;
  }
});