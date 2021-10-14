/*jshint node: true */
(function () {
    'use strict';

    var crypto,
        oauth2;

    crypto = require('crypto');
    oauth2 = require('simple-oauth2')({
        clientID: process.env.AUTH_CLIENT_ID,
        clientSecret: process.env.AUTH_CLIENT_SECRET,
        authorizationPath: '/authorization',
        site: 'https://oauth2.sky.blackbaud.com',
        tokenPath: '/token'
    });


    /**
     * Validates all requests.
     * @name checkSession
     * @param {Object} request
     * @param {Object} response
     * @param {Object} next
     */
    function checkSession(request, response, next) {
        validate(request, function (valid) {
            if (valid) {
                console.log("Session validated.");
                next();
            } else {
                console.log("Session not valid.");
                response.sendStatus(401);
            }
        });
    }


    /**
     * An interface for our front-end to see if we're authenticated.
     * @name getAuthenticated
     * @param {Object} request
     * @param {Object} response
     */
    function getAuthenticated(request, response) {
        validate(request, function (success) {
            var json = {
                authenticated: success
            };
            if (success) {
                json.tenant_id = request.session.ticket.tenant_id;
            }
            response.json(json);
        });
    }


    /**
     * Handles oauth response.
     * Validates the code and state querystring params.
     * Exchanges code for an access token and redirects user back to app home.
     * @name getCallback
     * @param {Object} request
     * @param {Object} response
     */
    function getCallback(request, response) {
        var error,
            options,
            redirect;

        if (request.query.error) {
            error = request.query.error;
        } else if (!request.query.code) {
            error = 'auth_missing_code';
        } else if (!request.query.state) {
            error = 'auth_missing_state';
        } else if (request.session.state !== request.query.state) {
            error = 'auth_invalid_state';
        }

        if (!error) {
            options = {
                code: request.query.code,
                redirect_uri: process.env.AUTH_REDIRECT_URI
            };
            oauth2.authCode.getToken(options, function (errorToken, ticket) {
                if (errorToken) {
                    console.log("Uh-Oh: (errorToken received)" + errorToken.message)
                    error = errorToken.message;
                } else {
                    console.log("request.session: " + JSON.stringify(request.session) + "\n")
                    redirect = request.session.redirect || '/';
                    console.log("Preparing to redirect to " + redirect + " in getCallback()")

                    request.session.redirect = '';
                    request.session.state = '';

                    saveTicket(request, ticket);
                    response.redirect(redirect);
                }
            });
        }

        if (error) {
            console.log("Error encountered in getCallback()" + error)
            response.redirect('/#?error=' + error);
        }
    }


    /**
     * Prepares our initial request to the oauth endpoint and redirects the user.
     * Handles an optional "redirect" querystring parameter, which we redirect to in getCallback.
     * @name getLogin
     * @param {Object} request
     * @param {Object} response
     */
    function getLogin(request, response) {
        console.log("getLogin called");
        request.session.redirect = request.query.redirect;
        request.session.state = crypto.randomBytes(48).toString('hex');
        response.redirect(oauth2.authCode.authorizeURL({
            redirect_uri: process.env.AUTH_REDIRECT_URI,
            state: request.session.state
        }));
    }


    /**
     * Revokes the tokens, clears our session, and redirects the user.
     * Handles an optional "redirect" querystring parameter.
     * @name getLogout
     * @param {Object} request
     * @param {Object} response
     */
    function getLogout(request, response) {
        var redirect,
            token;

        redirect = request.session.redirect || '/';

        function go() {
            request.session.destroy();
            response.redirect(redirect);
        }

        if (!request.session.ticket) {
            go();
        } else {
            token = oauth2.accessToken.create(request.session.ticket);
            token.revoke('access_token', function () {
                token.revoke('refresh_token', go);
            });
        }
    }


    /**
     * Internal function for saving ticket + expiration.
     * @internal
     * @name saveTicket
     * @param {Object} request
     * @param {Object} ticket
     */
    function saveTicket(request, ticket) {
        console.log("Saving accessToken value to request.session.ticket")
        request.session.ticket = ticket;
        request.session.expires = (new Date().getTime() + (1000 * ticket.expires_in));
    }


    /**
     * An interface for our front-end to see if we're authenticated.
     * @name getAuthenticated
     * @param {Object} request
     * @param {Object} response
     */
    function validate(request, callback) {
        var dtCurrent,
            dtExpires,
            token;

        if (request.session && request.session.ticket && request.session.expires) {

            dtCurrent = new Date();
            dtExpires = new Date(request.session.expires);

            if (dtCurrent >= dtExpires) {
                console.log('Token expired');

                // Check if the token is expired. If expired it is refreshed.
                token = oauth2.accessToken.create(request.session.ticket);
                token.refresh(function (error, ticket) {
                    saveTicket(request, ticket.token);
                    return callback(!error);
                });
            } else {
                callback(true);
            }
        } else {
            callback(false);
        }
    }


    /**
     * Auth class which lightly wraps the simple-oauth2 package.
     * Provides the necessary methods for interacting with Blackbaud's OAUTH2 implemenation.
     * @constructor
     * @returns {Object}
     *  {@link getAuthenticated}
     *  {@link getLogin}
     *  {@link getCallback}
     *  {@link getLogout}
     */
    module.exports = {
        checkSession: checkSession,
        getAuthenticated: getAuthenticated,
        getCallback: getCallback,
        getLogin: getLogin,
        getLogout: getLogout
    };
}());
