///<reference path="../typings/browser.d.ts" />

import {ngAdapter} from '../src/ngAdapter.ts';
import {UpgradeAdapter} from 'angular2/upgrade';
import {Component, Injectable, NgZone} from 'angular2/core';
import {html, deleteHtml} from './helper';

describe('Upgrade: ', () => {
  let adapter: ngAdapter;
  let ngUpgradeAdapter: UpgradeAdapter;
  let module: angular.IModule;
  
  class ng1Service {
    public value = 'ng1Service';
  }
  
  beforeEach(() => {    
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
    
    ngUpgradeAdapter = new UpgradeAdapter();
    module = angular.module('testAppUpgrade', []);
    adapter = new ngAdapter(module);
  });
  
  it('two-way data binding via event attribute', (done) => {    
    function ng1() {
      return {
        scope: {
          ng1: '=',
          testVar: '='
        },
        link: (scope: any, el: Element[], attrs: any) => {
          expect(scope.ng1).toEqual('stringTest');
          expect(scope.testVar).toEqual('ng2Var');
          
          scope.testVar = 'changedFromNg1';
        }
      }
    }
    module.directive('ng1', ng1);
    @Component({
      selector: 'ng2',
      template: `<div ng1="stringTest" [testVar]="myVar" 
        (testVarChange)="changeEvent($event)">{{myVar}}</div>`,
      directives: [adapter.upgradeNg1Directive('ng1')]
    })
    class ng2 {
      public myVar: string = 'ng2Var';
      
      changeEvent($event: any) {
        this.myVar = $event;
        expect($event).toEqual('changedFromNg1');
      
        ref.dispose();
        deleteHtml(element);
        done();
      }
    }
    module.directive('ng2', <any>adapter.downgradeNg2Component(ng2));
    
    let element = html('<ng2></ng2>');
    let ref: any;
    adapter.bootstrap(element, ['testAppUpgrade'])
      .ready((_ref: any) => {
        ref = _ref;
      });
  });
  
  it('two-way data binding via syntactic sugar', (done) => {
    function ng1() {
      return {
        scope: {
          ng1: '=',
          testVar: '='
        },
        link: (scope: any, el: Element[], attrs: any) => {
          expect(scope.ng1).toEqual('stringTest');
          expect(scope.testVar).toEqual('ng2Var');
          
          scope.testVar = 'changedFromNg1';
        }
      }
    }
    module.directive('ng1', ng1);
    let scope: any;
    @Component({
      selector: 'ng2',
      template: `<div ng1="stringTest" [(testVar)]="myVar">{{myVar}}</div>`,
      directives: [adapter.upgradeNg1Directive('ng1')]
    })
    class ng2 {
      public myVar: string = 'ng2Var';
      
      constructor() {
        scope = this;
        
      }
    }
    module.directive('ng2', <any>adapter.downgradeNg2Component(ng2));

    let element = html('<ng2></ng2>');
    adapter.bootstrap(element, ['testAppUpgrade'])
      .ready((ref: any) => {
        setTimeout(() => {
          expect(scope.myVar).toEqual('changedFromNg1'); 
          ref.dispose();
          deleteHtml(element);
          done();
        }, 10);
      });
  });
  
  it('one-way data binding (ng2 -> ng1) through ng2 syntax', (done) => {
    function ng1() {
      return {
        scope: {
          testVar: '='
        },
        link: (scope: any, el: Element[], attrs: any) => {
          expect(scope.testVar).toEqual('ng2Var');
        }
      }
    }
    module.directive('ng1', ng1);
    
    @Component({
      selector: 'ng2',
      template: '<div ng1 [testVar]="myVar">{{myVar}}</div>',
      directives: [adapter.upgradeNg1Directive('ng1')]
    })
    class ng2 {
      public myVar: string = 'ng2Var';
    }
    module.directive('ng2', <any>adapter.downgradeNg2Component(ng2));
    
    let element = html('<ng2></ng2>');
    adapter.bootstrap(element, ['testAppUpgrade'])
      .ready((ref: any) => {
        ref.dispose();
        deleteHtml(element);
        done();
      });
  });
  
  it('function (&) binding', (done) => {
    function ng1() {
      return {
        scope: {
          fn: '&'
        },
        link: (scope: any, el: Element[], attrs: any) => {
          scope.fn();
        }
      }
    }
    module.directive('ng1', ng1);
    
    @Component({
      selector: 'ng2',
      template: '<div ng1 [fn]="callMeFn"></div>',
      directives: [adapter.upgradeNg1Directive('ng1')]
    })
    class ng2 {
      public name = "ngAdapter"
      callMe() {
        /**
         * function is called from another class
         * check if this points correctly to ng2 class
         */
        expect(this.name).toEqual('ngAdapter');
      }
      public callMeFn = this.callMe.bind(this);
    }
    module.directive('ng2', <any>adapter.downgradeNg2Component(ng2));
    
    spyOn(ng2.prototype, 'callMe').and.callThrough();
    
    let element = html('<ng2></ng2>');
    adapter.bootstrap(element, ['testAppUpgrade'])
      .ready((ref: any) => {
        expect(ng2.prototype.callMe).toHaveBeenCalled();
        ref.dispose();
        deleteHtml(element);
        done();
      });
  });
  
  it('broadcast & listen on scope', (done) => {
    function ng1broadcast() {
      return {
        link: (scope: any, element: Element[], attrs: any) => {
          scope.$broadcast('channel', 'helloNg2');
        }
      }
    }
    
    let called = false;
    function ng1listen() {
      return {
        link: (scope: any, el: Element[], attrs: any) => {
          scope.$on('channel', (data: any) => {
            expect(data).toEqual('helloNg2');
            ref.dispose();
            deleteHtml(element);
            done();
          });
        }
      }
    }
    module.directive('ng1listen', ng1listen);
    module.directive('ng1broadcast', ng1broadcast);
    
    @Component({
      selector: 'ng2',
      template: '<div><div ng1listen></div><div ng1broadcast></div></div>',
      directives: [adapter.upgradeNg1Directive('ng1listen'),
        adapter.upgradeNg1Directive('ng1broadcast')]
    })
    class ng2 {}
    module.directive('ng2', <any>adapter.downgradeNg2Component(ng2));
    
    let element = html('<ng2></ng2>');
    let ref: any;
    adapter.bootstrap(element, ['testAppUpgrade'])
      .ready((_ref: any) => {
        ref = _ref;
      });
  });
  
  it('inject ng1 service via inline array notation', (done) => {
    module.service('ng1Service', ng1Service);
    adapter.upgradeNg1Provider('ng1Service');
    
    function ng1(service: ng1Service) {
      return {
        link: (scope: any, element: Element[], attrs: any) => {
          element[0].textContent = service.value;
        }
      }
    }
    module.directive('ng1', ['ng1Service', ng1]);
    
    @Component({
      selector: 'ng2',
      template: '<div ng1></div>',
      directives: [adapter.upgradeNg1Directive('ng1')]
    })
    class ng2 {}
    module.directive('ng2', <any>adapter.downgradeNg2Component(ng2));
    
    let element = html('<ng2></ng2>');
    adapter.bootstrap(element, ['testAppUpgrade'])
      .ready((ref: any) => {
        expect(element.textContent).toEqual('ng1Service');
        
        ref.dispose();
        deleteHtml(element);
        done();
      });
  });
  
  it('inject ng1 service via $inject syntax', (done) => {
    module.service('ng1Service', ng1Service);
    adapter.upgradeNg1Provider('ng1Service');
    
    ng1.$inject = ['ng1Service'];
    function ng1(service: ng1Service) {
      return {
        link: (scope: any, element: Element[], attrs: any) => {
          element[0].textContent = service.value;
        }
      }
    }
    module.directive('ng1', ng1);
    
    @Component({
      selector: 'ng2',
      template: '<div ng1></div>',
      directives: [adapter.upgradeNg1Directive('ng1')]
    })
    class ng2 {}
    module.directive('ng2', <any>adapter.downgradeNg2Component(ng2));
    
    let element = html('<ng2></ng2>');
    adapter.bootstrap(element, ['testAppUpgrade'])
      .ready((ref: any) => {
        expect(element.textContent).toEqual('ng1Service');
        
        ref.dispose();
        deleteHtml(element);
        done();
      });
  });
  
  it('inject ng2 service via inline array notation', (done) => {
    @Injectable()
    class ng2Service {
      public value: string = 'ng2Service';
      constructor() {}
    }
    adapter.addProvider(ng2Service);
    
    function ng1(service: ng2Service) {
      return {
        link: (scope: any, element: Element[], attrs: any) => {
          element[0].textContent = service.value;
        }
      }
    }
    module.directive('ng1', ['ng2Service', ng1]);
    
    @Component({
      selector: 'ng2',
      template: '<div ng1></div>',
      directives: [adapter.upgradeNg1Directive('ng1')]
    })
    class ng2 {}
    module.directive('ng2', <any>adapter.downgradeNg2Component(ng2));
    
    let element = html('<ng2></ng2>');
    adapter.bootstrap(element, ['testAppUpgrade'])
      .ready((ref: any) => {
        expect(element.textContent).toEqual('ng2Service');
        
        ref.dispose();
        deleteHtml(element);
        done();
      });
  });
  
  it('inject ng2 service via $inject syntax', (done) => {
    @Injectable()
    class ng2Service {
      public value: string = 'ng2Service';
      constructor() {}
    }
    adapter.addProvider(ng2Service);
    
    ng1.$inject = ['ng2Service'];
    function ng1(service: ng2Service) {
      return {
        link: (scope: any, element: Element[], attrs: any) => {
          element[0].textContent = service.value;
        }
      }
    }
    module.directive('ng1', ng1);
    
    @Component({
      selector: 'ng2',
      template: '<div ng1></div>',
      directives: [adapter.upgradeNg1Directive('ng1')]
    })
    class ng2 {}
    module.directive('ng2', <any>adapter.downgradeNg2Component(ng2));
    
    let element = html('<ng2></ng2>');
    adapter.bootstrap(element, ['testAppUpgrade'])
      .ready((ref: any) => {
        expect(element.textContent).toEqual('ng2Service');
        
        ref.dispose();
        deleteHtml(element);
        done();
      });
  });
  
  it('scope $watch with string watchExpression', (done) => {
    function ng1() {
      return {
        scope: {test: '='},
        link: (scope: any, el: Element[], attrs: any) => {
          scope.$watch('test', (newVal: any, oldVal: any, _scope: any) => {
            // dont cover first change from undefined to abc
            if (oldVal) {
              expect(newVal).toEqual('123');
              expect(oldVal).toEqual('abc');
              expect(_scope).toEqual(scope);
              
              ref.dispose();
              deleteHtml(element);
              done();
            }
          })
        }
      }
    }
    module.directive('ng1', ng1);
    
    let ng2Scope: any;
    @Component({
      selector: 'ng2',
      template: '<div ng1 [(test)]="test">{{test}}</div>',
      directives: [adapter.upgradeNg1Directive('ng1')]
    })
    class ng2 {
      public test = 'abc';
      constructor() {ng2Scope = this; }
    }
    module.directive('ng2', <any>adapter.downgradeNg2Component(ng2));
    
    let element = html('<ng2></ng2>');
    let ref: any;
    adapter.bootstrap(element, ['testAppUpgrade'])
      .ready((_ref: any) => {
        ref = _ref;
        ng2Scope.test = '123';
      });
  });
  
  it('scope $watch with function watchExpression', (done) => {
    function ng1() {
      return {
        scope: {test: '='},
        link: (scope: any, el: Element[], attrs: any) => {
          scope.$watch(
            (_scope: any) => {
              expect(scope).toEqual(_scope);
              return 'test';
            }, 
            (newVal: any, oldVal: any, _scope: any) => {
              // dont cover first change from undefined to abc
              if (oldVal) {
                expect(newVal).toEqual('123');
                expect(oldVal).toEqual('abc');
                expect(_scope).toEqual(scope);

                ref.dispose();
                deleteHtml(element);
                done();
              }
            },
            (a: any, b: any) => {return angular.equals(a,b)}
          )
        }
      }
    }
    module.directive('ng1', ng1);
    
    let ng2Scope: any;
    @Component({
      selector: 'ng2',
      template: '<div ng1 [(test)]="test"></div>',
      directives: [adapter.upgradeNg1Directive('ng1')]
    })
    class ng2 {
      public test = 'abc';
      constructor() {ng2Scope = this; }
    }
    module.directive('ng2', <any>adapter.downgradeNg2Component(ng2));
    
    let element = html('<ng2></ng2>');
    let ref: any;
    adapter.bootstrap(element, ['testAppUpgrade'])
      .ready((_ref: any) => {
        ref = _ref;
        ng2Scope.test = '123';
      });
  });
});
