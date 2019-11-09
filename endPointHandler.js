var parseString = require("xml2js").parseString;
const url = require("url");
const ytdl = require("ytdl-core");
const fs = require("fs");
const path = require("path");

const literals = require("./literals.json");
const podBeanAPI = require("./podBeanAPI.js");
const rssModule = require("./rssModule.js");
const soundFixer = require("./soundFixer.js");

const credentials = literals.credentials;
const channels = literals.channels;

var currentCredentials = "";

function downloadAudio(id, title) {
  console.log("Downloading audio for " + title);

  soundFixer.editAudio(ytdl(id), title).on("end", () => {
    //podBeanAPI.checkSpace(); Necessary if unlimited space?
    podBeanAPI.startUploading(title, currentCredentials);
    rssModule.propagate();
  });
}

function parse(request, response) {
  console.log("Server was called!");
  const method = request.method;
  const requestUrl = request.url;
  console.log("Method: " + method);
  console.log("Url: " + requestUrl);

  //Parse only permitted
  if (method === "GET" && requestUrl) {
    console.log("Subscribing!");
    var result = url.parse(requestUrl, true).query["hub.challenge"];
    if (result) {
      console.log(JSON.stringify(requestUrl));
      response.writeHead("200");
      response.write(result);
      response.end();
    }
  }

  if (method === "GET" && requestUrl == "/") {
    response.writeHead("200");
    response.write(
      "<html><head><meta name='google-site-verification' content='71QmVVJaUYxxAbp0YHhwaQ-gHcNnct4LtzaTt4ESPV0' /></head>"+
      "<body><h1>Welcome to my start page</h1><p>Pride is good</p></body></html>"
    );
    response.end();
  }

  if (method === "GET" && requestUrl === "/feed") {
    const result = rssModule.propagate();

    response.writeHead(200, {
      "Content-Type": "application/rss+xml"
    });

    response.write(result);
    response.end();
  }

  /*
      if endpoint get + filename, lookup and return file
    */
  if (method === "GET" && requestUrl.includes("test1")) {
    var filePath = path.join(__dirname, "test1.mp3");
    var stat = fs.statSync(filePath);

    response.writeHead(200, {
      "Content-Type": "audio/mpeg",
      "Content-Length": stat.size
    });

    var readStream = fs.createReadStream(filePath);
    readStream.pipe(response);
  }

  if (method === "GET" && requestUrl.includes("test2")) {
    response.writeHead("200");
    response.write(
      "<html><body><h1>Welcome to my test page</h1><p>Greed is good</p></body></html>"
    );
    response.end();
  }

  if (
    method === "POST" &&
    request.headers.link &&
    request.headers.link.includes("http://pubsubhubbub.appspot.com/")
  ) {
    // Parse feed data
    request.on("data", function(data) {
      parseString(data, function(err, parsedData) {
        if (err) {
          console.log(err);
        }
        var entry = parsedData.feed.entry[0];
        var channelId = entry["yt:channelId"][0];

        if (channelId === channels.KONVERENTSID) {
          currentCredentials = credentials.konverentsid;
          console.log("Podbean konverentsid");
        } else if (channelId === channels.ISTUNGID) {
          currentCredentials = credentials.konverentsid;
          console.log("Podbean istungid");
        } else if (channelId === channels.TEST) {
          currentCredentials = credentials.test;
          console.log("Podbean test");
        }
        if (currentCredentials !== "") {
          var id = entry["yt:videoId"][0];
          var title = entry.title[0];

          fs.appendFileSync("log.txt", title + "\n", { flags: "a+" });
          console.log("\nVideo title: " + title);
          //fileManager.checkSpace();
          downloadAudio(id, title);
        }
        // Stops the notifications for current item
        response.writeHead("200");
        response.end();
      });
    });
  }
}

module.exports = { parse: parse };
