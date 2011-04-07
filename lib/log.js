#! /usr/local/bin/node
//
// WebSoul : A full Javascript Netsoul client
//
// Copyright (c) 2011 Vincent Giersch <mail@vincent.sh>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
//

(function(){
    var fs = require("fs"),
	path = require("path");

    var addLogSoul = function(login, data) {
	fs.mkdir(path.join(__dirname, "..", "history_away"), 0755);
	fs.open(path.join(__dirname, "..", "history_away", login + ".txt"), 'a', 0644, function(err, fd) {
		if (!err)
		    fs.write(fd, data + "\n", null, 'utf8', function() {
			    fs.close(fd);
		    });
	    });
    };

    var rmLogSoul = function(login) {
	fs.unlink(file);	
    };

    var sendLogSoul = function(login, callback) {
	fs.read(path.join(__dirname, "..", "history_away", login + ".txt"), function(err, data) {
	    if (err)
		callback(null);
	    callback(data);
	});
    };

    exports.addLogSoul = addLogSoul;
    exports.rmLogSoul = rmLogSoul;
    exports.sendLogSoul = sendLogSoul;
})();