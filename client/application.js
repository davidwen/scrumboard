Meteor.startup(function() {
  var pathSplit = window.location.pathname.split('/');
  if (pathSplit.length >= 2 && pathSplit[1] != '') {
    Session.set(SPRINT, decodeURI(pathSplit[1]));
  }
});