var parseString = require('xml2js').parseString;


var http = require('http');

//create a server object:
http.createServer(function (request, response) {

  request.setEncoding('utf8');
  request.on('data', function (data) {
    parseString(data, function (err, result) {
      var entry = result.feed.entry;
      console.log(entry);
      console.log(entry[0]['yt:videoId'][0]);
    });
  });
  response.writeHead('200');
  response.end();
}).listen(process.env.PORT);