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

    this.el = $("#content");

    this.isScrolling = false;
    document.addEventListener(fullscreenchange,this.fullscreenChange.bind(this));

    $(document).mousewheel((function(e,delta){
	if (this.isScrolling) {
	    d.speed += (delta+(delta>0?1:-1))/2;
	    checkSpeed();
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

    $(".buttonset").buttonset();

    //// CODE STILL NEEDS TO BE REFACTORED \/ \/ \/ ////

    d = {};
    d.speed = 10;
    d.doScroll = 9;
    d.playing = false;
    d.intervals = {};

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

    //$("#disable-edits").get(0).checked = localStorage.prompterEditable == "0";
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
	    //if (!$("#more-dialog").dialog("isOpen")) {
	    d.playing = !d.playing;
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
    });
    
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
	    .animate({"borderColor": "transparent"},1000);
	setTimeout(function(){ $("#toolbar").focus(); },500);
    }

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
	icons: { primary: "ui-icon-disk" }
    }).click(function(){
	$("#more-dialog").dialog("open");
    });

    function closeMenu() {
	$("#more-dialog").dialog("close"); }
    menuButtons = ["ui-icon-document", "ui-icon-transferthick-e-w", "ui-icon-closethick"];
    menuActions = [
	function(){
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
/*window.onbeforeunload = function() {
// only if presenting
    return "Are you sure you want to leave the teleprompter? Your work will be saved when you return.";
}*/

};

Prompter.prototype = {
    startScrolling: function(preview) {
	if (preview === "preview") {
	    if (document[isFullscreen]) {
		document.cancelFullscreen();
	    } else {
		this.root.addClass("preview");
	    }	    
	} else {
	    this.root.removeClass("preview");
	    this.warn("Press &lt;Escape&gt; to stop prompting.");
	}
	this.root.get(0).requestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    },
    fullscreenChange: function(e) {
	this.isScrolling = document[isFullscreen];
	this.el.prop("contentEditable",!this.isScrolling);
	$(document.body).css("overflow-y",this.isScrolling?"hidden":"auto");
	$("#text-style button").button("option","disabled",this.isScrolling);
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
    save: function() {
	localStorage.prompter = JSON.stringify(this,[
	    "font","fontSize","textColor","bgColor"
	]);
    },
    warn: function(msg,timeout) {
	if (!timeout) { timeout = 2000; }
	$("#warning").stop(true,true).html(msg).fadeIn(200).delay(timeout).fadeOut(500);
    },
    root: $(document.documentElement),
    fontSize: "64px",
    font: fonts[0],
    textColor: "black",
    bgColor: "white"
};

$(function(){

    p = new Prompter();

});
