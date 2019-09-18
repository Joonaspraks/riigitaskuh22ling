const superagent = require('superagent');
const literals = require('./literals.json');

const channelsAsList = literals.channelsAsList;

channelsAsList.forEach(channel =>{
    subscribeTo(channel);
    setInterval(()=> {subscribeTo(channel)}, 1000*60*60*24);
/*     intervalTest(channel);
    setInterval(()=> {intervalTest(channel)}, 5000);   */ 
})

function subscribeTo(channel){
    superagent.post('https://pubsubhubbub.appspot.com/subscribe')
    .query({
      'hub.mode':'subscribe',
      'hub.topic':'https://www.youtube.com/xml/feeds/videos.xml?channel_id='+channel,
      'hub.verify':'async',
      'hub.callback':'http://88.196.184.57:8080'
    })
    .end((err, res) => {
      if (err) console.log(err);
    })
}

function intervalTest(input){
    console.log(input);
}

