ClickDB = {
  _hourToPair: function(hour) {
    return new Array("segment"+parseInt(hour/1024),hour%1024);
  },
  _currentHour: function() {
    var d = new Date();
    d.setMinutes(0,0,0);
    return parseInt(d.getTime() / 1000 / 3600);
  },
  _storeClick: function(hour,callback) {
    var pair = this._hourToPair(hour);
    var reqObj = {};
    reqObj.totalCount = 0;
    reqObj[pair[0]] = {};
    chrome.storage.local.get(reqObj, function(res){
      res.totalCount++;
      res[pair[0]][pair[1]] = res.totalCount;
      chrome.storage.local.set(res,function(){
        if (callback) {
          callback();
        }
      });
    });
  },
  _loadRange: function(cur,start,end,callback) {
    if (start >= end) {
      if (callback) {
        callback(cur);
      }
      return;
    }
    var segstart = parseInt(start/1024)*1024;
    var pair = this._hourToPair(start);
    var endPair = this._hourToPair(end);
    chrome.storage.local.get(pair[0],function(res){
      var lastIndex = 1024;
      if (segstart+1024 >= end) {
        lastIndex = end - segstart;
      }
      for (var i = start % 1024; i < lastIndex; i++) {
        if (pair[0] in res && i in res[pair[0]]) {
          cur[i+segstart] = res[pair[0]][i];
        } else {
          cur[i+segstart] = 0; // fix this
        }
      }
      ClickDB._loadRange(cur,start+1024,end,callback);
    });
  },
  storeClick: function(callback) {
    this._storeClick(this._currentHour(),callback);
  },
  loadRange: function(start,end,callback) {
    this._loadRange({},start,end,callback);
  },
  loadLast24: function(callback) {
    var hour = new Date().setMinutes(0,0,0) / 1000 / 3600;
    this._loadRange({},hour-24,hour+1,callback);
  },
  loadTotal: function(callback) {
    chrome.storage.local.get("totalCount",function(result){
      var totalCount = 0;
      if ("totalCount" in result) {
        totalCount = result.totalCount;
      }
      if (callback) {
        callback(totalCount);
      }
    });
  }
};
