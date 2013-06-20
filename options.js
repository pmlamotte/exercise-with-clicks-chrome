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
  for (var i = 0; i < clickArray.length; i++) {
    var prev = (i == 0) ? 0 : clickArray[i-1][1];
    clicks.push(clickArray[i][1] - prev);
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
  ClickDB.loadAll(function(results){
    data = [];
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

    data.forEach(function(hour){
      ticks.push(tickString(hour[0]));
    });

    $('#graph').highcharts({
      chart: {
        zoomType: 'x'
      },
      title: {
        text: "All time clicks"
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
        pointStart: (results.start * 60 - new Date().getTimezoneOffset()) * 60 * 1000
      }],
      legend: {
        enabled: false
      },
    });
  });
}

function refreshView() {
  ClickDB.loadTotal(function(totalCount){
    $("#count").text(totalCount);
    $("#calories").text((totalCount*1.42/1000).toFixed(3));
  });

  ClickDB.loadAll(function(results){
    data = [];
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

    data.forEach(function(hour){
      ticks.push(hour[0]);
    });

    var graph = $('#graph').highcharts();
    var data = graph.series[0].data;


    var latestTick = ticks[ticks.length-1] * 3600 * 1000;
    var latestClicks = clicks[clicks.length-1];

    // take care of the very odd case where we just got a click
    // on the hour boundary
    if ( (data[data.length-1].x + new Date().getTimezoneOffset()*60*1000) != latestTick) {
      graph.series[0].addPoint([tickString(latestTick), latestClicks]);
    } else {
      data[data.length-1].update(latestClicks);
    }
  });
}

$(document).ready(function(){
  createGraph();
  displayAchievements();
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if ("db" in request){
      refreshView();
    }
  });
  $('#cumulativeBtnGroup').click(function () {
    createGraph();
  });
});