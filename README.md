
Insta Slide Show
================

A Meteor app to easily create and share a slide show of your Instagram photos.

Find on: [instaslideshow.meteor.com](http://instaslideshow.meteor.com/)

Running locally:

```bash
meteor --settings settings.json
```

Where settings.json is a file that references an Instagram API client in the following format:

```
{
    "instagram": {
        "client_id": "{{client_id}}",
        "client_secret": "{{client_secret}}"
    }
}
```
