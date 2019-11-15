var minTime, maxTime, minSuccess, maxSuccess;
var tempData; 
var svg, legendSVG;
var currentSuccessRate = 0.0;
var graphPassing = 10, treePassing = 10;
var totalPassPoints, totalFailPoints;
var totalTreePoints, totalGraphPoints;
var totalRect = 0, totalCircle = 0;
formatDecimal = d3.format(".2f");

var formatDateIntoYear = d3.timeFormat("%Y");
var formatDate = d3.timeFormat("%b %Y");
var parseDate = d3.timeParse("%m/%d/%y");
var startDate = new Date("2004-11-01"),
    endDate = new Date("2017-04-01");
var margin = {top:50, right:50, bottom:0, left:50},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;
var svg = d3.select("#vis")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

////////// slider //////////
var moving = false;
var currentValue = 0;
var targetValue = width;
var playButton = d3.select("#play-button");
var x = d3.scaleTime()
    .domain([startDate, endDate])
    .range([0, targetValue])
    .clamp(true);
var slider = svg.append("g")
    .attr("class", "slider")
    .attr("transform", "translate(" + margin.left + "," + height/5 + ")");
slider.append("line")
    .attr("class", "track")
    .attr("x1", x.range()[0])
    .attr("x2", x.range()[1])
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-inset")
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-overlay")
    .call(d3.drag()
        .on("start.interrupt", function() { slider.interrupt(); })
        .on("start drag", function() {
            currentValue = d3.event.x;
            update(x.invert(currentValue));
        })
    );
slider.insert("g", ".track-overlay")
    .attr("class", "ticks")
    .attr("transform", "translate(0," + 18 + ")")
    .selectAll("text")
    .data(x.ticks(10))
    .enter()
    .append("text")
    .attr("x", x)
    .attr("y", 10)
    .attr("text-anchor", "middle")
    .text(function(d) { return formatDateIntoYear(d); });
var handle = slider.insert("circle", ".track-overlay")
    .attr("class", "handle")
    .attr("r", 9);
var label = slider.append("text")
    .attr("class", "label")
    .attr("text-anchor", "middle")
    .text(formatDate(startDate))
    .attr("transform", "translate(0," + (-25) + ")")
////////// plot //////////
playButton
    .on("click", function() {
        var button = d3.select(this);
        if (button.text() == "Pause") {
            moving = false;
            clearInterval(timer);
            // timer = 0;
            button.text("Play");
        } else {
            moving = true;
            timer = setInterval(step, 100);
            button.text("Pause");
        }
        console.log("Slider moving: " + moving);
    });

function prepare(d) {
    d.id = d.id;
    d.date = parseDate(d.date);
    return d;
}

function step() {
    update(x.invert(currentValue));
    currentValue = currentValue + (targetValue/151);
    if (currentValue > targetValue) {
        moving = false;
        currentValue = 0;
        clearInterval(timer);
        // timer = 0;
        playButton.text("Play");
        console.log("Slider moving: " + moving);
    }
}

function update(h) {
    // update position and text of label according to slider scale
    handle.attr("cx", x(h));
    label
        .attr("x", x(h))
        .text(formatDate(h));
}


    // TODO: get below values dynamically svg height and width
    var svgWidth =  700;
    var svgHeight = 600;


    d3.csv("excelData.csv").then(function(data) {  //Get data of all points 

    data.forEach(function(d) {
    d.id = d.ID;
    d.domain = +d.Ontologies;
    d.viz = +d.Visualization;
    d.success = +d.Task_Success;
    d.time = +d.Time_On_Task;
    d.fixation = +d.Fixations;

    });
    
    tempData = data;
    setScales(tempData);
    plotData(tempData);
    
});

 



