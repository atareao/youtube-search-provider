## YouTube Search Provider Extension for GNOME Shell

With this extension you are able to search videos from YouTube directly from GNOME Shell.

You can configure some options in order to improve your search,

* **Max results**. It specifies the maximum number of items that should be returned in the result set. Acceptable values are 0 to 50, inclusive.
* **Order**. It specifies the method that will be used to order resources in the response. Acceptable values are:
    * **date** – Resources are sorted in reverse chronological order based on the date they were created.
    * **rating** – Resources are sorted from highest to lowest rating.
    * **relevance** – Resources are sorted based on their relevance to the search query. This is the default value for this parameter.
    * **title** – Resources are sorted alphabetically by title.
    * **videoCount** – Channels are sorted in descending order of their number of uploaded videos.
    * **viewCount** – Resources are sorted from highest to lowest number of views. For live broadcasts, videos are sorted by number of concurrent viewers while the broadcasts are ongoing.
* **Time**. It specifies when look for results. Acceptable values are:
    * **last_24_hours**. In the last 24 hours.
    * **last_7_days**. In the last 7 days.
    * **last_30_days**. In the last 30 days.
    * **last_1_year**. In the last year.
    * **all_time**. Any moment.
* **Safe search**. It indicates whether the search results should include restricted content as well as standard content. Acceptable values are:
    * **moderate**. It will filter some content from search results and, at the least, will filter content that is restricted in your locale. Based on their content, search results could be removed from search results or demoted in search results. This is the default parameter value.
    * **none**. It will not filter the search result set.
    * **strict**. It will try to exclude all restricted content from the search result set. Based on their content, search results could be removed from search results or demoted in search results.
* **Video caption**. It indicates whether should filter video search results based on whether they have captions. Acceptable values are:
    * **any**. Do not filter results based on caption availability.
    * **closedCaption**. Only include videos that have captions.
    * **none**. Only include videos that do not have captions.
* **Video definition**. It lets you restrict a search to only include either high definition (HD) or standard definition (SD) videos. HD videos are available for playback in at least 720p, though higher resolutions, like 1080p, might also be available. Acceptable values are:
    * **any**. Return all videos, regardless of their resolution.
    * **high**. Only retrieve HD videos.
    * **standard**. Only retrieve videos in standard definition.
* **Video dimension**. It  lets you restrict a search to only retrieve 2D or 3D videos. If you specify a value for this parameter, you must also set the type parameter's value to video. Acceptable values are:
    * **2d**. Restrict search results to exclude 3D videos.
    * **3d**. Restrict search results to only include 3D videos.
    * **any**. Include both 3D and non-3D videos in returned results. This is the default value.
* **Video duration**. It filters video search results based on their duration. Acceptable values are:
    * **any**. Do not filter video search results based on their duration. This is the default value.
    * **long**. Only include videos longer than 20 minutes.
    * **medium**. Only include videos that are between four and 20 minutes long (inclusive).
    * **short**. Only include videos that are less than four minutes long.
* **Video license**. It filters search results to only include videos with a particular license. Acceptable values are:
    * **any**. Return all videos, regardless of which license they have, that match the query parameters.
    * **creativeCommon**. Only return videos that have a Creative Commons license. Users can reuse videos with this license in other videos that they create.
    * **youtube**. Only return videos that have the standard YouTube license.
* **Video type**. It lets you restrict a search to a particular type of videos. Acceptable values are:
    * **any**. Return all videos.
    * **episode**. Only retrieve episodes of shows.
    * **movie**. Only retrieve movies.

## HOWTO

### Install

* ```git clone https://github.com/atareao/youtube-search-provider.git ~/.local/share/gnome-shell/extensions/youtube-search-provider@atareao.es```
* Hit ```<Alt> + F2``` and type ```r``` and hit ```<Enter>```
* Enable the extension in ```gnome-tweak-tool```
* Configure languages in  ```gnome-tweak-tool```

### Use

* To search videos in YouTube simply pulse `Super` and write the word

* To configure options for search use ```gnome-tweak-tool```
