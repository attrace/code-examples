import { FC, useCallback, useMemo, useState } from 'react';

import { aggregation } from 'services';
import { farms, fetchTokenList, TokenListMap } from 'api';
import { address } from 'utils';
import { ChainId } from 'config';
import { ERC20Token } from 'types';

import styles from './styles.module.css';

const HARDCODED_TOKEN = '0xc778417e063141139fce010982780140aa0cd5ab';

const App: FC = () => {
  const [referredToken, setReferredToken] = useState(HARDCODED_TOKEN);
  const [chainId, setChainId] = useState(ChainId.Rinkeby);
  const [tokensList, setTokensList] = useState<TokenListMap>(new Map());
  const [tokenDetails, setTokenDetails] = useState<ERC20Token | undefined>(
    undefined,
  );
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

  const fetchTokensList = useCallback(async () => {
    if (chainId) {
      const tokenList = await fetchTokenList(chainId);
      if (tokenList?.size) {
        setTokensList(tokenList);
        return tokenList;
      }
    }
  }, [chainId]);

  const getTokenDetails = useCallback(async () => {
    if (!referredToken) {
      console.log('invalid input data');
      return;
    }

    let tokenDetails: ERC20Token | undefined;
    if (tokensList.size) {
      tokenDetails = tokensList.get(referredToken);
    } else if (!tokensList.size) {
      const list = await fetchTokensList();
      if (list?.size) {
        tokenDetails = list.get(referredToken);
      }
    }

    setTokenDetails(tokenDetails);
  }, [tokensList, referredToken]);

  const details = useMemo(() => {
    if (!tokenDetails) return [];

    const details = [];

    for (const [k, v] of Object.entries(tokenDetails)) {
      details.push({ k, v });
    }

    return details;
  }, [tokenDetails]);

  return (
    <div className={styles.app}>
      <label>Referred Token:</label>
      <input
        value={referredToken}
        onChange={(e) => setReferredToken(e.target.value)}
        placeholder="referred token address"
        className={styles.input}
      />
      <label>Chain ID:</label>
      <input
        value={chainId}
        onChange={(e) => setChainId(Number(e.target.value))}
        placeholder="chain id"
        className={styles.input}
      />
      <div className={styles.controlBtns}>
        <button onClick={getTokenDetails}>Get Referred Token Info</button>
        <button onClick={fetchFarmExistsEvents}>
          Get created at(timestamp)
        </button>
      </div>

      <div>
        <h2>Results:</h2>
        <div>
          <h4>Farm Created Timestamp:</h4> {farmCreatedTimestamp}
        </div>
        <div>
          <h4>Token Details:</h4>
          <div>
            {details.map(({ k, v }) => (
              <div key={k}>
                {k} - {v}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
