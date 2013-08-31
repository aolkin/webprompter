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

function Prompter() {

    if (localStorage.prompter) {
	try {
	    $.extend(this,JSON.parse(localStorage.prompter));
	} catch (err) { }
    }

    this.el = $("#content").html(this.text);

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
    this.setColor();

    $("#size-plus").button({
	icons: { "primary": "ui-icon-plusthick"  }
    }).click(this.changeFontSize.bind(this,"+"));
    $("#size-minus").button({
	icons: { "primary": "ui-icon-minusthick"  }
    }).click(this.changeFontSize.bind(this,"-"));
    this.changeFontSize();

    $("#font").change(this.changeFont.bind(this));
    for (i=0;i<fonts.length;i++) {
	$("<option>").val(fonts[i]).text(fonts[i].split(",")[0].replace(/"/g,""))
	    .appendTo("#font"); }
    this.changeFont();

    $("#edit-margins").button().click(this.toggleMarginsEditable.bind(this));
    this.updateMargins();

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

    function clearFormattingAndSave() {
	$("#content [style]").removeAttr("style");
	text = $("#content").html();
	localStorage.prompterText = text;
    }

    $("#more").button({
	icons: { primary: "ui-icon-disk" }
    }).click(function() {
	$("#more-dialog").dialog("open");
    });

    dialogEffect = {effect:"drop",direction:"up",duration:500};
    $("#more-dialog").dialog({
	autoOpen: false, closeOnEscape: true,
	modal: true, resizable: false, draggable: false,
	show: dialogEffect, hide: dialogEffect,
	position: {my:"center top+20", at:"center bottom", of:"#toolbars"},
	zIndex: 100
    });
    function closeMenu() {
	$("#more-dialog").dialog("close"); }
    menuButtons = ["ui-icon-transferthick-e-w", "ui-icon-closethick"];
    menuActions = [
	function(){
	    closeMenu();
	    this.warn("Saving and loading is not possible yet!");
	},
	closeMenu ];
    $("#more-dialog button").each( (function(index,el) {
	$(el).button({ icons: {primary: menuButtons[index]} })
	    .click(menuActions[index].bind(this));
    }).bind(this) );

    window.onbeforeunload = (function() {
	if (this.isScrolling) {
	    return "Are you sure you want to leave the teleprompter? Your work will be saved when you return."; }
    }).bind(this);

};

Prompter.prototype = {
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
	    "font","fontSize","textColor","bgColor","leftMargin","rightMargin","speed","text"
	]);
    },
    warn: function(msg,timeout) {
	if (!timeout) { timeout = 2000; }
	$("#warning").stop(true,true).html(msg).fadeIn(200).delay(timeout).fadeOut(500);
    },
    handleKey: function(e) {
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
    fontSize: "64px",
    font: fonts[0],
    textColor: "black",
    bgColor: "white",
    leftMargin: 5,
    rightMargin: 5,
    marginsEditable: false,
    doScroll: 0
};

$(function(){

    p = new Prompter();

});
