
//
// Route
//

Router.route('/', {
    name: 'Home', // so pathFor can work!
    waitOn: function() {
        if (Meteor.userId()) {
            return Meteor.subscribe('instaSlideShows');
        } else {
            return null;
        }
    },
    action: function() {
        if (Meteor.userId()) {
            this.render('HomeLoggedIn', {
                data: function() {
                    return {
                        slideShows: InstaSlideShows.find({})
                    };
                }
            });
        } else {
            this.render('Home');
        }
    }
});


//
// Home - Events
//

Template.Home.events({
    'click .login': function() {
        Meteor.loginWithInstagram(function (err) {
            if (err) {
                console.log('login failed', err);
            }
        });
    }
});


//
// Home Logged In - Events
//

Template.HomeLoggedIn.events({
    'click .logout': function() {
        Meteor.logout(function(err) {
            if (err) {
                console.log('Error logging out', err);
            }
        });
    }
});
