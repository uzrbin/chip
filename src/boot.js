var chip = require('./chip');
var Voice = require('./voice/voice');
var Face = require('./face/face');
var express = require('express');
var vhost = require('vhost');

var dbCreds = {
	host     : 'localhost',
	user     : 'pi',
	database : 'wbt'
};

// Start chip
chip.create(dbCreds);

// Start the web server with the bot and web interface
var app = express();
var voice = Voice.create();
var face = Face.create('/usr/local/src/chip/web/');

app.use(vhost('bot.uzrbin.com', voice));
app.use(vhost('chip.uzrbin.com', face));

app.listen(8080);

// Terrible catch-all, but we don't want Chippy to die on us
// and I'm lazy to proper error handling
process.on('uncaughtException', function(err) {
    chip.error(err, err.stack);
});
