// Normalized book type for all providers
export type NormalizedBook = {
  title: string;
  author: string;
  image: string;
  link: string;
  orderDate: string;
  usagePeriod: string;
};

export type KyoboBook = {
  mmbrNum: string;
  nowBook: unknown;
  endBook: unknown;
  acmBook: unknown;
  allBook: unknown;
  myBsh: unknown;
  saleCmdtid: string;
  ordrSaleCmdtid: string;
  hgrnSaleCmdtid: string | null;
  rentYsno: string;
  srisYsno: string | null;
  cmdtHnglName: string;
  cmdtChrcName: string;
  pbcmName: string;
  imgUrl: string;
  dgctSaleFrDvsnCode: string;
  dgctSaleFrDvsnName: string;
  cnt: number | null;
  remaNmtm: number;
  remaNmtmStr: string;
  dgctFnrdRate: number;
  dgctSaleCmdtDvsnCode: string;
  dgctSaleCmdtDvsnName: string | null;
  dgctSaleCmdtDvsnBksCont: unknown;
  dgctCmdtDsplClstCode: string | null;
  dgctCmdtDsplClstName: string | null;
  dgctCmdtDsplClstBksCont: unknown;
  bksCmdtcode: string;
  bksSubCmdtcode: string;
  ordrId: string;
  dgctOrdrCmdtSrmb: string;
  samYsno: string;
  grpCodeNm: string | null;
  grpCode: string;
  subBookCnt: number;
  srsBookCnt: number;
  buyDate: string;
  rprsSaleCmdtid: string;
  dgctOrdrPatrCode: string;
  dgctElbCmdtCdtnCode: string;
  dgctSaleCmdtGrpCode: string;
  dgctUseSttgDttm: string;
  dgctUseEndDttm: string | null;
  dgctLastRdngDttm: string | null;
  downEndDttm: string | null;
  downEndYsno: string | null;
  splmYsno: string;
  webvwYsno: string;
  artlNum: string | null;
};
export type AladinBook = {
  title: string;
  author: string;
  image: string;
  link: string;
  orderDate: string;
  usagePeriod: string;
};

export type RidiBook = {
  b_id: string;
  purchase_date: string;
  expire_date: string;
  service_type: string;
  is_ridiselect: boolean;
  remain_time: string;
  unit_count: number;
  unit_id: number;
  unit_title: string;
  unit_type: string;
  unit_type_int: number;
};

export type RidiBookListResponse = {
  items: RidiBook[];
  server_info: {
    server_date: string;
  };
};

export type KyoboBookListResponse = {
  data: KyoboBook[];
  statusCode: number;
  resultCode: string | null;
  resultMessage: string;
  detailMessage: string;
};
