## Integrating the code example
1.  Copy over attrace.ts into your project.
2.  Add `@ethersproject/bignumber` to your frontend dependencies.
3.  Instantiate a query instance:
```
const q = new AttraceQuery();
```
4.  You can now use all the functions of the class, as shown in [main.ts](./main.ts).

## Running the example:
```
yarn
yarn parcel example.html
```