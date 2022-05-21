import { getCompanionTypeId } from './nfts';
import {
  uncommonOrangeCompanionData,
  uncommonTealCompanionData,
  commonBlueCompanion,
  commonRedCompanion,
  commonWhiteCompanion,
  mythicCompanion,
  rareCompanion,
} from '../mocks/companionData';

test('Get Rarity ID should return the proper rarity id key', () => {
  expect(getCompanionTypeId(commonBlueCompanion)).toBe('common_blue');
  expect(getCompanionTypeId(commonWhiteCompanion)).toBe('common_white');
  expect(getCompanionTypeId(commonRedCompanion)).toBe('common_red');
  expect(getCompanionTypeId(uncommonTealCompanionData)).toBe('uncommon_teal');
  expect(getCompanionTypeId(uncommonOrangeCompanionData)).toBe('uncommon_orange');
  expect(getCompanionTypeId(mythicCompanion)).toBe('mythic');
  expect(getCompanionTypeId(rareCompanion)).toBe('rare');
});
