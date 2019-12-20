const ytdl = require("ytdl-core");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");


// ffmpeg(ytdl('KlsGHiV3Xf4')).save('./newVid.mp4')
ytdl('KlsGHiV3Xf4').pipe(fs.createWriteStream("newFile2.mp4"));