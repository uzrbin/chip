var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bodyParser = require('body-parser')
var chip = require('../../chip.js');
var Syndicate = require('../../model/syndicate');
var Account = require('../../model/account');
var Group = require('../../model/group');
var Engine = require('../../model/engine');
var util = require('../../lib/util');

module.exports = function(face, rootPath) {
	face.post('/api/register', bodyParser.json(), bodyParser.urlencoded(), register);
	
	face.get('/groups/:token', function(req, res) {
		res.sendFile(rootPath + 'assets/static/groups.html');
	});
	
	face.get('/api/groups/:token', function(req, res) {
		Account.getByToken(req.params.token).then(function(account) {
			return Engine.get(account.eid);
		}).then(function(engine) {
			var e = chip.getEngine(engine.sid);
			// I dunno what's going on here, but sometimes this gets weird
			e.loadGroups().then(function() { res.json({ synd: e.synd, groups: e.groups }); });
		});
	});
	
	face.route('/api/group/:gid')
		.get(getGroup)
		.post(bodyParser.json(), bodyParser.urlencoded(), updateGroup, getGroup);
		
	face.put('/api/group', createGroup);
};

function register(req, res) {
	return Syndicate.getByName(req.body.synd).then(function(synd) {
		if (synd) {
			return Engine.getBySynd(synd.sid).then(function(engine) {
				if (engine) {
					res.json({ error: 'Syndicate already registered' });
				} else {
					var e = Engine.create({
						sid: synd.sid
					});
					var token = Math.random().toString(36).slice(2);
					return e.save().then(function() {
						return chip.db.queryAsync('INSERT INTO account SET ?', { 
							email: req.body.email, 
							eid: e.eid,
							token: token
						});
					}).then(function(result) {
						chip.addEngine(e);
						
						res.json({ token: token });
					});
				}
			});
		} else {
			res.json({ error: 'Syndicate not found' });
		}
	})
};

function getGroup(req, res) {
	return Group.get(req.params.gid).then(function(group) {
		var g = chip.getGroup(group.groupme_id);
		res.json(g);
	})
}

function createGroup(req, res) {
	var g = Group.create({
		sid: req.body.sid,
		groupme_id: req.body.groupme_id,
		bot_key: req.body.bot_key,
		output: req.body.output == 'true',
		scout: req.body.scout == 'true',
		debug: req.body.debug == 'true'
	});
	
	return g.save().then(function() {
		req.params.gid = g.gid;
		chip.addGroup(g);
		res.json(g);
	});
}

function updateGroup(req, res, next) {
	return Group.get(req.params.gid).then(function(group) {
		var g = chip.getGroup(group.groupme_id);
		
		if (g) chip.removeGroup(g.groupme_id);
		else g = group;
		
		g.groupme_id = req.body.groupme_id;
		g.bot_key = req.body.bot_key;
		g.bot_id = null;
		g.output = req.body.output == 'true';
		g.scout = req.body.scout == 'true';
		g.debug = req.body.debug == 'true';
		
		return g.save().then(function() {
			delete g.bot_id;
			g.getEngine().loadGroups().then(function() { res.json(g); });
		});
	});
}

passport.use(new LocalStrategy(
	function(key, password, done) {
		//chip.db.queryAsync(
		/*
		connection.query("SELECT * FROM player p WHERE sid IS NOT NULL AND name='"+username+"'", 
				function(err, result) {
			if (err) throw err;
			
			if (result.length > 0 && password == 'oredic37') {
				var player = User.createPlayer(result[0]);
				done(null, player);
			} else {
				done(null, null, { message: 'Invalid login' });
			}
		});
		*/
	})
);

passport.serializeUser(function(player, done) {
	done(null, player.pid);
});

passport.deserializeUser(function(pid, done) {
	User.getUser(pid).then(function(user) {
		done(null, user);
	});
});

function loggedIn(req, res, next) {
	if (req.isAuthenticated()) {
		next();
	} else {
		req.session.loginRedirect = req.url;
		res.redirect('/');
	}
}
