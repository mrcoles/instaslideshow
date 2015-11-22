
//
// Route
//

Router.route('/add', {
    name: 'AddShow',
    waitOn: function() {
        return [];
    },
    data: function() {
        return {};
    }
});


//
// Helpers
//

Template.AddShow.helpers({
});


//
// Events
//

Template.AddShow.events({
    'submit form': function(event) {
        event.preventDefault();

        var name = event.target.name.value;
        var isPrivate = event.target.is_private.checked;

        var data = {
            name: name,
            isPrivate: isPrivate
        };

        Meteor.call('createSlideShow', data, function(error, result) {
            if (error) {
                console.log('[createSlideShow.error]', error);
                return;
            }
            var url = Router.url('EditShow', {_id: result._id});
            Router.go(url);
        });
    }
});
