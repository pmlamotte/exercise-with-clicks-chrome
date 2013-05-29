var lastTS = 0;

$(document).mousedown(function(e){
  var ts = e.timeStamp;
  if (ts > lastTS){
    lastTS = ts;
    chrome.runtime.sendMessage({});
  }
});