const ffmpeg   = require('fluent-ffmpeg');

ffmpeg('vid.mp4')
  .on('start', () => console.log('start'))
  //noise removal
  //detect general audio level to cut silence
  //note that questioneers mic sound can be lower than the ministers
  .audioFilters('silenceremove=stop_periods=-1:stop_duration=2:stop_threshold=-20dB')
  .on('end', () => console.log('end'))
  .save('processedVid.mp4');
