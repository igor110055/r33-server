import { getCompanionTypeId } from './nfts';
import {
  uncommonOrangeCompanionData,
  uncommonTealCompanionData,
  commonBlueCompanion,
} from '../mocks/companionData';

// TODO fix these, they're failing because they need to be formatted first
test('Get Rarity ID', () => {
  expect(getCompanionTypeId(uncommonTealCompanionData)).toBe('uncommon_teal');
  expect(getCompanionTypeId(uncommonOrangeCompanionData)).toBe('uncommon_orange');
  expect(getCompanionTypeId(commonBlueCompanion)).toBe('common_white');
});
