if (Meteor.isClient) {

  Template.storyTable.firstTask = function() {
    var story = getStory(this.id);
    var firstTask = story.tasks[0];
    if (firstTask) {
      firstTask.storyName = story.name;
      firstTask.numTasks = story.tasks.length;
      return firstTask;
    }
  }

  Template.storyTable.otherTasks = function() {
    var story = getStory(this.id);
    if (story.tasks.length > 1) {
      story.tasks.splice(0, 1);
      return story.tasks;
    }
  }

}