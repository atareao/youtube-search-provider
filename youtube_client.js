/*
 * This file is part of youtube-search-provider
 *
 * Copyright (c) 2018 Lorenzo Carbonell Cerezo <a.k.a. atareao>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

const Soup = imports.gi.Soup;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Convenience = Extension.imports.convenience;

//https://gdata.youtube.com/feeds/api/videos?q=%s&orderby=%s&start-index=%s&max-results=%s&alt=json&v=2
const PROTOCOL = 'https';
//www.googleapis.com/youtube/v3/search?part=snippet&order=viewCount&q=atareao&type=video&videoDefinition=high&key=AIzaSyASv1z2gERCOR7OmJnWUtXImlQO0hI9m7o
const BASE_URL = 'www.googleapis.com/youtube/v3/search';
const USER_AGENT = 'GNOME Shell - YouTubeSearchProvider - extension';
const HTTP_TIMEOUT = 10;

const ORDER = { //order
    0: "date", // Entries are ordered by their relevance to a search query. This is the default setting for video search results feeds.
    1: "rating", // Entries are returned in reverse chronological order. This is the default value for video feeds other than search results feeds.
    2: "title", // Entries are ordered from most views to least views.
    3: "videoCount", // Entries are ordered from highest rating to lowest rating.
    4: "viewCount", // Entries are ordered from highest rating to lowest rating.
}
const TIME = {
    0: "last_24_hours", // 1 day
    1: "last_7_days", // 7 days
    2: "last_30_days", // 1 month
    3: "last_1_year", // 1 month
    4: "all_time"
}
const SAFESEARCH = { //safeSearch
    0: "moderate",
    1: "none",
    2: "strict"
}
const VIDEOCAPTION = { //videoCaption
    0: "any",
    1: "closedCaption",
    2: "none"
}
const VIDEODEFINITION = { //videoDefinition
    0: "any",
    1: "high",
    2: "standard"
}
const VIDEODIMENSION = { //videoDimension
    0: "2d",
    1: "3d",
    2: "any"
}
const VIDEODURATION = { //videoDuration
    0: "any", // Only include videos that are less than four minutes long.
    1: "long", // Only include videos that are between four and 20 minutes long (inclusive).
    2: "medium", // Only include videos longer than 20 minutes.
    3: "short"
}
const VIDEOLICENSE = { //videoLicense
    0: "any",
    1: "creativeCommon",
    2: "youtube"
}
const VIDEOTYPE = { //videoType
    0: "any",
    1: "episode",
    2: "movie"
}
class YouTubeClient{
    constructor(params){
        this._protocol = PROTOCOL;
        this._base_url = BASE_URL;
        this._settings = Convenience.getSettings();
        this._order = ORDER[this._settings.get_enum('order')];
        this._time = TIME[this._settings.get_enum('time')];
        this._safesearch = SAFESEARCH[this._settings.get_enum('safesearch')]
        this._videocaption = VIDEOCAPTION[this._settings.get_enum('videocaption')]
        this._videodefinition = VIDEODEFINITION[this._settings.get_enum('videodefinition')]
        this._videodimension = VIDEODIMENSION[this._settings.get_enum('videodimension')]
        this._videoduration = VIDEODURATION[this._settings.get_enum('videoduration')]
        this._videolicense = VIDEOLICENSE[this._settings.get_enum('videolicense')]
        this._videotype = VIDEOTYPE[this._settings.get_enum('videotype')]
        this._max_results = this._settings.get_int('max-results');
        this._settings.connect("changed", ()=>{
            this._order = ORDER[this._settings.get_enum('order')];
            this._time = TIME[this._settings.get_enum('time')];
            this._safesearch = SAFESEARCH[this._settings.get_enum('safesearch')]
            this._videocaption = VIDEOCAPTION[this._settings.get_enum('videocaption')]
            this._videodefinition = VIDEODEFINITION[this._settings.get_enum('videodefinition')]
            this._videodimension = VIDEODIMENSION[this._settings.get_enum('videodimension')]
            this._videoduration = VIDEODURATION[this._settings.get_enum('videoduration')]
            this._videolicense = VIDEOLICENSE[this._settings.get_enum('videolicense')]
            this._videotype = VIDEOTYPE[this._settings.get_enum('videotype')]
            this._max_results = this._settings.get_int('max-results');
        });
    }

    calculate_time(thetime){
        let search_time_string = "";
        let publishedAfter = new Date();
        let publishedBefore = new Date();
        switch(thetime){
            case 'last_24_hours':
                publishedAfter.setDate(publishedBefore.getDate()-1);
                search_time_string = '&publishedAfter=%s&publishedBefore=%s'.format(
                    publishedAfter.toISOString(),
                    publishedBefore.toISOString()
                );
                break;
            case 'last_7_days':
                publishedAfter.setDate(publishedBefore.getDate()-7);
                search_time_string = '&publishedAfter=%s&publishedBefore=%s'.format(
                    publishedAfter.toISOString(),
                    publishedBefore.toISOString()
                );
                break;
            case 'last_30_days':
                publishedAfter.setDate(publishedBefore.getDate()-30);
                search_time_string = '&publishedAfter=%s&publishedBefore=%s'.format(
                    publishedAfter.toISOString(),
                    publishedBefore.toISOString()
                );
                break;
            case 'last_1_year':
                publishedAfter.setDate(publishedBefore.getDate()-365);
                search_time_string = '&publishedAfter=%s&publishedBefore=%s'.format(
                    publishedAfter.toISOString(),
                    publishedBefore.toISOString()
                );
                break;
        }
        return search_time_string;
    }

    _build_query_url(word){
        // 0 < maxResults < 50
        // encodeURIComponent(word),
        let url = '%s://%s?part=snippet&q=%s&order=%s&maxResults=%s&type=video&safeSearch=%s&videoCaption=%s&videoDefinition=%s&videoDimension=%s&videoDuration=%s&videoLicense=%s&videoType=%s%s&key=AIzaSyD04-CwHJn6llyGRmUfL3MwVxFjnzeektM'.format(
            this._protocol,
            this._base_url,
            encodeURIComponent(word),
            this._order,
            this._max_results,
            this._safesearch,
            this._videocaption,
            this._videodefinition,
            this._videodimension,
            this._videoduration,
            this._videolicense,
            this._videotype,
            this.calculate_time(this._time)
        );
        return url;
    }

    get(word, callback, p1, p2) {
        log('LLL 1: '+ word);
        let query_url = this._build_query_url(word);
        log('LLL 2: '+ query_url);
        let request = Soup.Message.new('GET', query_url);

        _get_soup_session().queue_message(request,
            (http_session, message) => {
                if(message.status_code !== Soup.KnownStatusCode.OK) {
                    let error_message =
                        "YouTubeClient.Client:get(): Error code: %s".format(
                            message.status_code
                        );
                    callback(error_message, null);
                    return;
                }else{
                    try {
                        let result = JSON.parse(request.response_body.data);
                        let results = [];
                        let i = 0;
                        result.items.forEach((element)=>{
                            log('Index: ' + i + ' Name: ' + element.snippet.title);
                            results.push({
                                id: 'index_'+i,
                                label: element.snippet.title,
                                url: element.id.videoId,
                                description: element.snippet.description,
                                thumbnail_url: element.snippet.thumbnails.default.url,
                                thumbnail_width: element.snippet.thumbnails.default.width,
                                thumbnail_height: element.snippet.thumbnails.default.height
                            });
                            i += 1;
                        });
                        if(results.length > 0){
                            callback(null, results, p1, p2);
                            return;
                        }
                    }
                    catch(e) {
                        let message = "WordReference.Client:get(): %s".format(e);
                        callback(message, null, p1, p2);
                        return;
                    }
                }
            }
        );
        let message = "Nothing found";
        callback(message, null, p1, p2);
    }
    destroy() {
        _get_soup_session().run_dispose();
        _SESSION = null;
    }

    get protocol() {
        return this._protocol;
    }

    set protocol(protocol) {
        this._protocol = protocol;
    }

    get base_url() {
        return this._base_url;
    }

    set base_url(url) {
        this._base_url = url;
    }
}

let _SESSION = null;

function _get_soup_session() {
    if(_SESSION === null) {
        _SESSION = new Soup.SessionAsync();
        Soup.Session.prototype.add_feature.call(
            _SESSION,
            new Soup.ProxyResolverDefault()
        );
        _SESSION.user_agent = USER_AGENT;
        _SESSION.timeout = HTTP_TIMEOUT;
    }

    return _SESSION;
}
