
InstaUsers = new Mongo.Collection('InstaUsers');

InstaMedia = new Mongo.Collection('InstaMedia');

InstaSlideShows = new Mongo.Collection('InstaSlideShows');

// TODO - use SimpleSchema?


Meteor.methods({
    createSlideShow: function(slideShow) {
        if (!this.userId) {
            throw new Meteor.Error(401, 'Not authenticated!!');
        }
        if (slideShow._id) {
            throw new Meteor.Error(403, 'Cannot set your own _id value!!');
        }
        slideShow.userId = this.userId;
        slideShow.isPrivate = !!slideShow.isPrivate; // replace with SimpleSchema
        var _id = InstaSlideShows.insert(slideShow);
        slideShow._id = _id;
        return slideShow;
    },
    editSlideShowName: function(slideShowId, name) {
        if (!this.userId) {
            throw new Meteor.Error(401, 'Not authenticated!!');
        }
        var slideShow = InstaSlideShows.findOne(slideShowId);
        if (!slideShow) {
            throw new Meteor.Error(404, 'Slide show not found');
        }
        if (slideShow.userId !== this.userId) {
            throw new Meteor.Error(403, 'Cannot edit someone else\'s slide show');
        }
        return InstaSlideShows.update(slideShowId, {$set: {name: name}});
    },
    editSlideShowIsPrivate: function(slideShowId, isPrivate) {
        if (!this.userId) {
            throw new Meteor.Error(401, 'Not authenticated!!');
        }
        var slideShow = InstaSlideShows.findOne(slideShowId);
        if (!slideShow) {
            throw new Meteor.Error(404, 'Slide show not found');
        }
        if (slideShow.userId !== this.userId) {
            throw new Meteor.Error(403, 'Cannot edit someone else\'s slide show');
        }
        if (typeof(isPrivate) !== 'boolean') {
            throw new Meteor.Error(400, 'isPrivate must be a boolean!');
        }
        return InstaSlideShows.update(slideShowId, {$set: {isPrivate: isPrivate}});
    },
    remMediumFromSlideShow: function(slideShowId, mediumId) {
        return _updateSlideShowMedia.call(this, slideShowId, mediumId, false);
    },
    addMediumToSlideShow: function(slideShowId, mediumId) {
        return _updateSlideShowMedia.call(this, slideShowId, mediumId, true);
    }
});


function _updateSlideShowMedia(slideShowId, mediumId, add) {
    if (!this.userId) {
        throw new Meteor.Error(401, 'Not authenticated!!');
    }
    var slideShow = InstaSlideShows.findOne(slideShowId);
    if (!slideShow) {
        throw new Meteor.Error(404, 'Slide show does not exist for id', slideShowId);
    }
    if (slideShow.userId != this.userId) {
        throw new Meteor.Error(403, 'User does not own this slide show');
    }
    if (add) {
        return InstaSlideShows.update(slideShowId,
                                      {$addToSet: {mediaIds: mediumId}});
    } else {
        return InstaSlideShows.update(slideShowId,
                                      {$pull: {mediaIds: mediumId}});
    }
}
