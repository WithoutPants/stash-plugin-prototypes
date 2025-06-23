import { ShelvePage } from "@/components/ShelvePage";
import "./styles.scss";

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "react-bootstrap";

const { PluginApi } = window;
const { Setting } = PluginApi.components;

PluginApi.register.route("/plugin/shelve", ShelvePage);

PluginApi.patch.before("SettingsToolsSection", function (props: any) {
  const {
    Setting,
  } = PluginApi.components;

  return [
    {
      children: (
        <>
          {props.children}
          <Setting
            heading={
              <Link to="/plugin/shelve">
                <Button>
                  Shelve
                </Button>
              </Link>
            }
          />
        </>
      ),
    },
  ];
});