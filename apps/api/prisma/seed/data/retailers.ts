import { LaunchStatus, RetailerType } from '@prisma/client';

export const retailers = [
  {
    countryCode: 'KR',
    name: 'GS25',
    slug: 'gs25',
    retailerType: RetailerType.convenience_store,
    launchStatus: LaunchStatus.active,
    displayOrder: 1,
  },
  {
    countryCode: 'KR',
    name: 'CU',
    slug: 'cu',
    retailerType: RetailerType.convenience_store,
    launchStatus: LaunchStatus.active,
    displayOrder: 2,
  },
  {
    countryCode: 'KR',
    name: '세븐일레븐',
    slug: 'seven-eleven',
    retailerType: RetailerType.convenience_store,
    launchStatus: LaunchStatus.active,
    displayOrder: 3,
  },
  {
    countryCode: 'KR',
    name: '이마트24',
    slug: 'emart24',
    retailerType: RetailerType.convenience_store,
    launchStatus: LaunchStatus.active,
    displayOrder: 4,
  },
  {
    countryCode: 'KR',
    name: 'Costco',
    slug: 'costco',
    retailerType: RetailerType.warehouse,
    launchStatus: LaunchStatus.coming_soon,
    displayOrder: 5,
  },
  {
    countryCode: 'KR',
    name: '트레이더스',
    slug: 'traders',
    retailerType: RetailerType.warehouse,
    launchStatus: LaunchStatus.coming_soon,
    displayOrder: 6,
  },
];
