// Copyright 2017-2019 @polkadot/types authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import polkadotJson from './static-polkadot.json';
import substrateJson from './static-substrate.json';
import polkadotData from './static.polkadot';
import substrateData from './static';
import { decodeLatestSubstrate, defaultValues, toLatest } from '../util/testUtil';

describe('MetadataV5 (substrate)', (): void => {
  decodeLatestSubstrate(5, substrateData, substrateJson);

  toLatest(5, substrateData);

  defaultValues(substrateData);
});

describe('MetadataV5 (polkadot)', (): void => {
  decodeLatestSubstrate(5, polkadotData, polkadotJson);

  toLatest(5, polkadotData);

  defaultValues(polkadotData);
});
