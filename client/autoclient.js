var STARTUP_TIME = null;
var ALL_SUBS_LOADED_TIME = null;
var AUTOCLIENT_START = null;
var AUTOCLIENT_LOGGED_IN = null;
var AUTOCLIENT_PRE_POST = null;
var AUTOCLIENT_POST_POST = null;
var AUTOCLIENT_PRE_COMMENT = null;
var AUTOCLIENT_POST_COMMENT = null;

// Global for Phantom to read out.
AUTOCLIENT_DONE = false;


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
  var afterLogin = function (err) {
    if (err) {
      Accounts.loginWithPassword(_id, afterLogin);
      return;
    }
    AUTOCLIENT_LOGGED_IN = new Date();
    setTimeout(function () {
      AUTOCLIENT_PRE_POST = new Date();
      Meteor.call('post', {
        url: "http://meteor.com/" + Random.id(),
        headline: dimsum.generate(1, {
          sentences_per_paragraph: [1, 1],
          words_per_sentence: [5, 10],
          commas_per_sentence: [0, 0]
        }),
        body: dimsum.generate(2)
      }, function () {
        AUTOCLIENT_POST_POST = new Date();
        setTimeout(function () {
          AUTOCLIENT_PRE_COMMENT = new Date();
          var post = Random.choice(Posts.find({}).fetch());
          Meteor.call(
            'comment',
            post._id,
            null,
            dimsum.paragraph(),
            function () {
              AUTOCLIENT_POST_COMMENT = new Date();
              AUTOCLIENT_DONE = true;
            });
        }, Random.fraction() * 10000);
      });
    }, Random.fraction() * 10000);
  };
  AUTOCLIENT_START = new Date();
  Accounts.createUser({
    username: _id,
    email: _id + "@example.com",
    password: id
  }, afterLogin);
};

autoclientResult = function () {
  if (!AUTOCLIENT_DONE)
    return null;
  return {
    startTime: STARTUP_TIME,
    loadTime: ALL_SUBS_LOADED_TIME,
    postLatency: AUTOCLIENT_POST_POST.valueOf() - AUTOCLIENT_PRE_POST.valueOf(),
    commentLatency: AUTOCLIENT_POST_COMMENT.valueOf() - AUTOCLIENT_PRE_COMMENT.valueOf()
  };
};
