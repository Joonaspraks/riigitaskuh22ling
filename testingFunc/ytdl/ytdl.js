const ytdl = require("ytdl-core");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");

ffmpeg(ytdl('KlsGHiV3Xf4')).save('newVid.mp4')

