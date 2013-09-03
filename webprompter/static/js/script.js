if (document.fullscreenEnabled) {
    var isFullscreen = "isFullscreen";
    var fullscreenchange = "fullscreenchange";
} else if (document.webkitFullscreenEnabled) {
    Element.prototype.requestFullscreen = Element.prototype.webkitRequestFullScreen;
    document.cancelFullscreen = document.webkitCancelFullScreen;
    var isFullscreen = "webkitIsFullScreen";
    var fullscreenchange = "webkitfullscreenchange";
} else if (document.mozFullscreenEnabled) {
    Element.prototype.requestFullscreen = Element.prototype.mozRequestFullScreen;
    document.cancelFullscreen = document.mozCancelFullScreen;
    var isFullscreen = "mozIsFullScreen";
    var fullscreenchange = "mozfullscreenchange";
} else {
    alert("Fullscreen APIs not present, please use a different browser or contact support.");
}

var fonts = [
    'Arial, Helvetica, sans-serif',
    '"Arial Black", Gadget, sans-serif',
    '"Comic Sans MS", cursive, sans-serif',
    'Impact, Charcoal, sans-serif',
    '"Lucida Sans Unicode", "Lucida Grande", sans-serif',
    'Tahoma, Geneva, sans-serif',
    '"Trebuchet MS", Helvetica, sans-serif',
    'Verdana, Geneva, sans-serif',
    'Georgia, serif',
    '"Times New Roman", Times, serif',
    '"Courier New", Courier, monospace',
    '"Lucida Console", Monaco, monospace'
];

