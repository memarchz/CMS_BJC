E('f').onsubmit=e=>{
  e.preventDefault();const err=m=>{E('err').textContent=m;E('err').classList.remove('hidden')};E('err').classList.add('hidden');
  const d={company:E('company').value.trim(),taxId:E('taxId').value.trim(),contact:E('contact').value.trim(),phone:E('phone').value.trim(),email:E('email').value.trim(),pw:E('pw').value};
  if(!/^\d{13}$/.test(d.taxId))return err('เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก');
  if(d.pw.length<8)return err('รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร');
  if(d.pw!=E('pw2').value)return err('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
  const r=Auth.register(d);if(r.error)return err(r.error);location.href=Auth.home('supplier');
};
