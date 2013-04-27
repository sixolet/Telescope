(function() {
  // node modules should probably do this
  if (process.env.NODE_MODULES_PATH)
    NodeModules.setPath(process.env.NODE_MODULES_PATH);
  
  Meteor.Profiler = {
    allow: function(userId) {
      return true;
    }
  };
  
  Meteor.methods({
    resumeProfile: function() {
      if (Meteor.Profiler.allow(this.userId)) {
        console.log('-- Resuming profile');
        NodeModules.require('profiler').resume();
      }
    },
    pauseProfile: function() {
      if (Meteor.Profiler.allow(this.userId)) {
        console.log('-- Pausing profile');
        NodeModules.require('profiler').pause();
      }
    }
  });
}());