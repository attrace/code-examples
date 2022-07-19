import { FC, useCallback, useState } from 'react';
import * as address from '../utils/address/address';

import { farms } from '../api';
import { aggregation } from 'services';

import styles from './styles.module.css';

const HARDCODED_TOKEN = '0xc778417e063141139fce010982780140aa0cd5ab';

const App: FC = () => {
  const [referredToken, setReferredToken] = useState(HARDCODED_TOKEN);
  const [chainId, setChainId] = useState(4);
  const [farmCreatedTimestamp, setFarmCreatedTimestamp] = useState<
    string | number
  >('-');

  const fetchFarmExistsEvents = useCallback(async () => {
    const data = await farms.getFarmExistsEvents(chainId, {
      referredTokens: [address.toChainAddressEthers(chainId, referredToken)],
    });
    const farmTimeCreated =
      data && (await aggregation.aggregateFarmCreatedTimestamp(data));

    farmTimeCreated && setFarmCreatedTimestamp(farmTimeCreated);
  }, [referredToken, chainId]);

  return (
    <div className={styles.app}>
      <input
        value={referredToken}
        onChange={(e) => setReferredToken(e.target.value)}
        placeholder="referred token address"
        className={styles.input}
      />
      <input
        value={chainId}
        onChange={(e) => setChainId(Number(e.target.value))}
        placeholder="chain id"
        className={styles.input}
      />

      <button onClick={fetchFarmExistsEvents}>getFarmCreatedTimestamp</button>

      <div>
        <h3>Results:</h3>
        Farm Created Timestamp: {farmCreatedTimestamp}
      </div>
    </div>
  );
};

export default App;
