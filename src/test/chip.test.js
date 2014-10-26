var chip = require('../chip');
var Voice = require('../voice/voice');
var Face = require('../face/face');

var dbCreds = {
	host     : 'localhost',
	user     : 'pi',
	database : 'wbt'
};
	
chip.create(dbCreds);

var voice = Voice.create();
voice.listen(8080);

var face = Face.create('/home/evan/work/chip/web/build/');
face.listen(8088);
