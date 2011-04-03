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

function websoul(socket)
{
    // Serialize logins as netsoul format : {giersc_v,giersc_v}
    function serialize_ns(tab)
    {
        var result = "{";
        for (var i = 0 ; i < tab.length ; i++)
        {
            result += tab[i];
            if (i + 1 != tab.length)
                result += ",";
        }
        result += "}";
        return result;
    }

    // Public methods for ui
    return {
        user_cmd_who: function(login, callback)
        {
            // Call with an array of logins : serialize
            if (login.constructor == Array)
            {
                var tab = [];
                for (var i = 0 ; i < login.length ; i++)
                    tab[i] = login[i].login;
                login = serialize_ns(tab);
            }

            // Callback function
            var result_who = function(data) {
                var lines = data.split('\n'), who;
                var idx = 0;
                var result = [];
                
                for (var i = 0 ; i < lines.length ; i++)
                {
                    if (lines[i].indexOf(' | who ') > 0)
                    {
                        who = lines[i].split(' | who ');
                        if (who.length == 2 && who[1].indexOf('rep') !== 0)
                            result[idx++] = who[1];
                    }
                }
                socket.removeEvent('message', result_who);
                callback(result);
            };
            
            socket.addEvent('message', result_who);
            socket.send("user_cmd who " + login + "\n");
        },
        user_cmd_msg_user: function(login, msg)
        {
            socket.send("user_cmd msg_user " + login + " msg " + escape(msg) + "\n");
	    },
        user_cmd_msg_receiv: function(msg)
        {
            if (msg.indexOf(' | msg ') > 0)
            {
                msg = msg.split(' | msg ');
                res = {};
                res.login = msg[0].split(' ')[1].split(':')[3].split('@')[0];
                res.msg = decodeURIComponent(msg[1].split(' ')[0]);
                return res;
	        }
	        return null;
	    }
   };
}