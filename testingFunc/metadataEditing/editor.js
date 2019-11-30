var ffmetadata = require("ffmetadata");
 
// Read song.mp3 metadata
ffmetadata.read("song.mp3", function(err, data) {
    if (err) console.error("Error reading metadata", err);
    else console.log(JSON.stringify(data));
});
 
// Set the artist for song.mp3
var data = {
  title: "",
};
ffmetadata.write("song.mp3", data, function(err) {
    if (err) console.error("Error writing metadata", err);
    else console.log("Data written");
});

