#! /usr/local/bin/node
//
// JSoul - Auth implementation of netsoul protocol for node.js
//
// Copyright (c) 2010 Vincent Giersch <mail@vincent.sh>
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
    var net = require("net"),
        sys = require("sys"),
        crypto = require("crypto");

    var nsClient = function (host, port, login, pass, location, callback, ws) {
	var ns, close, handshake, auth;
	var hash;

	ns = net.createConnection(port, host);
	ns.setTimeout(0);

	ns.addListener("connect", function() {
	    var onData;
	    sys.puts("Connection to " + host + " ...");
	    onData = function(data) {
		ns.removeListener("data", onData);
		return handshake(data.toString(), login, pass);
	    };
	    return ns.addListener("data", onData);
	});

	ns.addListener("end", function() {
	    // Todo 00:00
	    throw new Error("Netsoul client ended");
	});
	ns.addListener("timeout", function() {
	    throw new Error("Netsoul client timeout");
	});
	ns.addListener("close", function(hadError) {
	    if (hadError)
		throw new Error("Netsoul client closed");
	});

	close = function() {
	    ns.end();
	    return ns.destroy();
	};

	// Handshake
	handshake = function(handshake) {
	    handshake = handshake.split(' ');
	    if (handshake[0] != 'salut')
		return callback("Handshake fails : No 'salut' string");
	    ns.write("auth_ag ext_user none none\n");
	    onData = function(data) {
		data = data.toString();
		if (data.indexOf("rep 002") < 0)
		    return callback("Handshake fails : " + data.split("-- ")[1]);
		ns.removeListener("data", onData);
		return auth(handshake);
	    };
	    ns.addListener("data", onData);
	};

	auth = function(handshake) {
	    sys.puts("Authentification as " + login + " ...");
	    hash = handshake[2] + "-" + handshake[3] + "/" +
		handshake[4] + pass;
	    ns.write("ext_user_log " + login + " " +
		     crypto.createHash('md5').update(hash).digest("hex") +
		     " " + encodeURIComponent(location) + " " +
		     encodeURIComponent("WebSoul, JS Netsoul client") + "\n");
	    onData = function(data) {
		data = data.toString();
		if (data.indexOf("rep 002") < 0)
		    return callback("Auth fails : " + data.split("-- ")[1]);
		ns.removeListener("data", onData);
		ns.write("user_cmd state actif\n");
		ns.addListener("data", onGlobalData);
		callback(null);
		callback = null;
	    };
	    ns.addListener("data", onData);
	};

	ping = function(data) {
	    ns.write(data);
	};

	onGlobalData = function(data) {
	    data = data.toString();
	    if (data.indexOf("ping") == 0)
		ping(data);
	    else if (ws != null)
		ws.send(data);
	    else
		sys.puts(data);
	};

	return {
	    send: function(data) {
		ns.write(data);
	    },
	    status: function(status) {
		ns.write("user_cmd state " + status + "\n");
	    },
	    setWs: function(w) {
		ws = w;
	    }
	};
    };
    exports.nsClient = nsClient;
})();

