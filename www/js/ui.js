//
// WebSoul : A full Javascript Netsoul client
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

function ui()
{
    var socket = new io.Socket("127.0.0.1");
    var ns = new websoul(socket);
    var loggued_as = null;

    /* Contacts functions */

    function contacts_get()
    {
	var res = localStorage.getItem("contacts");
	if (res == null || res[0] != '[')
	    res = [];
	else
	    res = $.evalJSON(res);
	return res;
    }


    function contact_remove(login)
    {
	var contacts_new = [];
	var contacts = contacts_get();
	var idx = 0;

	for (var i = 0 ; i < contacts.length ; i++)
	{
	    if (contacts[i].login != login)
		contacts_new[idx] = contacts[i];
	    idx++;
	}		
	localStorage.setItem("contacts", $.toJSON(contacts_new));
	$(".list_contacts > li[title='" + login + "']").remove();
    }

    function contact_is_unead(login)
    {
	var unread = 0;
	var histo = local_storage_get_chat(login);
	for (var i = 0 ; i < histo.length ; i++)
	{
	    if (histo[i].read == 0)
		unread = 1;
	}
	return unread;
    }

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

    function contacts_add(login, is_contact)
    {
	var tab = contacts_get();
	var idx = tab == null ? 0 : tab.length;

	tab[idx] = {};
	tab[idx].login = login;
	tab[idx].is_contact = is_contact;
	localStorage.setItem("contacts", $.toJSON(tab));
	$(".list_contacts").append('<li title="' + login + '" class="' + (is_contact ? "side_list_friend" : "side_list_tmp") +
				   ' ' + (contact_is_unead(login) ? "side_unread" : "side_read") + '"><div class="photo photo_' +
				   login + '"><img src="http://www.epitech.eu/intra/photos/' +
				   login + '.jpg" /><div class="circle_status"></div></div>' + login + '</li>');
	ns.user_cmd_who(login, contacts_side_callback);
    }

    function contacts_side_callback(list)
    {
	for (var i = 0 ; i < list.length ; i++)
	{
	    contact = list[i].split(' ');
	    if (contact[10].indexOf("actif") == 0)
		contacts_side_status(contact[1], "actif");
	    else if (!$(".photo_" + contact[1] + " > .circle_status").hasClass("actif"))
		contacts_side_status(contact[1], "away");
	}
	init_ready();
    }


    function contacts_side_status(login, status)
    {
	$(".photo_" + login + " > .circle_status").removeClass("actif");
	$(".photo_" + login + " > .circle_status").removeClass("away");
	$(".photo_" + login + " > .circle_status").addClass(status);
    }

    /* Init functions */

    function init_ready()
    {
	$(".list_contacts").css("height", (window.innerHeight - 125) + "px");
	$(window).resize(function() { $(".list_contacts").css("height", (window.innerHeight - 125) + "px"); });

	$(".list_contacts > li").live("click", function() { chat_init($(this).attr('title')); });
	$("#chat_contact_remove").live("click", function() {  contact_remove($("#content").attr("title")); });
	$("#contact_add").submit(function(){
	    if (!contact_is_in_list($("#contact_add > input[type='text']").val()) &&
		$("#contact_add > input[type='text']").val() != "")
		contacts_add($("#contact_add > input[type='text']").val(), 1);
	    $("#contact_add > input[type='text']").val("");
	    return false;
	});
    }

    function init_state_contacts()
    {
	contacts = contacts_get().sort();
	$(".list_contacts").html("");
	for (var i = 0 ; i < contacts.length ; i++)
	{
	    $(".list_contacts").append('<li title="' + contacts[i].login + '" class="' + (contacts[i].is_contact ? "side_list_friend" : "side_list_tmp") + '"><div class="photo photo_' +
				       contacts[i].login + '"><img src="http://www.epitech.eu/intra/photos/' +
				       contacts[i].login + '.jpg" /><div class="circle_status"></div></div>' + contacts[i].login + '</li>');
	}

	ns.user_cmd_who(contacts, contacts_side_callback);

	$("img").error(function(){
	    $(this).attr("src", "http://www.epitech.eu/intra/photos/no.jpg");
	});
    }

    function chat_init(login)
    {
	if (window.webkitNotifications && window.webkitNotifications.checkPermission() > 0)
	    window.webkitNotifications.requestPermission();

	$("#content").html('<h2>Chat with ' + login + '</h2>\
	<div id="chat_right"><img src="http://www.epitech.eu/intra/photos/' + login + '.jpg" />\
	<ul id="chat_right_status">\
		<li id="chat_contact_group"><b>Group </b>: <span></span></li>\
		<li id="chat_contact_connect"><b>Connections </b>: <ul></ul></li>\
		<li><a href="#" id="chat_contact_remove">Remove from contacts</a></li>\
	</ul><div id="chat_right_me"><img src="http://www.epitech.eu/intra/photos/' + loggued_as + '.jpg"/><br /><b>Netsouled as ' + loggued_as + '</b></div></div>\
	<div id="chat_data"></div>\
	<form action="#" id="chat_form"><textarea id="chat_textarea" name="' + login + '"></textarea>\
        <div><input type="button" id="button_clear" value="Clear conversation" /><input type="submit" value="Send" /></div></form>\
	').attr("title", login);
	$("#chat_data").css("height", (window.innerHeight - 200) + "px");
	$(window).resize(function() { $("#chat_data").css("height", (window.innerHeight - 200) + "px"); });

	$('li[title="' + login + '"]').removeClass("side_unread");
	$("#button_clear").live("click", function() {
	    localStorage.removeItem("chat_histo_" + login);
	    chat_display_history(login);
	});


	$('#chat_textarea').keydown(function (e) {
	    if (e.ctrlKey && e.keyCode == 13)
		$("#chat_form").submit();
	});
	$("#chat_textarea").focus();
	
	ns.user_cmd_who(login, function(infos) {
	    var info;
	    for (var i = 0 ; i < infos.length ; i++)
	    {
		info = infos[i].split(' ');
		$("#chat_contact_group > span").html(info[9]);
		$("li#sock_" + info[0]).remove(); 
		$("#chat_contact_connect > ul").append('<li id="sock_' + info[0] + '"><div class="circle_status ' +
						       (!info[10].indexOf("actif") ? "actif" : "away") +
						       '"></div> ' + info[2] + ' : <span id="sock_location_' +
						       info[0] + '">Unkown</span></li>');
		$("#sock_location_" + info[0]).text(decodeURIComponent(info[8]));
	    }
	});
	$("#chat_form").submit(chat_send);
	chat_display_history(login);
    }

    function chat_send()
    {
	if ($("textarea:first").val() != "")
	{
	    ns.user_cmd_msg_user($("textarea:first").attr("name"),
				 $("textarea:first").val());
	    var histo = local_storage_add_chat($("textarea:first").attr("name"),
				   "Me",
				   $("textarea:first").val(), 1);
	    $("textarea:first").val("");
	    char_display_history_line($("textarea:first").val(), histo);
	    $("#chat_data").scrollTo('100%', '0', {duration:100});
	}
	return false;
    }

    function char_display_history_line(login, histo)
    {
	var date = new Date;
	date.setTime(histo.time);

	$("#chat_data").append('<p><b>(' +
			       (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':' +
			       (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':' +
			       (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds()) + ') ' +
			       histo.from + '</b>: <span></span></p>');
	histo.msg = histo.msg.replace(new RegExp("<br />", "g"), "\n");
	$("#chat_data > p:last > span").text(histo.msg);
	histo.read = 1;
    }
    
    function chat_display_history(login)
    {
	var histo = local_storage_get_chat(login);
	$("#chat_data").html("");
	for (var i = 0 ; i < histo.length ; i++)
	{
	    char_display_history_line(login, histo[i]);
	    histo[i].read = 1;
	}
	$("#chat_data").scrollTo('100%', '0', {duration:100});
    }

    function local_storage_get_chat(login)
    {
	var histo = localStorage.getItem("chat_histo_" + login);
	if (histo == null || histo[0] != '[')
	    histo = [];
	else
	    histo = $.evalJSON(histo);
	return histo;
    }

    function local_storage_add_chat(login, from, msg, read)
    {
	var histo = local_storage_get_chat(login);
	var idx = histo == null ? 0 : histo.length;
	var date = new Date();
	histo[idx] = {};
	histo[idx].time = date.getTime();
	histo[idx].from = from;
	histo[idx].msg = msg;
	histo[idx].read = read;
	try {
	    localStorage.setItem("chat_histo_" + login, $.toJSON(histo));
	} catch (e) {
	    if (e == QUOTA_EXCEEDED_ERR)
		alert("Local storage quota exceeded, cannot save history.");
	}
	return histo[idx];
    }

    function message_receive(data)
    {
	if (window.webkitNotifications && !window.webkitNotifications.checkPermission())
	{
	    var notif = window.webkitNotifications.createNotification("http://www.epitech.eu/intra/photos/" +
					  data.login+ ".jpg", "Netsoul from " + data.login, data.msg);
	    notif.ondisplay = function(event) {
		setTimeout(function() { event.currentTarget.cancel(); }, 5000);
	    };
	    notif.show();
	}
	var histo = local_storage_add_chat(data.login, data.login, data.msg, 0);
	if (!contact_is_in_list(data.login))
	    contacts_add(data.login, 0);
	if ($("#content").attr("title") == "")
	    chat_init(data.login);
	if ($("#content").attr("title") == data.login ||
	    $("#content").attr("title") == "")
	{
	    char_display_history_line(data.login, histo);
	    $("#chat_data").scrollTo('100%', '0', {duration:100});
	    histo.read = 1;
	}
	else
	{
	    $('li[title="' + data.login + '"]').removeClass("side_read");
	    $('li[title="' + data.login + '"]').addClass("side_read");
	}
    }


    /* Init & Auth */
    $("#form_login").submit(function() {
	var login_callback = function(data)
	{
	    if (!data.indexOf("ok"))
	    {
		if ($("#connect_remember:checked").val() == "on")
		{
		    var ck_date = new Date();
		    ck_date.setTime(ck_date.getTime() + (365 * 24 * 3600 * 1000));
		    document.cookie = "ns_auth=" + escape($("#connect_login").val() +
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
	socket.send("auth " + $("#connect_login").val() +
		    " " + $("#connect_password").val() +
		    " " + $("#connect_location").val());
	return false;
    });

    socket.connect();
    socket.on('connect', function() {
	// Displaying connect form
	$("#box_loading").hide();
	if (document.cookie.indexOf("ns_auth=") >= 0)
	{
	    var ck = unescape(document.cookie.split("ns_auth=")[1].split(";")[0]).split(" ");
	    $("#connect_login").val(ck[0]);
	    $("#connect_password").val(ck[1]);
	    $("#connect_location").val(ck[2]);
	    $("#form_login").submit();
	}
	else
	    $("#box_connect").show();
    });

    socket.on('message', function(data) {
	console.log(data);
	var data_tmp;
	if ((data_tmp = ns.user_cmd_msg_receiv(data)) != null)
	    message_receive(data_tmp);
    });

    socket.on('disconnect', function() {
	$("#overlay").show();
	$("#box_loading").show();
	$("#box_connect").hide();
	socket.connect();
    });
}