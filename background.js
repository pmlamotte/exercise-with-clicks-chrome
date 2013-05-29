chrome.browserAction.onClicked.addListener(function(){
  chrome.tabs.create({"url":"options.html"});
});

var achievements = {
  "First Click!": 1.0,
  "First Calorie!": 1000.0
};

function achievement(name) {
  var notification = webkitNotifications.createNotification(
    null,
    "Achievement Unlocked!",
    "You have unlocked achievement '" + name + "' with " +
    achievements[name].toFixed(3) + " calories burned."
  );
  notification.show();
}

chrome.storage.onChanged.addListener(function(changes,areaName){
  if (areaName!="local") return;
  if (!("totalCount" in changes)) return;
  var oldCals = changes.totalCount.oldValue * 1.42 / 1000;
  var newCals = changes.totalCount.newValue * 1.42 / 1000;
  for (ach in achievements) {
    if (oldCals < achievements[ach] &&
        newCals >= achievements[ach]) {
      achievement(ach);
    }
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  ClickDB.storeClick();
});