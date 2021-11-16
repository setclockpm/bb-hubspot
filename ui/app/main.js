(function (angular) {
    'use strict';

    const studentBaseRoleId = 14; // role_id: 16073
    const teacherBaseRoleID = 15;
    const parentBaseRoleId = 16;
    const teacherRoleID = 16074;
    const studentRoleID = 16073;
    const homeAddress = 1497;

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
                console.log("getUsersByRole() response: ");
                $scope.pageTitle = "Student";
                $http.get('/api/users/extended/' + studentBaseRoleId).then(function (res) {
                    $scope.isReady = true;
                    $scope.parentsOfMultipleEnrolledPupils = [];
                    // Ordering students by student ID, also sorts them by grade / grad year
                    $scope.students = res.data.value.sort(function (a, b) {
                      return a.student_id - b.student_id;
                    });
                    console.log($scope.students.length + " " + $scope.pageTitle + "(s) retrieved." );

                    const parentsHash = new Map();
                    let parents = [];

                    $scope.students.forEach(function (student) {
                        student.parents = student.relationships.filter(person => person.user_one_role === "Parent");
                        student.parents.forEach(function (parent) {
                            parent.studentFirstName = student.first_name;
                            parent.studentLastName = student.last_name;
                            parent.studentGradeLevel = student.student_info.grade_level;
                            // If parent exists in this set then we found a parent with another currently enrolled pupil
                            if (parentsHash.has(parent.user_one_id)) {
                                $scope.parentsOfMultipleEnrolledPupils.push(parent);
                            } else {
                                parentsHash.set(parent.user_one_id, parent);
                            }
                        })
                        parents = parents.concat(student.parents);
                        console.log(student.first_name + " " + student.last_name + " has " + student.parents.length + " parent(s).\n");
                        console.log("Running total of parents: " + parents.length);
                        console.log("Running total of unique parents: " + parentsHash.size);
                        console.log("Running total of parents with more than 1 currently enrolled child: " + $scope.parentsOfMultipleEnrolledPupils.length);

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
         /**
         * Cntroller for handling / displaying student and parent info.
         */
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
                        $scope.phoneNumbers = $scope.user.phones;
                        $scope.parents = [];


                        let studentRoles = $scope.user.roles.filter(role => role.name == "Student");
                        console.log("Student roles: " + '\n' + JSON.stringify(studentRoles, null, '\t'));
                        console.log("Student roles exist: " + '\n' + JSON.stringify(studentRoles.length > 0, null, '\t'));
                        $scope.isStudent = (studentRoles.length > 0);

                        if ($scope.user.addresses.some) {
                            $scope.homeAddress = $scope.user.addresses.filter(address => address.type_id == homeAddress)[0];
                        }
                        if ($scope.phoneNumbers.some) {
                            $scope.phoneNumbers.filter(phone => phone.type_id == "Home");
                        }
                        if ($scope.isStudent && $scope.user.relationships.some) {
                            $scope.parents = $scope.user.relationships.filter(person => person.user_one_role === "Parent");
                        }

                        console.log("$scope.isStudent: " + $scope.isStudent);
                        console.log("getUser() response: " + '\n' + JSON.stringify(res, null, '\t'));
                        $scope.isReady = true;
                    });
                }
            });
        })
        .controller('ParentsController', function ($scope, $http, $routeParams) {

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
                $scope.pageTitle = "Parent";
                $http.get('/api/users/extended/' + studentBaseRoleId).then(function (res) {
                    $scope.isReady = true;
                    $scope.parentsOfMultipleEnrolledPupils = [];
                    // Ordering students by student ID, also sorts them by grade / grad year
                    $scope.students = res.data.value.sort(function (a, b) {
                      return a.student_id - b.student_id;
                    });
                    console.log($scope.students.length + " " + $scope.pageTitle + "(s) retrieved." );

                    const parentsHash = new Map();
                    // let parents = [];

                    $scope.students.forEach(function (student) {
                        student.parents = student.relationships.filter(person => person.user_one_role === "Parent");
                        student.parents.forEach(function (parent) {
                            parent.studentFirstName = student.first_name;
                            parent.studentLastName = student.last_name;
                            parent.studentGradeLevel = student.student_info.grade_level;
                            // If parent exists in this set then we found a parent with another currently enrolled pupil
                            if (parentsHash.has(parent.user_one_id)) {
                                $scope.parentsOfMultipleEnrolledPupils.push(parent);
                            } else {
                                parentsHash.set(parent.user_one_id, parent);
                            }
                        })
                        // parents = parents.concat(student.parents);
                        console.log(student.first_name + " " + student.last_name + " has " + student.parents.length + " parent(s).\n");
                        // console.log("Running total of parents: " + parents.length);
                        console.log("Running total of unique parents: " + parentsHash.size);
                        console.log("Running total of parents with more than 1 currently enrolled child: " + $scope.parentsOfMultipleEnrolledPupils.length);

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
            };get('/auth/authenticated').then(function (res) {
                $scope.isAuthenticated = res.data.authenticated;

                if ($scope.isAuthenticated === false) {
                    $scope.isReady = true;
                    return;
                }

                /**
                 *  Access token is valid. Fetch parents' records.
                 */
                console.log("ParentsController - Valid access token.");

                if ($routeParams.studentBaseRoleId) {
                    // @TODO: Verify $routeParams.baseRoleIds works with comma separated values
                    $http.get('/api/users/extended/' + $routeParams.studentBaseRoleId).then(function (res) {
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
                        $scope.phoneNumbers = $scope.user.phones;
                        $scope.parents = [];


                        let studentRoles = $scope.user.roles.filter(role => role.name == "Student");
                        console.log("Student roles: " + '\n' + JSON.stringify(studentRoles, null, '\t'));
                        console.log("Student roles exist: " + '\n' + JSON.stringify(studentRoles.length > 0, null, '\t'));
                        $scope.isStudent = (studentRoles.length > 0);

                        if ($scope.user.addresses.some) {
                            $scope.homeAddress = $scope.user.addresses.filter(address => address.type_id == homeAddress)[0];
                        }
                        if ($scope.phoneNumbers.some) {
                            $scope.phoneNumbers.filter(phone => phone.type_id == "Home");
                        }
                        if ($scope.isStudent && $scope.user.relationships.some) {
                            $scope.parents = $scope.user.relationships.filter(person => person.user_one_role === "Parent");
                        }

                        console.log("$scope.isStudent: " + $scope.isStudent);
                        console.log("getUser() response: " + '\n' + JSON.stringify(res, null, '\t'));
                        $scope.isReady = true;
                    });
                }
            });
        });
})(window.angular);
