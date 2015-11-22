
//
// Route
//

Router.route('/edit/:_id', {
    name: 'EditShow',
    waitOn: function() {
        return [
            Meteor.subscribe('instaMedia'),
            Meteor.subscribe('instaSlideShow', this.params._id)
        ];
    },
    data: function() {
        var slideShow = InstaSlideShows.findOne(this.params._id);
        if (slideShow && slideShow.userId !== Meteor.userId()) {
            return this.redirect('/'); // TODO - test
        }
        return {
            slideShow: slideShow,
            media: InstaMedia.find({}),
            currentPageName: 'Edit'
        };
    }
});


//
// Template events
//

var isRendered = false;
var scrolled = false;
var $window = $(window);
var SCROLL_INCREMENT = 16;


Template.EditShow.onRendered(function() {
    isRendered = true;

    if (this.data.slideShow && !this.data.slideShow.lastUpdated &&
        !Session.get('checkingForUpdates')) {
        checkForUpdates(this.data.slideShow._id);
    }
});


Template.EditShow.onDestroyed(function() {
    isRendered = false;
});


$window.scroll(function() {
    if (isRendered) {
        scrolled = true;
    }
});


Meteor.setInterval(function() {
    if (scrolled) {
        scrolled = false;
        checkForScrollUpdate();
    }
}, 500);


Template.EditShow.onRendered(function() {
    Meteor.setTimeout(function() {
        checkForScrollUpdate();
    }, 100);
});


function checkForScrollUpdate() {
    var $target = $('#scrollable-media');
    var windowBottom = $window.scrollTop() + $window.height();
    var targetBottom = $target.offset().top + $target.height();
    if (windowBottom + 100 >= targetBottom) {
        Session.set(
            'scrolledLimit',
            (Session.get('scrolledLimit') || 0) + SCROLL_INCREMENT
        );
    }
}


//
// Helpers
//

Template.EditShow.helpers({
    editingName: function() {
        return Session.get('editing-name-' + this._id);
    },
    updatingImages: function() {
        return Session.get('checkingForUpdates', true);
    },
    showOnlySelected: function() {
        return Session.get('showOnlySelected');
    },
    showDate: function(date) { // TODO - better date rendering
        date = '' + date;
        return date.replace(/GMT.*$/, '');
    },
    privateChecked: function() {
        return this.slideShow && this.slideShow.isPrivate ? 'checked' : false;
    },
    scrollableMedia: function() {
        var limit = Session.get('scrolledLimit') || SCROLL_INCREMENT;
        var findQuery = {};
        var selectedOnly = Session.get('showOnlySelected');
        if (selectedOnly) {
            findQuery = {_id: {$in: this.slideShow.mediaIds || []}};
        }
        return InstaMedia.find(findQuery,
                               {limit: limit, sort: {created_time: -1}});
    },
    mediumSelectedClass: function() {
        var mediumId = this._id;
        var data = Template.parentData();
        return ((data.slideShow.mediaIds || []).indexOf(mediumId) >= 0 ?
                'selected' : '');
    }
});


//
// Events
//

Template.EditShow.events({
    'click span.edit-name': function(event) {
        event.preventDefault();
        Session.set('editing-name-' + this._id, true);
        Meteor.setTimeout(function() {
            $('form.edit-name input:first').focus();
        }, 10);
    },
    'submit form.edit-name': function(event) {
        event.preventDefault();
        var name = event.target.name.value;
        Meteor.call('editSlideShowName', this.slideShow._id, name, function(err, data) {
            if (err) {
                Session.set('editing-name-' + this._id, true);
                console.log('[editSlideShowName.error]', err);
            } else {
                Session.set('editing-name-' + this._id, false);
            }
        });
    },
    'click .check-for-updates': function(event) {
        event.preventDefault();
        checkForUpdates(this.slideShow._id);
    },
    'change .private-val': function(event) {
        var slideShowId = this.slideShow._id;
        var isChecked = event.target.checked;
        Meteor.call('editSlideShowIsPrivate', slideShowId, isChecked, function(err, resp) {
            if (err) {
                event.target.checked = !isChecked;
                console.log('[Meteor.editSlideShowIsPrivate.error]', err);
            }
        });
    },
    'click .toggle-show': function(event) {
        event.preventDefault();
        var key = 'showOnlySelected';
        Session.set(key, !Session.get(key));
    },
    'click .editable-medium, keyup .editable-medium': function(event) {
        if (event.keyCode && event.keyCode !== 13) {
            // only allow return key
            return;
        }

        var parentData = Template.parentData();
        var slideShowId = parentData.slideShow._id;
        var selected = $(event.target).closest('li').hasClass('selected');
        if (selected) {
            Meteor.call('remMediumFromSlideShow', slideShowId, this._id);
        } else {
            Meteor.call('addMediumToSlideShow', slideShowId, this._id);
        }
    }
});


//
// Extras
//

function checkForUpdates(slideShowId) {
    Session.set('checkingForUpdates', true);
    Meteor.call('instaUpdateUser', null, slideShowId, function(err, resp) {
        Session.set('checkingForUpdates', false);
    });
}
