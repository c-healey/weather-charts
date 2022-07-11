import * as d3 from "d3";
import Chart from "./Chart/Chart";
import Gradient from "./Chart/Gradient";
import { useChartDimensions, useUniqueId } from "./Chart/utils";
import Circles from "./Chart/Circles";
import Axis from "./Chart/Axis";
import Bars from "./Chart/Bars";
import Line from "./Chart/Line";
import Text from "./Chart/Text";

const Humidity = ({ data, lineData, xAccessor, yAccessor }) => {
  const [ref, dimensions] = useChartDimensions({
    width: window.innerWidth * 0.9,
    height: 400,
    marginBottom: 40,
    marginLeft: 80,
  });

  const dateParser = d3.timeParse("%Y-%m-%d");
  //   const dateFormatter = d3.timeFormat("%Y-%m-%d");
  const gradientId = useUniqueId("Humidity-gradient");
  const gradientColors = ["#34495e", "#c8d6e5", "#34495e"];

  // 4. Create scales

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(data, yAccessor))
    .range([dimensions.boundedHeight, 0])
    .nice(5);

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(data, xAccessor))
    .range([0, dimensions.boundedWidth]);

  // draw the line
  //   const areaGenerator = d3
  //     .area()
  //     .x((d) => xScale(xAccessor(d)))
  //     .y0(dimensions.boundedHeight / 2)
  //     .y1((d) => yScale(yAccessor(d)))
  //     .curve(d3.curveBasis);

  const lineGenerator = d3
    .area()
    .x((d) => xScale(xAccessor(d)))
    .y((d) => yScale(yAccessor(d)))
    .curve(d3.curveBasis);

  const keyAccessor = (d, i) => i;

  //   Seasonal rects
  const seasonBoundaries = ["3-20", "6-21", "9-21", "12-21"];
  const seasonNames = ["Spring", "Summer", "Fall", "Winter"];

  let seasonsData = [];
  const startDate = xAccessor(data[0]);
  const endDate = xAccessor(data[data.length - 1]);
  const years = d3.timeYears(d3.timeMonth.offset(startDate, -13), endDate);
  years.forEach((yearDate) => {
    const year = +d3.timeFormat("%Y")(yearDate);
    seasonBoundaries.forEach((boundary, index) => {
      const seasonStart = dateParser(`${year}-${boundary}`);
      const seasonEnd = seasonBoundaries[index + 1]
        ? dateParser(`${year}-${seasonBoundaries[index + 1]}`)
        : dateParser(`${year + 1}-${seasonBoundaries[0]}`);
      const boundaryStart = d3.max([startDate, seasonStart]);
      const boundaryEnd = d3.min([endDate, seasonEnd]);
      const days = data.filter(
        (d) => xAccessor(d) > boundaryStart && xAccessor(d) <= boundaryEnd
      );
      if (!days.length) return;
      seasonsData.push({
        start: boundaryStart,
        end: boundaryEnd,
        name: seasonNames[index],
        mean: d3.mean(days, yAccessor),
      });
    });
  });

  const seasonOffset = 10;

  //   const seasonXScale = d3
  //     .scaleBand()
  //     .domain(seasonNames)
  //     .range([0, dimensions.boundedWidth]);
  return (
    <div className="Humidity Timeline" ref={ref}>
      <Chart dimensions={dimensions}>
        <defs>
          <Gradient id={gradientId} colors={gradientColors} x2="0" y2="100%" />
        </defs>

        <Axis
          dimensions={dimensions}
          dimension="y"
          scale={yScale}
          //   numberofticks={3}
        />
        {/* <Axis
          dimensions={dimensions}
          dimension="x"
          scale={seasonXScale}
          label={"Seasons"}
          className={"season-label"}
          //   font-size={"1.1em"}
        /> */}
        {seasonsData.map((d, i) => (
          <Text
            text={d.name}
            x={(d) => xScale(d.start) + (xScale(d.end) - xScale(d.start)) / 2}
            y={dimensions.boundedHeight + 30}
            className={"season-label"}
          />
        ))}
        <path className="line" d={lineGenerator(lineData)} />
        {/* <path
          className="area"
          d={areaGenerator(lineData)}
          style={{ fill: ` url(#${gradientId})` }}
        /> */}
        <Circles
          data={data}
          keyAccessor={keyAccessor}
          xAccessor={(d) => xScale(xAccessor(d))}
          yAccessor={(d) => yScale(yAccessor(d))}
          className="dot"
        />
        <Bars
          data={seasonsData}
          keyAccessor={keyAccessor}
          xAccessor={(d) => xScale(d.start)}
          yAccessor={() => seasonOffset}
          widthAccessor={(d) => xScale(d.end) - xScale(d.start)}
          heightAccessor={() => dimensions.boundedHeight - seasonOffset}
          className={(d) => `season ${d.name}`}
        />
        <Line
          className={"season-mean"}
          data={seasonsData}
          startX={(d) => xScale(d.start)}
          endX={(d) => xScale(d.end)}
          startY={(d) => yScale(d.mean)}
          endY={(d) => yScale(d.mean)}
        />
        <Text
          text={"Season mean"}
          x={-15}
          y={yScale(seasonsData[0].mean)}
          className={"season-mean-label"}
        />
        <Text
          text="relative humidity"
          y={5.5}
          className="y-axis-label y-axis-label-suffix"
        />
      </Chart>
    </div>
  );
};

export default Humidity;
