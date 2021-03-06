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

require.paths.unshift(__dirname + '/lib');

var ns = require("jsoul"),
    sys = require("sys"),
    http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    mime = require('mime'),
    io = require("socket.io");

if (process.argv.length != 4)
{
    sys.puts("Usage : node httpd.js 0.0.0.0 80");
    process.exit(code = 1);
}

// Cloud9ide
//process.argv[3] = process.env.C9_PORT;

var httpd = http.createServer(function(req, res){ 
    var basepath = path.join(__dirname, "/www");
    var uri = url.parse(req.url).pathname;
    if (uri == "/")
	uri = "index.html";
    var file = path.join(basepath, uri);

    path.exists(file, function(exists) {
        if (!exists || file.toString().indexOf(basepath) !== 0)
        {
            res.writeHead(404, {"Content-Type": "text/plain"});
            res.write("404 - Page not found");
            res.end();
            return;
            }
    
        fs.readFile(file, "binary", function(err, f) {
            if (err)
            {
                res.writeHead(500, {"Content-Type": "text/plain"});
                res.write(err + "\n");
                res.end();
                return false;
            }
            res.writeHead(200, {'Content-Type': mime.lookup(file)});
            res.write(f, "binary");
            res.end();
	    });
    });
});
httpd.listen(process.argv[3], process.argv[2]);

var socket = io.listen(httpd); 
var nsc = [];

socket.on("connection", function(client){ 
    var auth_callback = function(data)
    {
	    data = data.split(' ');
        var ns_connect_callback = function(res)
        {
            if (res === null)
            {
                client.removeListener("message", auth_callback);
                client.addListener("message", nsc[data[1]].sock.send);
                client.addListener("disconnect", function(){ if (nsc[data[1]] !== null && nsc[data[1]].sock !== null) nsc[data[1]].sock.setWs(null); });
                client.send("ok\n");
                nsc[data[1]].pwd = data[2];
            }
            else
            {
                client.send(res);
                nsc[data[1]] = null;
            }
        };

	    if (data[0] == 'auth' && data.length == 4 && data[1] !== "")
	    {
            if (nsc[data[1]] === undefined || nsc[data[1]] === null)
            {
                nsc[data[1]] = {};
                nsc[data[1]].sock = ns.nsClient("ns-server.epita.fr", 4242,
                    encodeURIComponent(decodeURIComponent(data[1])), decodeURIComponent(data[2]), encodeURIComponent(decodeURIComponent(data[3])),
                    ns_connect_callback, client);
            }
            else if (nsc[data[1]].pwd == data[2])
            {
                if (!nsc[data[1]].sock.setWs(client))
                    nsc[data[1]].sock = ns.nsClient("ns-server.epita.fr", 4242,
                        encodeURIComponent(decodeURIComponent(data[1])), decodeURIComponent(data[2]), encodeURIComponent(decodeURIComponent(data[3])),
                        ns_connect_callback, client);
                else
                    ns_connect_callback(null);
            }
	        else
		        client.send("Wrong password, could not resume netsoul session\n");
        }
	    else
	        client.send("Form error\n");
    };
    client.addListener("message", auth_callback);
});
