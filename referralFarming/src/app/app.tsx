import { FC, useCallback, useState } from 'react';
import * as address from '../utils/address/address';

import { farms } from '../api';

import styles from './styles.module.css';

const HARDCODED_TOKEN = '0xc778417e063141139fce010982780140aa0cd5ab';

const App: FC = () => {
  const [referredToken, setReferredToken] = useState(HARDCODED_TOKEN);
  const [chainId, setChainId] = useState(4);

  const fetchFarmExistsEvents = useCallback(async () => {
    const data = await farms.getFarmExistsEvents(chainId, {
      referredTokens: [address.toChainAddressEthers(chainId, referredToken)],
    });
    console.log({ data });
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
      <button onClick={fetchFarmExistsEvents}>fetchFarmExistsEvents</button>
    </div>
  );
};

export default App;
