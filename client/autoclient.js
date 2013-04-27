var startupTime = null;
var allSubsLoaded = null;
var autoclientStart = null;
var autoclientLoggedIn = null;
var autoclientPrePost = null;
var autoclientPostPost = null;
var autoclientPreComment = null;
var autoclientPostComment = null;

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
  startupTime = new Date();
  Deps.autorun(function () {
    var ready = _allSubscriptionsReady();
    if (ready && !allSubsLoaded) {
      allSubsLoaded = new Date();
      if (typeof callPhantom !== 'undefined')
        callPhantom({event: "allSubs"});
      console.log("startup", startupTime);
      console.log("all subs loaded", allSubsLoaded);
      console.log("elapsed between", allSubsLoaded.valueOf() - startupTime.valueOf());
    }
  });
});



autoclient = function (id) {
  if (!id)
    id = Random.id();
  var _id = '_' + id;
  var afterLogin = function (err) {
    if (err) {
      Meteor.loginWithPassword(_id, id, afterLogin);
      return;
    }
    autoclientLoggedIn = new Date();
    setTimeout(function () {
      autoclientPrePost = new Date();
      Meteor.call('post', {
        url: "http://meteor.com/" + Random.id(),
        headline: dimsum.generate(1, {
          sentences_per_paragraph: [1, 1],
          words_per_sentence: [5, 10],
          commas_per_sentence: [0, 0]
        }),
        body: dimsum.generate(2)
      }, function () {
        autoclientPostPost = new Date();
        setTimeout(function () {
          autoclientPreComment = new Date();
          var post = Random.choice(Posts.find({}).fetch());
          Meteor.call(
            'comment',
            post._id,
            null,
            dimsum.paragraph(),
            function () {
              autoclientPostComment = new Date();
              AUTOCLIENT_DONE = true;
            });
        }, Random.fraction() * 10000);
      });
    }, Random.fraction() * 10000);
  };
  autoclientStart = new Date();
  if (Meteor.userId()) {
    Meteor.logout(function () {
      afterLogin(true);
    });
  } else {
    Accounts.createUser({
      username: _id,
      email: _id + "@example.com",
      password: id
    }, afterLogin);
  }
};

// Has to return JSON-able things
autoclientResult = function (start, events) {
  if (!AUTOCLIENT_DONE)
    return null;
  return {
    loadLatency: events.allSubs.time - start,
    loginLatency: autoclientLoggedIn.valueOf() - autoclientStart.valueOf(),
    postLatency: autoclientPostPost.valueOf() - autoclientPrePost.valueOf(),
    commentLatency: autoclientPostComment.valueOf() - autoclientPreComment.valueOf()
  };
};
