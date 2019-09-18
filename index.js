var parseString = require('xml2js').parseString;
var http = require('http');
const url = require('url');
const ytdl = require('ytdl-core');
const ffmpeg   = require('fluent-ffmpeg');
const credentials = require('./credentials.json');
const podBeanAPI = require('./podBeanAPI.js');
const fs = require("fs");

var siteEnum = {
  NONE:'',
  KONVERENTSID:'ValitsuseUudised',
  ISTUNGID:'UCS1xJUQbauo60LJCEbiiJvg',
  TEST:'UCl2a12GbW8e9itYOJDyjNoA'
}

var accessToken = '';
var mediaKey = '';
var currentCredentials = '';

//TODO Polling for Gov
//TODO delete if no space
//TODO find and rem whitespace
//TODO auto subscribe
//TODO proper error handling
//TODO es5->es6

function downloadAudio(id, title){
  console.log('Downloading audio for '+title)
  ffmpeg(ytdl(id))
  .audioBitrate(128).on('end',()=>{
    podBeanAPI.startUploading(title);
  })
  .save(`${title}.mp3`)  
}

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
  // request.setEncoding('utf8');
  if(method==='POST'){
  // Parse feed data
    request.on('data', function (data) {
      parseString(data, function (err, parsedData) {
        if(err){
          console.log(err)
        }
        var entry = parsedData.feed.entry[0];
        var channelId = entry['yt:channelId'][0];
        
        if (channelId === siteEnum.KONVERENTSID){
          currentCredentials = credentials.konverentsid;
          console.log('Podbean konverentsid')
        } else if (channelId === siteEnum.ISTUNGID){
          currentCredentials = credentials.istungid;
          console.log('Podbean istungid')
        } else if (channelId === siteEnum.TEST){
          currentCredentials = credentials.test;
          console.log('Podbean test')
        }
        if (currentCredentials !== ''){
          var id = entry['yt:videoId'][0];
          var title = entry.title[0];
          
          fs.appendFileSync('log.txt',title+'\n', {'flags': 'a+'});
          console.log('Video title: ' + title);
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