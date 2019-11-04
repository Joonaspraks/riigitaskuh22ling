var parseString = require('xml2js').parseString;
var http = require('http');
const url = require('url');
const ytdl = require('ytdl-core');
const fs = require("fs");
const path = require('path');

const literals = require('./literals.json');
const podBeanAPI = require('./podBeanAPI.js');
const rssModule = require('./rssModule.js')
const subscriber = require("./subscriber.js")
const soundFixer = require("./soundFixer.js")

const credentials = literals.credentials;
const channels = literals.channels;

var currentCredentials = '';

//TODO Polling for Gov
//TODO delete if no space
//TODO find and rem whitespace
//TODO auto subscribe
//TODO proper error handling
//TODO es5->es6

function downloadAudio(id, title){
  console.log('Downloading audio for '+title);

 soundFixer.editAudio(ytdl(id), title).on('end',()=>{

  // For some reason no file
  podBeanAPI.startUploading(title, currentCredentials);
  rssModule.propagate();
 })
  
/*   ffmpeg(ytdl(id))
  .audioBitrate(128).on('end',()=>{
    
    podBeanAPI.startUploading(title, currentCredentials);
    rssModule.propagate();
  })
  .save(`${title}.mp3`)  */
}

subscriber.renewSubscriptions();

http.createServer(function (request, response) {

  console.log('Server was called!');
  const method = request.method;
  const requestUrl = request.url;
  console.log('Method: '+ method);
  console.log('Url: '+ requestUrl);
  if(method==='GET' && requestUrl){
    var result = url.parse(requestUrl, true).query['hub.challenge'];
    if(result){
      response.writeHead('200');
      response.write(result);
      response.end();
    }
  }

  if(method=='GET' && requestUrl=='/'){
    response.writeHead('200');
    response.write('<html><body><h1>Welcome to my start page</h1><p>Pride is good</p></body></html>');
    response.end();
  
   }
  /*
    if endpoint get + filename, lookup and return file
  */
 if(method=='GET' && requestUrl.includes('file')){
  var filePath = path.join(__dirname, 'istung.mp3');
  var stat = fs.statSync(filePath);

  response.writeHead(200, {
    'Content-Type': 'audio/mpeg',
    'Content-Length': stat.size
  });

  var readStream = fs.createReadStream(filePath);
  readStream.pipe(response);
 }

 if(method=='GET' && requestUrl.includes('rss')){
  const result = rssModule.propagate();

  response.writeHead(200, {
    'Content-Type': 'application/rss+xml',
  });

  response.write(result);
  response.end();

 }

 if(method=='GET' && requestUrl.includes('test')){
  response.writeHead('200');
  response.write('<html><body><h1>Welcome to my test page</h1><p>Greed is good</p></body></html>');
  response.end();

 }

  if(method==='POST' ){

    console.log(JSON.stringify(request.headers));
  
  // Parse feed data
    request.on('data', function (data) {
      parseString(data, function (err, parsedData) {
        if(err){
          console.log(err)
        }
        var entry = parsedData.feed.entry[0];
        var channelId = entry['yt:channelId'][0];
        
        if (channelId === channels.KONVERENTSID){
          currentCredentials = credentials.konverentsid;
          console.log('Podbean konverentsid')
        } else if (channelId === channels.ISTUNGID){
          currentCredentials = credentials.konverentsid;
          console.log('Podbean istungid')
        } else if (channelId === channels.TEST){
          currentCredentials = credentials.test;
          console.log('Podbean test')
        }
        if (currentCredentials !== ''){
          var id = entry['yt:videoId'][0];
          var title = entry.title[0];
          
          fs.appendFileSync('log.txt',title+'\n', {'flags': 'a+'});
          console.log('\nVideo title: ' + title);
          // TODO
          //podBeanAPI.clearSpace();
          downloadAudio(id, title);
        }
        // Stops the notifications for current item
        response.writeHead('200');
        response.end();
      });
    });
  }
}).listen(process.env.PORT || 8080);