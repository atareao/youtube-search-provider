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

const St = imports.gi.St;
const Main = imports.ui.main;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const GLib = imports.gi.GLib;
const Clutter = imports.gi.Clutter;
const GdkPixbuf = imports.gi.GdkPixbuf;
const Util = imports.misc.util;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const YouTubeClient = Extension.imports.youtube_client;
const Convenience = Extension.imports.convenience;

const Gettext = imports.gettext.domain(Extension.metadata.uuid);
const _ = Gettext.gettext;

class YouTubeSearchProvider{
    constructor(){

        //this._settings = Convenience.getSettings();
        Gtk.IconTheme.get_default().append_search_path(
            Extension.dir.get_child('icons').get_path());
        // Use the default app for opening https links as the app for
        // launching full search.
        this.appInfo = Gio.AppInfo.get_default_for_uri_scheme('https');
        // Fake the name and icon of the app
        this.appInfo.get_name = ()=>{
            return 'YouTube Search Provider';
        };
        this.appInfo.get_icon = ()=>{
            return Gio.icon_new_for_string(Extension.path + '/icons/youtube.svg');
        };
        this._message = "";
        // Custom messages that will be shown as search results
        this._messages = {
            '__loading__': {
                id: '__loading__',
                name: _('YouTube'),
                description : _('Loading items from YouTube, please wait...'),
                // TODO: do these kinds of icon creations better
                createIcon: () => {}
            },
            '__error__': {
                id: '__error__',
                name: _('YouTube'),
                description : _('Oops, an error occurred while searching.'),
                createIcon: () => {}
            },
            '__error2__': {
                id: '__error__',
                name: _('YouTube'),
                description : this._message,
                createIcon: () => {}
            },
            '__nothing_found__': {
                id: '__nothing_found__',
                name: _('YouTube'),
                description : _('Oops, I did\'nt found what you are looking for.'),
                createIcon: ()=>{}
            }
            
        };
        // API results will be stored here
        this.resultsMap = new Map();
        this._api = new YouTubeClient.YouTubeClient();
        // Wait before making an API request
        this._timeoutId = 0;
        this._keyReleaseId = Main.overview.searchEntry.clutter_text.connect(
            "key-release_event", (object, event)=>{
                let symbol = event.get_key_symbol();
                let query = Main.overview.searchEntry.text;
            }
        )
    }

    /**
     * Launch the search in the default app (i.e. browser)
     * @param {String[]} terms
     */
    /*
    launchSearch(terms) {
        Util.trySpawnCommandLine(
            "xdg-open " + this._api.getFullSearchUrl(this._getQuery(terms)));
    }
    */
    /**
     * Open the url in default app
     * @param {String} identifier
     * @param {Array} terms
     * @param timestamp
     */
    activateResult(identifier, terms, timestamp) {
        let result;
        let command = '';
        // only do something if the result is not a custom message
        if (!(identifier in this._messages)) {
            result = this.resultsMap.get(identifier);
            if (result) {
                let settings = Convenience.getSettings();
                let viewer = settings.get_enum('viewer');
                switch(viewer) {
                    case 0:
                        if(Gio.File.new_for_path('/usr/bin/vlc').query_exists(null)){
                            command = '/usr/bin/vlc --one-instance "https://www.youtube.com/watch?v=%s"';
                        }
                        break;
                    case 1:
                        if(Gio.File.new_for_path('/usr/bin/minitube').query_exists(null)){
                            command = '/usr/bin/minitube "https://www.youtube.com/watch?v=%s"';
                        }
                        break;
                    case 2:
                        if(Gio.File.new_for_path('/usr/bin/smplayer').query_exists(null)){
                            command = '/usr/bin/smplayer "https://www.youtube.com/watch?v=%s"';
                        }
                        break;
                    case 3:
                        if(Gio.File.new_for_path('/usr/bin/umplayer').query_exists(null)){
                            command = '/usr/bin/umplayer "https://www.youtube.com/watch?v=%s"';
                        }
                        break;
                    case 4:
                        if(Gio.File.new_for_path('/usr/bin/totem').query_exists(null)){
                            command = '/usr/bin/totem "https://www.youtube.com/watch?v=%s"';
                        }
                        break;
                    case 5:
                        if(Gio.File.new_for_path('/usr/bin/miro').query_exists(null)){
                            command = '/usr/bin/miro "https://www.youtube.com/watch?v=%s"';
                        }
                        break;
                    case 6:
                        if(Gio.File.new_for_path('/usr/bin/mpv').query_exists(null)){
                            command = '/usr/bin/mpv "https://www.youtube.com/watch?v=%s"';
                        }
                        break;
                }
                if(command == ''){
                    command = 'xdg-open https://www.youtube.com/watch?v=%s';
                }
                Util.trySpawnCommandLine(command.format(result.url));
            }
        }
    }
    /**
     * Run callback with results
     * @param {Array} identifiers
     * @param {Function} callback
     */
    getResultMetas(identifiers, callback) {
        let metas = [];

        for (let i = 0; i < identifiers.length; i++) {
            let result;
            // return predefined message if it exists
            if (identifiers[i] in this._messages) {
                metas.push(this._messages[identifiers[i]]);
            } else {
                // TODO: check for messages that don't exist, show generic error message
                let meta = this.resultsMap.get(identifiers[i]);
                if (meta){
                    metas.push({
                        id: meta.id,
                        name: meta.label,
                        description : meta.description,
                        createIcon: (size)=>{
                            let box = new Clutter.Box();
                            if(meta && meta.thumbnail_url){
                                let gicon = Gio.icon_new_for_string(meta.thumbnail_url);
                                if(!gicon){
                                    gicon = Gio.icon_new_for_string(Extension.path + '/icons/youtube.svg');
                                }
                                let icon = new St.Icon({gicon: gicon,
                                                        style_class: 'youtube-icon'});
                                icon.set_icon_size(100);
                                box.add_child(icon);
                            }
                            return box;
                        }
                    });
                }
            }
        }
        callback(metas);
    }

