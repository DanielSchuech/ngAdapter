///<reference path="../typings/browser.d.ts" />

import {ngAdapter} from '../src/ngAdapter';
import {UpgradeAdapter} from '@angular/upgrade';
import {Component, Injectable, NgModule, destroyPlatform} from '@angular/core';
import {html, deleteHtml} from './helper';

describe('Upgrade: ', () => {
  let adapter: ngAdapter;
  let module: angular.IModule;
  
  class ng1Service {
    public value = 'ng1Service';
  }
  
  beforeEach(() => {    
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
    destroyPlatform();
    module = angular.module('testAppUpgrade', ['Ng2Module']);
    adapter = new ngAdapter(module);
  });

  afterEach(() => destroyPlatform());
  
  it('two-way data binding via event attribute', (done: any) => {    
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

    let executedChagedEvent = false;
    @Component({
      selector: 'ng2',
      template: `<div ng1="stringTest" [testVar]="myVar" 
        (testVarChange)="changeEvent($event)">{{myVar}}</div>`
    })
    class ng2 {
      public myVar: string = 'ng2Var';
      
      changeEvent($event: any) {
        this.myVar = $event;
        expect($event).toEqual('changedFromNg1');
        executedChagedEvent = true;
      }
    }

    let types = [adapter.upgradeNg1Directive('ng1'), ng2];
    @NgModule({
      declarations: types,
      exports: types
    })
    class Ng2Module {}
    adapter.addNg2Module(Ng2Module);
    adapter.downgradeNg2Module(Ng2Module);
    
    let element = html('<ng2></ng2>');
    let ref: any;
    adapter.bootstrap(element, ['testAppUpgrade'])
      .ready((ref: any) => {
        expect(executedChagedEvent).toBeTruthy();
        ref.dispose();
        deleteHtml(element); 
        done();
      });
  });
  
  it('two-way data binding via syntactic sugar', (done: any) => {
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
      template: `<div ng1="stringTest" [(testVar)]="myVar">{{myVar}}</div>`
    })
    class ng2 {
      public myVar: string = 'ng2Var';
      
      constructor() {
        scope = this;
      }
    }

    let types = [adapter.upgradeNg1Directive('ng1'), ng2];
    @NgModule({
      declarations: types,
      exports: types
    })
    class Ng2Module {}
    adapter.addNg2Module(Ng2Module);
    adapter.downgradeNg2Module(Ng2Module);

    let element = html('<ng2></ng2>');
    adapter.bootstrap(element, ['testAppUpgrade'])
      .ready((ref: any) => {
        expect(scope.myVar).toEqual('changedFromNg1'); 
        ref.dispose();
        deleteHtml(element);
        done();
      });
  });
  
  it('one-way data binding (ng2 -> ng1) through ng2 syntax', (done: any) => {
    let executedLink = false;
    function ng1() {
      return {
        scope: {
          testVar: '='
        },
        link: (scope: any, el: Element[], attrs: any) => {
          expect(scope.testVar).toEqual('ng2Var');
          executedLink = true;
        }
      }
    }
    module.directive('ng1', ng1);
    
    @Component({
      selector: 'ng2',
      template: '<div ng1 [testVar]="myVar">{{myVar}}</div>'
    })
    class ng2 {
      public myVar: string = 'ng2Var';
    }

    let types = [adapter.upgradeNg1Directive('ng1'), ng2];
    @NgModule({
      declarations: types,
      exports: types
    })
    class Ng2Module {}
    adapter.addNg2Module(Ng2Module);
    adapter.downgradeNg2Module(Ng2Module);
    
    let element = html('<ng2></ng2>');
    adapter.bootstrap(element, ['testAppUpgrade'])
      .ready((ref: any) => {
        expect(executedLink).toBeTruthy();
        ref.dispose();
        deleteHtml(element);
        done();
      });
  });
  
  it('function (&) binding', (done: any) => {
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
      template: '<div ng1 [fn]="callMeFn"></div>'
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
    
    let types = [adapter.upgradeNg1Directive('ng1'), ng2];
    @NgModule({
      declarations: types,
      exports: types
    })
    class Ng2Module {}
    adapter.addNg2Module(Ng2Module);
    adapter.downgradeNg2Module(Ng2Module);
    
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
  
  it('broadcast & listen on scope', (done: any) => {
    function ng1broadcast() {
      return {
        link: (scope: any, element: Element[], attrs: any) => {
          scope.$broadcast('channel', 'helloNg2');
        }
      }
    }
    
    let executedChagedEvent = false;
    let executedLink = false;
    function ng1listen() {
      return {
        link: (scope: any, el: Element[], attrs: any) => {
          scope.$on('channel', (data: any) => {
            expect(data).toEqual('helloNg2');
            executedLink = true;
          });
        }
      }
    }
    module.directive('ng1listen', ng1listen);
    module.directive('ng1broadcast', ng1broadcast);
    
    @Component({
      selector: 'ng2',
      template: '<div><div ng1listen></div><div ng1broadcast></div></div>'
    })
    class ng2 {}
    
    let types = [adapter.upgradeNg1Directive('ng1listen'),
        adapter.upgradeNg1Directive('ng1broadcast'), ng2];
    @NgModule({
      declarations: types,
      exports: types
    })
    class Ng2Module {}
    adapter.addNg2Module(Ng2Module);
    adapter.downgradeNg2Module(Ng2Module);
    
    let element = html('<ng2></ng2>');
    let ref: any;
    adapter.bootstrap(element, ['testAppUpgrade'])
      .ready((ref: any) => {
        expect(executedLink).toBeTruthy();
        ref.dispose();
        deleteHtml(element); 
        done();
      });
  });
  
  it('inject ng1 service via inline array notation', (done: any) => {
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
      template: '<div ng1></div>'
    })
    class ng2 {}
    
    let types = [adapter.upgradeNg1Directive('ng1'), ng2];
    @NgModule({
      declarations: types,
      exports: types
    })
    class Ng2Module {}
    adapter.addNg2Module(Ng2Module);
    adapter.downgradeNg2Module(Ng2Module);
    
    let element = html('<ng2></ng2>');
    adapter.bootstrap(element, ['testAppUpgrade'])
      .ready((ref: any) => {
        expect(element.textContent).toEqual('ng1Service');
        
        ref.dispose();
        deleteHtml(element);
        done();
      });
  });
  
  it('inject ng1 service via $inject syntax', (done: any) => {
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
      template: '<div ng1></div>'
    })
    class ng2 {}
    
    let types = [adapter.upgradeNg1Directive('ng1'), ng2];
    @NgModule({
      declarations: types,
      exports: types
    })
    class Ng2Module {}
    adapter.addNg2Module(Ng2Module);
    adapter.downgradeNg2Module(Ng2Module);
    
    let element = html('<ng2></ng2>');
    adapter.bootstrap(element, ['testAppUpgrade'])
      .ready((ref: any) => {
        expect(element.textContent).toEqual('ng1Service');
        
        ref.dispose();
        deleteHtml(element);
        done();
      });
  });
  
  it('inject ng2 service via inline array notation', (done: any) => {
    @Injectable()
    class ng2Service {
      public value: string = 'ng2Service';
      constructor() {}
    }
    
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
      template: '<div ng1></div>'
    })
    class ng2 {}
    
    let types = [adapter.upgradeNg1Directive('ng1'), ng2];
    @NgModule({
      declarations: types,
      exports: types,
      providers: [ng2Service]
    })
    class Ng2Module {}
    adapter.addNg2Module(Ng2Module);
    adapter.downgradeNg2Module(Ng2Module);
    
    let element = html('<ng2></ng2>');
    adapter.bootstrap(element, ['testAppUpgrade'])
      .ready((ref: any) => {
        expect(element.textContent).toEqual('ng2Service');
        
        ref.dispose();
        deleteHtml(element);
        done();
      });
  });
  
  it('inject ng2 service via $inject syntax', (done: any) => {
    @Injectable()
    class ng2Service {
      public value: string = 'ng2Service';
      constructor() {}
    }
    
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
      template: '<div ng1></div>'
    })
    class ng2 {}
    
    let types = [adapter.upgradeNg1Directive('ng1'), ng2];
    @NgModule({
      declarations: types,
      exports: types,
      providers: [ng2Service]
    })
    class Ng2Module {}
    adapter.addNg2Module(Ng2Module);
    adapter.downgradeNg2Module(Ng2Module);
    
    let element = html('<ng2></ng2>');
    adapter.bootstrap(element, ['testAppUpgrade'])
      .ready((ref: any) => {
        expect(element.textContent).toEqual('ng2Service');
        
        ref.dispose();
        deleteHtml(element);
        done();
      });
  });
  
  it('scope $watch with string watchExpression', (done: any) => {
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
      template: '<div ng1 [(test)]="test">{{test}}</div>'
    })
    class ng2 {
      public test = 'abc';
      constructor() {ng2Scope = this; }
    }
    
    let types = [adapter.upgradeNg1Directive('ng1'), ng2];
    @NgModule({
      declarations: types,
      exports: types
    })
    class Ng2Module {}
    adapter.addNg2Module(Ng2Module);
    adapter.downgradeNg2Module(Ng2Module);
    
    let element = html('<ng2></ng2>');
    let ref: any;
    adapter.bootstrap(element, ['testAppUpgrade'])
      .ready((_ref: any) => {
        ref = _ref;
        ng2Scope.test = '123';        
      });
  });
  
  it('attrs', (done: any) => {
    let executeLink = false;
    function ng1() {
      return {
        link: (scope: any, el: Element[], attrs: any) => {
          expect(attrs.ng1).toEqual('');
          expect(attrs.class).toEqual('testCSS');
          executeLink = true;
        }
      }
    }
    module.directive('ng1', ng1);
    
    @Component({
      selector: 'ng2',
      template: '<div ng1 class="testCSS"></div>'
    })
    class ng2 {}
    
    let types = [adapter.upgradeNg1Directive('ng1'), ng2];
    @NgModule({
      declarations: types,
      exports: types
    })
    class Ng2Module {}
    adapter.addNg2Module(Ng2Module);
    adapter.downgradeNg2Module(Ng2Module);
    
    let element = html('<ng2></ng2>');
    let ref: any;
    adapter.bootstrap(element, ['testAppUpgrade'])
      .ready((ref: any) => {
        expect(executeLink).toBeTruthy();
        ref.dispose();
        deleteHtml(element);
        done();
      });
  });
  
  it('scope $watch with function watchExpression', (done: any) => {
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
      template: '<div ng1 [(test)]="test"></div>'
    })
    class ng2 {
      public test = 'abc';
      constructor() {ng2Scope = this; }
    }

    let types = [adapter.upgradeNg1Directive('ng1'), ng2];
    @NgModule({
      declarations: types,
      exports: types
    })
    class Ng2Module {}
    adapter.addNg2Module(Ng2Module);
    adapter.downgradeNg2Module(Ng2Module);
    
    let element = html('<ng2></ng2>');
    let ref: any;
    adapter.bootstrap(element, ['testAppUpgrade'])
      .ready((_ref: any) => {
        ref = _ref;
        ng2Scope.test = '123';
      });
  });

  it('module can has another module as require which does exists jet', (done: any) => {
    module = angular.module('webendApp', ['notExistingModule', 'new']);
    adapter = new ngAdapter(module);

    angular.module('new', [])
      .directive('ng1', () => {return {link: () => {}}; });

    let dir = adapter.upgradeNg1Directive('ng1');

    let element = html('<ng2></ng2>');
    adapter.bootstrap(element, ['testAppUpgrade'])
      .ready((ref: any) => {
        expect(dir).toBeDefined();

        ref.dispose();
        deleteHtml(element);
        done();
      });
  });

  it('upgrade two directives', (done: any) => {
    module
      .directive('ng1_1', () => {return {link: ($scope, el) => {(<any>el)[0].innerHTML = '#1'; }}; })
      .directive('ng1_2', () => {return {link: ($scope, el) => {(<any>el)[0].innerHTML = '#2'; }}; });

    @Component({
      selector: 'ng2',
      template: `
        <p ng1_1>abc</p>
        <p ng1_2>abc</p>
      `
    })
    class ng2 {}

    let types = [adapter.upgradeNg1Directive('ng1_1'),
        adapter.upgradeNg1Directive('ng1_2'), ng2];
    @NgModule({
      declarations: types,
      exports: types
    })
    class Ng2Module {}
    adapter.addNg2Module(Ng2Module);
    adapter.downgradeNg2Module(Ng2Module);

    let element = html('<ng2></ng2>');
    adapter.bootstrap(element, ['testAppUpgrade'])
      .ready((ref: any) => {
        let pElements = (<any>element).children[0].children;
        expect(pElements[0].innerHTML).toEqual('#1');
        expect(pElements[1].innerHTML).toEqual('#2');

        ref.dispose();
        deleteHtml(element);
        done();
      });
  });
});
