// Copyright 2017-2019 @polkadot/api-derive authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AccountId, BlockNumber, SetIndex, VoteIndex } from '@polkadot/types/interfaces';
import { Codec } from '@polkadot/types/types';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiInterfaceRx } from '@polkadot/api/types';
import { Vec, u32 } from '@polkadot/types';

import { DerivedElectionsInfo } from '../types';
import { drr } from '../util/drr';

type Result = [Vec<[AccountId, BlockNumber] & Codec>, Vec<AccountId>, u32, u32, SetIndex, BlockNumber, VoteIndex, SetIndex];

function query (api: ApiInterfaceRx): Observable<Result> {
  return api.queryMulti<Result>([
    api.query.elections.members,
    api.query.elections.candidates,
    api.query.elections.candidateCount,
    api.query.elections.desiredSeats,
    api.query.elections.nextVoterSet,
    api.query.elections.termDuration,
    api.query.elections.voteCount,
    api.query.elections.voterCount
  ]);
}

/**
 * @name info
 * @returns An object containing the combined results of the storage queries for
 * all relevant election module properties.
 * @example
 * <BR>
 *
 * ```javascript
 * api.derive.elections.info(({ members, candidates }) => {
 *   console.log(`There are currently ${members.length} council members and ${candidates.length} prospective council candidates.`);
 * });
 * ```
 */
export function info (api: ApiInterfaceRx): () => Observable<DerivedElectionsInfo> {
  return (): Observable<DerivedElectionsInfo> => {
    return query(api).pipe(
      map(([members, candidates, candidateCount, desiredSeats, nextVoterSet, termDuration, voteCount, voterCount]): DerivedElectionsInfo => ({
        members: members.reduce(
          (record: Record<string, BlockNumber>, [accountId, blockNumber]): Record<string, BlockNumber> => {
            record[accountId.toString()] = blockNumber;
            return record;
          },
          {}
        ),
        candidates,
        candidateCount,
        desiredSeats,
        nextVoterSet,
        termDuration,
        voteCount,
        voterCount
      })),
      drr()
    );
  };
}
