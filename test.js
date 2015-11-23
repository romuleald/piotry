var fs = require('fs');
var Twit = require('twit');
var _ = require('underscore');
var options = require('./config');

var toString = Object.prototype.toString;

var T = new Twit(options.keys);

var screen_name = '';
process.argv.forEach(function (val, index) {
    if (index === 2) {
        screen_name = val;
    }
});

function dump_object(obj) {
    var buff, prop;
    buff = [];
    for (prop in obj) {
        buff.push(dump_to_string(prop) + ': ' + dump_to_string(obj[prop]))
    }
    return '{' + buff.join(', ') + '}';
}

function dump_array(arr) {
    var buff, i, len;
    buff = [];
    for (i = 0, len = arr.length; i < len; i++) {
        buff.push(dump_to_string(arr[i]));
    }
    return '[' + buff.join(', ') + ']';
}

function dump_to_string(obj) {
    if (toString.call(obj) == '[object Function]') {
        return obj.toString();
    } else if (toString.call(obj) == '[object Array]') {
        return dump_array(obj);
    } else if (toString.call(obj) == '[object String]') {
        return '"' + obj.replace('"', '\\"') + '"';
    } else if (obj === Object(obj)) {
        return dump_object(obj);
    }
    return obj.toString();
}

var displayError = function (err) {
    console.info(err.message);
    console.info('something went wront, call your mum');
};

/**
 diff = array
 */
var getDiffUsers = function (diff) {
    if (diff.length) {
        T.get('users/lookup', {user_id: diff}, function (err, data_follower) {
            if (err) {
                displayError(err);
            }
            else {
                for (var i = 0; data_follower[i]; i++) {
                    var twitter_user = data_follower[i];
                    console.info(twitter_user.name + ' (' + twitter_user.screen_name + ')');
                }
            }
        });
    }
};


var compareOldFollowers = function (screen_name, new_follower) {
    new_follower = new_follower.ids;
    fs.readFile(screen_name + 'followers.json', {encoding: 'utf8'}, function (err, old_followers) {
        var _old_followers = [];
        if (err) {
            console.log(screen_name + ' a ' + new_follower.length + ' followers');
            console.info('it\'s our first time here? *wink* *wink*');
            fs.writeFile('@' + screen_name, '');
        }
        else {
            _old_followers = eval(old_followers);
            var diffLostFollowers = _.difference(_old_followers, new_follower);
            var diffGainFollowers = _.difference(new_follower, _old_followers);
            var diffFollowers = (new_follower.length - _old_followers.length);

            var wonOrLost = diffFollowers > 0 ? ' a gagné ' : ' a perdu ';
            console.log('vous avez ' + new_follower.length + ' followers et en aviez ' + _old_followers.length);
            console.log(screen_name + wonOrLost + Math.abs(diffFollowers) + ' followers');
            getDiffUsers(diffLostFollowers);
            getDiffUsers(diffGainFollowers);
        }
        fs.writeFile(screen_name + 'followers.json', dump_array(new_follower));
    });

};
var getFollowers = function (screen_name) {
    if (screen_name[0] === '@') {
        screen_name = screen_name.substr(1);
    }
    T.get('followers/ids', {screen_name: screen_name}, function (err, new_follower) {
        if (err) {
            displayError(err);
            return;
        }
        compareOldFollowers(screen_name, new_follower);
    });
};

var getRateLimit = function () {
    T.get('application/rate_limit_status', {ressources: 'help,users,search,statuses'}, function (ok, response) {
        console.dir(response.resources)
    });
};


if (screen_name === 'rate_limit') {
    getRateLimit();
}
else {
    getFollowers(screen_name);
}

//TODO translate screen_name in id to manage the change os @screen_name
//TODO do not write file in case of error
//TODO use promise everywhere