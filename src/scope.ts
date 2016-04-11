import {ScopeEvents} from './scopeevents';

export class Scope {
  /**
   * setup scope with events, watch
   */
  static setUp(scope: any, scopeEvents: ScopeEvents) {
    //setting up scope events
    scope.$on = scopeEvents.$on.bind(scopeEvents);
    scope.$broadcast = scopeEvents.$broadcast.bind(scopeEvents);
    scope.$emit = scopeEvents.$emit.bind(scopeEvents);
    
    //setting up scope watch
    this.addScopeWatch(scope);
  }
  
  /**
   * scope watch function
   * saves the listeners and equals function for later check
   */
  static addScopeWatch(scope: any) {
    scope.$watch = scopeWatch
    
    function scopeWatch(watchExpression: string|Function, listener: Function, 
      objectEquality: Function|boolean) {
        //invoke watchExpression function
        if (watchExpression instanceof Function) {
          watchExpression = (<Function>watchExpression)(scope);
        }
        
        //determine equals function
        let equals: Function;
        if (objectEquality instanceof Function) {equals = objectEquality; }
        
        //save watch & equals functions
        scope._watch[<string>watchExpression] = listener;
        scope._equals[<string>watchExpression] = equals;
    }
  }
  /**
   * execute saved scope watch listener
   */
  static executeScopeWatchListener(property: string, scope: any, oldVal: any, newVal: any) {
    let listener = scope._watch[property];
    if (listener) {
      listener(newVal, oldVal, scope);
    }
  }
}