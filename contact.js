(function(){
  'use strict';
  const form=document.getElementById('contactForm');
  if(!form)return;
  const button=document.getElementById('contactSubmit');
  const status=document.getElementById('contactStatus');
  const endpoint=window.BK_SETTINGS?.formEndpoint||form.action;
  let submitting=false;
  form.addEventListener('submit',async(event)=>{
    event.preventDefault();
    if(submitting)return;
    if(!form.checkValidity()){form.reportValidity();return;}
    submitting=true;button.disabled=true;button.textContent='Sending…';status.textContent='Sending your message.';status.className='contact-status';
    const data=new FormData(form);data.append('submittedAt',new Date().toISOString());
    try{
      const response=await fetch(endpoint,{method:'POST',body:data,headers:{Accept:'application/json'}});
      if(!response.ok)throw new Error('Submission was not accepted');
      form.reset();status.textContent='Thank you—your message was sent. I’ll reply within 24–48 hours.';status.className='contact-status is-success';button.textContent='Message Sent';
    }catch(_){submitting=false;button.disabled=false;button.textContent='Try Again';status.innerHTML='The message could not be sent. Please try again or email <a href="mailto:contact@fuscomedia.com">contact@fuscomedia.com</a>.';status.className='contact-status is-error';}
  });
}());
