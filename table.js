if (Meteor.isClient) {

  Template.storyTable.firstTask = function() {
    var story = getStory(this.id);
    if (story) {
      var firstTask = story.tasks[0];
      if (firstTask) {
        firstTask.storyId = story._id;
        firstTask.storyName = story.name;
        firstTask.numTasks = story.tasks.length;
        return firstTask;
      } else {
        return {
          storyId: story._id,
          storyName: story.name,
          numTasks: 1
        }
      }
    }
  }

  Template.storyTable.otherTasks = function() {
    var story = getStory(this.id);
    if (story && story.tasks.length > 1) {
      story.tasks.splice(0, 1);
      return story.tasks;
    }
  }

}