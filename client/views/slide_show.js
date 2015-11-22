

//
// Route
//

Router.route('/show/:_id', {
    name: 'SlideShow',
    // layoutTemplate: 'slideShowLayout',
    waitOn: function() {
        return [
            Meteor.subscribe('instaSlideShowMedia', this.params._id),
            Meteor.subscribe('instaSlideShow', this.params._id)
        ];
    },
    data: function() {
        var slideShow = InstaSlideShows.findOne(this.params._id);
        var linkHref = '';
        var linkText = '';
        if (slideShow && slideShow.userId === Meteor.userId()) {
            linkHref = Router.url('EditShow', {_id: slideShow._id});
            linkText = 'edit';
        }
        return {
            slideShow: slideShow,
            media: InstaMedia.find({}),
            currentPageName: slideShow ? slideShow.name : '',
            currentHeaderClass: 'slide-show force-show',
            headerLinkHref: linkHref,
            headerLinkText: linkText
        };
    }
});


//
// Template
//

// Template.SlideShow.onCreated(function() {
// });


Template.SlideShow.onDestroyed(function() {
    stopLoop();

    $(window).off('keyup.slide-show');
});


Template.SlideShow.onRendered(function() {
    startLoop();

    Meteor.setTimeout(function() {
        $('header').removeClass('force-show');
    }, 3000);


    var nextKeys = {
        9: true, // tab
        13: true, // return
        39: true, // right
        32: true // spacebar
    };

    $(window).on('keyup.slide-show', function(event) {
        if (nextKeys[event.keyCode]) {
            $('.display').finish();
            loop(true);
        }
    });
});


//
// Events
//

Template.SlideShow.events({
    'click .display': function() {
        $('.display').finish();
        loop(true);
    }
});


//
// Extras
//

// Rendering of images

var FADE_DELAY = 3000;
var CHANGE_DELAY = 5000; // 15000;

var isChanging = false;
var oddDisplay = false;

var curId = null;
var queuedSrc = null;
var queuedId = null;


function updateImage(skipAnimation, newSrc, callback) {
    if (isChanging) {
        return;
    }
    isChanging = true;

    var $display0 = $('#display0');
    var $display1 = $('#display1');

    var $curDisplay = oddDisplay ? $display1 : $display0;
    var $nextDisplay = oddDisplay ? $display0 : $display1;
    oddDisplay = !oddDisplay;

    var delay = skipAnimation ? 0 : FADE_DELAY;

    var img = new Image();
    img.onload = function() {
        $nextDisplay.css('background-image', 'url(' + newSrc + ')');
        $nextDisplay.hide().css('z-index', 1).fadeIn(delay, function() {
            $curDisplay.hide();
            $nextDisplay.css('z-index', 0);
            isChanging = false;
            if (callback) {
                callback();
            }

            // preload and queue next image
            queuedSrc = getNextSrc();
            var queuedImg = new Image();
            queuedImg.src = queuedSrc;
        });
    };

    img.src = newSrc;
}


function getNextSrc() {
    var medium = getNextInstaMedia();
    return medium && medium.images.standard_resolution.url || null;
}


function getNextInstaMedia() {
    var media = InstaMedia.find({_id: {$ne: curId}}).fetch();
    shuffle(media);
    return media[0];
}


function change(skipAnimation, callback) {
    var nextSrc;
    if (queuedSrc) {
        nextSrc = queuedSrc;
        queuedSrc = null;
    } else {
        nextSrc = getNextSrc();
    }
    if (nextSrc) {
        updateImage(skipAnimation, nextSrc, callback);
    } else {
        callback();
    }
};


// Fisher-Yates (aka Knuth) Shuffle
// http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex ;

    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}


// Loop

var loopTimeout = null;

function loop(skipAnimation) {
    stopLoop();
    change(skipAnimation, function() {
        loopTimeout = Meteor.setTimeout(loop, CHANGE_DELAY);
    });
}


function stopLoop() {
    Meteor.clearTimeout(loopTimeout);
}

function startLoop() {
    loop();
}
