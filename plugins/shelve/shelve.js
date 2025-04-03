// Plugin input:
// {
//     "scene_rules": [
//         {
//             "filter": { /* filter */ },
//             "path": "/media/studios/{studio.name}/{basename}"
//         },
//         ...
//     ],
//     "rename": true | false // defaults to false
//     "useConfig": true | false
// }

// Example usage:
/*
mutation {
  runPluginTask(plugin_id: "shelve", 
    args_map: {
      scene_rules: [
				{ 
          filter: {
            path: {
              modifier:"INCLUDES"
              value: "issue4738"
            },
            studio: {
              modifier: "NOT_NULL"
            }
          },
          path: "/home/WithoutPants/media/video/{studio.name}-{basename}"
        }
      ]
      rename: true
    }
  )
}
*/

function runScenes(rules, rename) {
  // TODO get the rules
  // var rules = [
  //     { 
  //         filter: {
  //             studios: {
  //                 modifier: "NOT_NULL"
  //             }
  //         },
  //         path: "/media/studios/{studio.name}/{basename}"
  //     },
  //     { 
  //         filter: {
  //           studios: {
  //             modifier: "IS_NULL"
  //           },
  //           performer_count: {
  //               modifier: "EQUALS",
  //               value: 1
  //           }
  //         },
  //         path: "/media/performers/{performers.name}/{basename}"
  //     },
      // {
      //     filter: { /* no performer no studio one tag */ },
      //     path: "/media/tags/{tags.name}/{basename}"
      // }
  // ];
  

  rules.forEach(runSceneRule(rename));
}

function runUsingSceneConfig(rename) {
  let rules = [];

  let cfg = getConfig();
  let rulesJSON = cfg.configuration.plugins.shelve.scene_rules;
  if (rulesJSON) {
    try {
      rules = JSON.parse(rulesJSON);
    } catch (err) {
      log.Error(`Error parsing rules: ${err}`);
      return;
    }
  }

  runScenes(rules, rename);
}

// TODO - get all fields of relationships

function doGQL(query) {
  return (variables) => {
      return gql.Do(query, variables ?? {});
  }
}

const getConfigGQL = `
query {
  configuration {
    plugins(include: ["shelve"])
  }
}`;

const getConfig = doGQL(getConfigGQL);

const findScenesGQL = `
query FindScenes(
$filter: FindFilterType
$scene_filter: SceneFilterType
) {
findScenes(
  filter: $filter
  scene_filter: $scene_filter
) {
  count
  scenes {
    ...SceneData
  }
}
}

fragment SceneData on Scene {
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
}`;

const findScenes = doGQL(findScenesGQL);

const moveFilesGQL = `
mutation MoveFiles(
  $input: MoveFilesInput!
) {
  moveFiles(input: $input)
}
`;

const moveFiles = doGQL(moveFilesGQL);

function onlyUnique(value, index, array) {
  return array.indexOf(value) === index;
}

function getTokens(path) {
  // find all tokens in the path
  // tokens are in the form of {token[.name]}
  return path.match(/{[^}]+}/g).filter(onlyUnique);
}

function resolveToken(obj, key) {
  var keys = key.split('.');
  var leftover = keys.slice(1).join('.');

  if (Array.isArray(obj)) {
      if (obj.length === 0) {
          throw new Error(`Key ${key} resolved to an empty array`);
      }
      return resolveToken(obj[0], key);
  }

  if (keys.length === 1) {
      return obj[keys[0]];
  }

  return resolveToken(obj[keys[0]], leftover);
}

function dir(path) {
  // TODO - handle windows paths
  return path.split('/').slice(0, -1).join('/');
}

function basename(path) {
  // TODO - handle windows paths
  return path.split('/').pop();
}

function ext(path) {
  return `.${basename(path).split('.').pop()}`;
}

// from UI
const resolution = (width, height) => {
  const number = width > height ? height : width;
  if (number >= 6144) {
    return "HUGE";
  }
  if (number >= 3840) {
    return "8K";
  }
  if (number >= 3584) {
    return "7K";
  }
  if (number >= 3000) {
    return "6K";
  }
  if (number >= 2560) {
    return "5K";
  }
  if (number >= 1920) {
    return "4K";
  }
  if (number >= 1440) {
    return "1440p";
  }
  if (number >= 1080) {
    return "1080p";
  }
  if (number >= 720) {
    return "720p";
  }
  if (number >= 540) {
    return "540p";
  }
  if (number >= 480) {
    return "480p";
  }
  if (number >= 360) {
    return "360p";
  }
  if (number >= 240) {
    return "240p";
  }
  if (number >= 144) {
    return "144p";
  }
};

