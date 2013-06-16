ClickDB = {
  _db: null,
  // database constants
  __dbname: "clicks",
  __dbversion: "1.0",
  __dbdesc: "some clicks",
  __dbsize: 5*1024*1024, // 5 MB
  // sql queries
  __createtable: "CREATE TABLE IF NOT EXISTS clicks(time INTEGER PRIMARY KEY ASC, count BIGINTEGER)",
  __createachtable: "CREATE TABLE IF NOT EXISTS achievements(achv_id VARCHAR(255) PRIMARY KEY, unlocked BOOLEAN DEFAULT 0, unlocked_at BIGINTEGER)",
  __insertach: "INSERT OR IGNORE INTO achievements (achv_id) VALUES (?)",
  __ensurehour: "INSERT OR IGNORE INTO clicks (time,count) VALUES (?,?)",
  __getAllAchvs: "SELECT * FROM achievements",
  __getunlockable: "SELECT achv_id FROM achievements WHERE unlocked = 0",
  __unlockAchievement: "UPDATE achievements SET unlocked = 1, unlocked_at = ? WHERE achv_id = ?",
  __unlockall: "UPDATE achievements SET unlocked = 1 WHERE unlocked = 0",
  __incrementhour: "UPDATE clicks SET count = count + 1 WHERE time = ?",
  __gettotal: "SELECT count FROM clicks ORDER BY time DESC LIMIT 1",
  __getlast24: "SELECT * FROM clicks WHERE (time >= ? - 24) ORDER BY time ASC",
  __getprev: "SELECT * FROM clicks WHERE (time < ? - 24) ORDER BY time DESC LIMIT 1",
  __getspec: "SELECT * FROM clicks WHERE (time <= ?) ORDER BY time DESC LIMIT 1",
  __getearliest: "SELECT time FROM clicks ORDER BY time ASC LIMIT 1",
  // other constants
  __timestep: 1000*60*60, // 1 hr
  __achievements: {
    "first_click": {
      name: "First Click!",
      calories: 1.0,
    },
    "first_calorie": {
      name: "First Calorie!",
      calories: 1000.0
    },
    "first_pound": {
      name: "First Pound!",
      calories: 3500000.0
    },
  },
  // private methods
  _onDB: function(callback){
    var t = this;
    if (t._db == null){
      t._db = openDatabase(t.__dbname,t.__dbversion,t.__dbdesc,t.__dbsize);
      t._db.transaction(function(tx){
        tx.executeSql(t.__createtable,[],null,t._logerr);
        tx.executeSql(t.__createachtable,[],null,t._logerr);
        for (var ach in t.__achievements){
          tx.executeSql(t.__insertach,[ach],null,t._logerr);
        }
      },null,callback);
    } else {
      if (callback) {
        callback();
      }
    }
  },
  _transaction: function(queries,callback){
    var t = this;
    t._onDB(function(){
      var res = {};
      var single = function(tx,name){
        tx.executeSql(queries[name][0],queries[name][1],function(tx,rs){
          res[name] = rs;
        },t._logerr);
      };
      t._db.transaction(function(tx){
        for (var name in queries){
          single(tx,name);
        }
      },null,function(){
        if (callback){
          callback(res);
        }
      });
    });
  },
  _wrapCB: function(callback){
    return function() {
      if (callback)
        callback();
    };
  },
  _currentIndex: function() {
    return parseInt(new Date().getTime() / this.__timestep);
  },
  _logerr: function(tx,err){
    console.log(err);
  },
  _earliestIndex: function(callback) {
    var t = this;
    t._transaction({
      earliest: [t.__getearliest,[]],
    },function(res){
      var e = t._currentIndex() - 24;
      if (res.earliest.rows.length > 0) {
        e = Math.min(e, res.earliest.rows.item(0).time);
      }
      if (callback) {
        callback(e);
      }
    });
  },
  // public methods
  storeClick: function(callback) {
    var t = this;
    var i = t._currentIndex();
    t._transaction({
      total: [t.__gettotal,[]]
    },function(ires){
      var total = 0;
      if (ires.total.rows.length > 0) {
        total = ires.total.rows.item(0).count;
      }
      t._transaction({
        ensurehour: [t.__ensurehour,[i,total]],
        incrementhour: [t.__incrementhour,[i]],
      },t._wrapCB(callback));
    });
  },
  loadRange: function(interval,count,cumul,callback) {
    var t = this;
    var i = t._currentIndex();
    var start = i;
    start -= parseInt(new Date().getTimezoneOffset()/60);
    start -= start % interval;
    start += parseInt(new Date().getTimezoneOffset()/60);
    start -= count * interval;
    var queries = {};
    for (var x = 0; x < count; x++){
      queries[x] = [t.__getspec,[start+x*interval]];
    }
    queries[count] = [t.__getspec,[i]];
    t._transaction(queries,function(res){
      var lastcount = 0;
      if (res[0].rows.length > 0) {
        lastcount = res[0].rows.item(0).count;
      }
      var ret ={};
      for (var x = 1; x <= count; x++){
        var time = start + (x - 1) * interval;
        if (cumul) {
          if (res[x].rows.length > 0){
            lastcount = ret[time] = res[x].rows.item(0).count;
          } else {
            ret[time] = lastcount;
          }
        } else {
          if (res[x].rows.length > 0){
            ret[time] = res[x].rows.item(0).count - lastcount;
            lastcount = res[x].rows.item(0).count;
          } else {
            ret[time] = 0;
          }
        }
      }
      if (callback){
        callback({start:start+1,data:ret});
      }
    });
  },
  loadAll: function(callback){
    var t = this;
    var i = t._currentIndex();
    t._earliestIndex(function(earliest){
      t.loadRange(1,i-earliest+1,true,callback);
    });
  },
  loadTotal: function(callback){
    var t = this;
    t._transaction({
      x: [t.__gettotal,[]],
    },function(res){
      var count = 0;
      if (res.x.rows.length > 0) {
        count = res.x.rows.item(0).count;
      }
      if (callback){
        callback(count);
      }
    });
  },
  getAchievements: function(callback) {
    var t = this;
    t._transaction({
      achvs: [t.__getAllAchvs],
    }, function(res) {
      for (var i = 0; i < res.achvs.rows.length; i++) {
        var row = res.achvs.rows.item(i);
        var achv = t.__achievements[row.achv_id];
        if (achv) {
          achv.unlocked = row.unlocked ? true : false;
          if (achv.unlocked) {
            achv.unlocked_at = row.unlocked_at;
          }
        }
      }
      if (callback) {
        callback(t.__achievements);
      }
    });
  },
  unlockAchievement: function(achv_id, callback){
    var t = this;
    t._transaction({
      unlock: [t.__unlockAchievement, [Date.now(), achv_id]],
    },function(res){
      if (callback){
        callback();
      }
    });
  },
};