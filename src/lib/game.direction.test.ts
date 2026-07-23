import { Card, Cell, dirs, GOLD_MINE_MAP, isValidPlacement } from './game';

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

const card=(kind:Card['kind'],rotation=0):Card=>({id:String(Math.random()),type:'path',kind,label:String(kind),rotation});
const emptyBoard=():Cell[][]=>Array.from({length:GOLD_MINE_MAP.rows},()=>Array<Cell>(GOLD_MINE_MAP.cols).fill(null));

// Hai lá chỉ chạm nhau bằng cạnh đóng không tạo thành một đường nối hợp lệ.
{
 const board=emptyBoard();board[4][5]={card:card('v'),owner:'test'};
 if(isValidPlacement(board,card('v'),4,6,GOLD_MINE_MAP,[]))throw new Error('Không được xếp hai đường dọc cạnh nhau bằng hai cạnh đóng.');
}

// Một cửa mở khớp với cửa mở kế bên vẫn phải hợp lệ.
{
 const board=emptyBoard();board[2][0]={card:card('h'),owner:'test'};
 if(!isValidPlacement(board,card('h'),2,1,GOLD_MINE_MAP,[]))throw new Error('Hai đường ngang có cửa R-L khớp nhau phải hợp lệ.');
}

// Chỉ một cạnh sai trong số nhiều hàng xóm cũng phải từ chối toàn bộ nước đi.
{
 const board=emptyBoard();board[2][0]={card:card('h'),owner:'test'};board[1][1]={card:card('v'),owner:'test'};
 if(isValidPlacement(board,card('h'),2,1,GOLD_MINE_MAP,[]))throw new Error('Không được chấp nhận lá có một cạnh tiếp xúc không khớp.');
}
