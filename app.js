const lessons=[...document.querySelectorAll('.lesson')];
const nav=document.querySelector('#lessonNav');
const dots=document.querySelector('#dots');
const next=document.querySelector('#next');
const prev=document.querySelector('#prev');
const bar=document.querySelector('#progressBar');
const label=document.querySelector('#progressLabel');
let current=0;
const courseStartedAt=Date.now();
let latestScore=0;

lessons.forEach((lesson,index)=>{
  const button=document.createElement('button');
  button.textContent=`${String(index+1).padStart(2,'0')}  ${lesson.dataset.title}`;
  button.addEventListener('click',()=>show(index));
  nav.appendChild(button);
  const dot=document.createElement('i');
  dots.appendChild(dot);
});

function show(index){
  current=Math.max(0,Math.min(lessons.length-1,index));
  lessons.forEach((lesson,i)=>lesson.classList.toggle('active',i===current));
  [...nav.children].forEach((item,i)=>item.classList.toggle('active',i===current));
  [...dots.children].forEach((item,i)=>item.classList.toggle('active',i===current));
  label.textContent=`${current+1} of ${lessons.length}`;
  bar.style.width=`${((current+1)/lessons.length)*100}%`;
  prev.disabled=current===0;
  next.disabled=current===lessons.length-1;
  next.textContent=current===lessons.length-2?'Knowledge check':'Next lesson';
  window.scrollTo({top:0,behavior:'smooth'});
}

next.addEventListener('click',()=>show(current+1));
prev.addEventListener('click',()=>show(current-1));
document.addEventListener('keydown',event=>{
  if(event.key==='ArrowRight')show(current+1);
  if(event.key==='ArrowLeft')show(current-1);
});

document.querySelector('#quizForm').addEventListener('submit',event=>{
  event.preventDefault();
  const form=event.currentTarget;
  const formData=new FormData(form);
  const feedback=document.querySelector('#feedback');
  const completion=document.querySelector('#completion');
  const answers={q1:'b',q2:'b',q3:'c',q4:'c',q5:'c'};
  const explanations={q1:'Part 3.3 coordinates surface water, subsoil water and stormwater drainage.',q2:'The general requirement is 50 mm over the first metre. The 25 mm provision only applies in specified conditions.',q3:'A required subsoil drain needs a uniform fall of at least 1:300.',q4:'A 90 mm Class 6 UPVC stormwater drain beneath soil requires at least 100 mm of cover.',q5:'The full water pathway must be verified, including falls, clearances, overflow behaviour and lawful discharge.'};
  let score=0;
  let unanswered=0;
  Object.entries(answers).forEach(([question,correctAnswer])=>{
    const fieldset=form.querySelector(`[data-question="${question}"]`);
    const response=formData.get(question);
    const questionFeedback=fieldset.querySelector('.question-feedback');
    const isCorrect=response===correctAnswer;
    if(!response)unanswered+=1;
    if(isCorrect)score+=1;
    fieldset.classList.toggle('correct',isCorrect);
    fieldset.classList.toggle('incorrect',!isCorrect);
    questionFeedback.hidden=false;
    questionFeedback.textContent=isCorrect?`Correct. ${explanations[question]}`:`Review this point. ${explanations[question]}`;
  });
  feedback.hidden=false;
  if(unanswered){
    feedback.className='feedback bad';
    feedback.textContent=`Please answer all five questions. ${unanswered} ${unanswered===1?'question is':'questions are'} still unanswered.`;
    completion.hidden=true;
    document.querySelector('#betaFeedback').hidden=true;
  }else if(score>=4){
    feedback.className='feedback good';
    feedback.textContent=`You scored ${score} out of 5. You have demonstrated a practical understanding of the Part 3.3 drainage framework.`;
    completion.hidden=false;
    document.querySelector('#betaFeedback').hidden=false;
    latestScore=score;
    localStorage.setItem('buildcompass-part33-complete','true');
  }else{
    feedback.className='feedback bad';
    feedback.textContent=`You scored ${score} out of 5. Review the explanations above, then try again. You need four correct answers to complete the learning.`;
    completion.hidden=true;
    document.querySelector('#betaFeedback').hidden=true;
  }
  feedback.scrollIntoView({behavior:'smooth',block:'center'});
});

document.querySelector('#feedbackForm').addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.currentTarget;
  const data=new FormData(form);
  const button=form.querySelector('button[type="submit"]');
  const status=document.querySelector('#feedbackStatus');
  const minutes=Math.max(1,Math.round((Date.now()-courseStartedAt)/60000));
  const fields=[
    ['Name',data.get('name')],['Email',data.get('email')],['Role',data.get('role')],['Industry experience',data.get('experience')],
    ['Quiz score',`${latestScore} out of 5`],['Completion time',`${minutes} minute${minutes===1?'':'s'}`],
    ['Learning clarity',data.get('clarity')],['Module length',data.get('length')],['Question quality',data.get('questions')],
    ['Most useful',data.get('useful')],['Suggested improvements',data.get('improve')],['Paid learning interest',data.get('paid_interest')],
    ['Follow-up permitted',data.get('follow_up')||'No'],['Device',navigator.userAgent]
  ];
  const submission=Object.fromEntries(fields);
  submission._subject=`BuildCompass beta feedback: ${data.get('name')}`;
  submission._template='table';
  submission._captcha='false';
  button.disabled=true;
  button.textContent='Sending feedback...';
  status.className='form-status';
  status.textContent='Sending your feedback securely to BuildCompass.';
  try{
    const response=await fetch('https://formsubmit.co/ajax/info@buildcompass.com.au',{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify(submission)
    });
    if(!response.ok)throw new Error('Feedback service unavailable');
    status.className='form-status good';
    status.textContent='Thank you. Your feedback has been sent to BuildCompass.';
    form.reset();
  }catch(error){
    status.className='form-status bad';
    status.textContent='Your feedback could not be sent. Please try again or email info@buildcompass.com.au.';
  }finally{
    button.disabled=false;
    button.textContent='Send feedback';
  }
});

show(0);
