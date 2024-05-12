export class GetSuppliersDto {
  partNumber?: string;
  specificPartName?: string;
  partGroupName?: string;
  generalPartName?: string;
  supplierName?: string;
  orderBy?: string;
  limit: number;
  page: number;
}
