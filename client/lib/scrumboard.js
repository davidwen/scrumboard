;(function(){
  /*
   * Scrumboard v1.0
   * written by billy@yext.com
   */
  var Scrumboard = {}
  window.Scrumboard = Scrumboard;

  /* Handles all dynamic interface interactions
   */
  Scrumboard.UI = {

    // Sprint Dashboard
    sprintDashboard : {
      init : function() {
        this.showCurrentSprint();
        this.bindSlideToggle();
        this.bindToolTip();
      },

      bindSlideToggle : function() {
        // slide toggle for sprint directory
      },

      showCurrentSprint : function() {
        // show first sprint (current)
      },

      bindToolTip : function() {
        // Tooltip functionality
      }
    }
  }
})();
