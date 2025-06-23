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

### shelve (experimental - use at own risk!)

This is a power tool to move files to paths based on their metadata. 

**Caveats:**
- supports moving scenes files only
- runs only if a scene has a single file associated
- runs for linux-style paths only

**Usage:**

Currently must be run manually via the GraphQL playground.

Example:
```
mutation {
  runPluginTask(plugin_id: "shelve", 
    args_map: {
      scene_rules: [
		{ 
          filter: {
            path: {
              modifier:"INCLUDES"
              value: "foo"
            },
            studios: {
              modifier:"NOT_NULL"
              value: ""
            }
          },
          path: "/home/WithoutPants/media/video/{studio.name}-{basename}"
        }
      ]
      rename: true
    }
  )
}
```

This will move all scene files with a path that includes "foo" and a studio to the path `/home/WithoutPants/media/video/{studio.name}-{basename}`. The `{studio.name}` and `{basename}` will be replaced with the studio name and the basename of the file, respectively.

`path` field will replace `{<field>}` with the value of the field in the scene. For scenes, the following fields are available:
```
id
title
code
details
director
urls
date
rating100
organized
interactive
interactive_speed

files {
  id
  path
  width
  height
}

galleries {
  id
  files {
    path
  }
  folder {
    path
  }
  title
}

studio {
  id
  name
}

groups {
  group {
    id
    name
  }
  scene_index
}

tags {
  id
  name
}

performers {
  id
  name
  disambiguation
  gender
}
```

Where a field is an array, it will resolve to the first item in the array. For example, `tags.name` will resolve to the name of the first tag on the scene.

Additionally, the following fields are available:
```
basename (original file name including the extension)
ext (original file extension including the dot)
resolution (using same string as the UI - ie 1080p, 4K etc)
```

<!--(WIP) This plugin moves (shelves) files to paths based on their applicable metadata, according to a set of rules. The rules are defined in the settings. It offers a task to process and move files, and the plugin may be configured to automatically move files to the appropriate shelf when they are added to the library. -->

### Shelve UI

Provides a UI for bulk renaming scene files based on metadata. This plugin is a work in progress and may not be fully functional.

![Shelve UI](images/shelve-ui.png?raw=true "Shelve UI")

**Usage:**

Very basic filtering is provided. You can then enter the path pattern to use for renaming files. The path pattern can include metadata fields, such as `{scene.title}`, `{scene.studio.name}`, etc. The available fields are the same as those in the shelve plugin.

Currently, only the individual `Apply` and `Edit` buttons are functional. The `Apply Selected` button does not currently do anything. 
