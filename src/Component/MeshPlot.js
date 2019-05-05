import React, { Component } from 'react';
import * as d3 from 'd3';
import * as moment from 'moment';

import GetDomain from '../Utils/GetDomain.js';
import ReadPLY from '../Utils/ReadPLY.js';
import Axis from './Axis.js';
import AxisBox from './AxisBox.js';

import { csv } from 'd3-request';
import { json } from 'd3-request';
import { text } from 'd3-request';

class MeshPlot extends Component {
  constructor(props) {
    super(props)
    this.state = {
    }
  }


  startAnimation = () => {
      d3.select(`#${this.props.index}`)
        .transition()
        .duration(this.props.animateRotation.duration)
        .ease(d3.easeLinear)
        .attrTween("rotation", () => d3.interpolate(`${this.props.animateRotation.initialAngles[0]} ${this.props.animateRotation.initialAngles[1]} ${this.props.animateRotation.initialAngles[2]}`, `${this.props.animateRotation.finalAngles[0]} ${this.props.animateRotation.finalAngles[1]} ${this.props.animateRotation.finalAngles[2]}`));
  }
  componentDidUpdate(){
    if(this.state.data){
      if(this.props.animateRotation) {
        this.startAnimation();
        window.setInterval(this.startAnimation, this.props.animateRotation.duration);
      }
    }
  }


  componentWillMount() {
    if (this.props.data) {
      switch (this.props.data.fileType) {
        case 'json': {
          json(this.props.data.dataFile, (error, data) => {

            if (error) {
              this.setState({
                error: true,
              });
            } else {
              this.setState({
                data: data,
              });
            }
          });
          break;
        }
        case 'csv': {
          csv(this.props.data.dataFile, (error, data) => {
            data = data.map(d => {
              for (let i = 0; i < this.props.data.fieldDesc.length; i++) {
                if (this.props.data.fieldDesc[i][1] === 'number')
                  d[this.props.data.fieldDesc[i][0]] = +d[this.props.data.fieldDesc[i][0]]
                if ((this.props.data.fieldDesc[i][1] === 'date') || (this.props.data.fieldDesc[i][1] === 'time'))
                  d[this.props.data.fieldDesc[i][0]] = moment(d[this.props.data.fieldDesc[i][0]], this.props.data.fieldDesc[i][2])['_d']
                if (this.props.data.fieldDesc[i][1] === 'jsonObject')
                  d[this.props.data.fieldDesc[i][0]] = JSON.parse(d[this.props.data.fieldDesc[i][0]])
              }
              return d
            })
            if (error) {
              this.setState({
                error: true,
              });
            } else {
              this.setState({
                data: data,
              });
            }
          });
          break;
        }
        case 'ply': {
          let data = ReadPLY(this.props.data.dataFile);
          this.setState({
            data: data,
          })
          break;
        }
        case 'text': {
          text(this.props.data.dataFile, (error, text) => {

            let data = d3.csvParseRows(text).map(function (row) {
              return row.map(function (value) {
                return +value;
              });
            });
            if (error) {
              this.setState({
                error: true,
              });
            } else {
              this.setState({
                data: data,
              });
            }
          });
          break;
        }
        default: {
          let data = this.props.data.dataFile
          this.setState({
            data: data,
          });
          break;
        }
      }
    } else {
      this.setState({
        data: 'NA',
      });
    }
  }

