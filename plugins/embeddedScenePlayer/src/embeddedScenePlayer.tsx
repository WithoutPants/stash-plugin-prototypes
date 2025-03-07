interface IPluginApi {
  React: typeof React;
  GQL: any;
  Event: {
    addEventListener: (event: string, callback: (e: CustomEvent) => void) => void;
  };
  libraries: {
    ReactRouterDOM: {
      Link: React.FC<any>;
      Route: React.FC<any>;
      NavLink: React.FC<any>;
    },
    Bootstrap: {
      Button: React.FC<any>;
      Nav: React.FC<any> & {
        Link: React.FC<any>;
      };
    },
    FontAwesomeSolid: {
      faEthernet: any;
    },
    Intl: {
      FormattedMessage: React.FC<any>;
    }
  },
  loadableComponents: any;
  components: Record<string, React.FC<any>>;
  utils: {
    NavUtils: any;
    loadComponents: any;
    StashService: any;
  },
  hooks: any;
  patch: {
    before: (target: string, fn: Function) => void;
    instead: (target: string, fn: Function) => void;
    after: (target: string, fn: Function) => void;
  },
  register: {
    route: (path: string, component: React.FC<any>) => void;
  }
}

function urlEmbeddable(url: string, embeddable: string[]) {
  return embeddable.some((u) => url.indexOf(u) !== -1);
}

// from generated-graphql.ts
interface SceneDataFragment { 
  urls: Array<string>,
  files: Array<unknown>,
}

function parseEmbeddableURLs(urls: string) {
  try {
    const ret = JSON.parse(urls);
    if (!Array.isArray(ret)) {
      console.error("Invalid embeddable URLs configuration, expected array");
      return [];
    }
    return ret;
  } catch (e) {
    console.error("Error parsing embeddable URLs", e);
    return [];
  }
}

(function () {
  const PluginApi = (window as any).PluginApi as IPluginApi;
  const React = PluginApi.React;

  PluginApi.patch.instead("ScenePlayer", function (props: any, _: any, original: any) {
    const { data, error, loading } = PluginApi.utils.StashService.useConfiguration();
    
    const scene: SceneDataFragment = props.scene;

    if (loading || error) {
      return <></>;
    }

    const embeddableURLsString = data.configuration.plugins?.embeddedScenePlayer?.urls ?? [];
    // turn it into an array
    const embeddableURLs = React.useMemo(() => parseEmbeddableURLs(embeddableURLsString), [embeddableURLsString]);

    // TODO - provide defaults

    if (scene.files.length > 0) {
      // use default player
      return original(props);
    }

    // check if any of the URLs are embeddable
    // TODO make this configurable
    const embeddableURL = React.useMemo(() => {
      return scene.urls.find((u) => urlEmbeddable(u, embeddableURLs));
    }, [scene.urls]);

    if (embeddableURL) {
      return (
        <div className="scene-player-embedded-container">
          <iframe className="scene-player-embedded" src={embeddableURL} allowFullScreen />
        </div>
      );
    }

    return original(props);
  });
})();