export type RoomKind = "living" | "kitchen" | "bedroom" | "office" | "nursery" | "bath" | "hall";
export type PlanRoom = { id: string; name: string; short: string; kind: RoomKind; x: number; z: number; w: number; d: number; note: string };
export type Apartment = { id: string; name: string; subtitle: string; area: number; w: number; d: number; rooms: PlanRoom[] };
export const apartments: Apartment[] = [
 {id:"morning",name:"Тихое утро",subtitle:"Компактная квартира",area:42,w:7,d:6,rooms:[
  {id:"living",name:"Гостиная",short:"Гостиная",kind:"living",x:0,z:0,w:4.6,d:3.8,note:"Мягкий диван, кресло и место для вечеров вместе."},
  {id:"kitchen",name:"Кухня",short:"Кухня",kind:"kitchen",x:4.6,z:0,w:2.4,d:2.6,note:"Всё под рукой: рабочая поверхность, хранение и стол на двоих."},
  {id:"bedroom",name:"Спальня",short:"Спальня",kind:"bedroom",x:0,z:3.8,w:4.6,d:2.2,note:"Спокойная палитра и мягкий свет для отдыха."},
  {id:"bath",name:"Ванная",short:"Ванная",kind:"bath",x:4.6,z:2.6,w:2.4,d:1.8,note:"Душевая, подвесная тумба и тактильный камень."},
  {id:"hall",name:"Прихожая",short:"Холл",kind:"hall",x:4.6,z:4.4,w:2.4,d:1.6,note:"Удобное хранение у входа и свободный проход."}]},
 {id:"balance",name:"Тёплый баланс",subtitle:"Квартира с кабинетом",area:68,w:8.5,d:8,rooms:[
  {id:"living",name:"Гостиная",short:"Гостиная",kind:"living",x:0,z:0,w:5.2,d:3.5,note:"Большой диван, мягкий ковёр и свет у окна."},
  {id:"kitchen",name:"Кухня-столовая",short:"Кухня",kind:"kitchen",x:5.2,z:0,w:3.3,d:3.5,note:"Обеденный стол объединяет кухню и семейные ритуалы."},
  {id:"hall",name:"Галерея",short:"Галерея",kind:"hall",x:0,z:3.5,w:8.5,d:1.2,note:"Открытая связь между всеми комнатами квартиры."},
  {id:"bedroom",name:"Спальня",short:"Спальня",kind:"bedroom",x:0,z:4.7,w:3.5,d:3.3,note:"Двуспальная кровать, тумбы и место для хранения."},
  {id:"office",name:"Кабинет",short:"Кабинет",kind:"office",x:3.5,z:4.7,w:3,d:3.3,note:"Рабочее место и отдельный уголок для чтения."},
  {id:"bath",name:"Ванная",short:"Ванная",kind:"bath",x:6.5,z:4.7,w:2,d:3.3,note:"Тёплый камень, ванна и рассеянный свет."}]},
 {id:"family",name:"Больше вместе",subtitle:"Семейная квартира",area:94,w:10,d:9.4,rooms:[
  {id:"living",name:"Гостиная",short:"Гостиная",kind:"living",x:0,z:0,w:6,d:4,note:"Общее пространство для встреч, игр и неспешных выходных."},
  {id:"kitchen",name:"Кухня-столовая",short:"Кухня",kind:"kitchen",x:6,z:0,w:4,d:4,note:"Просторная кухня с островом и большим столом."},
  {id:"hall",name:"Галерея",short:"Галерея",kind:"hall",x:0,z:4,w:10,d:1.2,note:"Все комнаты связаны светлой центральной галереей."},
  {id:"bedroom",name:"Спальня",short:"Спальня",kind:"bedroom",x:0,z:5.2,w:3.8,d:4.2,note:"Личное пространство с большим гардеробом."},
  {id:"nursery",name:"Детская",short:"Детская",kind:"nursery",x:3.8,z:5.2,w:3.7,d:4.2,note:"Место для сна, творчества и новых открытий."},
  {id:"bath",name:"Ванная",short:"Ванная",kind:"bath",x:7.5,z:5.2,w:2.5,d:4.2,note:"Ванна у стены и просторная зона умывания."}]}
];
export const palettes=[{id:"sage",name:"Шалфей",color:"#a7b69d"},{id:"sand",name:"Песок",color:"#c9b496"},{id:"rose",name:"Роза",color:"#cba9a2"},{id:"blue",name:"Туман",color:"#a0b5c1"}];
export const floors=[{id:"oak",name:"Светлый дуб",color:"#cfb38d"},{id:"walnut",name:"Орех",color:"#967554"},{id:"stone",name:"Микроцемент",color:"#c3c2b9"}];
export type Finish = {palette:string;floor:string};
export type ObjectTransform = {dx:number;dz:number;rotation:number;hidden:boolean};
export type ApartmentDesign = {rooms:Record<string,Finish>;objects:Record<string,ObjectTransform>};
export type Designs = Record<string,ApartmentDesign>;
export type ObjectInfo = {id:string;name:string;roomId:string;x:number;z:number;w:number;d:number;rotation:number};
export const defaultTransform:ObjectTransform={dx:0,dz:0,rotation:0,hidden:false};
export function createDesigns():Designs {return Object.fromEntries(apartments.map((a,i)=>[a.id,{rooms:Object.fromEntries(a.rooms.map(r=>[r.id,{palette:i===2?"sand":r.kind==="bedroom"?"rose":"sage",floor:r.kind==="bath"?"stone":"oak"}])),objects:{}}]));}
export function validDesigns(input:unknown):input is Designs {
 if(!input||typeof input!=="object")return false;
 for(const a of apartments){const d=(input as Designs)[a.id];if(!d?.rooms||!d.objects||typeof d.objects!=="object"||Array.isArray(d.objects))return false;
  for(const r of a.rooms){const f=d.rooms[r.id];if(!f||!palettes.some(p=>p.id===f.palette)||!floors.some(p=>p.id===f.floor))return false;}
  if(Object.keys(d.objects).length>100)return false;
  for(const [key,t] of Object.entries(d.objects)){if(!/^[a-z]+:[a-z0-9-]+$/.test(key)||!t||![t.dx,t.dz,t.rotation].every(Number.isFinite)||Math.abs(t.dx)>12||Math.abs(t.dz)>12||Math.abs(t.rotation)>3600||typeof t.hidden!=="boolean")return false;}
 }return true;
}
export function roomArea(r:PlanRoom){return (r.w*r.d).toLocaleString("ru-RU",{maximumFractionDigits:1});}
