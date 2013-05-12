var lastTS = 0;

$(document).mousedown(function(e){
  var ts = e.timeStamp;
  if (ts > lastTS){
    lastTS = ts;
    chrome.storage.sync.get("clickcount", function(result){
      var count = 0;
      if ("clickcount" in result) {
        count = result.clickcount;
      }
      count++;
      chrome.storage.sync.set({"clickcount":count},function(){
        // on saved click
      });
    });
  }
});