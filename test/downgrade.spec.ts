///<reference path="../typings/browser.d.ts" />

import {ngAdapter} from '../src/ngAdapter';
import {UpgradeAdapter} from '@angular/upgrade';
import {Directive, ElementRef, Injectable, Input, 
  NgModule, Component} from '@angular/core';
import {html, deleteHtml} from './helper';

describe('Downgrade: ', () => {
  let adapter: ngAdapter;
  let module: angular.IModule;
  
  class ng1Service {
    public value = 'ng1Service';
  }
    
  beforeEach(() => {
    module = angular.module('testApp', []);
    let addedProviders: any = {};
    let upgradedProviders: string[] = [];
    adapter = new ngAdapter(module);
  });
  
  it('inject ElementRef', (done) => {
    @Directive({
      selector: '[ng2]'
    })
    class ng2 {
      constructor(element: ElementRef) {
        element.nativeElement.textContent = 'changedContent';
      }
    }
    module.directive('ng2', <any>adapter.downgradeNg2Directive(ng2));
    
    let element = html('<div ng2>Hello World</div>');
    adapter.bootstrap(element, ['testApp'])
      .ready((ref: any) => {
        expect(element.textContent).toEqual('changedContent');
        ref.dispose();
        deleteHtml(element);
        done();
      });
  });
  
  it('inject ng2 Service', (done) => {
    Injectable()
    class ng2Service {
      public value: string = 'ng2Service';
    }
    module.service('ng2Service', adapter.downgradeNg2Provider(ng2Service));
    
    @Directive({
      selector: '[ng2]'
    })
    class ng2 {
      constructor(service: ng2Service, element: ElementRef) {
        element.nativeElement.textContent = service.value;
      }
    }

    @NgModule({
      declarations: [ng2],
      providers: [ng2Service]
    })
    class Ng2Module {}
    adapter.addNg2Module(Ng2Module);
    module.directive('ng2', <any>adapter.downgradeNg2Directive(ng2));
    
    let element = html('<div ng2>Hello World</div>');
    adapter.bootstrap(element, ['testApp'])
      .ready((ref: any) => {
        expect(element.textContent).toEqual('ng2Service');
        ref.dispose();
        deleteHtml(element);
        done();
      });
  });
  
  it('inject ng1Service Service', (done) => {
    class ng1Service {
      public value = 'ng1Service';
    }
    module.service('ng1Service', ng1Service);
    adapter.upgradeNg1Provider('ng1Service');
    
    @Directive({
      selector: '[ng2]'
    })
    class ng2 {
      constructor(service: ng1Service, element: ElementRef) {
        element.nativeElement.textContent = service.value;
      }
    }
    module.directive('ng2', <any>adapter.downgradeNg2Directive(ng2));
    
    let element = html('<div ng2>Hello World</div>');
    adapter.bootstrap(element, ['testApp'])
      .ready((ref: any) => {
        expect(element.textContent).toEqual('ng1Service');
        ref.dispose();
        deleteHtml(element);
        done();
      });
  });
  
  it('initialise ng2 Services via providers setting', (done) => {
    Injectable()
    class ng2Service {
      public value: string = 'ng2Service';
    }
    module.service('ng2Service', adapter.downgradeNg2Provider(ng2Service));
    
    @Directive({
      selector: '[ng2]'
    })
    class ng2 {
      constructor(service: ng2Service, element: ElementRef) {
        element.nativeElement.textContent = service.value;
      }
    }
    @NgModule({
      declarations: [ng2],
      providers: [ng2Service]
    })
    class Ng2Module {}
    adapter.addNg2Module(Ng2Module);
    module.directive('ng2', <any>adapter.downgradeNg2Directive(ng2));
    
    let element = html('<div ng2>Hello World</div>');
    adapter.bootstrap(element, ['testApp'])
      .ready((ref: any) => {
        expect(element.textContent).toEqual('ng2Service');
        ref.dispose();
        deleteHtml(element);
        done();
      });
  });
  
  it('two way data binding', (done) => {
    @Directive({
      selector: '[ng2]'
    })
    class ng2 {
      @Input('ng1Var') ng1Var: string;
      @Input('ng2Var') ng2Var: string; 
      constructor() {
        expect(this.ng1Var).toEqual('ng1');
        expect(this.ng2Var).toEqual('ng2');
        this.ng2Var = 'changed';
      }
    }
    module.directive('ng2', <any>adapter.downgradeNg2Directive(ng2));
    let scope: any;
    module.controller('ctrl', ($scope: any) => {
      scope = $scope;
      $scope.ng1Var = 'ng1';
      $scope.ng2Var = 'ng2';
    });
    
    let element = html(`<div ng-controller="ctrl">
        <div ng2 ng1-var="ng1Var" ng2-var="ng2Var">{{ng2Var}}</div>
      </div>`);
    adapter.bootstrap(element, ['testApp'])
      .ready((ref: any) => {
        expect(scope.ng2Var).toEqual('changed');
        ref.dispose();
        deleteHtml(element);
        done();
      });
  });
  
  it('can call class function', (done) => {
    let executed = false;
    @Directive({
      selector: '[ng2]'
    })
    class ng2 {
      constructor() {
        this.myFunction();
      }
      
      myFunction() {
        executed = true;
      }
    }
    module.directive('ng2', <any>adapter.downgradeNg2Directive(ng2));
    
    let element = html('<div ng2></div>');
    adapter.bootstrap(element, ['testApp'])
      .ready((ref: any) => {
        expect(executed).toBeTruthy();
        ref.dispose();
        deleteHtml(element);
        done();
      });
  });
  
  it('event binding via host setting (expect added event listener)', (done) => {    
    @Directive({
      selector: '[ng2]',
      host: {
        '(mouseenter)': 'onMouseEnter()'
      }
    })
    class ng2 {
      constructor() {}
      
      onMouseEnter() {
        //EventListener
      }
    }
    module.directive('ng2', <any>adapter.downgradeNg2Directive(ng2));
    
    let element = html('<div ng2>Hello World</div>');
    let el = element.childNodes[0];
    let event: string;
    let fn: any;
    spyOn(el, 'addEventListener').and.callFake((_event: string, _fn: any) => {
      event = _event;
      fn = _fn;
    });
    adapter.bootstrap(element, ['testApp'])
      .ready((ref: any) => {
        expect(el.addEventListener).toHaveBeenCalled();
        expect(event).toEqual('mouseenter');
        expect(fn instanceof Function).toBeTruthy();
        ref.dispose();
        deleteHtml(element);
        done();
      });
  });

  it('downgradeNg2Module', (done) => {
    @Injectable()
    class ng2Service {
      public test = '123';
    }

    @Directive({
      selector: '[ng2Dir]'
    })
    class ng2Dir {
      constructor(el: ElementRef) {
        el.nativeElement.style.backgroundColor = 'red';
      }
    }

    @Component({
      selector: 'ng2',
      template: 'component'
    })
    class ng2 {}

    @NgModule({
      declarations: [ng2Dir, ng2],
      exports: [ng2Dir, ng2],
      providers: [ng2Service]
    })
    class Ng2Module {}
    adapter.addNg2Module(Ng2Module);
    adapter.downgradeNg2Module(Ng2Module);

    //Inject new ng1 modul into testApp modul
    angular.module('testApp').requires.push('Ng2Module');

    let element = html('<ng2 ng2-dir></ng2>');
    adapter.bootstrap(element, ['testApp'])
      .ready((ref: any) => {
        expect(ref.ng1Injector.get('ng2Service')).toBeDefined();
        expect(ref.ng1Injector.get('ng2Service').test).toEqual('123');
        expect((<any>element.firstChild).style.backgroundColor).toEqual('red');
        expect(element.firstChild.textContent).toEqual('component');

        ref.dispose();
        deleteHtml(element);
        done();
      });
  });

  it('downgradeNg2Module only exports available', (done) => {
    @Component({
      selector: 'one',
      template: '1'
    })
    class One {}

    @Component({
      selector: 'two',
      template: '2'
    })
    class Two {}

    @NgModule({
      declarations: [One, Two],
      exports: [Two]
    })
    class Ng2ModuleExportsTest {}
    adapter.addNg2Module(Ng2ModuleExportsTest);
    adapter.downgradeNg2Module(Ng2ModuleExportsTest);
    //Inject new ng1 modul into testApp modul
    angular.module('testApp').requires.push('Ng2ModuleExportsTest');

    let element = html('<one></one><two></two');
    adapter.bootstrap(element, ['testApp'])
      .ready((ref: any) => {
        expect(element.textContent).toEqual('2');

        ref.dispose();
        deleteHtml(element);
        done();
      });
  });

  it('downgradeNg2Module recursive module', (done) => {
    @Component({
      selector: 'one',
      template: '1'
    })
    class One {}

    @Component({
      selector: 'two',
      template: '2'
    })
    class Two {}

    @NgModule({
      declarations: [Two],
      exports: [Two]
    })
    class Ng2ModuleRecursive2 {}

    @NgModule({
      declarations: [One],
      exports: [One, Ng2ModuleRecursive2]
    })
    class Ng2ModuleRecursive1 {}
    adapter.addNg2Module(Ng2ModuleRecursive1);
    adapter.downgradeNg2Module(Ng2ModuleRecursive1);
    //Inject new ng1 modul into testApp modul
    angular.module('testApp').requires.push('Ng2ModuleRecursive1');

    let element = html('<one></one><two></two');
    adapter.bootstrap(element, ['testApp'])
      .ready((ref: any) => {
        expect(element.textContent).toEqual('12');

        ref.dispose();
        deleteHtml(element);
        done();
      });
  });
});