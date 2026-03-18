import cat620200 from './categories/620200.json';
import cat741000 from './categories/741000.json';
import cat620100Dev from './categories/620100-dev.json';
import cat620100Infra from './categories/620100-infra.json';
import catMkt from './categories/mkt.json';
import catSupport from './categories/support.json';
import catAdmin from './categories/admin.json';

export type ServiceItem = {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  unit: string;
  recurring: boolean;
};

export type Category = {
  id: string;
  name: string;
  description: string;
  items: ServiceItem[];
};

export const catalog: Category[] = [
  cat620200,
  cat741000,
  cat620100Dev,
  cat620100Infra,
  catMkt,
  catSupport,
  catAdmin
] as Category[];