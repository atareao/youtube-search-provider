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
 
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const Convenience = Extension.imports.convenience;
const PreferencesWidget = Extension.imports.preferenceswidget;
const Gettext = imports.gettext.domain(Extension.uuid);
const _ = Gettext.gettext;


function init() {
    Convenience.initTranslations();
}

var AboutWidget = GObject.registerClass(
    class AboutWidget extends Gtk.Grid{
        _init(settings) {
            super._init({
                margin_bottom: 18,
                row_spacing: 8,
                hexpand: true,
                halign: Gtk.Align.CENTER,
                orientation: Gtk.Orientation.VERTICAL
            });

            let aboutIcon = new Gtk.Image({
                icon_name: "youtube",
                pixel_size: 128
            });
            this.add(aboutIcon);

            let aboutName = new Gtk.Label({
                label: "<b>" + _("YouTube Search Provider") + "</b>",
                use_markup: true
            });
            this.add(aboutName);

            let aboutVersion = new Gtk.Label({ label: _('Version: ') + Extension.metadata.version.toString() });
            this.add(aboutVersion);

            let aboutDescription = new Gtk.Label({
                label:  Extension.metadata.description
            });
            this.add(aboutDescription);

            let aboutWebsite = new Gtk.Label({
                label: '<a href="%s">%s</a>'.format(
                    Extension.metadata.url,
                    _("Atareao")
                ),
                use_markup: true
            });
            this.add(aboutWebsite);

            let aboutCopyright = new Gtk.Label({
                label: "<small>" + _('Copyright © 2018 Lorenzo Carbonell') + "</small>",
                use_markup: true
            });
            this.add(aboutCopyright);

            let aboutLicense = new Gtk.Label({
                label: "<small>" +
                _("THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n") + 
                _("IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n") + 
                _("FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n") + 
                _("AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n") + 
                _("LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING\n") + 
                _("FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS\n") + 
                _("IN THE SOFTWARE.\n") + 
                "</small>",
                use_markup: true,
                justify: Gtk.Justification.CENTER
            });
            this.add(aboutLicense);
        }
    }
);
var YouTubeSearchProviderPreferencesWidget = GObject.registerClass(
    class YouTubeSearchProviderPreferencesWidget extends PreferencesWidget.Stack{
        _init(){
            super._init();

            let theme = Gtk.IconTheme.get_default();
            if (theme == null) {
                // Workaround due to lazy initialization on wayland
                // as proposed by @fmuellner in GNOME mutter issue #960
                theme = new Gtk.IconTheme();
                theme.set_custom_theme(St.Settings.get().gtk_icon_theme);
            }
            theme.append_search_path(
                Extension.dir.get_child('icons').get_path());

            // Preferences Page
            let preferencesPage = this.addPage(
                "preferences",
                _("Preferences"),
                {}
            );

            var settings = Convenience.getSettings();
            
            let viewerSection = preferencesPage.addSection(_("Viewer options"), null, {});
            viewerSection.addGSetting(settings, "viewer");

            let appearanceSection = preferencesPage.addSection(_("Search options"), null, {});
            appearanceSection.addGSetting(settings, "order");
            appearanceSection.addGSetting(settings, "time");
            appearanceSection.addGSetting(settings, "safesearch");
            appearanceSection.addGSetting(settings, "videocaption");
            appearanceSection.addGSetting(settings, "videodefinition");
            appearanceSection.addGSetting(settings, "videodimension");
            appearanceSection.addGSetting(settings, "videoduration");
            appearanceSection.addGSetting(settings, "videolicense");
            appearanceSection.addGSetting(settings, "videotype");
            appearanceSection.addGSetting(settings, "max-results");
            appearanceSection.addGSetting(settings, "apikey");

            // About Page
            let aboutPage = this.addPage(
                "about",
                _("About"),
                { vscrollbar_policy: Gtk.PolicyType.NEVER }
            );
            aboutPage.box.add(new AboutWidget());
            aboutPage.box.margin_top = 18;
        }
    }
);
function buildPrefsWidget() {
    let wrsp = new YouTubeSearchProviderPreferencesWidget();
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 0, () => {
        let prefsWindow = wrsp.get_toplevel()
        prefsWindow.get_titlebar().custom_title = wrsp.switcher;
        return false;
    });

    wrsp.show_all();
    return wrsp;
}
