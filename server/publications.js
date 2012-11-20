Meteor.publish('sprints', function() {
    return Sprints.find({});
});

Meteor.publish('stories', function() {
    return Stories.find({});
});