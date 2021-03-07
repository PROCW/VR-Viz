import React, { Component } from "react";
import "./App.css";
import VRViz from "./Component/Visualization.js";
import mapData from "./mapData/mapData.json";

class App extends Component {
  render() {
    return (
      <VRViz
        scene={{
          sky: {
            style: {
              color: "#ccc",
              texture: false,
            },
          },
          lights: [
            {
              type: "directional",
              color: "#fff",
              position: "0 1 1",
              intensity: 1,
              decay: 1,
            },
            {
              type: "ambient",
              color: "#fff",
              intensity: 1,
              decay: 1,
            },
          ],
          camera: {
            position: "0 0 10",
            rotation: "0 0 0",
          },
          floor: {
            style: {
              color: "#ccc",
              texture: false,
              width: 100,
              depth: 100,
            },
          },
          "3D-objects": [
            {
              objectFile: "/path/to/tree.obj",
              materialFile: "/path/to/tree.mtl",
              objectId: "tree-obj",
              materialId: "tree-mtl",
            },
          ],
        }}
        graph={[
          {
            type: "MapStackedBarChart",
            data: {
              dataFile: "data/mapStackedBarChart.csv",
              fileType: "csv",
              fieldDesc: [
                ["latitude", "number"],
                ["longitude", "number"],
                ["value", "number"],
                ["value1", "number"],
              ],
            },
            style: {
              origin: [0, 0, 0],
            },
            mark: {
              mapScale: 20,
              mapOrigin: [5, 5],
              rotation: "-90 0 0",
              map: {
                data: mapData,
                projection: "Mercator",
                shapeIdentifier: "id",
                shapeKey: "countries",
                style: {
                  extrusion: {
                    value: 0.0000001,
                  },
                  fill: {
                    opacity: 1,
                    color: "red",
                  },
                  stroke: {
                    width: 1,
                    color: "black",
                  },
                },
              },
              bars: {
                type: "box",
                style: {
                  depth: 0.2,
                  width: 0.2,
                  height: {
                    scaleType: "linear",
                    field: ["value", "value1"],
                    value: [0, 5],
                  },
                  fill: {
                    opacity: 0.9,
                    scaleType: "ordinal",
                    color: ["green", "blue"],
                    field: ["value", "value1"],
                  },
                },
                mouseOver: {
                  focusedObject: {
                    opacity: 1,
                    fill: "#333",
                  },
                  nonFocusedObject: {
                    opacity: 0.1,
                  },
                  label: {
                    value: (d) => `Label:LabelValue`,
                    align: "center",
                    fontSize: 1,
                    backgroundColor: "#333",
                    backgroundOpacity: 1,
                    fontColor: "#fff",
                  },
                },
              },
            },
          },
        ]}
      />
    );
  }
}

export default App;
