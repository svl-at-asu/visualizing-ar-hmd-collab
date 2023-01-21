// JavaScript source code

// Import D3
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";


// ================= CONSTANTS =================

// Define the program constants.
const team_number = 4;
const trial_number = 2;
const numTeams = 6;
const numTrialsPerTeam = 12;
const thresholdAngle = 43.3;

// Set the dimensions of the canvas / graph
var margin = { top: 50, right: 50, bottom: 50, left: 50 },
    width = 1000 - margin.left - margin.right,
	height = 600 - margin.top - margin.bottom;

var pos_margin = { top: 50, right: 50, bottom: 50, left: 50 },
	pos_width = 600 - margin.left - margin.right,
	pos_height = 600 - margin.top - margin.bottom;

// Define the color scheme and legend data.
const legendData = [
	{ text: "P1 Angle", color: "steelblue" },
	{ text: "P2 Angle", color: "black" },
	{ text: "Chart Angle", color: "orange" },
	{ text: "Distance", color: "grey" },
	{ text: "Angle Threshold", color: "red" }
];


// =============================================


// ================= VARIABLES =================

// References to the positions on the participant positions charts.
var p1_positions;
var p2_positions;
//var trial_time;

// =============================================


// ================= FUNCTIONS =================

// Define function for parsing datetimes.
var parseTime = d3.timeParse("%m/%d/%Y %H:%M:%S %p");
var parseTrialTime = d3.timeParse("%M:%S");

// =============================================


// =================== MAIN ====================

// Read the data.
const positionData = await d3.csv("data/Angles_Team" + team_number + "_Trial" + trial_number + ".csv");

// Format the data (parsing the strings to their appropriate datatypes)
const trial_start = parseTime(positionData[0].time);

positionData.forEach(function (d) {
	//d.time = parseTime(d.time);
	d.time = getPositionSeconds(d.time, trial_start);
	d.p1_angle = Number(d.p1_angle);
	d.p2_angle = Number(d.p2_angle);
	d.distance = Number(d.distance);
});

// Set the time scale for the x axis and linear scale for the y axis.
const xScale = d3.scaleLinear()
					.range([0, width])
					.domain(d3.extent(positionData, function (d) { return d.time; }));
const yScale = d3.scaleLinear().range([height, 0]);

var customXScale = d3.scaleLinear().range([0, width]).domain([0, 120])

// Set the distance scale for the participant distance.
const distScale = d3.scaleLinear().range([height, 0]);

const highlightRanges = [
	//{ id: "Separate Space", range: { start: 25, end: 30, color: "crimson", opacity: 0.2, showOpacity: 1.0, label: "Separate Space" }},
	//{ id: "Mixed Space", range: { start: 87, end: 90, color: "darkgreen", opacity: 0.2, showOpacity: 1.0, label: "Mixed Space" }},
	//{ id: "Same Space", range: { start: 105, end: 110, color: "blue", opacity: 0.2, showOpacity: 1.0, label: "Same Space" } },
	{ id: "Slider", range: { start: 105, end: 110, color: "blue", opacity: 0.2, showOpacity: 1.0, label: "Selection" } },
];

// append the svg obgect to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var anglesSvg = d3.select(".chartContainer").append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform",
		"translate(" + margin.left + "," + margin.top + ")");

// append the svg obgect to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var positionsSvg = d3.select(".chartContainer").append("svg")
	.attr("width", pos_width + pos_margin.left + pos_margin.right)
	.attr("height", pos_height + pos_margin.top + pos_margin.bottom)
	.append("g")
	.attr("transform",
		"translate(" + pos_margin.left + "," + pos_margin.top + ")");

updateCharts(team_number, trial_number, ".chartContainer", highlightRanges);

drawEventLines(team_number, trial_number);

// =============================================


// =============== INPUT HANDLERS ===============

const startSlider = document.getElementById("startTimeSlider");
const endSlider = document.getElementById("endTimeSlider");

startSlider.oninput = function () {
	//console.log("Slider updated to: " + startSlider.value);

	// Update the range of the end slider.
	endSlider.min = startSlider.value;

	// Update the highlight ranges (model/data).
	updateSliderHighlightRange("Slider", startSlider.value, endSlider.value);

	// Update each chart based on the new ranges (view).
	updateTimeHighlight();
	updatePositionHighlight();
}

