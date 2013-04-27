Package.describe({
  summary: "Run node-profiler against your meteor app"
});

Package.on_use(function (api, where) {
  api.use('node-modules', 'server');
  
  api.add_files('profiler.js', 'server');
});
