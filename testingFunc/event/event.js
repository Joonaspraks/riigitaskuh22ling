var events = require('events').EventEmitter;
var emitter = new events.EventEmitter();

emitter.on('newEvent', function(user){
    console.log(user);
});
emitter.on('newEvent', function(user){
    console.log(user);
});

emitter.emit('newEvent', "Krunal");