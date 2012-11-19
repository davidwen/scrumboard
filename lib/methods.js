Meteor.methods({
  addSprint: function(sprint) {
    Sprints.insert(sprint);
    return sprint.name;
  },

  addStoryToSprint: function(story, sprint) {
    Sprints.update(
      {_id: sprint._id},
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

  /* 
    If given task has no ID, assigns ID to task and insert into story.
    If given task has ID, updates the specified task in the story.
    In addition, update sprint hours/hours remaining.
  */
  upsertTask: function(task, story, sprint) {
    var hoursDelta;
    var hoursRemainingDelta;
    if (task.id == null) {
      task.id = story.nextTaskId;
      story.nextTaskId++;
      story.tasks.push(task);
      hoursDelta = task.hours;
      hoursRemainingDelta = task.hoursRemaining;
    } else {
      for (var ii = 0, len = story.tasks.length; ii < len; ii++) {
        var oldTask = story.tasks[ii];
        if (oldTask.id == task.id) {
          hoursDelta = task.hours - oldTask.hours;
          hoursRemainingDelta = task.hoursRemaining - oldTask.hoursRemaining;
          story.tasks[ii] = task;
          break;
        }
      }
    }
    Stories.update({_id: story._id},
      {$set: {
        tasks: story.tasks,
        nextTaskId: story.nextTaskId
      }});
    Sprints.update(
      {_id: sprint._id},
      {
        $set: {
          totalHours: sprint.totalHours + hoursDelta,
          hoursRemaining: sprint.hoursRemaining + hoursRemainingDelta
        }
      });
  },

  deleteTask: function(taskId, storyId, sprint) {
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
          {_id: sprint._id},
          {$set: {
            totalHours: sprint.totalHours - taskHours,
            hoursRemaining: sprint.hoursRemaining - taskHoursRemaining
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