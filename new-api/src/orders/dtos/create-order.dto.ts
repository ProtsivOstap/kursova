export class CreateOrderDto {
  parts: PartOrder[];
}

export type PartOrder = {
  partNumber?: string;
  carModelName?: string;
  carBrand?: string;
  carModelYear?: number;
  generalPartName?: string;
  partGroupName?: string;
  specificPartName?: string;
};
