var parseString = require('xml2js').parseString;
var http = require('http');
const keys = require('./keys.json');
const shell = require('shelljs');
const superagent = require('superagent');
var {google} = require('googleapis');
const fs = require("fs");
const url = require('url');
const ytdl = require('ytdl-core');
const ffmpeg   = require('fluent-ffmpeg');
const credentials = require('./credentials.json')

var service = google.youtube('v3');

/* function getChannelId() {
    service.channels.list({
      auth: keys.API_KEY,
      part: 'id',
      forUsername: 'ValitsuseUudised'
    }, function(err, response) {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }
      var channels = response.data.items;
      if (channels.length == 0) {
        console.log('No channel found.');
      } else {
        getVideos(channels[0].id, upload);
      }
    });
  }

function getVideos(id, callback){
  service.search.list({
    auth: keys.API_KEY,
    part: 'id, snippet',
    channelId: id,
    q: 'Valitsuse pressikonverents',
    type: 'video'
  },  function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var videos = response.data.items;
    if (videos.length == 0) {
      console.log('No videos found.');
    } else {
      var video = videos[0];
      console.log(video);
      shell.exec('downloadVideo.sh' + ' ' + video.id.videoId + ' ' + '`' + video.snippet.title  + '`');
      callback(video.snippet.title);
    }
  });
} */

var siteEnum = {
  NONE:'',
  KONVERENTSID:'ValitsuseUudised',
  ISTUNGID:'UCS1xJUQbauo60LJCEbiiJvg',
  TEST:'UCl2a12GbW8e9itYOJDyjNoA'
}

var accessToken = '';
var mediaKey = '';
var currentCredentials = '';

function startUploading(fileName){
  getPodBeanAccessToken(fileName);
}

function getPodBeanAccessToken(fileName){
  superagent.post('https://api.podbean.com/v1/oauth/token')
    .send({
      grant_type: 'client_credentials',
      client_id: currentCredentials.id,
      client_secret: currentCredentials.secret
    })
    .end((err, res) => {
      if (err) console.log(err);
      accessToken = res.body.access_token;
      authorizeUpload(fileName);
    })
}

function authorizeUpload(fileName){
  var ext = '.mp3';
  var fileSize = fs.statSync(fileName+'.mp3').size;
  console.log(accessToken);
  console.log(fileName+ext);
  console.log(fileSize);
  superagent.get('https://api.podbean.com/v1/files/uploadAuthorize')
    .query({
      access_token: accessToken,
      filename: fileName+ext,
      filesize: fileSize,
      content_type: 'audio/mpeg'
    })
    .end((err, res) => {
      if (err) {
        console.log(err);
      }
      mediaKey = res.body.file_key;
      uploadPodcast(res.body.presigned_url, fileName);
    })
}

function uploadPodcast(url, fileName){
  superagent.put(url)
  .type('audio/mpeg')
  .attach(fileName, fs.readFileSync(fileName+'.mp3'))
  .end((err, res) => {
    if (err){ 
      console.log(err.status);
    };
    console.log(res.status);
    if (res.status===200);
      publishPodcast(fileName)
  })
}

function publishPodcast(fileName){
  fileName+'.mp3';
  superagent.post('https://api.podbean.com/v1/episodes')
    .send({
      access_token: accessToken,
      type: 'public',
      title: fileName,
      status: 'publish',
      media_key: mediaKey
    })
    .type('application/x-www-form-urlencoded')
    .end((err, res) => {
      if (err) console.log(err);
      console.log(res.status);
    })
}

function downloadAudio(id, title){
  console.log('Downloading audio for '+title)
  ffmpeg(ytdl(id))
  .audioBitrate(128).on('end',()=>{
    startUploading(title);
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
          console.log('Video title: ' + title);
          downloadAudio(id, title);
        }
        // Stops the notifications for current item
        response.writeHead('200');
        response.end();
      });
    });
  }
}).listen(process.env.PORT || 8080);