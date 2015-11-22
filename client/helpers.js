
UI.registerHelper('timesince', function(datetime) {
    return datetime ? moment(datetime).fromNow() : '';
});


UI.registerHelper('fulltime', function(datetime) {
    return datetime ? moment(datetime).format('ddd, MMM D, YYYY, h:mm A') : '';
});


UI.registerHelper('safelength', function(array) {
    return array ? array.length : 0;
});