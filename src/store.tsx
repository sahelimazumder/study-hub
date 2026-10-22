import {createContext,useContext} from 'react';
import type {State} from './core';
type Context={state:State;update:(fn:(s:State)=>State)=>void;go:(page:string,module?:string)=>void;focusModule:string};
export const StudyContext=createContext<Context>(null!);
export const useStudy=()=>useContext(StudyContext);
