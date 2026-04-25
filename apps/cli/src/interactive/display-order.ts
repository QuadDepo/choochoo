import type { NsConfig, TripGroup } from '@choochoo/core';

export const orderGroupsForDisplay = (groups: TripGroup[], tripOrder: NsConfig['tripOrder']): TripGroup[] =>
  tripOrder === 'desc'
    ? groups
    : [...groups].reverse().map((group) => ({ ...group, trips: [...group.trips].reverse() }));
