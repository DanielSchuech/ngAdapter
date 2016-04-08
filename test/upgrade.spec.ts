///<reference path="../typings/browser.d.ts" />

import {ngAdapter} from '../src/ngAdapter.ts';
import {UpgradeAdapter} from 'angular2/upgrade';
import {Component, Injectable} from 'angular2/core';
import {html, deleteHtml} from './helper';

describe('Upgrade: ', () => {
  let adapter: ngAdapter;
  let ngUpgradeAdapter: UpgradeAdapter;
  let module: angular.IModule;
  
  class ng1Service {
    public value = 'ng1Service';
  }
  
  beforeEach(() => {    
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 300000;
    
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
});
