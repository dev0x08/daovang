import { Card, Cell, createTreasures, dirs, GOLD_MINE_MAP, isValidPlacement, reachableFromEntrance } from './game';

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
  ['crossDead', ['U', 'R', 'D', 'L']],
  ['nwDead', ['D']],
  ['seDead', ['U']],
  ['swDead', ['U']],
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

// Mỗi lần tạo trận phải luôn có đúng một kho báu thật trong ba vị trí.
for(let i=0;i<30;i++){
 const treasures=createTreasures(GOLD_MINE_MAP);
 if(treasures.length!==3||treasures.filter(t=>t.isGold).length!==1)throw new Error('Bản đồ phải có đúng 1 kho báu thật và 2 rương giả.');
}

// Góc cụt chỉ nhận kết nối ở đầu mở; nét cụt bên trong không phải một cửa ghép.
{
 const board=emptyBoard();
 board[3][1]={card:card('v'),owner:'test'};
 if(!isValidPlacement(board,card('nwDead'),2,1,GOLD_MINE_MAP,[]))throw new Error('Góc trên trái cụt phải nối được ở cạnh dưới.');
 board[3][1]=null;
 board[2][2]={card:card('h'),owner:'test'};
 if(isValidPlacement(board,card('nwDead'),2,1,GOLD_MINE_MAP,[]))throw new Error('Đầu cụt phía phải không được xem là cửa nối.');
}

// Lá cụt vẫn có cửa ngoài để ghép cạnh, nhưng không được truyền đường qua tâm.
{
 const board=emptyBoard();
 board[2][0]={card:card('h'),owner:'test'};
 board[2][1]={card:card('crossDead'),owner:'test'};
 board[2][2]={card:card('h'),owner:'test'};
 const reachable=reachableFromEntrance(board,GOLD_MINE_MAP);
 if(!reachable.has('2,1'))throw new Error('Lá Ngã tư cụt phải nhận được đường từ cửa hầm.');
 if(reachable.has('2,2'))throw new Error('Lá Ngã tư cụt không được truyền đường qua tâm.');
}

// Hai lá chỉ chạm nhau bằng cạnh đóng không tạo thành một đường nối hợp lệ.
{
 const board=emptyBoard();board[4][5]={card:card('v'),owner:'test'};
 if(isValidPlacement(board,card('v'),4,6,GOLD_MINE_MAP,[]))throw new Error('Không được xếp hai đường dọc cạnh nhau bằng hai cạnh đóng.');
}

// Sau khi lá gốc bị phá, nhánh cô lập không được dùng làm điểm neo để đặt tiếp.
{
 const board=emptyBoard();
 board[2][1]={card:card('h'),owner:'test'};
 if(isValidPlacement(board,card('h'),2,2,GOLD_MINE_MAP,[]))throw new Error('Không được nối tiếp từ một nhánh đã mất kết nối với Cửa hầm.');
}

// Ô ngay Cửa hầm bắt buộc phải mở cạnh trái, dù có khớp với lá trên/dưới.
{
 const board=emptyBoard();
 board[1][0]={card:card('v'),owner:'test'};
 if(isValidPlacement(board,card('v'),2,0,GOLD_MINE_MAP,[]))throw new Error('Lá tại ô Cửa hầm không mở cạnh trái phải bị từ chối.');
 board[1][0]=null;
 if(!isValidPlacement(board,card('h'),2,0,GOLD_MINE_MAP,[]))throw new Error('Lá mở đúng cạnh Cửa hầm phải đặt được.');
}

// Một nhánh từng bị cô lập được phép hoạt động lại sau khi có lá nối nó về Cửa hầm.
{
 const board=emptyBoard();
 board[2][0]={card:card('h'),owner:'test'};
 board[2][2]={card:card('h'),owner:'test'};
 if(!isValidPlacement(board,card('h'),2,1,GOLD_MINE_MAP,[]))throw new Error('Phải cho phép đặt lá cầu nối để nối lại nhánh cô lập với Cửa hầm.');
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