endSlider.oninput = function () {
	//console.log("Slider updated to: " + startSlider.value);

	// Update the range of the start slider.
	startSlider.max = endSlider.value;

	// Update the highlight ranges (model/data).
	updateSliderHighlightRange("Slider", startSlider.value, endSlider.value);

	// Update each chart based on the new ranges (view).
	updateTimeHighlight();
	updatePositionHighlight();
}


// =============================================


// =========== DRAW CHART FUNCTIONS ============

function updateCharts(teamNum, trialNum, containingDiv, ranges) {

	// Clear the existing charts.
	anglesSvg.selectAll("g").remove();

	drawHighlightChart(teamNum, trialNum, ranges);
	drawPositionHighlightChart(teamNum, trialNum, containingDiv, ranges);
}

function drawHighlightRectangles(chart, ranges) {

	// Append the given ranges to the chart.
	chart.selectAll("rect")
		.attr("class", "highlightRange")
		.data(ranges)
		.enter().append('rect')
		.attr("width", function (d) { return customXScale(d.range.end - d.range.start); })
		.attr("height", height)
		.attr("x", function (d) { return customXScale(d.range.start); })
		.attr("y", 0)
		.style("fill", function (d) { return d.range.color; })
		.style("opacity", function (d) { return d.range.opacity; });
}

function updateTimeHighlight() {
	// Clear the previous rectangles.
	anglesSvg.selectAll(".highlightRange").remove();

	// Update the new rectangles.
	drawHighlightRectangles(anglesSvg, highlightRanges);
}

function drawUserPositions() {

	// Update the positions for participant 1.
	p1_positions
		.attr("fill", function (d) {
			var opacity;
			for (let index in highlightRanges) {
				if (xScale(d.time) >= customXScale(highlightRanges[index].range.start) && xScale(d.time) <= customXScale(highlightRanges[index].range.end)) {
					opacity = highlightRanges[index].range.color;
				}
			};

			return opacity;
		}).style("opacity", function (d, r) {
			var opacity = 0.1;
			for (let index in highlightRanges) {
				if (xScale(d.time) >= customXScale(highlightRanges[index].range.start) && xScale(d.time) <= customXScale(highlightRanges[index].range.end)) {
					opacity = highlightRanges[index].range.showOpacity;
				}
			};

			return opacity;
		});

	// Update the positions for participant 2.
	p2_positions
		.attr("fill", function (d) {
			var opacity;
			for (let index in highlightRanges) {
				if (xScale(d.time) >= customXScale(highlightRanges[index].range.start) && xScale(d.time) <= customXScale(highlightRanges[index].range.end)) {
					opacity = highlightRanges[index].range.color;
				}
			};

			return opacity;
		}).style("opacity", function (d, r) {
			var opacity = 0.1;
			for (let index in highlightRanges) {
				if (xScale(d.time) >= customXScale(highlightRanges[index].range.start) && xScale(d.time) <= customXScale(highlightRanges[index].range.end)) {
					opacity = highlightRanges[index].range.showOpacity;
				}
			};

			return opacity;
		});
}

function updatePositionHighlight() {
	drawUserPositions();
}

