#! /usr/local/bin/node
//
// JSoul : Auth implementation of netsoul protocol for node.js
// WebSoul : A full Javascript Netsoul client
//
// Copyright (c) 2010 - 2011 Vincent Giersch <mail@vincent.sh>
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
        
        var callback_ns_error = function()
        {
            if (ns !== null)
            {
                ns.end();
                ns.destroy();
            }
            ns = null;
            if (callback)
                return (callback("Connection to Netsoul server lost."));
            if (ws)
                return (ws._onDisconnect());
        };
        
        ns.addListener("error", callback_ns_error);
        ns.addListener("end", callback_ns_error);
        ns.addListener("close", callback_ns_error);
        
        ns.addListener("connect", function() {
            var onData;
            onData = function(data) {
                ns.removeListener("data", onData);
                return handshake(data.toString(), login, pass);
            };
            return ns.addListener("data", onData);
        });
    
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
                if (callback)
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
            if (data.indexOf("ping") === 0)
                ping(data);
            else if (ws !== null)
                ws.send(data);
            else
                sys.puts(data);
        };
    
        return {
            send: function(data) {
                sys.puts(data);
                ns.write(data);
            },
            status: function(status) {
                ns.write("user_cmd state " + status + "\n");
            },
            setWs: function(w) {
                ws = w;
                if (ns === null)
                    return false;
                return true;
            }
        };
    };
    exports.nsClient = nsClient;
})();

