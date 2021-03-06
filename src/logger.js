const config = require("./config.js");

const opts = {
  logDirectory: config.loggerDir, // NOTE: folder must exist and be writable...
  fileNamePattern: "<DATE>.log",
  dateFormat: "YYYY.MM.DD"
};
const log = require("simple-node-logger").createRollingFileLogger(opts);

module.exports = log;
