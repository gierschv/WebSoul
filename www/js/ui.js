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

function ui()
{
    var socket = new io.Socket(window.location.hostname);
    var ns = new websoul(socket);
    var ws_connected = false;
    var loggued_as = null;

    // Load localstorage "contacts" key. Contacts are stored as a JSON object.
    function contacts_get()
    {
        var res = localStorage.getItem("contacts");
        if (res === null || res[0] != '[')
            res = [];
        else
            res = $.evalJSON(res);
        return res;
    }

    // Remove a contact from the "contacts" localstorage, the display from the side and the history.
    function contact_remove(login)
    {
        var contacts_new = [];
        var contacts = contacts_get();
        var idx = 0;
        
        for (var i = 0 ; i < contacts.length ; i++)
        {
            if (contacts[i].login != login)
            {
                contacts_new[idx] = contacts[i];
                idx++;
            }
        }
        
        try {
            localStorage.setItem("contacts", $.toJSON(contacts_new));
        } catch (e) {
            alert("Cannot save contacts, error is loggued in the JS console");
            console.log("Localstorage error : " + e);
        }
        $(".list_contacts > li[title='" + login + "']").remove();
        localStorage.removeItem("chat_histo_" + login);
    }

    // Return if there are unread messages for a contact
    function contact_is_unread(login)
    {
        var unread = 0;
        var histo = local_storage_get_chat(login);
        for (var i = 0 ; i < histo.length ; i++)
        {
            if (histo[i].read === 0)
                unread = 1;
        }
        return unread;
    }

    // Check if the contacts is in the localstorage
    function contact_is_in_list(login)
    {
        var list = contacts_get();
        var is = 0;
        for (var i = 0 ; i < list.length ; i++)
        {
	        if (list[i].login == login)
		        is = 1;
        }
        return is;
    }

    // Add a contact in the localstorage and in the side
    function contacts_add(login, is_contact)
    {
        var tab = contacts_get();
        var idx = tab === null ? 0 : tab.length;
        
        tab[idx] = {};
        tab[idx].login = login.replace(/^\s+/g,'').replace(/\s+$/g,'');
        tab[idx].is_contact = is_contact;
        
        try {
            localStorage.setItem("contacts", $.toJSON(tab));
        } catch (e) {
            alert("Cannot save contacts, error is loggued in the JS console");
            console.log("Localstorage error : " + e);
        }
        
        $(".list_contacts").append('<li title="' + login + '" class="' + (is_contact ? "side_list_friend" : "side_list_tmp") +
				   ' ' + (contact_is_unread(login) ? "side_unread" : "side_read") + '"><div class="photo photo_' +
				   login + '"><img src="http://www.epitech.eu/intra/photos/' +
				   login + '.jpg" /><div class="circle_status"></div></div>' + login + '</li>');
        ns.user_cmd_who(login, contacts_side_callback);
        ns.user_cmd_watch_log_user(tab);
    }

    function contacts_side_callback(list)
    {
        for (var i = 0 ; i < list.length ; i++)
        {
            contact = list[i].split(' ');
            if (contact[10].indexOf("actif") === 0)
                contacts_side_status(contact[1], "actif");
            else if (!$(".photo_" + contact[1] + " > .circle_status").hasClass("actif"))
                contacts_side_status(contact[1], "away");
        }
        init_ready();
    }

    // Change a contact status
    function contacts_side_status(login, status)
    {
        $(".photo_" + login + " > .circle_status").removeClass("actif");
        $(".photo_" + login + " > .circle_status").removeClass("away");
        if (status != "logout")
            $(".photo_" + login + " > .circle_status").addClass(status);
    }

    // Init the UI
    function init_ready()
    {
        // Adapt Div height of the contacts list
        $(".list_contacts").css("height", (window.innerHeight - 125) + "px");
        $(window).resize(function() { $(".list_contacts").css("height", (window.innerHeight - 125) + "px"); });
        
        // Bind link : enable chat
        $(".list_contacts > li").live("click", function() { chat_init($(this).attr('title')); });
        $("#chat_contact_remove").live("click", function() {  contact_remove($("#content").attr("title")); });
        
        // Bind contact_add form
        $("#contact_add").submit(function(){
            if (!contact_is_in_list($("#contact_add > input[type='text']").val()) && $("#contact_add > input[type='text']").val() !== "")
                contacts_add($("#contact_add > input[type='text']").val(), 1);
            $("#contact_add > input[type='text']").val("");
	        return false;
	    });
    }

    // Display the contact list on the side
    function init_state_contacts()
    {
        contacts = contacts_get().sort();
        $(".list_contacts").html("");
        for (var i = 0 ; i < contacts.length ; i++)
        {
            if (contacts[i] !== null)
                $(".list_contacts").append('<li title="' + contacts[i].login + '" class="' + (contacts[i].is_contact ? "side_list_friend" : "side_list_tmp") + '"><div class="photo photo_' +
				       contacts[i].login + '"><img src="http://www.epitech.eu/intra/photos/' +
				       contacts[i].login + '.jpg" /><div class="circle_status"></div></div>' + contacts[i].login + '</li>');
        }
        ns.user_cmd_who(contacts, contacts_side_callback);
        ns.user_cmd_watch_log_user(contacts);
        $("img").error(function(){
            $(this).attr("src", "http://www.epitech.eu/intra/photos/no.jpg");
        });
    }

    // Init a chat session
    function chat_init(login)
    {
        // Get Webkit notifications permissions
        if (window.webkitNotifications && window.webkitNotifications.checkPermission() > 0)
            window.webkitNotifications.requestPermission();

        $.get("content_chat.html", function(data) {
            // Set up content
            $("#content").html(data).attr("title", login);
            $("#content > h2 > span").text(login);
            $("#chat_photo_contact").attr("src", "http://www.epitech.eu/intra/photos/" + login + ".jpg");
            $("#chat_photo_me").attr("src", "http://www.epitech.eu/intra/photos/" + loggued_as + ".jpg");
            $("#chat_right_me > span").text(loggued_as);
            
            // Chat history height size
            $("#chat_data").css("height", (window.innerHeight - 200) + "px");
            $(window).resize(function() { $("#chat_data").css("height", (window.innerHeight - 200) + "px"); });
             
            // Remove unread class on side login
            $('li[title="' + login + '"]').removeClass("side_unread");
            // Set clean history action
            $("#button_clear").live("click", function() {
                localStorage.removeItem("chat_histo_" + login);
                chat_display_history(login);
            });
            
            // Set Ctrl+Enter action to send message
            $('#chat_textarea').keydown(function (e) {
                if (e.ctrlKey && e.keyCode == 13) $("#chat_form").submit();
            });
            $("#chat_textarea").focus();
            
            // Get contact informations
            ns.user_cmd_who(login, function(infos) {
                var info;
                for (var i = 0 ; i < infos.length ; i++)
                {
                    info = infos[i].split(' ');
                    // Display group
                    $("#chat_contact_group > span").html(info[9]);
                    // Display connections and locations
                    $("li#sock_" + info[0]).remove(); 
                    $("#chat_contact_connect > ul").append('<li id="sock_' + info[0] + '"><div class="circle_status ' +
						 (!info[10].indexOf("actif") ? "actif" : "away") +
						 '"></div> ' + info[2] + ' : <span id="sock_location_' +
						 info[0] + '">Unkown</span></li>');
		            $("#sock_location_" + info[0]).text(decodeURIComponent(info[8]));
	            }
	        });
            
            $("#chat_form").submit(chat_send);
            // Display history in #chat_data
            chat_display_history(login);
        });
    }

    // Send a message to a contact
    function chat_send()
    {
        if ($("#chat_textarea").val() !== "")
        {
            ns.user_cmd_msg_user($("#content").attr("title"), $("#chat_textarea").val());
            var histo = local_storage_add_chat($("#chat_textarea").attr("name"), "Me", $("#chat_textarea").val(), 1);
            $("#chat_textarea").val("");
            // Add line in #chat_data and scroll
            char_display_history_line($("textarea:first").val(), histo);
            $("#chat_data").scrollTo('100%', '0', {duration:100});
        }
        return false;
    }

    // Display a history element in #chat_data
    function char_display_history_line(login, histo)
    {
        var date = new Date();
        date.setTime(histo.time);
        
        $("#chat_data").append('<p><b>(' +
			       (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':' +
			       (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':' +
			       (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds()) + ') ' +
			       histo.from + '</b>: <span></span></p>');
	    histo.msg = histo.msg.replace(new RegExp("<br />", "g"), "\n");
	    $("#chat_data > p:last > span").text(histo.msg).anchorTextUrls();
	    histo.read = 1;
    }
    
    // Displaying history and set messages as read    
    function chat_display_history(login)
    {
	    var histo = local_storage_get_chat(login);
	    $("#chat_data").html("");
        for (var i = 0 ; i < histo.length ; i++)
        {
            char_display_history_line(login, histo[i]);
            histo[i].read = 1;
        }
        // Scroll on the last message
        $("#chat_data").scrollTo('100%', '0', {duration:100});
    }

    // Loads chat history from local storage. The history is stored as JSON object.
    function local_storage_get_chat(login)
    {
        var histo = localStorage.getItem("chat_histo_" + login);
        if (histo === null || histo[0] != '[')
	        histo = [];
        else
            histo = $.evalJSON(histo);
        return histo;
    }

    // Add history element in the local storage.
    function local_storage_add_chat(login, from, msg, read)
    {
	    var histo = local_storage_get_chat(login);
	    var idx = histo === null ? 0 : histo.length;
	    var date = new Date();
        histo[idx] = {};
        histo[idx].time = date.getTime();
        histo[idx].from = from;
        histo[idx].msg = msg;
        histo[idx].read = read;
        try {
            localStorage.setItem("chat_histo_" + login, $.toJSON(histo));
        } catch (e) {
            alert("Cannot save history, error is loggued in the JS console");
            console.log("Localstorage error : " + e);
        }
        return histo[idx];
    }

    // Callback function when receive a netsoul
    function message_receive(data)
    {
        var histo = local_storage_add_chat(data.login, data.login, data.msg, 0);
        // If contact isn't a friend, add it as a tmp
        if (!contact_is_in_list(data.login))
            contacts_add(data.login, 0);
        // If it's a message in the current conversation
        if ($("#content").attr("title") == data.login ||
            $("#content").attr("title") === "")
        {
            char_display_history_line(data.login, histo);
            $("#chat_data").scrollTo('100%', '0', {duration:100});
            histo.read = 1;
        }
        // Displaying contact on the side as "unread"
        else
        {
            $('li[title="' + data.login + '"]').removeClass("side_read");
            $('li[title="' + data.login + '"]').addClass("side_unread");
            // Displaying a Desktop notification in Chrom{e,ium}
            if (window.webkitNotifications && !window.webkitNotifications.checkPermission())
            {
                var notif = window.webkitNotifications.createNotification("http://www.epitech.eu/intra/photos/" +
                    data.login+ ".jpg", "Netsoul from " + data.login, data.msg);
                notif.ondisplay = function(event)
                {
                    setTimeout(function() { event.currentTarget.cancel(); }, 5000);
                };
                notif.onclick = function(event)
                {
                    chat_init(data.login);
                };
                notif.show();
            }
        }
        // If no chat opened, display open a new conversation
        if ($("#content").attr("title") === "")
            chat_init(data.login);
    }

    // Callback function when recevie a change of state
    function state_receive(data)
    {
        // Login or actif -> set actif
        if (data.state == "login" || data.state.indexOf("actif") >= 0)
        {
            if (window.webkitNotifications && !window.webkitNotifications.checkPermission())
            {
                var notif = window.webkitNotifications.createNotification("http://www.epitech.eu/intra/photos/" +
                    data.login+ ".jpg", data.login + " login", data.login + " has just login");
                notif.ondisplay = function(event)
                {
                    setTimeout(function() { event.currentTarget.cancel(); }, 5000);
                };
                notif.onclick = function(event)
                {
                    chat_init(data.login);
                };
                notif.show();
            }
            contacts_side_status(data.login, "actif");            
        }
        // Logout or away -> search another better state
        else
        {
            contacts_side_status(data.login, "logout");
            ns.user_cmd_who(data.login, contacts_side_callback);
        }
    }


    /* Init & Auth */
    $("#form_login").submit(function() {
        var login_callback = function(data)
        {
            $("#box_loading").hide();
            if (!data.indexOf("ok"))
            {
                // Save login information as a cookie (in clear...)
                if ($("#connect_remember:checked").val() == "on")
                {
                    var ck_date = new Date();
                    ck_date.setTime(ck_date.getTime() + (365 * 24 * 3600 * 1000));
                    document.cookie = "ns_auth=" + encodeURIComponent($("#connect_login").val() +
                                    " " + $("#connect_password").val() +
                                    " " + $("#connect_location").val()) +
                                    ";expires=" + ck_date.toGMTString();
                }
                $("#box_connect").hide();
                $("#overlay").hide();
                $("#contact_add").show();
                $("#content_menu").show();
                loggued_as = $("#connect_login").val();
                $("#list_contacts > span").text(loggued_as);
                init_state_contacts();
            }
            else
            {
                $("#box_connect").show();
                $("#connect_error").html("<b>Error :</b> " + data);
            }
            socket.removeEvent("message", login_callback);
        };

        socket.addEvent("message", login_callback);
        $("#box_connect").hide();
        $("#box_loading").show();
        socket.send("auth " + encodeURIComponent($("#connect_login").val()) +
                " " + encodeURIComponent($("#connect_password").val()) +
                " " + encodeURIComponent($("#connect_location").val()));
        return false;
    });

    socket.connect();
    socket.on('connect', function() {
        // Displaying connect form
        ws_connected = true;
        $("#box_loading").hide();
        if (document.cookie.indexOf("ns_auth=") >= 0)
        {
            var ck = decodeURIComponent(document.cookie.split("ns_auth=")[1].split(";")[0]).split(" ");
            $("#connect_login").val(ck[0]);
            $("#connect_password").val(ck[1]);
            $("#connect_location").val(ck[2]);
            $("#form_login").submit();
        }
        else
            $("#box_connect").show();
    });

    socket.on('message', function(data) {
        // debug
        console.log(data);
        // -->
        var data_tmp;
        if ((data_tmp = ns.user_cmd_msg_receiv(data)) !== null)
            message_receive(data_tmp);
        else if ((data_tmp = ns.user_cmd_state_receiv(data)) !== null)
            state_receive(data_tmp);            
    });

    // Trying to reconnect
    socket.on('disconnect', function() {
        ws_connected = false;
        $("#overlay").show();
        $("#box_loading").show();
        $("#box_connect").hide();
        var reconnect = function()
        {
           if (!ws_connected)
           {
                setTimeout(reconnect, 2000);
                socket.connect();
           }
        };
        reconnect();
    });
}