/*jshint node: true */
(function () {
    'use strict';

    var rq;

    rq = require('request-promise');


    /**
     * Wrap all GET proxy calls.
     * @private
     * @name get
     * @param {Object} request
     * @param {String} endpoint
     * @param {Function} callback
     */
    function get(request, endpoint, callback) {
        return proxy(request, 'GET', endpoint, '', callback);
    }

     /**
     * Wrap all POST proxy calls.
     * @private
     * @name get
     * @param {Object} request
     * @param {String} endpoint
     * @param {Function} callback
     */
    function post(request, endpoint, body, callback) {
        return proxy(request, 'POST', endpoint, body, callback);
    }




    /**
     * Gets the requested user by ID
     * @name getUser
     * @param {Object} request
     * @param {string} userId Id of the user to retrieve
     * @param {Function} callback
     */
    function getUser(request, userId, callback) {
        get(request, 'users/extended/' + userId, callback);
    }

    /**
     * Gets a list of all the core roles
     * @name getRoles
     * @param {Object} request
     * @param {Function} callback
     */
    function getRoles(request, callback) {
        get(request, 'roles/', callback);
    }

    /**
     * Returns a paginated collection of users, limited to 100 per page.
     * @name getUserByRoles
     * @param {Object} request
     * @param {string} roles Comma delimited list of role IDs to get users for.
     * @param {Function} callback
     */
    function getUserByRoles(request, roles, callback) {
        get(request, 'users?roles=' + roles, callback);
    }

    /**
     * Returns a paginated collection of extended user details, limited to 1000 users per page..
     * @name getUserExtendedByRoles
     * @param {Object} request
     * @param {string} base_role_ids Comma delimited list of role IDs to get users for.
     * @param {Function} callback
     */
    function getUserExtendedByRoles(request, base_role_ids, callback) {
        get(request, 'users/extended?base_role_ids=' + base_role_ids, callback);
    }


    /*****************
     * NOT IN USE
     * Posts a note to the specified constituent (kept here to reference a post request for later)
     * @name postNotes
     * @param {Object} request
     * @param {string} constituentId Id of the constituent to retrieve
     * @param {Function} callback
     */
    function postNotes(request, constituentId, body, callback) {
        post(request, 'constituents/' + constituentId + '/notes', body, callback);
    }
    /*****************


    /**
     * Proxy method to the SCHOOL api.
     * Validates the session before initiating request.
     * @private
     * @name getProxy
     * @param {Object} request
     * @param {string} method
     * @param {string} endpoint
     * @param {Function} callback
     */
    function proxy(request, method, endpoint, body, callback) {
        var options;

        options = {
            json: true,
            method: method,
            body: body,
            url: 'https://api.sky.blackbaud.com/school/v1/' + endpoint,
            headers: {
                'bb-api-subscription-key': process.env.AUTH_SUBSCRIPTION_KEY,
                'Authorization': 'Bearer ' + request.session.ticket.access_token
            }
        };

        rq(options).then(callback).catch(function (err) {
            console.log('Proxy Error: ', err);
        });
    }


    /**
     * Class which lightly wraps a few of SKY API endpoints.
     * @constructor
     * @returns {Object}
     *  {@link getUser}
     */
    module.exports = {
        getUser: getUser,
        getRoles: getRoles,
        getUserByRoles: getUserByRoles,
        getUserExtendedByRoles: getUserExtendedByRoles
        // postNotes: postNotes
    };
}());
