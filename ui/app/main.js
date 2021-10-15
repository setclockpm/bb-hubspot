(function (angular) {
    'use strict';

    const studentBaseRoleId = 14; // role_id: 16073
    const teacherBaseRoleID = 15;
    const teacherRoleID = 16074;
    const studentRoleID = 16073;

    angular.module('AuthCodeFlowTutorial', ['ngRoute'])
        .config(function ($routeProvider) {

            /**
             *  Defines our app's routes.
             *  For this example we will only be using two: a `#/home`
             *  and a `#/auth-success` route. We define which controllers and
             *  templates each route will use.
             */
            $routeProvider
                .when('/home', {
                    templateUrl: './app/main-template.html',
                    controller: 'AppController'
                })
                .when('/auth-success', {
                    template: '<h1>Login Successful</h1>',
                    controller: 'AuthController'
                })
                .when('/users/extended/:baseRoleIds', {
                    templateUrl: './app/users-template.html',
                    controller: 'UsersController'
                })
                .when('/users/:userId', {
                    templateUrl: './app/users-template.html',
                    controller: 'UsersController'
                })
                .otherwise({
                    redirectTo: '/home'
                });
        })

        /**
         * This controller is for handling our post-success authentication.
         */
        .controller('AuthController', function ($window) {

            /**
             * When we arrive at this view, the popup window is closed, and we redirect the main
             * window to our desired route; in this case, '/'.
             *   - This is also a great place for doing any post-login logic you want to implement
             *     before we redirect.
             */
            $window.opener.location = '/';
            $window.close();
        })

        /**
         * General controller for handling the majority of our routes.  As our app grows, we would use more
         * controllers for each route.
         */
        .controller('AppController', function ($scope, $http, $window) {

            /**
             *  Checks the user access token.
             */
            $http.get('/auth/authenticated').then(function (res) {
                $scope.isAuthenticated = res.data.authenticated;
                if ($scope.isAuthenticated === false) {
                    $scope.isReady = true;
                    return;
                }

                /**
                 *  Access token is valid. Fetch roles records.
                 */
                console.log("Access token is valid");
                $scope.pageTitle = "Student";
                $http.get('/api/users/extended/' + studentBaseRoleId).then(function (res) {
                    $scope.users = res.data.value;
                    $scope.isReady = true;
                    console.log("getUsersByRole() response: " + res.data.count + " " + $scope.pageTitle + "(s) retrieved." )
                    // Ordering students by student ID, also sorts them by grade / grad year
                    $scope.users.sort(function (a, b) {
                      return a.student_id - b.student_id;
                    });
                });
            });

            /**
             * Opens a new popup window and redirects it to our login route.
             * After a successful login within the popup, the popup is redirected to the `#/auth-success`
             * route, which closes the popup window and returns focus to the parent window.
             */
            $scope.popupLogin = function () {
                var popup;

                popup = $window.open('auth/login?redirect=/%23/auth-success', 'login', 'height=450,width=600');

                if ($window.focus) {
                    popup.focus();
                }
            };
        })
        .controller('UsersController', function ($scope, $http, $routeParams) {

            /**
             *  Checks the user access token.
             */
            $http.get('/auth/authenticated').then(function (res) {
                $scope.isAuthenticated = res.data.authenticated;

                if ($scope.isAuthenticated === false) {
                    $scope.isReady = true;
                    return;
                }

                /**
                 *  Access token is valid. Fetch roles records.
                 */
                console.log("UsersController - Valid access token.");

                if ($routeParams.baseRoleIds) {
                    // @TODO: Verify $routeParams.baseRoleIds works with comma separated values
                    $http.get('/api/users/extended/' + $routeParams.baseRoleIds).then(function (res) {
                        $scope.users = res.data.value;
                        $scope.pageTitle = "Users";
                        console.log(res.data.count + " user(s) retrieved." )
                        // console.log('\n' + JSON.stringify(res, null, '\t'));
                        $scope.isReady = true;
                    });
                } else if ($routeParams.userId) {
                    $http.get('/api/users/' + $routeParams.userId).then(function (res) {
                        $scope.user = res.data;
                        $scope.pageTitle = $scope.user.display;
                        console.log("getUser() response: " + '\n' + JSON.stringify(res, null, '\t'))
                        $scope.isReady = true;
                    });
                }
            });
        });
})(window.angular);
