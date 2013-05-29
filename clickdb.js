ClickDB = {
  _db: null,
  // database constants
  __dbname: "clicks",
  __dbversion: "1.0",
  __dbdesc: "some clicks",
  __dbsize: 5*1024*1024, // 5 MB
  // sql queries
  __createtable: "CREATE TABLE IF NOT EXISTS clicks(time INTEGER PRIMARY KEY ASC, count BIGINTEGER)",
  __createachtable: "CREATE TABLE IF NOT EXISTS achievements(name VARCHAR(255) PRIMARY KEY, cals DOUBLE, unlocked BOOLEAN DEFAULT 0)",
  __insertach: "INSERT OR IGNORE INTO achievements (name,cals) VALUES (?,?)",
  __ensurehour: "INSERT OR IGNORE INTO clicks (time,count) VALUES (?,?)",
  __getunlockable: "SELECT name,cals FROM achievements WHERE unlocked = 0 AND cals <= ?",
  __unlockall: "UPDATE achievements SET unlocked = 1 WHERE unlocked = 0 AND cals <= ?",
  __incrementhour: "UPDATE clicks SET count = count + 1 WHERE time = ?",
  __gettotal: "SELECT count FROM clicks ORDER BY time DESC LIMIT 1",
  __getlast24: "SELECT * FROM clicks WHERE (time >= ? - 24) ORDER BY time ASC",
  __getprev: "SELECT * FROM clicks WHERE (time < ? - 24) ORDER BY time DESC LIMIT 1",
  // other constants
  __timestep: 1000*60*60, // 1 hr
  __achievements: {
  "First Click!": 1.0,
  "First Calorie!": 1000.0
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
          tx.executeSql(t.__insertach,[ach,t.__achievements[ach]],null,t._logerr);
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
  loadLast24: function(callback) {
    var t = this;
    var i = t._currentIndex();
    t._transaction({
      latest: [t.__getlast24,[i]],
      prev: [t.__getprev,[i]],
    },function(res){
      var latest = {};
      for (var x = 0; x < res.latest.rows.length; x++) {
        var row = res.latest.rows.item(x);
        latest[row.time] = row.count;
      }
      var lastcount = 0;
      if (res.prev.rows.length > 0) {
        lastcount = res.prev.rows.item(0).count;
      }
      var ret = {};
      for (var x = 0; x <= 24; x++) {
        var hr = i + x - 24;
        if (hr in latest) {
          lastcount = ret[hr] = latest[hr];
        } else {
          ret[hr] = lastcount;
        }
      }
      if (callback){
        callback(ret);
      }
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
  unlockAchs: function(callback){
    var t = this;
    t.loadTotal(function(count){
      t._transaction({
        achs: [t.__getunlockable,[count*1.42]],
        set: [t.__unlockall,[count*1.42]],
      },function(res){
        var ret = {};
        for (var i = 0; i < res.achs.rows.length; i++) {
          var row = res.achs.rows.item(i);
          ret[row.name] = row.cals;
        }
        if (callback){
          callback(ret);
        }
      });
    });
  },
};