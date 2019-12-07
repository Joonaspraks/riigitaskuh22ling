const env = process.env.NODE_ENV; //dev or prod
const fs = require("fs");

let config;

config =
  env === "dev"
    ? {
        feedEndpoint: "/testFeed",
        fileResource: "testFile",
        homeEndpoint: "/test",
        loggerDir: "./logs/devLogs",
        port: 8080,
        publish: false,
        storageDir: "./audioStorage/devAudio",
        useReroute: false,
        youTubeChannels: ["UCl2a12GbW8e9itYOJDyjNoA"] // Joonas Praks
      }
    : {
        feedEndpoint: "/feed",
        fileResource: "file",
        homeEndpoint: "/",
        loggerDir: "./logs/productionLogs",
        port: 443,
        publish: true,
        storageDir: "./audioStorage/productionAudio",
        useReroute: true,
        youTubeChannels: ["ValitsuseUudised", "UCS1xJUQbauo60LJCEbiiJvg"] // valitsus, Riigikogu
      };

config.SSLCert = {
  key: fs.readFileSync("/etc/letsencrypt/live/riigipodcast.ee/privkey.pem"),
  cert: fs.readFileSync("/etc/letsencrypt/live/riigipodcast.ee/fullchain.pem")
};
config.extension = ".mp3";
config.podbeanCredentials = {
  // riigiPodcast.podbean
  id: "1405d6a0497f64f70d6d1",
  secret: "2872053f56f0b2e656d4f"
};

module.exports = config;
