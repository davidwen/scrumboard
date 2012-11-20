Meteor.startup(function() {
  var pathSplit = window.location.pathname.split('/');
  if (pathSplit.length >= 2 && pathSplit[1] != '') {
    Session.set(SPRINT_NAME, decodeURI(pathSplit[1]));
  }
});