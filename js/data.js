const f=(k,l,t,r,p,o)=>({k,l,t:t||'text',r:r||'r',p:p||'',o:o||[]});
const O=(...a)=>a;
const only=(x,...r)=>(x.only=r,x);
const CATS={
  'Chiller':[],
  'Cooling tower':[],
  'Air condition / AHU':[],
  'Refrigeration system':[],
  'Electrical system':['Lighting','Transformer','Generator','Cap bank','SVG','อื่นๆ (etc)'],
  'Safety Equipment':['CCTV','EAS','Fire protection','Fire pump','Gas detector','Smoke detector','อื่นๆ (etc)'],
  'Waste water System':['Submerge pump','อื่นๆ (etc)'],
  'Super Equipment':['Bakery Equipment','Delica Equipment','Butchery Equipment','Sea food Equipment','Produce Equipment','อื่นๆ (etc)'],
  'General Homeuse Equipment':[],
  'LED signage':[],
  'Logistic Equipment':['Overhead door','Dock leveler','Dock shelter','Basket washing machine','Conveyor','อื่นๆ (etc)'],
  'Shopping Trolley':[],
  'Small Equipment':['Dish','Bowl','Spoon','อื่นๆ (etc)'],
  'Fork lift':[]
};
const CATN=Object.keys(CATS);
// ช่องที่ "ไม่เอา" ของแต่ละหมวด (อ้างอิงไฟล์ Fill_in_data_Category__All__-_021026.xlsx คอลัมน์ เอา/ไม่เอา)
// ถ้าหมวดไหนไม่อยู่ในรายการนี้ = แสดงทุกช่องตามปกติ
const CARBON=['ef','cprice','co2y','co2l','cval']; // คำนวณจาก Energy x ชม.ใช้งาน จึงซ่อนตามเมื่อไม่เอา Energy
const HIDE={
  'Super Equipment':['util','opc'],
  'General Homeuse Equipment':['util','opc','wExt','minStock','design','econ','resid','disp'],
  'Shopping Trolley':['cap','power','util','opc','maint','pm','cons','labor','energy','tco','esc',...CARBON],
  'Small Equipment':['cap','power','util','opc',
    'wStart','wEnd','wScope','wCond','wExt','sla','svc','train',
    'spDocs','spClass','spInt','minStock',
    'life','hrs','design','econ','overhaul','resid','eos','disp',
    'maint','pm','cons','labor','energy','tco','esc',...CARBON]
};
const STEPS=[
{id:1,title:'ทะเบียนทรัพย์สิน',roles:['buyer','admin'],groups:[
 {t:'Identity (ข้อมูลระบุตัวตน)',c:'bg-green-700',f:[
  f('assetCode','Asset Code','text','r','Auto-generate จาก SAP/Oracle เมื่อบันทึก','AUTO'),
  f('assetName','Asset Name','text','r','เช่น ตู้แช่เย็น Daikin'),
  only(f('category','Category','select','r','',CATN),'buyer','admin'),
  only(f('subCat','Sub Category','select','r','',[]),'buyer','admin'),
  f('brand','Brand/Manufacturer','text','r','เช่น Daikin, Samsung'),
  f('model','Model No.','text','r','เช่น FTV50QV1V'),
  f('serial','Serial No.','text','n','จาก Nameplate หรือกล่อง (ถ้ามี)'),
  f('mtnCode','MTN Asset Code (ใหม่)','text','r','Domain Nomenclature เช่น REF-1-1-0-001','')]},
 {t:'Location (สถานที่) และบัญชี',c:'bg-green-700',f:[
  f('company','Company','text','r','นิติบุคคล/บริษัทในกลุ่ม'),
  f('bu','Business Unit','select','r','',O('Retail','Factory','Warehouse','HO')),
  f('branch','Branch/Site Code','text','r','เช่น BKK-001'),
  f('floor','Floor/Area','text','r','เช่น B1/ห้องเครื่อง'),
  f('resp','Responsible Person','text','r','แผนกที่รับผิดชอบ'),
  f('cc','Cost Center','text','r','รหัส Cost Center ใน SAP'),
  f('gl','GL Account (ใหม่)','text','r','รหัสบัญชีแยกประเภท'),
  f('subAcc','Sub Account (ใหม่)','text','r','บัญชีย่อยใต้ GL'),
  f('wbs','WBS (ใหม่)','text','n','รหัสโครงการ (ถ้ามี)')]}]},
{id:2,title:'Supplier & สเปค',roles:['supplier','buyer','admin'],groups:[
 {t:'Supplier & Product Identity',c:'bg-green-700',f:[
  f('sup','Supplier Code / Name','text','r','รหัสคู่ค้า + ชื่อนิติบุคคลเต็ม'),
  only(f('category','Category','select','r','',CATN),'supplier'),
  only(f('subCat','Sub Category','select','r','',[]),'supplier'),
  f('po','Contract / PO No.','text','r','เลขสัญญา/ใบสั่งซื้อ'),
  f('mfr','Brand / Manufacturer','text','r','ยี่ห้อ + ประเทศผู้ผลิต'),
  f('series','Product Series','text','r','เช่น Inverter FTV Series'),
  f('model2','Model No.','text','r','รุ่นเต็มตาม Nameplate'),
  f('serial2','Serial No. / Batch','text','r','1 แถว = 1 เครื่อง (ห้ามซ้ำ)'),
  f('origin','Country of Origin','text','r','แหล่งผลิต'),
  f('mfgDate','MFG Date','month','r')]},
 {t:'Technical Specification',c:'bg-green-700',f:[
  f('cap','Capacity / Rating','text','r','เช่น 18000 BTU, 2.5 kW'),
  f('power','Power Requirement','text','r','เช่น 380V 3P 50Hz + kW'),
  f('util','Utility Requirement','text','n','น้ำ/ลม/ไอน้ำ/แก๊ส ต่อชั่วโมง'),
  f('dim','Dimension & Weight','text','r','กว้าง×ยาว×สูง (มม.) + กก.'),
  f('opc','Operating Condition','text','o','อุณหภูมิ/ความชื้น/สภาพแวดล้อม'),
  f('std','Standard & Certificate','text','r','มอก./CE/UL/ISO + เลขที่ใบรับรอง'),
  f('func','Functional Requirements (ใหม่)','textarea','n','ระบบทำอะไรได้บ้าง เช่น ฟีเจอร์ ปุ่มกด หรือขั้นตอนการใช้งาน (ถ้ามี)'),
  f('docs','Document Attachment','file','r','Catalog, Spec Sheet, Manual, Wiring/P&ID (PDF)')]}]},
{id:3,title:'ประกัน & อะไหล่',roles:['supplier','buyer','admin'],groups:[
 {t:'Warranty & Service Level',c:'bg-green-700',f:[
  f('wStart','Warranty Start','date','r'),
  f('wEnd','Warranty End','date','r'),
  f('wScope','Warranty Scope','select','r','',O('อะไหล่+ค่าแรง','เฉพาะอะไหล่','On-site','Return-to-base')),
  f('wCond','Warranty Condition & Exclusion','textarea','r','เงื่อนไขที่ทำให้ประกันสิ้นสุด เช่น ใช้อะไหล่นอก'),
  f('wExt','Extended Warranty Option (THB/ปี)','text','o','ราคาต่อประกันเพิ่ม ปีที่ 2-5'),
  f('sla','Response / Restore SLA (ชม.)','text','r','เช่น ตอบรับ 4 / แก้ไข 24'),
  f('svc','Service Center & Contact','text','r','ศูนย์บริการ + ชื่อ/เบอร์/อีเมล 24 ชม.'),
  f('train','Training & Commissioning','text','o','การอบรม + เอกสารส่งมอบงาน (ชม./ครั้ง)')]},
 {t:'Spare Parts & Consumables',c:'bg-green-700',f:[
  f('spDocs','Spare Part List (แนบไฟล์เอกสาร)','file','r','รหัสอะไหล่ ชื่อ ราคา Lead Time ฯลฯ (Excel/PDF)'),
  f('spClass','Part Classification','select','r','',O('Critical','Wear part','Consumable')),
  f('spCur','Currency','select','r','',O('THB','USD','JPY','EUR')),
  f('spInt','Replacement Interval (ชม./เดือน)','text','o','บางอย่างใช้งานได้ยาวนานกว่านี้'),
  f('lead','Lead Time (วัน)','text','r','ระยะเวลาสั่งซื้อจนได้รับ + Stock ไทย/ต่างประเทศ'),
  f('minStock','Min. Stock Recommend','number','o','จำนวนที่แนะนำให้สำรอง'),
  f('avail','Part Availability Guarantee (ปี)','number','r','รับประกันว่ายังมีอะไหล่จำหน่าย')]}]},
{id:4,title:'อายุใช้งาน & งบซ่อม',roles:['supplier','buyer','admin'],groups:[
 {t:'Useful Life & Lifecycle',c:'bg-green-700',f:[
  f('life','Useful Life (ปี)','number','r','อายุที่ผู้ผลิตแนะนำ'),
  f('hrs','สมมติฐานชั่วโมงใช้งาน/ปี','number','r','เช่น 8760'),
  f('design','Design Life / Duty Cycle','text','o','ชั่วโมงออกแบบรวม + รอบทำงานต่อวัน'),
  f('econ','Economic Life (ปี)','number','o'),
  f('overhaul','Major Overhaul Year','text','r','ปีที่ต้อง Overhaul ใหญ่ + ค่าใช้จ่าย'),
  f('resid','Expected Residual Value (%)','number','o','% ของราคาซื้อ'),
  f('eos','End-of-Support Year','number','r','ปีที่ผู้ผลิตหยุดสนับสนุน'),
  f('disp','Disposal / Recycle Guide','textarea','o','วิธีกำจัดซาก สารอันตราย การรีไซเคิล')]},
 {t:'Maintenance Budget Forecast',c:'bg-green-700',f:[
  f('price','ราคาซื้อ (THB)','number','r'),
  f('maint','Year 1-N Maintenance Cost (THB/ปี)','number','r','ประมาณการแยกรายปี ตลอดอายุ'),
  f('pm','PM Package Price','text','r','ราคา PM ต่อครั้ง/ปี + จำนวนครั้งที่แนะนำ'),
  f('cons','Consumable Cost/Year (THB)','number','r','ไส้กรอง น้ำมัน สารเคมี'),
  f('labor','Labor Rate (THB/ชม.)','number','o','นอกประกัน'),
  f('energy','Energy Consumption (kWh/ชม.)','number','o','เพื่อคำนวณค่าไฟตลอดอายุ'),
  f('esc','Price Escalation Assumption (%)','number','o','ปรับราคาต่อปี'),
  f('tco','Total Cost of Ownership (Auto)','calc','c','ราคาซื้อ + ค่าบำรุงรักษา + พลังงาน − มูลค่าซาก')]},
 {t:'Carbon Credit (ใหม่)',c:'bg-green-700',f:[
  f('ef','Emission Factor (kgCO₂e/kWh)','number','o','',0.4999),
  f('cprice','ราคา Carbon Credit (THB/tCO₂e)','number','o','เช่น 200'),
  f('co2y','คาร์บอนที่ปล่อย (tCO₂e/ปี)','calc','c'),
  f('co2l','คาร์บอนตลอดอายุ (tCO₂e)','calc','c'),
  f('cval','มูลค่า Carbon Credit ที่ต้องชดเชย (THB)','calc','c')]}]}
];
const S={assetName:'ตู้แช่เย็น Daikin',category:'Refrigeration system',subCat:'',brand:'Daikin',model:'FTV50QV1V',serial:'DK26X001234',mtnCode:'REF-1-1-0-001',
company:'บริษัท ตัวอย่างรีเทล จำกัด',bu:'Retail',branch:'BKK-001',floor:'B1/ห้องเครื่อง',resp:'แผนกวิศวกรรม',cc:'CC-100245',gl:'1210-0100',subAcc:'1210-0101',wbs:'P-2026-BKK-001',
sup:'SUP-00123 / บริษัท ไดกิ้น (ประเทศไทย) จำกัด',po:'PO-2026-004512',mfr:'Daikin, Japan',series:'Inverter FTV Series',model2:'FTV50QV1V',serial2:'DK26X001234',origin:'Japan',mfgDate:'2026-03',
cap:'18000 BTU / 2.5 kW',power:'380V 3P 50Hz / 2.5 kW',util:'น้ำหล่อเย็น 0.5 ลบ.ม./ชม.',dim:'900×320×290 มม. / 38 กก.',opc:'0-43°C, RH ≤ 85%',std:'มอก. 1155 / CE / ISO 9001 เลขที่ TH-2026-0456',
func:'ปรับอุณหภูมิ 16-30°C, โหมดประหยัดพลังงาน, ตั้งเวลาเปิด-ปิด, รีโมทและปุ่มกดบนตัวเครื่อง, แจ้งเตือนรหัสข้อผิดพลาด',docs:'Daikin_Catalog.pdf, FTV50_Manual.pdf',
wStart:'2026-04-01',wEnd:'2029-03-31',wScope:'อะไหล่+ค่าแรง',wCond:'ใช้อะไหล่ที่ไม่ใช่ของแท้ หรือซ่อมโดยช่างนอกศูนย์',wExt:'12,000 / ปี',sla:'ตอบรับ 4 / แก้ไข 24',svc:'Daikin Service Bangkok / 02-123-4567 / service@daikin.co.th',train:'อบรมช่าง 4 ชม./ครั้ง + คู่มือส่งมอบ',
spDocs:'SparePartList_FTV50.xlsx',spClass:'Critical',spCur:'THB',spInt:'8,000 ชม.',lead:'30 (Stock ไทย)',minStock:2,avail:10,
life:10,hrs:8760,design:'87,600 ชม. / 24 ชม.ต่อวัน',econ:8,overhaul:'ปีที่ 6 / 80,000 THB',resid:10,eos:2038,disp:'ถ่ายสารทำความเย็นก่อนทิ้ง ส่งโรงงานรีไซเคิลที่ได้รับอนุญาต',
price:180000,maint:12000,pm:'2,500 / ครั้ง × 4 ครั้ง/ปี',cons:3500,labor:450,energy:2.5,esc:3,ef:0.4999,cprice:200};
