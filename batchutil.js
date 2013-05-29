BatchUtil = {
  _singleCall: function(name,call,obj,callback){
    call(function(res){
      obj[name] = res;
      if (callback) {
        callback();
      }
    });
  },
  runBatch: function(calls,callback) {
    var total = 0;
    var count = 0;
    for (var name in calls) {
      total++;
    }
    var res = {};
    for (var name in calls) {
      this._singleCall(name,calls[name],res,function(){
        count++;
        if (count == total) {
          if (callback) {
            callback(res);
          }
        }
      });
    }
  }
};