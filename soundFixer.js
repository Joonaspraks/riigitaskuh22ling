const ffmpeg   = require('fluent-ffmpeg');

function editAudio(fileName){
  return ffmpeg(fileName)
  .on('start', () => console.log('start'))
  //noise removal
  //detect general audio level to cut silence
  //note that questioneers mic sound can be lower than the ministers
  .audioFilters('silenceremove='+
/*             'start_periods=0:'+ //trim until 1 non-silence
               'start_duration=0:'+ //atleast that amount of seconds to be a 'silence'
               'start_threshold=0:'+ //what dB constitutes a 'silence' */

              'stop_periods=-1:'+ //negative value means that silencing will occur in the middle of the file, '1' means that 'trim until 1 non-silence'
              'stop_duration=3:'+ //atleast that amount of seconds to be a 'silence'
              'stop_threshold=-35dB',
               
              //'earwax'+
              //'loudnorm',
              'dynaudnorm'
              ) //what dB constitutes a 'silence'

  .on('progress', progress => console.log(progress.percent))
  //.save('earwaxIstung2.mp3');
  .save('dynaudnormIstung2.mp3');
  //.save('loudnormIstung2.mp3');
}

module.exports = {editAudio: editAudio};