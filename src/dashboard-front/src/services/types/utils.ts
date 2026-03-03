export interface ICountAndResults<R> {
  count: number
  results: R[]
}

export type IExtractResults<R extends ICountAndResults<unknown>> = R['results'][number];