async function drawHighlightChart(teamNum, trialNum, ranges) {
	
	console.log(positionData[0].time);

	// Set the time scale range based on the data's time range.
	yScale.domain([0, 180]);

	// Set distance scale as a constant 5 meters to represent the maximum of the space.
	distScale.domain([0, 5]);

	// Define the curves.
	const p1_line = d3.line()
		.x((d) => { return xScale(d.time); })
		.y((d) => { return yScale(d.p1_angle); })
	//.curve(d3.curveCardinal);
	const p2_line = d3.line()
		.x((d) => { return xScale(d.time); })
		.y((d) => { return yScale(d.p2_angle); })
	//.curve(d3.curveCardinal);

	const chart_line = d3.line()
		.x((d) => { return xScale(d.time); })
		.y((d) => { return yScale(180 - (d.p2_angle + d.p1_angle)); })
	//.curve(d3.curveCardinal);

	const dist_line = d3.line()
		.x((d) => { return xScale(d.time); })
		.y((d) => { return distScale(d.distance); })
	//.curve(d3.curveCardinal);

	var svgPaths = anglesSvg.append("g");

	svgPaths.append("path").datum(positionData)
		.attr("fill", "none")
		.attr("stroke", legendData[0].color)
		.attr("stroke-linejoin", "round")
		.attr("stroke-linecap", "round")
		.attr("stroke-width", 1.5)
		.attr("d", p1_line);
	svgPaths.append("path").datum(positionData)
		.attr("fill", "none")
		.attr("stroke", legendData[1].color)
		.attr("stroke-linejoin", "round")
		.attr("stroke-linecap", "round")
		.attr("stroke-width", 1.5)
		.attr("d", p2_line);

	svgPaths.append("path").datum(positionData)
		.attr("fill", "none")
		.attr("stroke", legendData[2].color)
		.attr("stroke-linejoin", "round")
		.attr("stroke-linecap", "round")
		.attr("stroke-width", 1.5)
		.style("stroke-dasharray", "3,3")
		.style("opacity", 0.8)
		.attr("d", chart_line);

	svgPaths.append("path").datum(positionData)
		.attr("fill", "none")
		.attr("stroke", legendData[3].color)
		.attr("stroke-linejoin", "round")
		.attr("stroke-linecap", "round")
		.attr("stroke-width", 1.5)
		.style("stroke-dasharray", "3,3")
		.style("opacity", 0.3)
		.attr("d", dist_line);

	// Add the threshold line.
	svgPaths.append("line")
		.attr("class", "y")
		.attr("stroke", legendData[4].color)
		.style("stroke-dasharray", "3,3")
		.style("opacity", 0.5)
		.attr("x1", 0)
		.attr("x2", width)
		.attr("y1", yScale(thresholdAngle))
		.attr("y2", yScale(thresholdAngle));

	var customXScale = d3.scaleLinear().range([0, width]).domain([0, 120])

	// Append the highlight ranges.
	svgPaths.selectAll("rect")
		.attr("class", "highlightRange")
		.data(ranges)
		.enter().append('rect')
		.attr("width", function (d) { return customXScale(d.range.end - d.range.start); })
		.attr("height", height)
		.attr("x", function (d) { return customXScale(d.range.start); })
		.attr("y", 0)
		.style("fill", function (d) { return d.range.color; })
		.style("opacity", function (d) { return d.range.opacity; });

	// Define the x Axis
	const xAxis = d3.axisBottom(customXScale)
	//.ticks(11, ".0s");

	// Add the X Axis
	anglesSvg.append("g")
		.attr("transform", "translate(0," + height + ")")
		.attr("font-family", "Lato")
		.call(xAxis);

	// Add the X Axis Label
	anglesSvg.append("text")
		.attr("font-family", "sans-serif")
		.attr("font-size", 14)
		.attr("font-weight", 700)
		.attr("text-anchor", "middle")
		.attr("x", width / 2)
		.attr("y", height + margin.bottom - 5)
		.text("Time (seconds)");

	// Add the Y Axis
	anglesSvg.append("g")
		.call(d3.axisLeft(yScale));

	// Add the Y Axis Label
	anglesSvg.append("text")
		.attr("font-family", "sans-serif")
		.attr("font-size", 14)
		.attr("font-weight", 700)
		.attr("text-anchor", "middle")
		.attr("x", 0 - (height / 2))
		.attr("y", 10 - margin.left)
		.attr("transform", "rotate(-90)")
		.text("Angle (degrees)");

	// Add the title
	anglesSvg.append("text")
		.attr("font-family", "sans-serif")
		.attr("font-size", 16)
		.attr("font-weight", 700)
		.attr("text-decoration", "underline")
		.attr("text-anchor", "middle")
		.attr("x", width / 2)
		.attr("y", 42 - margin.top)
		.text("Participant Angles: Team " + teamNum + " Trial " + trialNum);

	// Add the legend
	var legend = anglesSvg.append("g")
		.attr("transform", "translate(" + (width - 100) + "," + 25 + ")");

	var legendRect = legend.selectAll('g')
		.data(legendData);

	var legendRectE = legendRect.enter()
		.append("g")
		.attr("transform", function (d, i) {
			return 'translate(0, ' + (i * 20) + ')';
		});

	legendRectE
		.append('rect')
		.attr("width", 15)
		.attr("height", 15)
		.style("fill", function (d) { return d.color; });

	legendRectE
		.append("text")
		.attr("x", 20)
		.attr("y", 10)
		.attr("font-family", "sans-serif")
		.attr("font-size", 11)
		.text(function (d) { return d.text; });
}

