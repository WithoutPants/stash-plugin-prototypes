# WithoutPants Stash Plugin Prototypes

This repository contains a collection of Stash plugins that are in various stages of development. These plugins are not officially supported and are not guaranteed to be stable or secure. They are provided as-is for demonstration purposes only.

## Installation

Add https://withoutpants.github.io/stash-plugin-prototypes/main/index.yml as a Source URL to your Stash plugin sources.

## Plugin List

### Embedded Scene Player

This plugin checks a given file-less scene for URLs that match a configured list of URLs, and it it finds any, it replaces the Scene Player with an embedded player that plays the video using the URL.

![Embedded Scene Player](images/embed-scene-player.png?raw=true "Embedded Scene Player")

**Usage:**

The embeddable URLs must be configured before using. This setting is found in `Settings > Plugins > Embedded Scene Player > URLs`. The setting must be a JSON array of strings, where each string is a URL pattern to match.

![Config](images/embed-scene-player-settings.png?raw=true "Config")

After this is configured, create file-less scenes, filling in the URL with the embed link, and the scene player will be replaced with an embedded player.

### Quick Sentiment

This plugin adds two buttons to the Scene card, for quickly adding Favorite or Watch Later tags to the Scene. 

![Quick Sentiment](images/quick-sentiment.png?raw=true "Quick Sentiment")

**Usage:**

The tag IDs for Favorite and Watch Later must be configured before using. These settings are found in `Settings > Plugins > Quick Sentiment > Favorite Tag ID` and `Settings > Plugins > Quick Sentiment > Watch Later Tag ID`. These settings must be the numeric IDs of the tags to apply.

Clicking on the applicable button will toggle the respective tag on the Scene.
