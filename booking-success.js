(function(){
  'use strict';
  let receipt=null;
  try{receipt=JSON.parse(sessionStorage.getItem('bfmBookingReceipt'));}catch(_){receipt=null;}
  const queryRef=new URLSearchParams(location.search).get('ref')||'';
  if(!receipt){receipt={reference:queryRef||'Check your confirmation screen',firstName:'',service:'Booking request',title:'Request submitted',dateDisplay:'See your submitted request',date:'',time:'',timezone:'America/Toronto'};}
  const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value||'—';};
  document.getElementById('successName').textContent=receipt.firstName?`, ${receipt.firstName}`:'';
  set('successReference',receipt.reference||queryRef);set('successService',receipt.service);set('successPackage',receipt.title);set('successDate',receipt.dateDisplay);set('successTime',receipt.time?`${receipt.time} · Eastern Time`:null);
  document.getElementById('manageRequest').href=`booking-manage.html?ref=${encodeURIComponent(receipt.reference||queryRef)}&email=${encodeURIComponent(receipt.email||'')}`;
  document.getElementById('copyReference').addEventListener('click',async(event)=>{try{await navigator.clipboard.writeText(receipt.reference||queryRef);event.currentTarget.textContent='Copied';}catch(_){event.currentTarget.textContent='Select and copy';}});

  function calendarRange(){
    if(!receipt.date)return null;
    let startHour=9,startMinute=0;
    const match=String(receipt.time||'').match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if(match){startHour=Number(match[1])%12+(match[3].toUpperCase()==='PM'?12:0);startMinute=Number(match[2]);}
    else if(/afternoon/i.test(receipt.time||''))startHour=13;else if(/evening/i.test(receipt.time||''))startHour=17;
    const start=`${receipt.date.replaceAll('-','')}T${String(startHour).padStart(2,'0')}${String(startMinute).padStart(2,'0')}00`;
    const duration=/real-estate-photos/i.test(receipt.packageId||'')?120:/real-estate/i.test(receipt.packageId||'')?180:/maxi/i.test(receipt.packageId||'')?60:/midi/i.test(receipt.packageId||'')?30:/mini/i.test(receipt.packageId||'')?15:60;
    const date=new Date(`${receipt.date}T${String(startHour).padStart(2,'0')}:${String(startMinute).padStart(2,'0')}:00`);date.setMinutes(date.getMinutes()+duration);
    const end=`${receipt.date.replaceAll('-','')}T${String(date.getHours()).padStart(2,'0')}${String(date.getMinutes()).padStart(2,'0')}00`;
    return{start,end};
  }
  const range=calendarRange();
  const google=document.getElementById('googleCalendar');
  if(range){const q=new URLSearchParams({action:'TEMPLATE',text:`TENTATIVE — ${receipt.title} request`,dates:`${range.start}/${range.end}`,ctz:'America/Toronto',details:`Booking request ${receipt.reference}. This is a tentative hold and is not confirmed until approved by Ben Fusco Media.`,location:'Ottawa / Gatineau area — final location pending'});google.href=`https://calendar.google.com/calendar/render?${q}`;}else{google.hidden=true;document.getElementById('downloadCalendar').hidden=true;}
  document.getElementById('downloadCalendar').addEventListener('click',()=>{if(!range)return;const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Ben Fusco Media//Booking Request//EN','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:${receipt.reference}@benfusco.com`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,`DTSTART;TZID=America/Toronto:${range.start}`,`DTEND;TZID=America/Toronto:${range.end}`,`SUMMARY:TENTATIVE — ${receipt.title} request`,`DESCRIPTION:Booking request ${receipt.reference}. This is not confirmed until approved by Ben Fusco Media.`,'STATUS:TENTATIVE','END:VEVENT','END:VCALENDAR'].join('\r\n');const blob=new Blob([ics],{type:'text/calendar;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${receipt.reference||'booking-request'}.ics`;a.click();URL.revokeObjectURL(url);});
}());
