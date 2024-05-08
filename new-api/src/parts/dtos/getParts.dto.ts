export class GetPartsDto {
  limit: number;
  page: number;
  partNumber?: string;
  partId?: string;
  specificPartName?: string;
  partGroupName?: string;
  generalPartName?: string;
  carModelName?: string;
  carModelYear?: string;
  carBrand?: string;
}
