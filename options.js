function setcount(count) {
  $("#count").text((count*1.42/1000).toFixed(3) + " Calories burned.");
}

$(document).ready(function(){
  chrome.storage.sync.get("clickcount",function(result){
    var count = 0;
    if ("clickcount" in result) {
      count = result.clickcount;
    }
    setcount(count);
  });
  chrome.storage.onChanged.addListener(function(changes,areaName){
    if (areaName!="sync") return;
    if (!("clickcount" in changes)) return;
    setcount(changes.clickcount.newValue);
  });
});