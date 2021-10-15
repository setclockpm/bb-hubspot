/*jshint node: true */
(function () {
    'use strict';

    var Sky;

    Sky = require('../libs/sky');


    /**
     * Returns data for the specified [user_id]
     * @name getUser
     * @param {Object} request
     * @param {Object} response
     * @param {string} request.params.userId
     * @returns {string}
     */
    function getUser(request, response) {
        Sky.getUser(request, request.params.userId, function (results) {
            console.log('getUser() response:\n' + JSON.stringify(results, null, '\t'));
            response.send(results);
        });
    }

    /**
     * Returns a collection of core school user roles.
     * @name getRoles
     * @param {Object} request
     * @param {Object} response
     * @returns {string}
     */
    function getRoles(request, response) {
        Sky.getRoles(request, function (results) {
            // console.log('getRoles() response:\n' + JSON.stringify(results, null, '\t'));
            response.send(results);
        });
    }

    /**
     * Returns the collection of school grade levels offered.
     * @name getGradeLevels
     * @param {Object} request
     * @param {Object} response
     * @returns {string}
     */
    function getGradeLevels(request, response) {
        Sky.getGradeLevels(request, function (results) {
            // console.log('getRoles() response:\n' + JSON.stringify(results, null, '\t'));
            response.send(results);
        });
    }

    /**
     * Returns a paginated collection of users, limited to 100 per page.
     * @name getUserByRoles
     * @param {Object} request
     * @param {Object} response
     * @param {string} roles Comma delimited list of role IDs to get users for.
     * @param {Function} callback
     */
    function getUserByRoles(request, response) {
        Sky.getUserByRoles(request, request.params.roleIds, function (results) {
            console.log('getUserByRoles() response:\n' + JSON.stringify(results, null, '\t'));
            response.send(results);
        });
    }

    /**
     * Returns a paginated collection of extended user details, limited to 1000 users per page..
     * @name getUserExtendedByRoles
     * @param {Object} request
     * @param {Object} response
     * @param {string} base_role_ids Comma delimited list of role IDs to get users for.
     * @param {Function} callback
     */
    function getUserExtendedByRoles(request, response) {
        Sky.getUserExtendedByRoles(request, request.params.baseRoleIds, function (results) {
            console.log('getUserExtendedByRoles() response:\n' + JSON.stringify(results, null, '\t'));
            response.send(results);
        });
    }


    module.exports = {
        getGradeLevels: getGradeLevels,
        getRoles: getRoles,
        getUser: getUser,
        getUserExtendedByRoles: getUserExtendedByRoles,
        getUserByRoles: getUserByRoles,
    };
}());
