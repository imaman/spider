var spider = require('./src/framework/spider.js');

spider.run(3000, function(err) {
  console.log('done. err=' + err);
});