function getNewScenePath(rule, scene) {
  var path = rule.path;
  // TODO - handle windows paths
  var existingPath = scene.files[0].path;
  var bn = basename(existingPath);
  var xt = ext(existingPath);
  path = path.replaceAll('{basename}', bn);
  path = path.replaceAll('{ext}', xt);
  path = path.replaceAll('{resolution}', resolution(scene.files[0].width, scene.files[0].height));

  var tokenStrings = getTokens(path);
  tokenStrings.forEach((key) => {
      var token = key.substring(1, key.length - 1);
      try {
        var value = resolveToken(scene, token);
        if (!value) {
            throw new Error(`Key ${token} resolved to an empty value for path ${rule.path}`);
            // log.Error(`Key ${key} resolved to an empty value for path ${rule.path}`)
            // errored = true;
            // return;
        }
        path = path.replaceAll(key, value);
      } catch (err) {
        throw new Error(`Error resolving token ${key} for path ${rule.path}: ${err}`);  
      }
  });

  return path;
}

function runSceneRule(rename) {
  return (rule) => {
      let filter = { ...rule.filter }
      
      // TODO - batch this

      const result = findScenes({
          filter: {
              per_page: 100,
              sort: 'id'
          },
          scene_filter: {
              ...filter, 
              file_count: { 
                  modifier: "EQUALS",
                  value: 1
              }
          }
      });
  
      var data = result.findScenes;

      log.Info(`Found ${data.count} scenes`);
      
      data.scenes.forEach((scene) => {
          // ignore scenes that have two files
          if (scene.files.length !== 1) {
              log.Info(`Scene ${scene.id} has ${scene.files.length} files. Ignoring`);
              return;
          }

          const scenePath = scene.files[0].path;

          try {
              var path = getNewScenePath(rule, scene);
          } catch (err) {
              log.Error(`Error processing: ${scenePath}: ${err}`);
              return;
          }

          // if path is the same, skip
          if (path === scenePath) {
              // log.Trace(`Scene ${scenePath} already in correct place`);
              return;
          }

          // TODO - if scene has already been moved, skip

          // if path is already in the correct place, skip
          if (path === scenePath) {
              log.Debug(`Scene ${scenePath} already in correct place`);
              return;
          }

          const dryRun = !rename ? "[DRY RUN]: " : "";
          log.Info(`${dryRun}Moving scene ${scenePath} to ${path}`);

          // move it
          if (!rename) {
            return;
          }

          try {
            moveFiles({
              input: {
                  ids: [scene.files[0].id],
                  destination_folder: dir(path),
                  destination_basename: basename(path)
              }
            });
          } catch (err) {
            log.Error(`Error moving scene ${scenePath} to ${path}: ${err}`);
            return;
          }
      });
  };
}


function main() {
  log.Info("Shelve plugin started: " + JSON.stringify(input.Args));
  var rename = input.Args.rename ?? false;

  var useConfig = input.Args.useConfig;

  if (useConfig) {
    runUsingSceneConfig(rename);
    return { Output: "ok" };
  }

  var rules = input.Args.scene_rules ?? [];
  log.Info(`Running using provided ${rules.length} rules`);

  if (rules.length > 0) {
    runScenes(rules, rename);
  }

  return {
      Output: "ok"
  };

  // if (modeArg !== undefined) {
  //     try {
  //         if (modeArg == "" || modeArg == "add") {
  //             addTag();
  //         } else if (modeArg == "remove") {
  //             removeTag();
  //         } else if (modeArg == "long") {
  //             doLongTask();
  //         } else if (modeArg == "indef") {
  //             doIndefiniteTask();
  //         } else if (modeArg == "hook") {
  //             doHookTask();
  //         }
  //     } catch (err) {
  //         return {
  //             Error: err
  //         };
  //     }

  //     return {
  //         Output: "ok"
  //     };
  // }

  // if (input.Args.error) {
  //     return {
  //         Error: input.Args.error
  //     };
  // }

  // // immediate mode
  // // just return the args
  // return {
  //     Output: input.Args
  // };
}

main();