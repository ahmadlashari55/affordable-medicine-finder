// SAMPLE DATA (static) — edit or expand as you like.
// MEDS: id, name, generic, price (number), priceText, brands, alternatives[], desc, expiry (YYYY-MM)
const MEDS = [
  {id:'m1',name:'Panadol',generic:'Paracetamol',price:25,priceText:'Rs.25 (10)',brands:['Panadol'],alternatives:['Paracet','Napa'],desc:'Analgesic & antipyretic',expiry:'2026-12',prescription:false},
  {id:'m2',name:'Augmentin',generic:'Amoxicillin + Clavulanic Acid',price:350,priceText:'Rs.350 (10)',brands:['Augmentin'],alternatives:['Amoclav'],desc:'Antibiotic - prescription required',expiry:'2025-06',prescription:true},
  {id:'m3',name:'Disprin',generic:'Aspirin',price:15,priceText:'Rs.15 (10)',brands:['Disprin'],alternatives:['Ecosprin'],desc:'Pain relief / blood thinner',expiry:'2027-01',prescription:false},
  {id:'m4',name:'Flagyl',generic:'Metronidazole',price:80,priceText:'Rs.80 (10)',brands:['Flagyl'],alternatives:['Metrogyl'],desc:'Antiprotozoal',expiry:'2026-03',prescription:true},
  {id:'m5',name:'Napa',generic:'Paracetamol',price:22,priceText:'Rs.22 (10)',brands:['Napa'],alternatives:['Panadol'],desc:'Generic paracetamol',expiry:'2026-08',prescription:false}
];

// PHARMACIES: id, name, city, address, verified, stock: {medId: qty}, contact (international format)
const PHARMS = [
  {id:'p1',name:'Sehat Pharmacy',city:'Lahore',address:'Model Town',verified:true,stock:{m1:20,m2:5},contact:'+92300111222',opening:'9:00-21:00'},
  {id:'p2',name:'Clinix Pharmacy',city:'Karachi',address:'Gulshan',verified:true,stock:{m1:50,m3:10},contact:'+92215554444',opening:'8:00-22:00'},
  {id:'p3',name:'Imtiaz Pharmacy',city:'Karachi',address:'North Nazimabad',verified:false,stock:{m4:12,m2:2},contact:'+92216667777',opening:'9:00-20:00'},
  {id:'p4',name:'D.Watson',city:'Islamabad',address:'F-6 Markaz',verified:true,stock:{m1:5,m5:40},contact:'+9251123456',opening:'10:00-20:00'},
  {id:'p5',name:'Servaid Pharmacy',city:'Multan',address:'New Garden',verified:false,stock:{m2:3,m3:9},contact:'+9261333222',opening:'9:00-19:00'}
];
