/*
 * YouTube Search Provider
 * An extension to search videos in YouTube with GNOME Shell
 *
 * Copyright (C) 2018
 *     Lorenzo Carbonell <lorenzo.carbonell.cerezo@gmail.com>,
 * https://www.atareao.es
 *
 * This file is part of YouTube Search Provider
 * 
 * YouTube Search Provider is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * YouTube Search Provider is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gnome-shell-extension-openweather.
 * If not, see <http://www.gnu.org/licenses/>.
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
            return new Gio.ThemedIcon({name: "youtube"});
        };

        // Custom messages that will be shown as search results
        this._messages = {
            '__loading__': {
                id: '__loading__',
                name: _('YouTube'),
                description : _('Loading items from YouTube, please wait...'),
                // TODO: do these kinds of icon creations better
                createIcon: this.createIcon
            },
            '__error__': {
                id: '__error__',
                name: _('YouTube'),
                description : _('Oops, an error occurred while searching.'),
                createIcon: this.createIcon
            }
        };
        // API results will be stored here
        this.resultsMap = new Map();
        this._api = new YouTubeClient.YouTubeClient();
        // Wait before making an API request
        this._timeoutId = 0;


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
                            /*
                            let icon = new St.Icon({gicon: new Gio.ThemedIcon({name: 'youtube'}),
                                                    icon_size: size});
                            box.add_child(icon);
                            */
                            let scale_factor = St.ThemeContext.get_for_stage(global.stage).scale_factor;
                            let image_file = Gio.file_new_for_uri( meta.thumbnail_url);
                            let texture_cache = St.TextureCache.get_default();
                            let icon = texture_cache.load_file_async(
                                image_file,
                                meta.thumbnail_width,
                                meta.thumbnail_height,
                                scale_factor
                            );
                            box.add_child(icon);
                            return box;
                        }
                    });
                }
            }
        }
        callback(metas);
    }

    /**
     * Search API if the query is a Wikidata query.
     * Wikidata query must start with a 'wd' as the first term.
     * @param {Array} terms
     * @param {Function} callback
     * @param {Gio.Cancellable} cancellable
     */
    getInitialResultSet(terms, callback, cancellable) {
        // terms holds array of search items
        // The first term must start with a 'wd' (=wikidata).
        // It can be of the form 'wd', 'wd-en', 'wd-ru'. The part after
        // the dash is the search language.

        if (terms != null && terms.length >= 1) {
            // show the loading message
            this.showMessage('__loading__', callback);
            // remove previous timeout
            if (this._timeoutId > 0) {
                GLib.source_remove(this._timeoutId);
                this._timeoutId = 0;
            }
            this._timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1500, () => {
                // now search
                this._api.get(
                    this._getQuery(terms.join(' ')),
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
    getSubsetResultSearch(previousResults, terms) {
        return [];
    }

    /**
     * Return subset of results
     * @param {Array} results
     * @param {number} max
     * @returns {Array}
     */
    filterResults(results, max) {
        // override max for now
        max = this._api.limit;
        return results.slice(0, max);
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
            result.forEach((aresult) => {
                this.resultsMap.set(aresult.id, aresult);
                results.push(aresult.id);
            });
            callback(results);
        } else if (error) {
            // Let the user know that an error has occurred.
            this.showMessage('__error__', callback);
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
        Main.overview.viewSelector._searchResults._unregisterProvider(
            youTubeSearchProvider
        );
        youTubeSearchProvider = null;
    }
}