    /**
     * Search API if the query is a YouTube query.
     * YouTube query must start with a 'y:' as the first term.
     * @param {Array} terms
     * @param {Function} callback
     * @param {Gio.Cancellable} cancellable
     */
    getInitialResultSet(terms, callback, cancellable) {
        // terms holds array of search items
        // The first term must start with a 'y:'
        if (terms != null && terms.length > 0 && terms[0].substring(0, 2) === 'y:') {
            // show the loading message
            this.showMessage('__loading__', callback);
            // remove previous timeout
            if (this._timeoutId > 0) {
                GLib.source_remove(this._timeoutId);
                this._timeoutId = 0;
            }
            this._timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1500, () => {
                // now search
                let query = terms.join(' ');
                this._api.get(
                    this._getQuery(query.substring(2)),
                    this._getResultSet.bind(this),
                    callback,
                    this._timeoutId
                );
                return false;
            });
        } else {
            // return an emtpy result set
            this._getResultSet(null, {}, callback, 0);
        }
    }

    /**
     * Show any message as a search item
     * @param {String} identifier Message identifier
     * @param {Function} callback Callback that pushes the result to search
     * overview
     */
    showMessage(identifier, callback) {
        callback([identifier]);
    }

    /**
     * TODO: implement
     * @param {Array} previousResults
     * @param {Array} terms
     * @returns {Array}
     */
    getSubsearchResultSet(previousResults, terms, callback, cancellable) {
        this.getInitialResultSet(terms, callback);
    }

    /**
     * Return subset of results
     * @param {Array} results
     * @param {number} max
     * @returns {Array}
     */
    filterResults(results, max) {
        // override max for now
        if(this._apit && this._api.limit){
            max = this._api.limit;
            results = results.slice(0, max);
        }
        return results;
    }

    /**
     * Return query string from terms array
     * @param {String[]} terms
     * @returns {String}
     */
    _getQuery(terms) {
        return terms;
    }

    /**
     * Parse results that we get from the API and save them in this.resultsMap.
     * Inform the user if no results are found.
     * @param {null|String} error
     * @param {Object|null} result
     * @param {Function} callback
     * @private
     */
    _getResultSet(error, result, callback, timeoutId) {
        let results = [];
        if (timeoutId === this._timeoutId && result && result.length > 0) {
            if(result.length > 0){
                result.forEach((aresult) => {
                    this.resultsMap.set(aresult.id, aresult);
                    results.push(aresult.id);
                });
                callback(results);
            }else{
                this.showMessage('__nothing_found__', callback);
            }
        } else if (error) {
            // Let the user know that an error has occurred.
            this.resultsMap = new Map();
            let message_error = {
                id: GLib.base64_encode(error),
                label: _('YouTube'),
                description : error
            };
            this.resultsMap.set(message_error.id, message_error);
            results.push(message_error.id);
            callback(results);
        }
    }

    /**
     * Create meta icon
     * @param size
     * @param {Object} meta
     */
    createIcon(size) {
        let box = new Clutter.Box();
        let icon = new St.Icon({gicon: new Gio.ThemedIcon({name: 'youtube'}),
                                icon_size: size});
        box.add_child(icon);
        return box;
    }
    unregister(){
        if (this._timeoutId > 0) {
            GLib.source_remove(this._timeoutId);
            this._timeoutId = 0;
        }
    }
}

let youTubeSearchProvider = null;

function init() {
    Convenience.initTranslations();
}

function enable() {
    if (!youTubeSearchProvider) {
        youTubeSearchProvider = new YouTubeSearchProvider();
        Main.overview.viewSelector._searchResults._registerProvider(
            youTubeSearchProvider
        );
    }
}

function disable() {
    if (youTubeSearchProvider){
        youTubeSearchProvider.unregister();
        Main.overview.viewSelector._searchResults._unregisterProvider(
            youTubeSearchProvider
        );
        youTubeSearchProvider = null;
    }
}
