function tickString(hour) {
  var d = new Date(hour*3600*1000);
  var hr = d.getHours();
  var hs = "AM";
  if (hr >= 12) {
    hr -= 12;
    hs = "PM";
  }
  if (hr == 0) hr = 12;
  return (d.getMonth()+1) + "/" +
    d.getDate() + "/" +
    d.getFullYear() + "<br/>" +
    hr + ":00 " + hs;
}

function displayAchievements(achievements) {
  $('#achievements').html("");
  for (var achv_id in achievements) {
    var achv = achievements[achv_id];

    var calories = parseFloat($("#calories").text());
    var achvCalories = achv.calories / 1000;

    var unlocked = "";
    var dateString = "";
    if (achv.unlocked) {
      unlocked = "unlocked";
      var date = new Date(achv.unlocked_at);
      dateString = 'Unlocked on: ' + date.toLocaleDateString() ;
    }


    var plural = achvCalories == 1 ? '' : 's';
    $('#achievements').append('<div class="achievement well ' +
                              unlocked + '">' +
                              achv.name + '<span class="pull-right">' +
                              achvCalories +
                              ' Calorie' + plural + '</span>' +
                              ((achv.unlocked) ? ('<br/>' +
                               '<div class="text-right achievement-date"><small>' + dateString + '</small></div>') : '') + '</div>');
  }
}

function getSeparateClickData(clickArray) {
  var clicks = [];
  for (var i = 1; i < clickArray.length; i++) {
    clicks.push(clickArray[i][1] - clickArray[i-1][1]);
  }
  return clicks;
}

function getCumulativeClickData(clickArray) {
  var clicks = [];
  clickArray.forEach(function (hour) {
    clicks.push(hour[1]);
  });
  return clicks;
}

function createGraph() {
  var cumulative = $('#cumulativeBtn').hasClass('active');

  loadCurrentRange(true, !cumulative, function(results){
    var data = [];
    for (var hour in results.data) {
      data.push([parseInt(hour),results.data[hour]]);
    }
    data.sort(function(x,y){return x[0]-y[0]});
    var ticks = [];
    var clicks = [];

    if (!cumulative) {
      clicks = getSeparateClickData(data);
    } else {
      clicks = getCumulativeClickData(data);
    }

    var separateExtra = (!cumulative) ? 60 : 0;

    $('#graph').highcharts({
      chart: {
        zoomType: 'x'
      },
      title: {
        text: currentRangeText() + " clicks"
      },
      xAxis: {
        type: 'datetime',
        maxZoom: 24 * 3600 * 1000, // 24 hours
        title: {
          text: null
        }
      },
      yAxis: {
        title: {
          text: 'Number of clicks'
        }
      },
      series: [{
        type: 'line',
        data: clicks,
        name: "clicks",
        pointInterval: 3600 * 1000,
        pointStart: (results.start * 60 - new Date().getTimezoneOffset() + separateExtra) * 60 * 1000
      }],
      legend: {
        enabled: false
      },
    });
  });
}

function currentRange(callback) {
  ClickDB._earliestIndex(function(earliestIdx) {
    var range = parseInt($('#rangeBtnGroup > .active').val());
    var maxRange = ClickDB._currentIndex() - earliestIdx;
    if (range == -1) {
      range = maxRange;
    } else {
      range = Math.min(maxRange, range);
    }
    callback(range);
  });
}

function currentRangeText() {
  return $('#rangeBtnGroup > .active').text();
}

/*
 * Loads the current range of values. If extraInBeginning is set to true,
 * an extra value will be set at the beginning for doing things like
 * differences
 */
function loadCurrentRange(cumulative, extraInBeginning, callback) {
  var currIdx = ClickDB._currentIndex();
  currentRange(function(range) {
    var extra = (extraInBeginning) ? 1 : 0;
    ClickDB.loadRange(1, currIdx - (currIdx - range) + 1 + extra, cumulative, function(results) {
      callback(results);
    });
  });
}

function refreshStats() {
  loadCurrentRange(false, false, function(results){
    var totalCount = 0;
    var data = results.data;
    for (var hour in data) {
      totalCount += data[hour];
    }

    $("#count").text(totalCount);
    $("#calories").text((totalCount*1.42/1000).toFixed(3));
  });

  ClickDB.getAchievements(function (achvs) {
    displayAchievements(achvs);
  });
}

function refreshGraph() {
  ClickDB.loadRange(1, 3, true, function(results){
    var data = [];
    for (var hour in results.data) {
      data.push([parseInt(hour),results.data[hour]]);
    }

    data.sort(function(x,y){return x[0]-y[0]});
    var ticks = [];
    var clicks = [];

    var cumulative = $('#cumulativeBtn').hasClass('active');
    if (!cumulative) {
      clicks = getSeparateClickData(data);
    } else {
      clicks = getCumulativeClickData(data);
    }

    for (var i = 0; i < data.length; i++) {
      ticks.push(data[i][0]);
    }

    var graph = $('#graph').highcharts();
    var graphData = graph.series[0].data;

    var latestTick = ticks[ticks.length-1] * 3600 * 1000;
    var latestClickCount = clicks[clicks.length-1];

    // take care of the very odd case where we just got a click
    // on the hour boundary
    if ( (graphData[graphData.length-1].x + new Date().getTimezoneOffset()*60*1000) != latestTick) {
      graph.series[0].addPoint([latestTick, latestClickCount]);
    } else {
      graphData[graphData.length-1].update(latestClickCount);
    }
  });
}

$(document).ready(function(){
  createGraph();
  displayAchievements();
  refreshStats();
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if ("db" in request){
      refreshStats();
      refreshGraph();
    }
  });
  $('#cumulativeBtnGroup').click(function () {
    setTimeout(createGraph,0);
  });

  $('#rangeBtnGroup').click(function (e) {
    refreshStats();
    createGraph();
  });
});