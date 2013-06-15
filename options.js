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
  for (var achv in achievements) {

    var calories = parseFloat($("#calories").text());
    var achvCalories = achievements[achv].calories / 1000;

    var unlocked = achievements[achv].unlocked ? "unlocked" : "";

    var plural = achvCalories == 1 ? '' : 's';
    $('#achievements').append('<div class="achievement well ' +
                              unlocked + '">' +
                              achievements[achv].name + '<span class="pull-right">' +
                              achvCalories
                              + ' Calorie' + plural + '</div>');
  }
}

function refreshView() {
  ClickDB.loadTotal(function(totalCount){
    $("#count").text(totalCount);
    $("#calories").text((totalCount*1.42/1000).toFixed(3));
  });

  ClickDB.getAchievements(displayAchievements);

  ClickDB.loadLast24(function(results){
    data = [];
    for (var hour in results) {
      data.push([parseInt(hour),results[hour]]);
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
        type: 'line'
      },
      title: {
        text: 'Clicks from the past 24 hours'
      },
      xAxis: {
        categories: ticks,
        labels: {
          overflow: "justify",
          step: 2
        }
      },
      yAxis: {
        title: {
          text: 'Number of clicks'
        }
      },
      series: [{
        data: clicks,
        name: "clicks"
      }],
      legend: {
        enabled: false
      }
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