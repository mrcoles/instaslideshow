
//
// Subscriptions
//

Meteor.publish('instaMedia', function() {
    var user = Meteor.users.findOne(this.userId);
    if (user) {
        var userId = user.services.instagram.id;
        return InstaMedia.find({'user.id': userId});
    } else {
        return null;
    }
});


Meteor.publish('instaSlideShowMedia', function(_id) {
    var slideShow = InstaSlideShows.findOne(_id);
    var mediaIds = [];
    if (slideShow && slideShow.mediaIds &&
        (!slideShow.isPrivate || slideShow.userId === this.userId)) {
        mediaIds = slideShow.mediaIds;
    }
    return InstaMedia.find({_id: {$in: mediaIds}});
});


Meteor.publish('instaSlideShow', function(_id) {
    return InstaSlideShows.find({
        _id: _id,
        $or: [
            {userId: this.userId},
            {isPrivate: false}
        ]
    });
});


Meteor.publish('instaSlideShows', function() {
    return InstaSlideShows.find({userId: this.userId});
});


//
// Server-only calls
//

function findUser(data, upsert) {
    if (!data.username && !data.id) {
        throw Meteor.Error('Bad data for insta user lookup', 'needs username or id');
    }
    var result, user;
    if (data.username) {
        result = InstagramAPI.query('usersSearch', {q: data.username, count: 10});
        var usernameLower = data.username.toLowerCase();
        user = _.filter(result.data, function(u) {
            return u.username.toLowerCase() === usernameLower;
        })[0];
    } else {
        result = InstagramAPI.query('usersUserId', {user_id: data.id});
        user = result.data;
    }

    if (upsert && user) {
        InstaUsers.upsert({id: user.id}, user);
    }

    return user;
}


function loadUserMedia(user_id) {
    // get existing medium ids
    var medium_ids = {};
    InstaMedia.find({'user.id': user_id}, {fields: {id: 1}}).forEach(function(medium) {
        medium_ids[medium.id] = true; // ids are strings
    });

    // gather new medium objects
    var new_media = [];
    var stop = false;
    var max_id = undefined;
    var params;
    var count = 0;
    var next_max_id;

    while (true) {
        count++;
        params = {count: 100};
        if (max_id) {
            params.max_id = max_id;
        }
        var result = InstagramAPI.query('usersUserIdMediaRecent', {
            user_id: user_id
        }, params);
        if (!result || !result.data || !result.data.length) {
            break;
        }

        result.data.forEach(function(medium) {
            if (stop) {
                return;
            }

            var medium_id = medium.id;
            if (medium_ids[medium_id]) {
                stop = true;
            } else {
                new_media.push(medium);
                medium_ids[medium_id] = true;
            }
        });

        next_max_id = result.pagination ? result.pagination.next_max_id : undefined;

        if (stop) {
            // since we always have oldest, don't keep looking when we already
            // have stuff
            break;
        } else if (!result.pagination) {
            console.log('>> no pagination in result!', typeof(result.pagination));
            break;
        } else if (!next_max_id) {
            // WINNER - this is what happens and result.pagination is `{}`
            // console.log('>> no more next_max_id',
            //             next_max_id,
            //             result.pagination);
            break;
        } else if (max_id === next_max_id) {
            console.log('>> max_id === next_max_id', max_id);
            break;
        }

        max_id = next_max_id;
    }

    // insert new media
    new_media.forEach(function(medium, i) {
        InstaMedia.upsert({id: medium.id}, medium);
    });

    return new_media.length;
}


Meteor.methods({
    instaUpdateUser: function(data, slideShowId) {
        // HACK - for last updated, but really should be on instaUser?
        var slideShow = slideShowId ? InstaSlideShows.findOne(slideShowId) : null;
        if (slideShow) {
            if (slideShow.userId != this.userId) {
                throw new Meteor.Error(403, 'Cannot update someone elses slideShow last updated');
            }
        }

        var instaUser;
        if (data === null) {
            if (!this.userId) {
                throw new Meteor.Error(401, 'Not authenticated!!');
            }
            var user = Meteor.users.findOne(this.userId);
            instaUser = user.services.instagram;
        } else {
            instaUser = findUser(data, true);
        }

        if (!instaUser) {
            throw new Meteor.Error(401, 'InstaUser not found');
        }

        var num_added = loadUserMedia(instaUser.id);
        if (slideShow) {
            InstaSlideShows.update(slideShowId, {$set: {lastUpdated: new Date()}});
        }
        return {
            num_added: num_added
        };
    }
});
