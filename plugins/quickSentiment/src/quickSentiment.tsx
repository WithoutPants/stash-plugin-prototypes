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
      faHeart: any;
      faClock: any;
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

(function () {
  const PluginApi = (window as any).PluginApi as IPluginApi;
  const React = PluginApi.React;
  const { Button } = PluginApi.libraries.Bootstrap;
  const { faHeart, faClock } = PluginApi.libraries.FontAwesomeSolid;
  const { Icon } = PluginApi.components;

  function useToggleTag() {
    const [updateScene] = PluginApi.utils.StashService.useSceneUpdate();

    const toggleTag = React.useCallback((scene: any, tagName: string) => {
      // find favourite tag in scene tags
      const favoriteTag = scene.tags.find((tag: any) => tag.id === tagName);
      let tags = scene.tags.map((tag: any) => tag.id);
      if (favoriteTag) {
        // remove tag
        tags = tags.filter((id: string) => id !== tagName);
      } else {
        // we have to find 
        // add tag
        tags.push(tagName);
      }

      // update scene
      updateScene({
        variables: {
          input: {
            id: scene.id,
            tag_ids: tags,
          },
        },
      });
    }, [updateScene]);

    return toggleTag;
  }

  const FavoriteIcon: React.FC<{
    value: boolean;
    onToggle: (v: boolean) => void;
  }> = ({ value: favorite, onToggle: onToggleFavorite }) => {
    return (
      <Button
        className={`minimal favorite-button ${favorite ? "favorite" : "not-favorite"} `}
        onClick={() => onToggleFavorite!(!favorite)}
      >
        <Icon icon={faHeart} />
      </Button>
    );
  };

  const WatchLaterIcon: React.FC<{
    value: boolean;
    onToggle: (v: boolean) => void;
  }> = ({ value: favorite, onToggle: onToggleFavorite }) => {
    return (
      <Button
        className={`minimal favorite-button ${favorite ? "watch-later" : "not-favorite"} `}
        onClick={() => onToggleFavorite!(!favorite)}
      >
        <Icon icon={faClock} />
      </Button>
    );
  };

  const Overlays: React.FC<{
    scene: any;
  }> = ({ scene }) => {
    const { data } = PluginApi.utils.StashService.useConfiguration();
    const favoriteTag = data.configuration.plugins?.quickSentiment?.favouriteTag ?? "";
    const watchLaterTag = data.configuration.plugins?.quickSentiment?.watchLaterTag ?? "";

    const toggleTag = useToggleTag();

    const favorite = React.useMemo(() => {
      return scene?.tags.some((tag: any) => tag.id === favoriteTag);
    }, [scene, favoriteTag]);

    const watchLater = React.useMemo(() => {
      return scene?.tags.some((tag: any) => tag.id === watchLaterTag);
    }, [scene, watchLaterTag]);

    return (
      <span className="plugin-quick-sentiment">
        {favoriteTag && <FavoriteIcon value={favorite} onToggle={(v) => toggleTag(scene, favoriteTag)} />}
        {watchLaterTag && <WatchLaterIcon value={watchLater} onToggle={(v) => toggleTag(scene, watchLaterTag)} />}
      </span>
    );
  };
  
  PluginApi.patch.instead("SceneCard.Overlays", function (props: any, _: any, Original: any) {
    const scene = props.scene;

    return (
      <>
      <Original {...props} />
      <Overlays scene={scene} />
      </>
    );
  });
})();