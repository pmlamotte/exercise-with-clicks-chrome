chrome.browserAction.onClicked.addListener(function(){
  chrome.tabs.create({"url":"options.html"});
  //chrome.storage.sync.set({"clickcount":0},function(){});
});

var achievements = {
  "First Click!": 1,
  "First Calorie!": 742
};

function achievement(name) {
  var notification = webkitNotifications.createNotification(
    null,
    "Achievement Unlocked!",
    "You have unlocked achievement '" + name + "' with " +
      (achievements[name]*1.42/1000).toFixed(3) + " Calories burned."
  );
  notification.show();
}

chrome.storage.onChanged.addListener(function(changes,areaName){
  if (areaName!="sync") return;
  if (!("clickcount" in changes)) return;
  for (ach in achievements) {
    if (changes.clickcount.oldValue < achievements[ach] &&
        changes.clickcount.newValue >= achievements[ach]) {
      achievement(ach);
    }
  }
});