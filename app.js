(function () {
  var app = angular.module('smb-app', ['ngRoute']);

  app.config(function ($httpProvider, $locationProvider, $routeProvider) {
    $httpProvider.defaults.useXDomain = true;
    // $locationProvider.hashPrefix('!');
    // $locationProvider.html5Mode(true);

    $routeProvider
    .when('/', {
      controller: 'IndexCtrl',
      templateUrl: './partials/index.html'
    })
    .when('/widgets/:templ*', {
      controller: 'WidgetCtrl',
      template: '<div ng-include="include"></div>'
    })
    .otherwise({
      redirectTo: '/'
    });

  });

  app.controller('IndexCtrl', function ($scope, smbFetcher) {

  });

  app.controller('WidgetCtrl', function ($scope, $routeParams, smbFetcher) {
    $scope.include = './widgets/' + $routeParams.templ;
  });

  app.factory('smbFetcher', function ($http, $q) {
    return {
      getAds: function(cat, rows) {
        console.log('Fecthing ' + rows + ' ads from ' + cat);

        var d = $q.defer();
        $http.jsonp('http://eu1.websolr.com/solr/7a1e37bb15b/select/', {
          params: {
            start: 0,
            rows: rows || 10,
            q: 'section:' + cat,
            sort: 'created desc',
            wt: 'json',
            'json.wrf': 'JSON_CALLBACK'
          }
        })
        .success(function (data, status) {
          console.log(data.response);
          return d.resolve(data.response.docs);
        })
        .error(function (data, status) {

        });
        return d.promise;
      }
    };
  });

  app.directive('smbAd', function (smbFetcher, $rootScope) {
    return {
      restrict: 'A',
      transclude: true,
      scope: {
        cat: '@cat',
        count: '@count'
      },
      template: '<div ng-transclude></div>',
      controller: function ($scope) {

      },
      link: function (scope, element, attrs) {
        element.attr('ng-include', '\'' + scope.content + '\'');
        smbFetcher.getAds( scope.cat, +scope.count)
        .then(function (data) {
          console.log('Got data!');
          $rootScope.items = data;
          $rootScope.$broadcast('loadScript');
        },
        function (err) {
          console.log('Err:', err);
        });
      }
    };
  });

  app.directive('smbScript', function ($http, $timeout) {
    function loadScript(scope, element) {
      console.log('Load script!');
      $http.get(scope.src)
      .success(function (data) {
        var script = $('<script type="text/javascript"></script>');
        script.html(data);
        element.append(script);
      });
    }
    return {
      restrict: 'A',
      scope: {
        src: '@src',
        async: '@async'
      },
      link: function (scope, element) {
        if(!scope.async) {
          return loadScript(scope, element);
        }
        scope.$on('loadScript', function () {
          $timeout(function () {
            loadScript(scope, element);
          }, 500);
        });
      }
    };
  });

  app.directive('smbStyle', function ($http) {
    return {
      restrict: 'A',
      scope: {
        src: '@src'
      },
      template: '<style></style>',
      replace: true,
      link: function (scope, element) {
        console.log('Load style!');
        $http.get(scope.src)
        .success(function (data) {
          element.html(data);
        });
      }
    };
  });

})();
