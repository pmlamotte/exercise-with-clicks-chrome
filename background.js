chrome.browserAction.onClicked.addListener(function(){
  chrome.tabs.create({"url":"options.html"});
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if ("db" in request){
    ClickDB.loadTotal(function(calories) {
      ClickDB.getAchievements(function(achvs) {
        for (var achv_id in achvs) {
          var achv = achvs[achv_id];
          if (!achv.unlocked && calories >= achv.calories) {
            ClickDB.unlockAchievement(achv_id);
            var notification = webkitNotifications.createNotification(
              "img/trophy.png",
              "Achievement Unlocked!",
              "You have unlocked achievement '" + achv.name + "' with " + achv.calories.toFixed(3)/1000 + " calories burned."
            );
            notification.show();
          }
        }
      });
    });
  } else {
    ClickDB.storeClick(function(){
      chrome.runtime.sendMessage({db:""});
    });
  }
});