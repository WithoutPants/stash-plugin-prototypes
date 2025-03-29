function run(dry) {
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

  rules.forEach(runRule(dry));
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

function getNewScenePath(rule, scene) {
  var path = rule.path;
  var basename = scene.files[0].path.split('/').pop();
  path = path.replace('{basename}', basename);

  var tokenStrings = getTokens(path);
  tokenStrings.forEach((key) => {
      var token = key.substring(1, key.length - 1);
      var value = resolveToken(scene, token);
      if (!value) {
          throw new Error(`Key ${token} resolved to an empty value for path ${rule.path}`);
          // log.Error(`Key ${key} resolved to an empty value for path ${rule.path}`)
          // errored = true;
          // return;
      }
      path = path.replace(key, value);
  });

  return path;
}

function runRule(dry) {
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

          const dryRun = dry ? "[DRY RUN]: " : "";
          log.Info(`${dryRun}Moving scene ${scenePath} to ${path}`);

          // TODO - move it
      });
  };
}


function main() {
  var dry = input.Args.dry;

  run(dry);

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