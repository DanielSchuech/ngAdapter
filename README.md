[![npm version](https://badge.fury.io/js/ngadapter.svg)](https://badge.fury.io/js/ngadapter)
[![Build Status](https://travis-ci.org/DanielSchuech/ngAdapter.svg?branch=master)](https://travis-ci.org/DanielSchuech/ngAdapter)
[![Test Coverage](https://codeclimate.com/github/DanielSchuech/ngAdapter/badges/coverage.svg)](https://codeclimate.com/github/DanielSchuech/ngAdapter/coverage)

# AngularJS and Angular2 Adapter

This adapter extends the angular2 UpgradeAdapter by support for attribute directives.
The usage is similar to the standard UpgradeAdapter.

## Setup
```javascript
import {ngAdapter} from 'ngAdapter/build/ngAdapter';

//create your AngularJS module
let module = angular.module('MyApp', []);

//create adapter
let adapter = new ngAdapter(module);

/**
 * modify your module
 */

adapter.bootstrap(document.body, ['MyApp']);
```

## Downgrade Functions
```javascript
module.directive('myNg2Component', adapter.downgradeNg2Component(MyNg2Component));
module.directive('myNg2Directive', adapter.downgradeNg2Directive(MyNg2Directive));

adapter.addProvider(MyNg2Service);
module.factory('myNg2Service', adapter.downgradeNg2Provider(MyNg2Service));
```

## Upgrade Functions
```javascript
upgradeAdapter.upgradeNg1Provider('myNg1Service');

@Component({
    selector: 'my-ng2-component',
    template: `
      <span my-ng1-attribute-directive>Hello World</span>
      <my-ng1-directive></my-ng1-directive>>
    `,
    directives: [
      adapter.upgradeNg1Directive('myNg1AttributeDirective'),
      adapter.upgradeNg1Directive('myNg1Directive')
    ]
})
export class AppComponent {
  constructor(@Inject('myNg1Service') service: MyNg1Service) {}
}
```

## 
