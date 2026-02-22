import { createContext, useContext } from 'react';
import type { Strings } from './lang';
import { createT, resolveLang } from './lang';

type TFn = (key: keyof Strings, vars?: Record<string, string | number>) => string;

export const LangContext = createContext<TFn>(createT(resolveLang('auto')));

export function useT(): TFn {
  return useContext(LangContext);
}
