// Globals for Phantom to read out.

STARTUP_TIME = null;
ALL_SUBS_LOADED_TIME = null;
AUTOCLIENT_START = null;
AUTOCLIENT_LOGGED_IN = null;
AUTOCLIENT_PRE_POST = null;
AUTOCLIENT_POST_POST = null;
AUTOCLIENT_PRE_COMMENT = null;
AUTOCLIENT_POST_COMMENT = null;
AUTOCLIENT_DONE = false;


var lorem = new Lorem();

var _allSubscriptionsReady = function () {
  return _.all(Meteor._LivedataConnection._allConnections, function (conn) {
    return _.all(conn._subscriptions, function (sub) {
      Deps.depend(sub.readyDeps);
      return sub.ready;
    });
  });
};

Meteor.startup(function () {
  STARTUP_TIME = new Date();
  Deps.autorun(function () {
    var ready = _allSubscriptionsReady();
    if (ready && !ALL_SUBS_LOADED_TIME) {
      ALL_SUBS_LOADED_TIME = new Date();
      console.log("startup", STARTUP_TIME);
      console.log("all subs loaded", ALL_SUBS_LOADED_TIME);
      console.log("elapsed between", ALL_SUBS_LOADED_TIME.valueOf() - STARTUP_TIME.valueOf());
    }
  });
});


autoclient = function (id) {
  if (!id)
    id = Random.id();
  var _id = '_' + id;
  AUTOCLIENT_START = new Date();
  Accounts.createUser({
    username: _id,
    email: _id + "@example.com",
    password: id
  }, function () {
    AUTOCLIENT_LOGGED_IN = new Date();
    setTimeout(function () {
      AUTOCLIENT_PRE_POST = new Date();
      Meteor.call('post', {
        url: "http://meteor.com/" + id,
        headline: lorem.createText(1, 2),
        body: lorem.createText(1, 1)
      }, function () {
        AUTOCLIENT_POST_POST = new Date();
        setTimeout(function () {
          AUTOCLIENT_PRE_COMMENT = new Date();
          var post = Posts.findOne({_id: {$gt: Random.id()}}, {sort: [["_id", 1]]});
          if (!post)
            post = Posts.findOne();
          Meteor.call(
            'comment',
            post._id,
            null,
            lorem.createText(1, 1),
            function () {
              AUTOCLIENT_POST_COMMENT = new Date();
              AUTOCLIENT_DONE = true;
            });
        }, Random.fraction() * 10000);
      });
    }, Random.fraction() * 10000);
  });
};
