## Integrating the code example
1.  Copy over attrace.ts into your project.
2.  Add `@ethersproject/bignumber` to your frontend dependencies.
3.  Instantiate a query class and pass in your RPC provider url:
```
const q = new AttraceQuery(chainId, `https://mainnet.infura.io/v3/${infuraKey}`);
```
4.  You can now use all the functions of the class, as shown in [main.ts](./main.ts).

## Running the example:
```
yarn
yarn parcel example.html
```