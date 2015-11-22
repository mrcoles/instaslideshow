// settings http://stackoverflow.com/questions/14099048/whats-the-best-way-to-protect-secret-keys-when-deploying-a-meteor-app
// consider using the db? for auto-config?

var _URL_BASE = 'https://api.instagram.com/v1';

var _ENDPOINTS = {
    usersUserId: {
        url: '/users/{user_id}',
        keywords: {
            user_id: 'User id or "self" if authenticated.'
        },
        params: {}
    },
    usersSelfFeed: {
        url: '/users/self/feed',
        params: {
            count: 'count of media to return.',
            min_id: 'Return media later than this min_id.',
            max_id: 'Return media earlier than this max_id.'
        }
    },
    usersUserIdMediaRecent: {
        url: '/users/{user_id}/media/recent',
        keywords: {
            user_id: 'User id or "self" if authenticated.'
        },
        params: {
            count: 'Count of media to return.',
            max_timestamp: 'Return media before this UNIX timestamp.',
            access_token: 'A valid access token.',
            min_timestamp: 'Return media after this UNIX timestamp.',
            min_id: 'Return media later than this min_id.',
            max_id: 'Return media earlier than this max_id.'
        }
    },
    usersSelfLiked: {
        url: '/users/self/media/liked',
        params: {
            count: 'Count of media to return.',
            max_like_id: 'Return media liked before this id.'
        }
    },
    usersSearch: {
        url: '/users/search',
        params: {
            q: 'A query string.',
            count: 'Number of users to return.'
        }
    }
};


/**
 * Make a query to the Instagram API
 *
 * name - String - name of the endpoint
 * urlKeywords - Object - keywords arguments for the URL (iff required in URL)
 * params - Object - parameters for endpoint
 * asyncCallback - Function - optional callback. If passed, the method runs
 *                            asynchronously, instead of synchronously, and
 *                            calls asyncCallback. On the client, this callback
 *                            is required.
 */
function query(name, urlKeywords, params, asyncCallback) {
    var endpoint = _ENDPOINTS[name];
    if (typeof(endpoint) === 'undefined') {
        throw new Meteor.Error('Unknown endpoint', name + ' not found.');
    }

    var config = (Meteor.settings || {})['instagram'];
    if (!config || !config.client_id || !config.client_secret) {
        throw new Meteor.Error('Missing instagram API config',
                               'Need Meteor.settings with client_id and secret_id');
    }

    var clientId = config.client_id;

    if (!endpoint.keywords) {
        asyncCallback = params;
        params = urlKeywords;
        urlKeywords = {};
    }

    var url = endpoint.url;
    if (urlKeywords) {
        url = _format(url, urlKeywords);
    }
    url = _URL_BASE + url;

    // TODO - verify params are correct?
    params = _.extend({client_id: clientId}, params);

    // REM - logging
    var params_str = Object.keys(params).map(function(key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    }).join('&');

    var result = HTTP.get(url, {
        params: params,
        timeout: 30 * 1000
    });

    if (result.statusCode != 200) {
        throw Meteor.Error('Error making api call to ' + name, result.content);
    }

    return result.data;
}


function _format(string, keywords) {
    return string.split(/\{([^\}]+)\}/).map(function(token, i) {
        return (i % 2) ? keywords[token] : token;
    }).join('');
}


// Expose API

InstagramAPI = {
    query: query
};
