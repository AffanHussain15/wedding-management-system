/**
 * `selectNextFunction` drives the Home screen's "Upcoming" tile. It used to take
 * the first unfinished function in array order, which named a function years out
 * whenever the API hadn't flagged one as 'next'.
 */

import { initialState } from '../src/store/reducer';
import { selectNextFunction } from '../src/store/selectors';
import type { WeddingState } from '../src/store/types';
import type { FunctionStatus, WeddingFunction } from '../src/types';

const isoIn = (days: number): string => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};

const fn = (
  name: string,
  date: string,
  status: FunctionStatus = 'upcoming',
): WeddingFunction => ({ id: name, name, date, time: '', venue: '', status });

const stateWith = (functions: WeddingFunction[]): WeddingState => ({
  ...initialState,
  functions,
});

describe('selectNextFunction', () => {
  it('uses the function the API flagged as next', () => {
    const result = selectNextFunction(
      stateWith([fn('Walima', isoIn(400)), fn('Mehndi', isoIn(10), 'next')]),
    );
    expect(result.name).toBe('Mehndi');
    expect(result.relative).toBe('in 10 days');
  });

  it('falls back to the soonest upcoming function, not the first in the array', () => {
    // Array order deliberately puts the distant function first, which is what
    // the old implementation returned.
    const result = selectNextFunction(
      stateWith([fn('Reception', isoIn(1251)), fn('Baraat', isoIn(30))]),
    );
    expect(result.name).toBe('Baraat');
    expect(result.relative).toBe('in 30 days');
  });

  it('skips a past function the server left as postponed', () => {
    const result = selectNextFunction(
      stateWith([fn('Dholki', isoIn(-20), 'postponed'), fn('Mehndi', isoIn(15))]),
    );
    expect(result.name).toBe('Mehndi');
  });

  it('ignores done and cancelled functions', () => {
    const result = selectNextFunction(
      stateWith([
        fn('Dholki', isoIn(5), 'done'),
        fn('Qawwali', isoIn(7), 'cancelled'),
        fn('Walima', isoIn(9)),
      ]),
    );
    expect(result.name).toBe('Walima');
  });

  it('ignores functions with no date set', () => {
    const result = selectNextFunction(
      stateWith([fn('Undated', ''), fn('Baraat', isoIn(3))]),
    );
    expect(result.name).toBe('Baraat');
  });

  it('reports nothing pending when every function is behind us', () => {
    const result = selectNextFunction(
      stateWith([fn('Mehndi', isoIn(-5), 'done'), fn('Walima', isoIn(-2), 'done')]),
    );
    expect(result).toEqual({ name: 'All set', relative: 'Nothing pending' });
  });

  it('reports nothing pending for an empty timeline', () => {
    expect(selectNextFunction(stateWith([]))).toEqual({
      name: 'All set',
      relative: 'Nothing pending',
    });
  });
});
