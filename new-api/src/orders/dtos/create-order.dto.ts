export class CreateOrderDto {
  parts: PartOrder[];
}

export type PartOrder = {
  partCode?: string;
  carModel?: string;
  carBrand?: string;
  carYear?: number;
  generalPartName?: string;
  partGroupName?: string;
  specificPartName?: string;
};
