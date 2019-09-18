const ffmpeg   = require('fluent-ffmpeg');

ffmpeg('vid.mp4')
  .on('start', () => console.log('start'))
  .audioFilters('silenceremove=stop_periods=-1:stop_duration=0.2:stop_threshold=-20dB')
  .on('end', () => console.log('end'))
  .save('processedVid.mp4');