  render() {
    if (!this.state.data) {
      return <a-entity />
    }
    else {

      // Getting domain for axis
      let xDomain, yDomain, zDomain, xDomainTemp;
      if (this.props.mark.position.x) {
        if (this.props.mark.position.x.scaleType === 'linear') {
          if (!this.props.mark.position.x.domain) {
            xDomainTemp = this.state.data.map((d, i) => parseFloat(d[this.props.mark.position.x.field]));
            xDomain = [Math.min(...xDomainTemp), Math.max(...xDomainTemp)];
          } else {
            xDomain = this.props.mark.position.x.domain;
            xDomainTemp = this.props.mark.position.x.domain;
          }

        }
        else{
          xDomain = GetDomain(this.state.data, this.props.mark.position.x.field, this.props.mark.position.x.scaleType, this.props.mark.position.x.startFromZero)
          xDomainTemp = GetDomain(this.state.data, this.props.mark.position.x.field, this.props.mark.position.x.scaleType, this.props.mark.position.x.startFromZero)
        }
      }
      if (this.props.mark.position.z) {
        if (!this.props.mark.position.z.domain) {
          zDomain = [];
          Object.keys(this.state.data[0]).forEach((d,i) => {
            if(d !== this.props.mark.position.x.field){
              zDomain.push(d)
            }
          })
        } 
        else
          zDomain = this.props.mark.position.z.domain
      }

      if (this.props.mark.position.y) {
        if (!this.props.mark.position.y.domain) {
          let min = 9999999999999999, max = -99999999999999999;
          for (let k = 0; k < zDomain.length; k++) {
            for (let i = 0; i < this.state.data.length; i++) {
              if (min > this.state.data[i][zDomain[k]]) {
                min = this.state.data[i][zDomain[k]]
              }
              if (max < this.state.data[i][zDomain[k]])
                max = this.state.data[i][zDomain[k]]
            }
          }
          if (this.props.mark.position.y.startFromZero)
            yDomain = [0, max]
          else
            yDomain = [min, max]
        } else
          yDomain = this.props.mark.position.y.domain
      }
      //Adding Scale
      let zRange = [];
      for (let i = 0; i < zDomain.length; i++) {
        zRange.push(i * this.props.style.dimensions.depth / (zDomain.length - 1))
      }
      let xRange = [];
      for (let i = 0; i < xDomain.length; i++) {
        xRange.push(i * this.props.style.dimensions.width / (xDomain.length - 1))
      }

      let xScale, yScale, zScale, colorScale;

      if (this.props.mark.position.x.scaleType === 'ordinal')
        xScale = d3.scaleOrdinal()
          .range(xRange)
          .domain(xDomain);
      else
        xScale = d3.scaleLinear()
          .range([0, this.props.style.dimensions.width])
          .domain(xDomain);
      yScale = d3.scaleLinear()
        .domain(yDomain)
        .range([0, this.props.style.dimensions.height])

      if (this.props.mark.position.z.scaleType === 'ordinal')
        zScale = d3.scaleOrdinal()
          .domain(zDomain)
          .range(zRange);
      else
        zScale = d3.scaleLinear()
          .domain(zDomain)
          .range([0, this.props.style.dimensions.depth]);

      //Data Manipulation

      let dataCoordinate = [];

      for (let i = 0; i < this.state.data.length - 1; i++) {
        for (let j = 0; j < zDomain.length - 1; j++) {
          let tempData = [];
          tempData.push(this.state.data[i][this.props.mark.position.x.field]);
          tempData.push(this.state.data[i][zDomain[j]]);
          tempData.push(zDomain[j]);

          tempData.push(this.state.data[i+1][this.props.mark.position.x.field]);
          tempData.push(this.state.data[i+1][zDomain[j]]);
          tempData.push(zDomain[j]);

          
          tempData.push(this.state.data[i+1][this.props.mark.position.x.field]);
          tempData.push(this.state.data[i+1][zDomain[j+1]]);
          tempData.push(zDomain[j+1]);

          tempData.push(this.state.data[i][this.props.mark.position.x.field]);
          tempData.push(this.state.data[i][zDomain[j+1]]);
          tempData.push(zDomain[j+1]);
          /*
          if (this.props.mark.surface.style.fill.function)
            tempData.push(this.props.mark.surface.style.fill.function(i, j))
            */
          dataCoordinate.push(tempData);
        }
      }

      //Color Scale
      if (this.props.mark.style.fill.scaleType){
        let colorRange = d3.schemeCategory10;
        if (this.props.mark.style.fill.color)
          colorRange = this.props.mark.style.fill.color
        if (this.props.mark.style.fill.domain)
          colorScale = d3.scaleLinear()
            .domain(this.props.mark.style.fill.domain)
            .range(colorRange)
        else
          colorScale = d3.scaleLinear()
            .domain([d3.min(dataCoordinate, d => d[this.props.mark.style.fill.axis]), d3.max(dataCoordinate, d => d[this.props.mark.style.fill.axis])])
            .range(colorRange)
      }

      //Axis
      let xAxis, yAxis, zAxis;

      if (this.props.xAxis) {
        xAxis = <Axis
          domain={xDomain}
          tick={this.props.xAxis.ticks}
          scale={xScale}
          axis={'x'}
          orient={this.props.xAxis.orient}
          title={this.props.xAxis.title}
          dimensions={this.props.style.dimensions}
          scaleType={this.props.mark.position.x.scaleType}
          grid={this.props.xAxis.grid}
        />
      }

      if (this.props.yAxis) {
        yAxis = <Axis
          domain={yScale.ticks(this.props.yAxis.ticks['noOfTicks'])}
          tick={this.props.yAxis.ticks}
          scale={yScale}
          axis={'y'}
          orient={this.props.yAxis.orient}
          title={this.props.yAxis.title}
          dimensions={this.props.style.dimensions}
          scaleType={this.props.mark.position.y.scaleType}
          grid={this.props.yAxis.grid}
        />
      }

      if (this.props.zAxis) {
        zAxis = <Axis
          domain={zDomain}
          tick={this.props.zAxis.ticks}
          scale={zScale}
          axis={'z'}
          orient={this.props.zAxis.orient}
          title={this.props.zAxis.title}
          dimensions={this.props.style.dimensions}
          scaleType={this.props.mark.position.z.scaleType}
          grid={this.props.zAxis.grid}
        />

      }

      let box;
      if (this.props.axisBox) {
        box = <AxisBox
          width={this.props.style.dimensions.width}
          height={this.props.style.dimensions.height}
          depth={this.props.style.dimensions.depth}
          color={this.props.axisBox.color}
        />
      }

      //Adding marks
      let marks;
      console.log(dataCoordinate)
      
      if (this.props.mark.style.stroke) {
        if (this.props.mark.style.fill.scaleType)
          marks = dataCoordinate.map((d, i) => <a-entity key={`${this.props.index}_Mark${i}`} plane-from-vertices={`path:${xScale(d[0])} ${yScale(d[1])} ${zScale(d[2])}, ${xScale(d[3])} ${yScale(d[4])} ${zScale(d[5])}, ${xScale(d[6])} ${yScale(d[7])} ${zScale(d[8])}, ${xScale(d[9])} ${yScale(d[10])} ${zScale(d[11])}, ${xScale(d[0])} ${yScale(d[1])} ${zScale(d[2])};face:true;faceColor: ${colorScale(d[this.props.mark.style.fill.axis])};faceOpacity: ${this.props.mark.style.fill.opacity};stroke:true;strokeWidth:${this.props.mark.style.stroke.width};strokeColor:${this.props.mark.style.stroke.color}`} />);
        else
          marks = dataCoordinate.map((d, i) => <a-entity key={`${this.props.index}_Mark${i}`} plane-from-vertices={`path:${xScale(d[0])} ${yScale(d[1])} ${zScale(d[2])}, ${xScale(d[3])} ${yScale(d[4])} ${zScale(d[5])}, ${xScale(d[6])} ${yScale(d[7])} ${zScale(d[8])}, ${xScale(d[9])} ${yScale(d[10])} ${zScale(d[11])}, ${xScale(d[0])} ${yScale(d[1])} ${zScale(d[2])};face:true;faceColor: ${this.props.mark.style.fill.color};faceOpacity: ${this.props.mark.style.fill.opacity};stroke:true;strokeWidth:${this.props.mark.style.stroke.width};strokeColor:${this.props.mark.style.stroke.color}`} />);
      }
      else {
        if (this.props.mark.style.fill.scaleType)
          marks = dataCoordinate.map((d, i) => <a-entity key={`${this.props.index}_Mark${i}`} plane-from-vertices={`path:${xScale(d[0])} ${yScale(d[1])} ${zScale(d[2])}, ${xScale(d[3])} ${yScale(d[4])} ${zScale(d[5])}, ${xScale(d[6])} ${yScale(d[7])} ${zScale(d[8])}, ${xScale(d[9])} ${yScale(d[10])} ${zScale(d[11])}, ${xScale(d[0])} ${yScale(d[1])} ${zScale(d[2])};face:true;faceColor: ${colorScale(d[this.props.mark.style.fill.axis])};faceOpacity: ${this.props.mark.style.fill.opacity};stroke:false`} />);
        else
          marks = dataCoordinate.map((d, i) => <a-entity key={`${this.props.index}_Mark${i}`} plane-from-vertices={`path:${xScale(d[0])} ${yScale(d[1])} ${zScale(d[2])}, ${xScale(d[3])} ${yScale(d[4])} ${zScale(d[5])}, ${xScale(d[6])} ${yScale(d[7])} ${zScale(d[8])}, ${xScale(d[9])} ${yScale(d[10])} ${zScale(d[11])}, ${xScale(d[0])} ${yScale(d[1])} ${zScale(d[2])};face:true;faceColor: ${this.props.mark.style.fill.color};faceOpacity: ${this.props.mark.style.fill.opacity};stroke:false`} />);
      }
      let graphTitle
      if (this.props.title) {
        graphTitle = <a-text color={this.props.title.color} wrapCount={this.props.title.wrapCount} lineHeight={this.props.title.lineHeight} width={this.props.title.width} value={this.props.title.value} anchor='align' side='double' align={this.props.title.align} position={this.props.title.position} rotation={this.props.title.rotation} billboard={this.props.title.billboarding} />
      }
      let pivot
      if(this.props.style.pivot)
        pivot = this.props.style.pivot;
      else
        pivot = `0 0 0`
      return (
        <a-entity pivot={pivot} position={`${this.props.style.origin[0]} ${this.props.style.origin[1]} ${this.props.style.origin[2]}`} rotation={this.props.style.rotation} id={this.props.index}>
          {xAxis}
          {yAxis}
          {zAxis}
          {graphTitle}
          {box}
          {marks}
        </a-entity>
      )
    }
  }
}
export default MeshPlot