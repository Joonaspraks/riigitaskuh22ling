const env = process.env.NODE_ENV; //dev or prod
const fs = require("fs");

let config;

config =
  env === "dev"
    ? {
        loggerDir: "./logs/devLogs/",
        hmacSecret = "qVt5FXH8RpHprlFetynj",
        port: 8080,
        protocol: "http://",
        publish: false,
        storageDir: "./audioStorage/devAudio/",
        useReroute: false,
        youTubeChannels: ["UCl2a12GbW8e9itYOJDyjNoA"] // Joonas Praks
      }
    : {
        loggerDir: "./logs/productionLogs/",
        hmacSecret = "NjPWAxQeykUoixaYt1HJ",
        port: 443,
        protocol: "https://",
        publish: true,
        SSLCert: {
          key: fs.readFileSync(
            "/etc/letsencrypt/live/riigipodcast.ee/privkey.pem"
          ),
          cert: fs.readFileSync(
            "/etc/letsencrypt/live/riigipodcast.ee/fullchain.pem"
          )
        },
        storageDir: "./audioStorage/productionAudio/",
        useReroute: true,
        youTubeChannels: ["ValitsuseUudised", "UCS1xJUQbauo60LJCEbiiJvg"] // valitsus, Riigikogu
      };

config.descriptionExtension = ".txt";
config.audioExtension = ".mp3";
config.podbeanCredentials = {
  // riigiPodcast.podbean
  id: "1405d6a0497f64f70d6d1",
  secret: "2872053f56f0b2e656d4f"
};

module.exports = config;
