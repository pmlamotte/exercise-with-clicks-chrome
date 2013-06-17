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

function refreshView() {
  ClickDB.loadTotal(function(totalCount){
    $("#count").text(totalCount);
    $("#calories").text((totalCount*1.42/1000).toFixed(3));
  });

  ClickDB.getAchievements(displayAchievements);

  ClickDB.loadAll(function(results){
    data = [];
    for (var hour in results.data) {
      data.push([parseInt(hour),results.data[hour]]);
    }
    data.sort(function(x,y){return x[0]-y[0]});
    var ticks = [];
    var clicks = [];
    data.forEach(function(hour){
      ticks.push(tickString(hour[0]));
      clicks.push(hour[1]);
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

$(document).ready(function(){
  refreshView();
  displayAchievements();
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if ("db" in request){
      refreshView();
    }
  });
});