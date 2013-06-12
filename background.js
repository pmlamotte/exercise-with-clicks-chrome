chrome.browserAction.onClicked.addListener(function(){
  chrome.tabs.create({"url":"options.html"});
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if ("db" in request){
    ClickDB.unlockAchs(function(achs){
      for (var name in achs){
        var notification = webkitNotifications.createNotification(
          null,
          "Achievement Unlocked!",
          "You have unlocked achievement '" + name + "' with " + achs[name].toFixed(3)/1000 + " calories burned."
        );
        notification.show();
      }
    });
  } else {
    ClickDB.storeClick(function(){
      chrome.runtime.sendMessage({db:""});
    });
  }
});