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
        console.log('Toggle sprint enabled!');
      },
      
      showCurrentSprint : function() {
        console.log('Show current sprint successful!');
      },
      
      bindToolTip : function() {
        console.log('Tooltip enabled!');
      }
    }
  }
})();
