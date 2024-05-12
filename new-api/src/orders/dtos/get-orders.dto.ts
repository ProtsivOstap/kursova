export class GetOrdersDto {
  limit: number;
  page: number;
  generalPartName?: string;
  partGroupName?: string;
  specificPartName?: string;
  supplierName?: string;
  partNumber?: string;
  status?: string;
  clientLastName?: string;
  adminLastName?: string;
}
