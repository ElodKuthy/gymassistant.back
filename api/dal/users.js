(function () {
    "use strict";

    exports.findByName = findByName;
    exports.findByNameOrEmail = findByNameOrEmail;
    exports.rollback = loadUsers;
    exports.commit = saveUsers;
    exports.getAllUsers = getAllUsers;

    var jfs = require("jsonfile");

    var roles = require("./roles.js");
    var user = require("./../model/user.js");

    var users = [];

    loadUsers();

    function loadUsers() {
        jfs.readFileSync(__dirname + "./../data/users.json")
            .users.forEach(function (instance) {
                users.push(new user.ctor(instance));
        });
    }

    function findByNameOrEmail(nameOrEmail) {

        for (var index = 0; index < users.length; index++) {
            var current = users[index];
            if (current.userName === nameOrEmail || current.email === nameOrEmail) {
                return current;
            }
        }
    }

    function findByName(userName) {
        for (var index = 0; index < users.length; index++) {
            var current = users[index];
            if (current.userName === userName) {
                return current;
            }
        }
    }

    function getAllUsers() {
        return users;
    }

    function saveUsers() {
        var data = {};
        data.users = users;
        jfs.writeFileSync(__dirname + "./../data/users.json", data);
    }

})();