async function drawPositionHighlightChart(teamNum, trialNum, containingDiv, ranges) {

	var positionScatterPlotXScale = d3.scaleLinear()
		.range([0, pos_width])
		.domain([-2.5, 2.5]);
	var positionScatterPlotYScale = d3.scaleLinear()
		.range([pos_height, 0])
		.domain([0, 5]);

	p1_positions = positionsSvg.selectAll("dot")
		.data(positionData)
		.enter()
		.append("circle")
		.attr("fill", function (d) {
			var opacity;
			for (let index in highlightRanges) {
				if (xScale(d.time) >= customXScale(highlightRanges[index].range.start) && xScale(d.time) <= customXScale(highlightRanges[index].range.end)) {
					opacity = highlightRanges[index].range.color;
				}
			};

			return opacity;
		})
		.attr("stroke", "black")
		.attr("r", 5)
		.attr("cx", function (d) { return positionScatterPlotXScale(d.p1_x); })
		.attr("cy", function (d) { return positionScatterPlotYScale(d.p1_y); })
		.style("opacity", function (d, r) {
			var opacity = 0.1;
			for (let index in highlightRanges) {
				if (xScale(d.time) >= customXScale(highlightRanges[index].range.start) && xScale(d.time) <= customXScale(highlightRanges[index].range.end)) {
					opacity = highlightRanges[index].range.showOpacity;
				}
			};

			return opacity;
		});

	p2_positions = positionsSvg.selectAll("rect")
		.data(positionData)
		.enter()
		.append("rect")
		.attr("fill", function (d) {
			var opacity;
			for (let index in highlightRanges) {
				if (xScale(d.time) >= customXScale(highlightRanges[index].range.start) && xScale(d.time) <= customXScale(highlightRanges[index].range.end)) {
					opacity = highlightRanges[index].range.color;
				}
			};

			return opacity;
		})
		.attr("stroke", "black")
		.attr("width", 10)
		.attr("height", 10)
		.attr("x", function (d) { return positionScatterPlotXScale(d.p2_x) - 5; })
		.attr("y", function (d) { return positionScatterPlotYScale(d.p2_y) - 5; })
		.style("opacity", function (d, r) {
			var opacity = 0.1;
			for (let index in highlightRanges) {
				if (xScale(d.time) >= customXScale(highlightRanges[index].range.start) && xScale(d.time) <= customXScale(highlightRanges[index].range.end)) {
					opacity = highlightRanges[index].range.showOpacity;
				}
			};

			return opacity;
		});

	var chart_x = 0.5;
	var chart_y = 2.5;
	var chart_size = positionScatterPlotXScale(-1.5);

	// Append the chart icon.
	positionsSvg.append('rect')
		.attr("width", chart_size)
		.attr("height", chart_size)
		.attr("x", positionScatterPlotXScale(chart_x) - 0.5 * chart_size)
		.attr("y", positionScatterPlotYScale(chart_y) - 0.5 * chart_size)
		.style("fill", "black")
		.style("opacity", 0.2);

	// Add the chart lines.
	positionsSvg.append("line")
		.attr("class", "y")
		.attr("stroke", legendData[3].color)
		.style("stroke-dasharray", "3,3")
		.style("opacity", 0.5)
		.attr("x1", positionScatterPlotXScale(chart_x))
		.attr("x2", positionScatterPlotXScale(chart_x))
		.attr("y1", 0)
		.attr("y2", pos_height);

	positionsSvg.append("line")
		.attr("class", "y")
		.attr("stroke", legendData[3].color)
		.style("stroke-dasharray", "3,3")
		.style("opacity", 0.5)
		.attr("x1", 0)
		.attr("x2", pos_width)
		.attr("y1", positionScatterPlotYScale(chart_y))
		.attr("y2", positionScatterPlotYScale(chart_y));

	// Define the x Axis
	const xAxis = d3.axisBottom(positionScatterPlotXScale)
	//.ticks(11, ".0s");

	// Add the X Axis
	positionsSvg.append("g")
		.attr("transform", "translate(0," + pos_height + ")")
		.attr("font-family", "Lato")
		.call(xAxis);

	// Add the X Axis Label
	positionsSvg.append("text")
		.attr("font-family", "sans-serif")
		.attr("font-size", 14)
		.attr("font-weight", 700)
		.attr("text-anchor", "middle")
		.attr("x", pos_width / 2)
		.attr("y", pos_height + pos_margin.bottom - 5)
		.text("X Position (meters)");

	// Add the Y Axis
	positionsSvg.append("g")
		.call(d3.axisLeft(positionScatterPlotYScale));

	// Add the Y Axis Label
	positionsSvg.append("text")
		.attr("font-family", "sans-serif")
		.attr("font-size", 14)
		.attr("font-weight", 700)
		.attr("text-anchor", "middle")
		.attr("x", 0 - (pos_height / 2))
		.attr("y", 10 - pos_margin.left)
		.attr("transform", "rotate(-90)")
		.text("Y Position (meters)");

	// Add the title
	positionsSvg.append("text")
		.attr("font-family", "sans-serif")
		.attr("font-size", 16)
		.attr("font-weight", 700)
		.attr("text-decoration", "underline")
		.attr("text-anchor", "middle")
		.attr("x", pos_width / 2)
		.attr("y", 42 - pos_margin.top)
		.text("Participant Positions: Team " + teamNum + " Trial " + trialNum);

	// Add the legend
	var legend = positionsSvg.append("g")
		.attr("transform", "translate(" + (pos_width - 100) + "," + 25 + ")");

	var legendRect = legend.selectAll('g')
		.data(highlightRanges);

	var legendRectE = legendRect.enter()
		.append("g")
		.attr("transform", function (d, i) {
			return 'translate(0, ' + (i * 20) + ')';
		});

	legendRectE
		.append('rect')
		.attr("width", 15)
		.attr("height", 15)
		.style("fill", function (d) { return d.range.color; });

	legendRectE
		.append("text")
		.attr("x", 20)
		.attr("y", 10)
		.attr("font-family", "sans-serif")
		.attr("font-size", 11)
		.text(function (d) { return d.range.label; });
}

