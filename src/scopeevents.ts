import {Injectable, EventEmitter} from 'angular2/core';

@Injectable()
export class ScopeEvents {
  private events: { [event: string]: EventEmitter<any> } = {};
  
  $broadcast(name: string, args: any) {
    if (!this.events[name]) {
      this.events[name] = new EventEmitter<any>();
    }
    
    this.events[name].emit(args);
  }
  
  $emit(name: string, args: any) {
    this.$broadcast(name, args);
  }
  
  $on(name: string, listener: Function) {
    if (!this.events[name]) {
      this.events[name] = new EventEmitter<any>();
    }
    
    this.events[name].subscribe(listener);
  }
}
