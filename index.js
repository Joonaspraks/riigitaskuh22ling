var parseString = require('xml2js').parseString;
var http = require('http');
const keys = require('./keys.json');
const shell = require('shelljs');
const superagent = require('superagent');
var {google} = require('googleapis');
const fs = require("fs");

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

var accessToken = '';
var mediaKey = '';

function downloadAudio(id, title){
  // sync
  shell.exec("downloadVideo.sh" + " " + id);
  console.log('Shell downloaded audio');
  startUploading(title);
}

function startUploading(fileName){
  getPodBeanAccessToken(fileName);
}

function getPodBeanAccessToken(fileName){
  superagent.post('https://api.podbean.com/v1/oauth/token')
    .send({
      grant_type: 'client_credentials',
      client_id: '1405d6a0497f64f70d6d1',
      client_secret: '2872053f56f0b2e656d4f'
    })
    .end((err, res) => {
      if (err) return console.log(err);
      accessToken = res.body.access_token;
      authorizeUpload(fileName);
    })
}

function authorizeUpload(fileName){
  var ext = '.mp3';
  var fileSize = fs.statSync('clips/'+fileName+'.mp3').size;
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
  .attach(fileName, fs.readFileSync('clips/'+fileName+'.mp3'))
  .end((err, res) => {
    if (err){ 
      console.log(err.status);
    };
    console.log(res.status);
    if (res.status==200);
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
      media_key: mediaKey,
      // content: 'lore ipsum'
    })
    .type('application/x-www-form-urlencoded')
    .end((err, res) => {
      if (err) return console.log(err);
      console.log(res);
    })
}

http.createServer(function (request, response) {

  console.log('Server was called!');
  var challenge = '';
  request.setEncoding('utf8');
  request.on('response', function (res) {
    console.log(res)
  })
  request.on('data', function (data) {
    parseString(data, function (err, result) {
      if(err){
        console.log(err)
      }
      // challenge = result.hub.challenge;
      var entry = result.feed.entry[0];
      var id = entry['yt:videoId'][0];
      var title = entry.title;
      console.log('Video title: ' + title);
      downloadAudio(id, title);

      // Stops the notifications for current item
      response.writeHead('200');
      // response.write(challenge);
      response.end();
    });
  });
}).listen(process.env.PORT || 8080);