function plotData(d) {

    var tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltipDiv")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .text("");

var type;

    svg.selectAll(".dot")
        .data(d)
        .enter()
        .append(function(d) {
            if(d.domain == 2)
            {
                type = d.viz == 1 ? "rect" : "circle";
                //console.log(type);
                if(type == "rect")
                {
                    totalRect++;
                }
                else{
                    totalCircle++;
                }
                return document.createElementNS("http://www.w3.org/2000/svg", type);
            }
            type = "ellipse";
            return document.createElementNS("http://www.w3.org/2000/svg", type);
        });

    svg.selectAll("circle")
        .attr("cx", d => xScale(d.time))
        .attr("cy", d => yScale(d.success))
        .attr("r", 5)
        .attr("fill", "red") /////////////////Changed color to red
        .attr("participant", d => d.id)
        .attr("success",d => d.success )
        .attr("time", d => d.time)
        .attr("fill-opacity", 0.8)
        //.attr("class", function(d){
        //    var domain = d.domain == 1 ?  "general" : "expert";
        //    return "tree" + " " + domain;
        //})
        .on('mouseover', function(d, i) {
            msg = "<b>Participant: </b>" + d.id + "<br>" +
                  "<b>Success Rate: </b>" + d.success + "<br>" +
                "<b>Time: </b>" + d.time;
            tooltip.html(msg);
            tooltip.style("visibility", "visible");

            d3.select(this)
                .attr("stroke-width", "3px")
                .attr("stroke", "#3F1414")
                .attr("stroke", "#3F1414");

            var currentParticipant = d3.select(this).attr("participant");
            d3.select("rect[participant='"+currentParticipant+"']")
                .attr("stroke-width", "3px")
                .attr("stroke", "#3F1414");

            d3.select('#details').html(msg);
        })
        .on("mousemove", function(d, i) {
            return tooltip.style("top",
                (d3.event.pageY-10)+"px")
                .style("left",(d3.event.pageX+10)+"px");
        })
        .on('mouseout', function(d, i){
            d3.select(this)
                .attr("stroke-width", "0px");

            var currentParticipant = d3.select(this).attr("participant");
            d3.select("rect[participant='"+currentParticipant+"']")
                .attr("stroke-width", "0px");

            tooltip.style("visibility", "hidden");
            d3.select('#details').html('');
        });

    svg.selectAll("rect")
        .attr("x", d => xScale(d.time))
        .attr("y", d => yScale(d.success))
        .attr("width", 10)
        .attr("height", 10)
        .attr("participant", d => d.id)
        .attr("fill", "green")
        .attr("fill-opacity", 0.5)
        .attr("success",d => d.success )
        .attr("time", d => d.time)
        //.attr("class", function(d){
        //    var domain = d.domain == 1 ?  "general" : "expert";
        //    return "graph" + " " + domain;
        //})
        .on('mouseover', function(d, i) {

            d3.select(this)
                .attr("stroke-width", "3px")
                .attr("stroke", "#3F1414");

            var currentParticipant = d3.select(this).attr("participant");
            d3.select("circle[participant='"+currentParticipant+"']")
                .attr("stroke-width", "3px")
                .attr("stroke", "#3F1414");

            msg = "<b>Participant: </b>" + d.id + "<br>" +
                "<b>Success Rate: </b>" + d.success + "<br>" +
            "<b>Time: </b>" + d.time;
            tooltip.html(msg);
            tooltip.style("visibility", "visible");
            d3.select('#details').html(msg);
        })
        .on("mousemove", function(d, i) {
            return tooltip.style("top",
                (d3.event.pageY-10)+"px")
                .style("left",(d3.event.pageX+10)+"px");
        })
        .on('mouseout', function(d, i){
            d3.select(this)
                .attr("stroke-width", "0px");
            var currentParticipant = d3.select(this).attr("participant");
            d3.select("circle[participant='"+currentParticipant+"']")
                .attr("stroke-width", "0px");

            tooltip.style("visibility", "hidden");
            d3.select('#details').html('');
        });



}

function setScales(data) {

maxSuccess = d3.max(data,function(d) { return d.success; });
minSuccess = d3.min(data,function(d) { return d.success; });

maxTime = d3.max(data,function(d) { return d.time;});

    //Create SVG file for it
    svg = d3.select("#mySvg");

    //Create scale 
    xScale = d3.scaleLinear()
    .domain([0, maxTime])
    .range([20, svgWidth - 50])
    .nice();

    yScale = d3.scaleLinear()
    .domain([1, 0])
    .range([20, svgHeight - 50])
    .nice();

     x_axis = d3.axisBottom()
    .scale(xScale);

    y_axis = d3.axisLeft()
    .scale(yScale);

    svg.append("g")
       .attr("transform", "translate(23, 0)")
       .call(y_axis);

    svg.append("g")
       .attr("transform", "translate(0, "+(560)+")")
       .call(x_axis);
                                          ///////////////////////////////////////////////////////////////////TO DO 
    svg.append("line")          // attach a line                                                          Moveable line 
       .style("stroke", "blue")  // colour the line
        .attr("id", "sLine")
       .attr("x1", 24)     // x position of the first end of the line
       .attr("y1", svgHeight - 50)      // y position of the first end of the line
       .attr("x2", svgWidth - 50)     // x position of the second end of the line
       .attr("y2", svgHeight - 50);

//////////////////////////////////////////////////////////////LEGENDS 
    svg.append("text")
       .attr("x", 200)
       .attr("y", 50)
       .attr("font-family", "sans-serif")
       .attr("font-size", 30)
       .style("fill", "green")
       .text("TREE");

       svg.append("text")
       .attr("x", 300)
       .attr("y", 50)
       .attr("font-family", "sans-serif")
       .attr("font-size", 30)
       .style("fill", "red")
       .text("GRAPH");
////////////////////////////////////////////AXIS//////////////////////////////////////

    svg.append("text")    //For the left side success rate
       .attr("transform", "rotate(-90)")
       .attr("y", svgWidth -710)
       .attr("x",0 - (svgHeight / 2))
       .attr("dy", "1em")
       .style("text-anchor", "middle")
       .text("Success Rate");

    svg.append("text")
       .attr("x", 350)
       .attr("y", 600)
       .attr("font-family", "sans-serif")
       .attr("font-size", 15)
       .html("Time (mins)");
//////////////////////////////////////////////////////////////////////////////////////
}

