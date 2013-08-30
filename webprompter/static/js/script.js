d = {};
d.speed = 10;
d.doScroll = 9;
d.playing = false;
d.intervals = {};

window.onbeforeunload = function() {
    return "Are you sure you want to leave the teleprompter? Your work will be saved when you return.";
}

$(function(){

    function setup(obj) {
	localStorage.prompterEditable = obj.prompterEditable;
	changeEditable();
	if (obj.prompterText) {
	    localStorage.prompterText = obj.prompterText;
	    $("#content").html(obj.prompterText);
	}
	if (obj.prompterSpeed) {
	    localStorage.prompterSpeed = obj.prompterSpeed;
	    d.speed = Number(obj.prompterSpeed);
	}
	if (obj.prompterSize) {
	    localStorage.prompterSize = obj.prompterSize;
	    $("#content").css("fontSize",localStorage.prompterSize); }
	    
	storedMargins = [0,100];
	if (obj.prompterMargins) {
	    localStorage.prompterMargins = obj.prompterMargins;
	    for (i=0;i<=1;i++) {
		j = Number(localStorage.prompterMargins.split(" ")[i]);
		if (!isNaN(j)) {
		    storedMargins[i] = j;
		}
	    }
	}
	adjustMargins({}, {values: storedMargins});
	$("#margin-slider").slider("option","values",storedMargins);
    }		   

    function warn(msg,timeout) {
	if (d.warnTimeout) {
	    clearTimeout(d.warnTimeout); }
	if (!timeout) { timeout = 2000; }
	$("#warning").clearQueue().html(msg).fadeIn(200).delay(timeout).fadeOut(500);
    }
    $(window).resize(function(e){
	if (d.dimensionsTimeout) {
	    clearTimeout(d.dimensionsTimeout); }
	$("#dimensions").clearQueue().html(innerWidth+" x "+innerHeight);
	if ($("#dimensions").is(":visible")) {
	    $("#dimensions").css({"opacity":1});
	} else {
	    $("#dimensions").fadeIn(200); }
	d.dimensionsTimeout = setTimeout(function(){
	    $("#dimensions").fadeOut(500);
	},1000);
    });

    $("#disable-edits").get(0).checked = localStorage.prompterEditable == "0";
    function changeEditable(){
	$("#content").get(0).contentEditable = 
	    (localStorage.prompterEditable=="0"?"false":"true");
	$(document.body).css({ "overflow-y": 
			       localStorage.prompterEditable=="0"?"hidden":"scroll"});
	$("body, #rich-sensor, #content *").css({ "cursor": 
			localStorage.prompterEditable=="0"?"url(Cursor.png)":"text"});
	$("#content").css({ "webkitUserSelect": 
			localStorage.prompterEditable=="0"?"none":""});
    }

    $("#help, #dimensions").mouseover(function(){
	$(this).fadeOut();
    });

    function checkSpeed() {
	negative = (d.speed<0)?true:false;
	if (Math.abs(d.speed) > 19.5) {
	    d.speed = 19.5*(negative?-1:1);
	}
	if (Math.abs(d.speed) < 6 && d.speed !== 0) {
	    if (Math.abs(d.speed) <= 1) {
		d.speed = 6*(negative?-1:1);
	    } else {
		d.speed = 0;
	    }
	}
	localStorage.prompterSpeed = d.speed;
    }

    function testForDialogs() {
	obj = [true];
	$(".ui-dialog-content").each(function(index,el){
	    if ($(el).dialog("isOpen")) { obj[0] = false; }
	});
	return obj[0];
    }
    
    $(document).keydown(function(e) {
	if (!testForDialogs()) { return true; }
	if ( (String.fromCharCode(e.which).toLowerCase() == "s" && e.ctrlKey)
	     || e.which == 19 ) {
	    $("#server").dialog("open");
	    e.preventDefault(); return false;
	}
	if ( e.which == 18 || (e.altKey && !String.fromCharCode(e.which)) ) {
	    $("#more-dialog").dialog("open");
	    e.preventDefault(); return false;
	}
	if (e.which == 9) {
	    e.preventDefault();
	    $("#content").blur();
	    return false;
	}
	if (document.activeElement == $("#content").get(0)) {
	    return true; }
	if (e.which == 38 || e.which == 40) {
	    if (!d.playing) {
		warn("The prompter is currently not scrolling...",1000);
	    }
	}
	switch (e.which) {
	case 38: // Up Arrow
	    if (document.height-innerHeight == $(document).scrollTop() && d.speed !== 0) {
		d.speed = 0; break; }
	    d.speed += -1; break;
	case 40: // Down Arrow
	    if ($(document).scrollTop() == 0 && d.speed !== 0) {
		d.speed = 0; break; }
	    d.speed += 1; break;
	case 32: // Space Key
	    if (!$("#more-dialog").dialog("isOpen")) {
		$("#play-label").click(); }
	    if (d.playing && d.speed == 0) {
		d.speed = 1;
		checkSpeed();
	    }
	    break;
	default:
	    return true;
	}
	checkSpeed();
	e.preventDefault();
	return false;
    }).mousewheel(function(e,delta){
	if (localStorage.prompterEditable === "0") {
	    d.speed += (delta+(delta>0?1:-1))/2;
	    checkSpeed();
	    e.preventDefault();
	}
    });

    $("#toolbar-sensor").tooltip({
	position: { my: "center bottom-4", at: "center top"}
    }).hoverIntent({
	over: function(e){
	    $("#toolbar").clearQueue().animate({"top":30,opacity:1},200);
	},
	out: function(e){
	    $("#margin-slider a.ui-state-focus").blur();
	    $("#toolbar").animate({"top":-56,opacity:1},500);
	},
	timeout: 200,
	interval: 30
    });
    $("#rich-sensor").tooltip({
	position: { my: "center top+4", at: "center bottom"}
    }).hoverIntent({
	over: function(e){
	    if (localStorage.prompterEditable !== "0") {
		$("#rich").clearQueue().animate({"bottom":30,opacity:1},200); }
	},
	out: function(e){
	    $("#rich").animate({"bottom":-56,opacity:1},500);
	},
	timeout: 200,
	interval: 30
    });

    $("#disable-edits").button({
	icons: { secondary: "ui-icon-pencil" }
    }).click(function(e){
	localStorage.prompterEditable = Number(!this.checked);
	changeEditable();
    });

    // Playback controls...
    $("#speed-down").button({
	text: false,
	icons: { "primary": "ui-icon-seek-prev"  }
    }).click( function(e){
	d.speed -= 1;
	checkSpeed();
    });
    $("#speed-up").button({
	text: false,
	icons: { "primary": "ui-icon-seek-next"  }
    }).click( function(e){
	d.speed += 1;
	checkSpeed();
    });
    $("#play").button({
	text: false,
	icons: { "primary": "ui-icon-play"  }
    });
    $("#play-label").click( function(e){
	d.playing = !d.playing;
	$("#toolbar-sensor").tooltip("option","disabled",d.playing);
	icon = d.playing?"ui-icon-pause":"ui-icon-play";
	$("#play").prop("checked",d.playing).button("refresh")
	    .button("option","icons",
		    {"primary":icon} );
	$("#disable-edits").button("option","disabled",d.playing);
    });
    $("#playback").buttonset();

    $("#size-plus").button({
	text: false,
	icons: { "primary": "ui-icon-plusthick"  }
    }).click( function(e){
	$("#content").css("fontSize","+=4");
	localStorage.prompterSize = $("#content").css("fontSize");
    });
    $("#size-minus").button({
	text: false,
	icons: { "primary": "ui-icon-minusthick"  }
    }).click( function(e){
	$("#content").css("fontSize","-=4");
	localStorage.prompterSize = $("#content").css("fontSize");
    });
    $("#font-size").buttonset();
    
    rangy.init();
    resetApplier = rangy.createCssClassApplier("reset-formatting",
					       {normalize: true,
						applyToEditableOnly: true});
    boldApplier = rangy.createCssClassApplier("bold",
					      {normalize: true,
					       applyToEditableOnly: true});
    italicApplier = rangy.createCssClassApplier("italic",
						{normalize: true,
						 applyToEditableOnly: true});
    underlineApplier = rangy.createCssClassApplier("underline",
						   {normalize: true,
						    applyToEditableOnly: true});
    $("#bold").button().click( function(e){
	resetApplier.applyToSelection();
	boldApplier.toggleSelection();
	clearFormattingAndSave();
    });
    $("#italic").button().click( function(e){
	resetApplier.applyToSelection();
	italicApplier.toggleSelection();
	clearFormattingAndSave();
    });
    $("#underline").button().click( function(e){
	resetApplier.applyToSelection();
	underlineApplier.toggleSelection();
	clearFormattingAndSave();
    });
    $("#text-style").buttonset();

    function adjustMargins(e,ui) {
	localStorage.prompterDirty = 1;
	margins = {left: ui.values[0], right: 100-ui.values[1]};
	localStorage.prompterMargins = margins.left+" "+(100-margins.right);
	$("#content").clearQueue().css( {"marginLeft": margins.left+"%",
					 "marginRight": margins.right+"%",
					 "border": "1px dashed white",
					 "paddingRight": 0,
					 "overflow": "hidden" })
	    .delay(1500)
	    .animate({"borderColor": "transparent"},1000)/*.delay(1000)
							   .animate({ "marginRight": 0, "overflow": "scroll",
							   "paddingRight": margins.right+"%"
							   },10)*/;
	setTimeout(function(){ $("#toolbar").focus(); },500);
    }
    
    $("#margin-slider").slider({
	range: true,
	min: 0, max: 100,
	slide: adjustMargins
    });

    function moveText() {
	if (d.playing && testForDialogs() && Math.abs(d.doScroll) > 1000 ) {
	    d.abs = Math.abs(d.speed);
	    scrollBy(0,( (d.speed<0)?-1:1) * (d.abs>10 ? d.abs%10:1) );
	    d.doScroll = 0;
	} else {
	    d.doScroll += d.speed*d.speed*d.speed;
	}
    }

    function clearFormattingAndSave() {
	$("#content [style]").removeAttr("style");
	text = $("#content").html();
	localStorage.prompterText = text;
    }

    $("#content").keyup(function(e){
	if (localStorage.prompterEditable !== "0") {
	    localStorage.prompterDirty = 1;
	    clearFormattingAndSave();
	}
    });

    $("#more").button({
	text: false,
	icons: { primary: "ui-icon-disk" }
    }).click(function(){
	$("#more-dialog").dialog("open");
    });
    
    function serverWarn(message){
	$("#server-form-warning").text(message)
	    .clearQueue().show("blind").delay(1500).hide("blind"); }

    d.allowServerClose = true;
    function readServerFormAndPrep(){
	if (!d.allowServerClose) {
	    serverWarn("Please wait until the current operation is finished!");
	    return false;
	}
	name = $("#filename").val();
	password = $("#password").val();
	if (!name) {
	    serverWarn("Please provide a filename to save or load!");
	    return false;
	} else {
	    d.allowServerClose = false;
	    $("#server-working").fadeIn(500);
	    return { name:name, password:password };
	}
    }
    function serverRequestComplete(){
	d.allowServerClose = true;
	$("#server-working").fadeOut(500);
    }

    dialogEffect =  {effect:"drop",direction:"up",duration:500};
    dialogOptions = {
	autoOpen: false, closeOnEscape: true,
	modal: true, draggable: false, resizable: false,
	show: dialogEffect, hide: dialogEffect,
	position: {my:"center top", at:"center bottom", of:"#toolbar-sensor"},
	zIndex: 100
    }
    $("#more-dialog").dialog(dialogOptions);
    $("#server").dialog(dialogOptions).dialog("option", {
	open: function() { $(".server-message,#server-form-warning").hide() },
	close: function() { d.replaceSave = false; $("#extra-password").hide(); },
	beforeClose: function() {
	    if (!d.allowServerClose) {
		serverWarn("Please wait until the current request is done!");
	    }
	    return d.allowServerClose;
	},
	width: 600, height: 450,
	buttons: {
	    "Save": function() {
		info = readServerFormAndPrep();
		if (!info) { return false; }
		info.data = JSON.stringify({
		    prompterEditable: localStorage.prompterEditable,
		    prompterText: $("#content").html(),
		    prompterSpeed: d.speed,
		    prompterSize: localStorage.prompterSize,
		    prompterMargins: localStorage.prompterMargins
		});
		if (d.replaceSave) {
		    info.replace = $("#replace-password").val();
		}
		$.ajax({
		    url: "php/save.php",
		    data: info,
		    dataType: "json",
		    type: "POST",
		    success: function(data,status) {
			serverRequestComplete();
			if (!data.success) {
			    if (data.error == "Incorrect password to replace!") {
				serverWarn("The old password you inputted was incorrect. Please try again.");
			    } else if (data.error.substr(0,16) == "Duplicate entry ") {
				serverWarn("A file with this name already exists.");
				$("#extra-password").fadeIn(500);
				d.replaceSave = true;
			    } else {
				serverWarn("Request failed: "+data.error);
			    }
			}
			else {
			    serverRequestComplete();
			    d.replaceSave = false;
			    $("#extra-password").hide();
			    $("#server-finished").fadeIn(500);
			    setTimeout(function(){
				$("#server").dialog("close");
			    },1000);
			    localStorage.prompterDirty = 0;
			}
		    }
		}).error( function(xhr,status,error) {
		    serverRequestComplete();
		    serverWarn("Request failed: "+error);
		});
	    },
	    "Load": function() {
		info = readServerFormAndPrep();
		if (!info) { return false; }
		$.ajax({
		    url: "php/load.php",
		    data: info,
		    dataType: "json",
		    type: "POST",
		    success: function(data,status) {
			serverRequestComplete();
			if (!data.success) {
			    serverWarn("Request failed: "+data.error); }
			else {
			    $("#server-finished").fadeIn(500);
			    setup(JSON.parse(data.data));
			    setTimeout(function(){
				$("#server").dialog("close");
			    },1000);
			    localStorage.prompterDirty = 0;
			}
		    }
		}).error( function(xhr,status,error) {
		    serverRequestComplete();
		    serverWarn("Request failed: "+error);
		});
	    },
	    "Cancel": function() { $("#server").dialog("close"); }
	}
    });

    function closeMenu() {
	$("#more-dialog").dialog("close"); }
    menuButtons = ["ui-icon-document", "ui-icon-transferthick-e-w", "ui-icon-closethick"];
    menuActions = [ function(){
	if (localStorage.prompterDirty=="0" || confirm("Are you sure you want to clear the current script (without saving!) and create a new one?")) {
	    $("#content").html("");
	    if (d.playing) {
		$("#play-label").click(); }
	    $("#disable-edits").get(0).checked=false; $("#disable-edits").button("refresh");
	    localStorage.prompterEditable = 1;
	    changeEditable();
	    newMargins = [0,100];
	    $("#margin-slider").slider("values",newMargins);
	    adjustMargins({},{values:newMargins});
	    localStorage.prompterDirty=0;
	    closeMenu();
	    $("#content").focus();
	}
    },
		    function(){
			closeMenu();
			$("#server").dialog("open");
		    },
		    closeMenu ];
    $("#more-dialog button").each( function(index,el) {
	$(el).button({ icons: {primary: menuButtons[index]} }).click(menuActions[index]);
    });
    
    setup(localStorage);
    d.intervals.moveText = setInterval(moveText,1);

});