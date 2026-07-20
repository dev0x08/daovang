import { dirs } from './game';

const same = (actual: string[], expected: string[]) =>
  actual.length === expected.length && expected.every(direction => actual.includes(direction as never));

const cases: Array<[Parameters<typeof dirs>[0], string[]]> = [
  ['ne', ['D', 'L']], // Góc trên phải: góc nằm phía trên-phải, lối mở xuống và trái.
  ['nw', ['D', 'R']], // Góc trên trái: lối mở xuống và phải.
  ['se', ['U', 'L']], // Góc dưới phải: lối mở lên và trái.
  ['sw', ['U', 'R']], // Góc dưới trái: lối mở lên và phải.
  ['tLeft', ['U', 'D', 'L']],
  ['tRight', ['U', 'D', 'R']],
  ['v', ['U', 'D']],
];

for (const [kind, expected] of cases) {
  const actual = dirs(kind, 0);
  if (!same(actual, expected)) {
    throw new Error(`${kind}: expected ${expected.join(',')} but received ${actual.join(',')}`);
  }
}

// Ba mảnh này đều phải có cửa U để đặt ngay bên dưới Ngã ba trái.
for (const kind of ['se', 'tRight', 'v'] as const) {
  if (!dirs(kind, 0).includes('U')) {
    throw new Error(`${kind} phải mở hướng U để ghép bên dưới Ngã ba trái.`);
  }
}
