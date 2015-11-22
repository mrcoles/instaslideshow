
ServiceConfiguration.configurations.remove({
    service: 'instagram'
});


ServiceConfiguration.configurations.insert({
    service: 'instagram',
    scope: 'basic',
    clientId: Meteor.settings.instagram.client_id,
    secret: Meteor.settings.instagram.client_secret
});


Accounts.onCreateUser(function (options, user) {
    if (user.services && user.services.instagram) {
        user.username = user.services.instagram.username;
    }
    return user;
});
