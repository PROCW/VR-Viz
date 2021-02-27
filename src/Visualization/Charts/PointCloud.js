import React from "react";
import * as d3 from "d3";
import GetDomain from "../../utils/GetDomain";
import Shape from "../Components/Shape";

const PointCloud = (props) => {
  if (!props.data || !props.graphSettings.style || !props.graphSettings.mark) {
    console.error(
      `Error: Some necessary attributes missing for ${props.graphSettings.type}`
    );
    return null;
  }

  const colorDomain = props.graphSettings.mark.style.fill.scaleType
    ? props.graphSettings.mark.style.fill.domain
      ? props.graphSettings.mark.style.fill.domain
      : GetDomain(
          props.data,
          props.graphSettings.mark.style.fill.field,
          props.graphSettings.mark.style.fill.scaleType,
          props.graphSettings.mark.style.fill.startFromZero
        )
    : null;

  const colorRange = props.graphSettings.mark.style.fill.color
    ? props.graphSettings.mark.style.fill.color
    : d3.schemeCategory10;

  const colorScale = props.graphSettings.mark.style.fill.scaleType
    ? props.graphSettings.mark.style.fill.scaleType === "ordinal"
      ? d3.scaleOrdinal().domain(colorDomain).range(colorRange)
      : d3.scaleLinear().domain(colorDomain).range(colorRange)
    : null;

  //Adding marks
  const marks = props.data.map((d, i) => {
    const color =
      d.r && d.g && d.b
        ? `rgb(${d.r},${d.g},${d.b})`
        : colorScale
        ? colorScale(d[props.graphSettings.mark.style.fill.field])
        : props.graphSettings.mark.style.fill.color
        ? props.graphSettings.mark.style.fill.color
        : "#000000";

    const radius = props.graphSettings.mark.style.radius
      ? props.graphSettings.mark.style.radius
      : 5;

    const hoverText = props.graphSettings.mark.mouseOver?.label
      ? props.graphSettings.mark.mouseOver.label.value(d)
      : null;

    return (
      <Shape
        key={i}
        type={
          props.graphSettings.mark.type
            ? props.graphSettings.mark.type
            : "sphere"
        }
        color={`${color}`}
        opacity={
          props.graphSettings.mark.style.fill.opacity
            ? props.graphSettings.mark.style.fill.opacity
            : 1
        }
        depth={`${radius}`}
        height={`${radius}`}
        width={`${radius}`}
        radius={`${radius}`}
        segments={
          props.graphSettings.mark.style.segments
            ? `${props.graphSettings.mark.style.segments}`
            : "16"
        }
        position={`${d.x * props.graphSettings.style.objectScale} ${
          d.y * props.graphSettings.style.objectScale
        } ${d.z * props.graphSettings.style.objectScale}`}
        hover={props.graphSettings.mark.mouseOver}
        hoverText={hoverText}
        graphID={props.graphID}
      />
    );
  });

  return <>{marks}</>;
};

export default PointCloud;
