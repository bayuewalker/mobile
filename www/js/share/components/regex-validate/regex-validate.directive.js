/**
 * @name bgRegexValidate directive
 * @author Morteza Tavnarad
 * @contributors []
 * @since 11/02/2016
 * @copyright Binary Ltd
 */

(function(){
  'use strict';

  angular
    .module('binary.share.components.regex-validate.directives')
    .directive('bgRegexValidate', Validate);

  function Validate(){
    var directive = {
      restrict: 'A',
      link: link,
      require: 'ngModel',
      scope:{
        regex: '@bgRegexValidate'
      }
    };

    return directive;

    function link(scope, elements, attrs, ngModel){

      scope.$watch(() => { return ngModel.$viewValue; }, (newVal, oldVal) => {
        if(_.isEmpty(scope.regex)){
          return;
        }

        var regex = RegExp(scope.regex);

        if(!_.isEmpty(ngModel.$viewValue) && !regex.test(ngModel.$viewValue))
        {
          ngModel.$setViewValue(oldVal);
          ngModel.$render();
        }

        return;

      });

    }
  }
})();