function Prompter(fresh) {

    $.extend(this,this.defaults);
    if (localStorage.prompter) {
	try {
	    $.extend(this,JSON.parse(localStorage.prompter));
	} catch (err) { }
    }
    if (fresh) {
	this.autosave();
	$.extend(this,this.defaults);
    }

    this.el = $("#content");

    this.isScrolling = false;
    document.addEventListener(fullscreenchange,this.fullscreenChange.bind(this));

    $(document).mousewheel((function(e,delta){
	if (this.isScrolling) {
	    this.speed += (delta+(delta>0?1:-1))/2;
	    this.checkSpeed();
	    e.preventDefault();
	}
    }).bind(this));

    $("#start").button().click(this.startScrolling.bind(this));
    $("#preview").button().click(this.startScrolling.bind(this,"preview"));

    var colorOpts = {
	showPalette: ["black","white","blue","red"],
	showButtons: false
    };
    $("#text-color").spectrum($.extend({
	color: this.textColor,
	localStorageKey: "prompterTextColorSelections",
	move: this.setColor.bind(this,"text")
    },colorOpts));
    $("#bg-color").spectrum($.extend({
	color: this.bgColor,
	localStorageKey: "prompterBGColorSelections",
	move: this.setColor.bind(this,"bg")
    },colorOpts));

    $("#size-plus").button({
	icons: { "primary": "ui-icon-plusthick"  }
    }).click(this.changeFontSize.bind(this,"+"));
    $("#size-minus").button({
	icons: { "primary": "ui-icon-minusthick"  }
    }).click(this.changeFontSize.bind(this,"-"));

    $("#font").change(this.changeFont.bind(this));
    for (i=0;i<fonts.length;i++) {
	$("<option>").val(fonts[i]).text(fonts[i].split(",")[0].replace(/"/g,""))
	    .appendTo("#font"); }

    $("#edit-margins").button().click(this.toggleMarginsEditable.bind(this));

    this.init();
    $(".buttonset").buttonset();

    $(window).resize(function(e){
	if (this.dimensionsTimeout) {
	    clearTimeout(this.dimensionsTimeout); }
	$("#dimensions").stop(true).html(innerWidth+" x "+innerHeight);
	if ($("#dimensions").is(":visible")) {
	    $("#dimensions").css({"opacity":1});
	} else {
	    $("#dimensions").fadeIn(200); }
	this.dimensionsTimeout = setTimeout(function(){
	    $("#dimensions").fadeOut(500);
	},1000);
    });
    
    $(document).keydown(this.handleKey.bind(this));
    this.moveTextInterval = setInterval(this.scrollText.bind(this),1);

    $("#toolbars").removeClass("hide");

/*    
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

    function clearFormatting() {
	$("#content [style]").removeAttr("style");
    }
*/


    $("#more").button({	icons: { primary: "ui-icon-gear" } }).click(function() {
	$("#more-dialog").dialog("open");
    });

    var dialogEffect = {effect:"drop",direction:"up",duration:500};
    var dialogOpts = {
	autoOpen: false, closeOnEscape: true,
	modal: true, resizable: false, draggable: false,
	show: dialogEffect, hide: dialogEffect,
	position: {my:"center top+20", at:"center bottom", of:"#toolbars"},
	zIndex: 100
    };
    this.serverDialog = $("#server-dialog").dialog($.extend({
	minHeight: 400, minWidth: 600
    },dialogOpts)).data("object",this);
    $.tablesorter.addParser({
	id: 'timestamp',
	is: function(d) {
	    return false; //(new Date(d).toString() != "Invalid Date");
	},
	format: function(d) {
	    return new Date(d).getTime();
	},
	type: 'numeric'
    });
    $("#server-dialog table").tablesorter({
	headers: { 1: {sorter: 'timestamp'} }
    });
    $("#save-name").on("keyup focus click",(function(t,e){
	self = $(e.target);
	val = self.val();
	t.find("tbody>tr>td:first-child").each(function(index,el){
	    if ($(this).text() === val) {
		$(this).parent().addClass("selected selected-by-text-input");
	    } else {
		$(this).parent().removeClass("selected selected-by-text-input");
	    }
	});
	return true;
    }).bind(this,this.serverDialog.children("table")));

    this.autosaveDialog = $("#autosave-dialog").dialog($.extend({
	minHeight: 400, minWidth: 600,
	buttons: {
	    Close: function() { $("#autosave-dialog").dialog("close"); }
	}
    },dialogOpts));

    $("#more-dialog").dialog(dialogOpts);
    menuButtons = ["ui-icon-document","ui-icon-disk","ui-icon-folder-open",
		   "ui-icon-clock","ui-icon-key","ui-icon-closethick"];
    menuActions = [
	function() {
	    d = {}; $.extend(d,this.defaults);
	    delete d.textColor; delete d.bgColor;
	    this.init(d);
	},
	this.openServer.bind(this,"save"),
	this.openServer.bind(this,"load"),
	this.autosaveDialog.dialog.bind(this.autosaveDialog,"open"),
	function() {
	    if (this.authorizeIfNecessary()) {
		deauth_w = open(socialauthDisconnect,'','height=600,width=500');
		checkerFunc = (function() {
		    if (deauth_w.closed) {
			this.retextLogoutButton();
		    } else {
			setTimeout(checkerFunc,500);
		    }
		}).bind(this);
		checkerFunc();
	    }
	}
    ];
    $("#more-dialog button").each( (function(index,el) {
	$(el).button({ icons: {primary: menuButtons[index]} })
	    .click((function(func,closeFunc){
		closeFunc();
		if (func) { func.call(this); }
	    }).bind(this,menuActions[index],
		    function(){ $("#more-dialog").dialog("close"); }));
    }).bind(this) );
    this.retextLogoutButton();

    window.onbeforeunload = (function() {
	this.save();
	if (this.isScrolling) {
	    return "Are you sure you want to leave the teleprompter? Your work will be saved when you return."; }
    }).bind(this);

};

Prompter.prototype = {
    retextLogoutButton: function() {
	$("#logout").button("option","label",isAuthenticated?"Logout":"Log In");
    },
    openServer: function(type) {
	this.serverDialog.dialog("option",{
	    dialogClass: "server-"+type+"-dialog",
	    open: (function(type,e,ui) {
		onAuthorize = function(type,self){
		    $.getJSON("load/").success((function(data,status){
			$("#server-dialog table tbody").empty()
			for (i=0;i<data.length;i++) {
			    $("<tr>").appendTo($("#server-dialog table tbody"))
				.append($("<td>").text(data[i].name))
				.append($("<td>").text(data[i].modified))
				.click(function(e){
				    $(this).parent().children("tr").removeClass(
					"selected selected-by-text-input");
				    $(this).addClass("selected");
				    $("#save-name").val($(this).children("td:first-child")
							.text());
				});
			}
			$("#server-dialog table").trigger("update");
			//$("#server-dialog table").trigger("sorton",[[1,0]]);
		    }).bind(this)).error((function(type,func,xhr,status,error){
			if (error == "FORBIDDEN") {
			    window.isAuthenticated = false;
			    this.authorizeIfNecessary.call(this,type,func);
			} else {
			    console.log(arguments);
			    alert("An error occured!");
			}
		    }).bind(this,type,self));
		};
		onAuthorize = onAuthorize.bind(this,type,onAuthorize);
		$("#server-dialog table tbody").empty()
		    .append('<tr><td colspan="2">Loading...</td></tr>');
		$("#server-dialog .dialog-message").empty();
		$("#save-name").val("");
		this.authorizeIfNecessary.call(this,type,onAuthorize);
	    }).bind(this,type),
	    buttons: {
		Cancel: function() { $(this).dialog("close"); },
		"": function() {
		    td = $(this).find(".selected td:first-child");
		    errorFunc = (function(xhr,error,err) {
			$(this).children(".dialog-message").text(error+': '+(err.message?
									     err.message:err));
		    }).bind(this);
		    if ($(this).is(".server-save-dialog>div")) {
			if (td.length > 0) {
			    if (!confirm("Are you sure you want to overwrite that script?")) {
				return false; } }
			$.ajax("save/"+encodeURIComponent($("#save-name").val()),{
			    dataType: "json",
			    type: "POST",
			    data: { contents: $(this).data("object").save() }
			}).success((function(data){
			    console.log(data);
			    $(this).dialog("close");
			}).bind(this)).error(errorFunc);
		    } else {
			$.getJSON("load/"+encodeURIComponent(td.text())).success((function(data){
			    self = $(this).data("object");
			    $(this).dialog("close");
			    self.init(self.defaults);
			    self.init(data,true);
			}).bind(this)).error(errorFunc);
		    }
		}
	    }
	});
	this.serverDialog.dialog("open");
    },
    authorizeIfNecessary: function(m,callback) {
	if (isAuthenticated) {
	    if (callback) { callback(); }
	    return true;
	}
	overlay_back = $("<div>").addClass("overlay-back authorizer").appendTo("body");
	overlay = $("<div>").addClass("overlay").appendTo(overlay_back);
	extra = m?" to "+m+" scripts":""
	$("<p>").text("Please sign in with Google"+extra+".").appendTo(overlay);
	button_cont = $("<div>").appendTo(overlay);
	$("<button>").text("Sign In").click((function(cb){
	    if ($(this).data("win") && !$(this).data("win").closed) {
		$(this).data("win").focus();
	    } else {
		w = open(socialauthBegin,'','height=600,width=500');
		$(this).data("win",w);
		checkerFunc = (function(w,callback){
		    if (w.closed) {
			if (isAuthenticated) {
			    if (callback) { callback(); }
			    $(".authorizer").remove(); }
			this.retextLogoutButton();
		    } else {
			setTimeout(checkerFunc,1000);
		    }
		}).bind(this,w,cb);
		checkerFunc();
	    }
	}).bind(this,callback)).button({icons:{primary:"ui-icon-extlink"}})
	    .appendTo(button_cont);
	$("<button>").text("Cancel").click((function(){
	    if ($(this).data("win") && !$(this).data("win").closed) {
		$(this).data("win").close(); }
	    if (this != window) {
		$("#server-dialog").dialog("close"); }
	    $(".authorizer").remove();
	}).bind(this)).button({icons:{primary:"ui-icon-close"}}).appendTo(button_cont);
    },
    init: function(obj,nosave) {
	if (obj) {
	    if (!nosave) { this.autosave(); }
	    $.extend(this,obj);
	}
	this.el.html(this.text);
	this.setColor();
	this.changeFontSize();
	this.changeFont();
	this.updateMargins();
    },
    autosave: function() {
	localStorage.prompterAutosaves = (localStorage.prompterAutosaves?
					  localStorage.prompterAutosaves+"\\;"+
					  localStorage.prompter:localStorage.prompter);
    },
    startScrolling: function(preview) {
	if (this.marginsEditable) { this.toggleMarginsEditable(); }
	this.playing = false;
	this.warn("");
	if (preview === "preview") {
	    if (document[isFullscreen]) {
		document.cancelFullscreen();
	    } else {
		this.root.addClass("preview");
	    }	    
	} else {
	    this.root.removeClass("preview");
	    this.warn("Press &lt;Esc&gt; to stop prompting.");
	}
	this.root.get(0).requestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    },
    fullscreenChange: function(e) {
	this.isScrolling = document[isFullscreen];
	this.el.prop("contentEditable",!this.isScrolling);
	$(document.body).css("overflow-y",this.isScrolling?"hidden":"auto");
	this.root.css("cursor",this.isScrolling?
		      "url("+staticPath+"img/cursor.png), crosshair":"text");
	this.el.css({
	    "webkitUserSelect": this.isScrolling?"none":"",
	    "userSelect": this.isScrolling?"none":"",
	    "mozUserSelect": this.isScrolling?"none":""
	});
	$("#text-style button,#more").button("option","disabled",this.isScrolling);
	if (this.isScrolling) {
	} else {
	    this.root.removeClass("preview");
	}
    },
    setColor: function(of,color) {
	if (of) {
	    c = color.toHexString();
	    this[of+"Color"] = c;
	    if (of == "text") {
		this.el.css("color",c);
	    } else if (of == "bg") {
		this.root.css("background-color",c);
	    }
	} else {
	    this.el.css("color",this.textColor);
	    this.root.css("background-color",this.bgColor);
	}
	this.save();
    },
    changeFontSize: function(sign,e) {
	this.el.css("fontSize",sign?sign+"=4":this.fontSize);
	this.fontSize = this.el.css("fontSize");
	this.save();
    },
    changeFont: function(e) {
	if (!e) {
	    $("#font").val(this.font); }
	this.el.css("fontFamily",$("#font").val())
	this.font = $("#font").val();
	this.save();
    },
    toggleMarginsEditable: function(e) {
	if (this.marginsEditable) {
	    this.marginsEditable = false;
	    $(".margin-handle").remove();
	    $("#edit-margins").removeClass("working");
	} else {
	    this.warn("Drag the orange handles to adjust the margins.");
	    this.marginsEditable = true;
	    $("#edit-margins").addClass("working");
	    for (i in {0:0,1:1}) {
		$("<div>").appendTo("body").html("&nbsp;").addClass("margin-handle").css({
		    position: "fixed",
		    top: 0, width: 4,
		    height: "100%",
		    cursor: "w-resize",
		    backgroundColor: "#ffaa00"
		}).draggable({
		    axis: "x",
		    cursor: "w-resize",
		    scroll: false,
		    drag: (function(e,ui) {
			percent = (ui.offset.left/(document.width))*100;
			if ($(e.target).css("right") === "auto") {
			    if (percent > 40 || percent < 0) {
				e.preventDefault(); return false; }
			    this.leftMargin = percent;
			} else {
			    if (percent < 60 || (document.width-4)-ui.offset.left < 0) {
				e.preventDefault(); return false; }
			    this.rightMargin = 100-percent;
			}
			this.updateMargins();
		    }).bind(this)
		});
	    }
	    $(".margin-handle").eq(0).css("left",this.leftMargin+"%");
	    $(".margin-handle").eq(1).css("right",this.rightMargin+"%");
	}
    },
    updateMargins: function() {
	this.el.css({
	    marginRight: this.rightMargin+"%",
	    marginLeft: this.leftMargin+"%"
	});
	this.save();
    },
    checkSpeed: function() {
	negative = (this.speed<0)?true:false;
	if (Math.abs(this.speed) > 19.5) {
	    this.speed = 19.5*(negative?-1:1);
	}
	if (Math.abs(this.speed) < 6 && this.speed !== 0) {
	    if (Math.abs(this.speed) <= 1) {
		this.speed = 6*(negative?-1:1);
	    } else {
		this.speed = 0;
	    }
	}
	this.save();
    },
    save: function() {
	this.text = this.el.html();
	localStorage.prompter = JSON.stringify(this,[
	    "font","fontSize","textColor","bgColor","leftMargin","rightMargin","text"
	]);
	return JSON.stringify(this,["font","fontSize","textColor","bgColor","text"]);
    },
    warn: function(msg,timeout) {
	if (!timeout) { timeout = 2000; }
	$("#warning").stop(true,true).html(msg).fadeIn(200).delay(timeout).fadeOut(500);
    },
    handleKey: function(e) {
	var dialogsAreOpen=false;
	$(".ui-dialog-content").each(function(index,el){
	    if ($(this).dialog("isOpen")) { dialogsAreOpen = true; }
	});
	if (dialogsAreOpen) { return true; }
	if (e.which == 9) {
	    e.preventDefault();
	    $("#content").blur();
	    return false;
	}
	if (document.activeElement == $("#content").get(0)) {
	    return true; }
	if (e.which == 39) { e.which = 40; }
	if (e.which == 37) { e.which = 38; }
	if (e.which == 38 || e.which == 40) {
	    if (this.isScrolling && !this.playing) {
		this.warn("The prompter is currently not scrolling...",1000); }
	}
	switch (e.which) {
	case 38: // Up Arrow
	    if (document.height-innerHeight == $(document).scrollTop() && this.speed !== 0) {
		this.speed = 0; break; }
	    this.speed += -1; break;
	case 40: // Down Arrow
	    if ($(document).scrollTop() == 0 && this.speed !== 0) {
		this.speed = 0; break; }
	    this.speed += 1; break;
	case 32: // Space Key
	    this.playing = !this.playing;
	    if (this.playing && this.speed == 0) {
		this.speed = 1;
		this.checkSpeed();
	    }
	    break;
	default:
	    return true;
	}
	this.checkSpeed();
	e.preventDefault();
	return false;
    },
    scrollText: function() {
	if (this.isScrolling && this.playing && Math.abs(this.doScroll) > 1000 ) {
	    this.abs = Math.abs(this.speed);
	    scrollBy(0,( (this.speed<0)?-1:1) * (this.abs>10 ? this.abs%10:1) );
	    this.doScroll = 0;
	} else {
	    this.doScroll += this.speed*this.speed*this.speed;
	}
    },
    root: $(document.documentElement),
    defaults: {
	fontSize: "64px",
	font: fonts[0],
	textColor: "black",
	bgColor: "white",
	text: "Type or paste your script here..."
    },
    leftMargin: 5,
    rightMargin: 5,
    marginsEditable: false,
    doScroll: 0,
    speed: 6
};

var p;

$(function(){

    function removeOverlay(o,time) {
	if (!time) { time = 600; }
	f = (function(){this.remove();}).bind(
	    $(o).removeClass("overlay-opaque",time*(1/4)).fadeOut(time*(3/4)));
	setTimeout(f,time+100);
    }

    $(".splash-actions button").prop("disabled",false);
    if (!localStorage.prompter) {
	$("#splash-continue").prop("disabled",true); }

    $("#splash-continue").button().click(function(){
	removeOverlay("#splash-overlay");
	p = new Prompter();
    });
    $("#splash-new").button().click(function(){
	removeOverlay("#splash-overlay");
	p = new Prompter(true);
    });
    $("#splash-load").button().click(function(){
	removeOverlay("#splash-overlay");
	p = new Prompter();
	p.openServer("load");
    });

});