function successRateUpdated() {
    // get the current value from slider
    var number = document.getElementById("successRate").value;
    currentSuccessRate = (number/5.3) * 0.01;

    var label = document.getElementById("successRateLabel");
    label.innerText = ""+ currentSuccessRate.toFixed(2);

    //console.log("Success rate: " + currentSuccessRate);

    var line = document.getElementById("sLine");
    var updatedY = (svgHeight - 50) - number;
    line.setAttribute("y1", updatedY);
    line.setAttribute("y2", updatedY);

    calculateStatistics();
}

function calculateStatistics() {

    var failTimes = 0;
    var passTimes = 0;

    var passCount = 0;
    var failCount = 0;

    var passFixation = 0;
    var failFixation = 0;

    

    // todo: check circle for graph???
    var graphPassPoints =  d3.selectAll("circle")
        .filter(function(d) { if (d.success >= currentSuccessRate) {passTimes += d.time; passCount += 1; passFixation += d.fixation;  return d;}});

    var treePassPoints =  d3.selectAll("rect")
        .filter(function(d) { if (d.success >= currentSuccessRate) {passTimes += d.time; passCount += 1; passFixation += d.fixation; return d;}});

    var treeFailPoints =  d3.selectAll("rect")
        .filter(function(d) { if (d.success < currentSuccessRate) {failTimes += d.time; failCount += 1; failFixation += d.fixation; return d;}});

    var graphFailPoints =  d3.selectAll("circle")
        .filter(function(d) { if (d.success < currentSuccessRate) {failTimes += d.time; failCount += 1; failFixation += d.fixation; return d;}});

    var treePass = document.getElementById("treePassCount");
    treePass.innerText = treePassPoints.size();

    var treeFail = document.getElementById("treeFailCount");
    treeFail.innerText = treeFailPoints.size();

    var graphPass = document.getElementById("graphPassCount");
    graphPass.innerText = graphPassPoints.size();

    var graphFail = document.getElementById("graphFailCount");
    graphFail.innerText = graphFailPoints.size();
///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var avgSuccess = document.getElementById("avgPassSuccessRate");  //Get the averages success Rate
   var valueAvgP = (graphPassPoints.size() + treePassPoints.size()) / (totalRect + totalCircle);
   
   avgSuccess.innerText =  formatDecimal(valueAvgP);

   var avgFail = document.getElementById("avgFailSuccessRate");     //Get the average fail Rate 
   var valueAvgF = (graphFailPoints.size() + treeFailPoints.size()) / (totalRect + totalCircle);

   avgFail.innerText = formatDecimal(valueAvgF);
//--------------------------------------------------------------------------
  var timePass = document.getElementById("avgPassTime");  //Get average time of the ones that passed 
   var tpComp = passTimes / passCount;

   timePass.innerText = formatDecimal(tpComp);

   var timeFail = document.getElementById("avgFailTime"); //Get average time of the ones that failed 
   var tfComp = failTimes / failCount;

   timeFail.innerText = formatDecimal(tfComp);
//-------------------------------------------------------------------------------------------------------
   var pFix = document.getElementById("avgPassFixation");  //Get average fixation for passing 
   var pfComp = passFixation / passCount;

   pFix.innerText = formatDecimal(pfComp);

   var fFix = document.getElementById("avgFailFixation");  //Get average fixation for fail
   var ffComp = failFixation / failCount;

   fFix.innerText = formatDecimal(ffComp);
   

}

function handlePreloading() {
    calculateStatistics();
}

function playOnto()
{


}