async function drawEventLines(teamNum, trialNum) {
	//console.log("loading...");
	const data = await d3.csv("data/VideoEncodingEventTable.csv");
	//console.log(data);

	// Format the data (parsing the strings to their appropriate datatypes)
	data.forEach(function (d) {
		d[" Trial Time"] = getTrialSeconds(d[" Trial Time"]);
		//console.log(d);
		d["Team"] = Number(d["Team"]);
		d[" Trial"] = Number(d[" Trial"]);
	});

	var trialData = data.filter(d => { return d["Team"] == teamNum && d[" Trial"] == trialNum; });
	//console.log(trialData);

	//xScale.domain(trial_time);

	// Create the group on the SVG.
	var eventLines = anglesSvg.append("g");

	// Add the event lines.
	eventLines.selectAll("line")
		.data(trialData)
		.enter().append("line")
		.attr("class", "y")
		.attr("stroke", "red")
		.style("opacity", 0.5)
		.attr("x1", function (d) { return xScale(d[" Trial Time"]); })
		.attr("x2", function (d) { return xScale(d[" Trial Time"]); })
		.attr("y1", 0)
		.attr("y2", height);
}

// =============================================


// ============= HELPER FUNCTIONS ==============

function updateSliderHighlightRange(rangeId, startTime, endTime) {
	// Get a reference to the range to update.
	var range = highlightRanges.find(r => { return r.id == rangeId; });

	// Update the start and end time of the given range.
	if (startTime != null) {
		range.range.start = startTime;
	}
	if (endTime != null) {
		range.range.end = endTime;
    }
}

function getPositionSeconds(dateTimeString, trialStart) {
	var dateTime = parseTime(dateTimeString);
	return 60 * (dateTime.getMinutes() - trialStart.getMinutes()) + (dateTime.getSeconds() - trialStart.getSeconds());
}

function getTrialSeconds(dateTimeString) {
	var dateTime = parseTrialTime(dateTimeString);
	return 60 * dateTime.getMinutes() + dateTime.getSeconds();
}

// =============================================