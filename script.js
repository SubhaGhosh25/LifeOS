const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY="lifeos-v1";

const defaultData={
 tasks:[
  {id:1,title:"Wake up + morning walk",time:"4:30 AM",category:"Health",priority:"Low",done:true},
  {id:2,title:"Gym",time:"5:00 AM",category:"Health",priority:"Medium",done:true},
  {id:3,title:"Breakfast",time:"7:30 AM",category:"Personal",priority:"Low",done:true},
  {id:4,title:"Study DBMS",time:"9:00 AM",category:"Study",priority:"High",done:false},
  {id:5,title:"Lunch",time:"1:00 PM",category:"Personal",priority:"Low",done:false},
  {id:6,title:"College work",time:"3:00 PM",category:"College",priority:"Medium",done:false},
  {id:7,title:"Revision",time:"6:00 PM",category:"Study",priority:"High",done:false},
  {id:8,title:"Free time",time:"8:00 PM",category:"Personal",priority:"Low",done:false},
  {id:9,title:"Sleep",time:"10:30 PM",category:"Health",priority:"Low",done:false}
 ],
 habits:[
  {id:1,name:"Gym",icon:"🏋️",streak:12,done:true},
  {id:2,name:"Reading",icon:"📖",streak:6,done:true},
  {id:3,name:"Study",icon:"📚",streak:9,done:true},
  {id:4,name:"Meditation",icon:"🧘",streak:4,done:false},
  {id:5,name:"Drink Water",icon:"💧",streak:8,done:true}
 ],
 goals:[
  {id:1,title:"Complete JavaScript course",progress:80,deadline:"Mar 2027"},
  {id:2,title:"Build portfolio",progress:60,deadline:"Jun 2027"},
  {id:3,title:"Exercise 5 days per week",progress:70,deadline:"Ongoing"}
 ],
 notes:[
  {id:1,title:"Project ideas",body:"Build useful vanilla JavaScript projects and keep improving the portfolio.",date:"Today"},
  {id:2,title:"Study reminder",body:"Use focused 25-minute sessions and take short breaks.",date:"Yesterday"}
 ],
 routines:[
  {id:1,time:"5:00 AM",title:"Gym",meta:"Fitness • 60 min"},
  {id:2,time:"9:00 AM",title:"Study DBMS",meta:"Study • 90 min"},
  {id:3,time:"3:00 PM",title:"College work",meta:"College • 60 min"},
  {id:4,time:"6:00 PM",title:"Revision",meta:"Study • 60 min"}
 ],
 journal:[],
 focus:{minutes:0,sessions:0,history:[]},
 habitsHistory:{}
};

let data=JSON.parse(localStorage.getItem(KEY)||"null")||structuredClone(defaultData);
let currentPage="dashboard", taskFilter="all", currentMonth=new Date();
let timerSeconds=25*60, timerRunning=false, timerInterval=null, timerMode=25;

function save(){localStorage.setItem(KEY,JSON.stringify(data));}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200);}
function uid(){return Date.now()+Math.floor(Math.random()*1000)}
function todayKey(){return new Date().toISOString().slice(0,10)}
function formatDate(d=new Date()){return d.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}

function showPage(page){
 currentPage=page;
 $$(".page").forEach(p=>p.classList.toggle("active",p.id===`page-${page}`));
 $$(".nav-item").forEach(n=>n.classList.toggle("active",n.dataset.page===page));
 window.scrollTo({top:0,behavior:"smooth"});
 renderAll();
 if(innerWidth<850) $("#sidebar").classList.remove("open");
}
$$(".nav-item").forEach(n=>n.onclick=()=>showPage(n.dataset.page));
$$("[data-page-link]").forEach(b=>b.onclick=()=>showPage(b.dataset.pageLink));

$("#openSidebar").onclick=()=>$("#sidebar").classList.add("open");
$("#closeSidebar").onclick=()=>$("#sidebar").classList.remove("open");

function taskHTML(t){
 return `<div class="task-row ${t.done?"done":""}">
  <button class="check ${t.done?"done":""}" onclick="toggleTask(${t.id})">${t.done?"✓":""}</button>
  <span class="task-name">${escapeHTML(t.title)}</span>
  <span class="task-time">${escapeHTML(t.time||"Anytime")}</span>
  <span class="tag ${t.category}">${escapeHTML(t.category)}</span>
  <span class="priority ${t.priority}">${escapeHTML(t.priority)}</span>
 </div>`;
}
function escapeHTML(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}

function renderTasks(){
 const filtered=data.tasks.filter(t=>taskFilter==="all"||(taskFilter==="active"&&!t.done)||(taskFilter==="completed"&&t.done)).filter(t=>$("#taskCategoryFilter")?.value==="all"||!$("#taskCategoryFilter")||t.category===$("#taskCategoryFilter").value);
 $("#dashboardTasks").innerHTML=data.tasks.slice(0,9).map(taskHTML).join("")||empty("No tasks yet.");
 $("#allTasks").innerHTML=filtered.map(taskHTML).join("")||empty("Nothing here.");
 const total=data.tasks.length, done=data.tasks.filter(t=>t.done).length, pct=total?Math.round(done/total*100):0;
 $("#progressPercent").textContent=pct+"%";$("#progressText").textContent=`${done} / ${total}`;
 $("#progressRing").style.background=`conic-gradient(var(--primary2) ${pct*3.6}deg,var(--primary) ${pct*3.6}deg,#263a60 0)`;
 const sel=[...data.tasks].map(t=>`<option value="${t.id}">${escapeHTML(t.title)}</option>`).join("");
 ["#timerTask","#timerTaskLarge"].forEach(id=>{if($(id))$(id).innerHTML='<option value="">No current task</option>'+sel});
}
function toggleTask(id){const t=data.tasks.find(x=>x.id===id);if(!t)return;t.done=!t.done;save();toast(t.done?"Task completed ✓":"Task reopened");renderAll();}

function renderHabits(){
 $("#habitGrid").innerHTML=`<div class="habit-mini"><b>Habit</b>${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>`<span class="day">${d}</span>`).join("")}</div>`+
 data.habits.map(h=>`<div class="habit-mini"><span>${h.icon} ${escapeHTML(h.name)}</span>${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((_,i)=>`<button class="habit-dot ${i<Math.min(h.streak,5)?"done":""}" onclick="toggleHabit(${h.id},${i})">${i<Math.min(h.streak,5)?"✓":""}</button>`).join("")}</div>`).join("");
 $("#allHabits").innerHTML=data.habits.map(h=>`<div class="panel habit-card"><h3>${h.icon} ${escapeHTML(h.name)}</h3><p>Current streak: <b>${h.streak} days</b></p><div class="habit-check"><span class="muted">Today</span><button class="check ${h.done?"done":""}" onclick="toggleHabitToday(${h.id})">${h.done?"✓":""}</button></div></div>`).join("");
}
function toggleHabitToday(id){const h=data.habits.find(x=>x.id===id);h.done=!h.done;if(h.done)h.streak++;else h.streak=Math.max(0,h.streak-1);save();toast(h.done?"Habit completed ✓":"Habit unchecked");renderAll();}
function toggleHabit(id){toggleHabitToday(id)}

function renderGoals(){
 const html=data.goals.map(g=>`<div class="goal-row"><div class="goal-top"><span>${escapeHTML(g.title)}</span><b>${g.progress}%</b></div><div class="progress-line"><i style="width:${g.progress}%"></i></div></div>`).join("");
 $("#goalList").innerHTML=html||empty("No goals yet.");
 $("#allGoals").innerHTML=data.goals.map(g=>`<div class="panel goal-card"><h3>◇ ${escapeHTML(g.title)}</h3><p>Deadline: ${escapeHTML(g.deadline)}</p><div class="goal-top" style="margin-top:18px"><span>Progress</span><b>${g.progress}%</b></div><div class="progress-line"><i style="width:${g.progress}%"></i></div><div style="margin-top:14px"><input type="range" min="0" max="100" value="${g.progress}" onchange="updateGoal(${g.id},this.value)" style="width:100%"></div></div>`).join("");
}
function updateGoal(id,v){const g=data.goals.find(x=>x.id===id);g.progress=Number(v);save();renderAll();}

function renderNotes(){
 $("#allNotes").innerHTML=data.notes.map(n=>`<div class="panel note-card"><h3>▤ ${escapeHTML(n.title)}</h3><p>${escapeHTML(n.body)}</p><div class="note-date">${escapeHTML(n.date)}</div></div>`).join("")||empty("No notes yet.");
}
function renderRoutine(){
 $("#routineList").innerHTML=data.routines.map(r=>`<div class="routine-item"><span class="routine-time">${escapeHTML(r.time)}</span><i class="routine-line"></i><div><div class="routine-name">${escapeHTML(r.title)}</div><div class="routine-meta">${escapeHTML(r.meta)}</div></div><button class="secondary-btn" onclick="deleteRoutine(${r.id})">Delete</button></div>`).join("")||empty("No routines yet.");
 $("#scheduleList").innerHTML=data.routines.slice(0,4).map(r=>`<div class="schedule-item"><i class="schedule-dot"></i><span><b>${escapeHTML(r.time)}</b> ${escapeHTML(r.title)}</span></div>`).join("");
}
function deleteRoutine(id){data.routines=data.routines.filter(x=>x.id!==id);save();renderAll();}

function renderCalendar(){
 const y=currentMonth.getFullYear(),m=currentMonth.getMonth();
 const title=currentMonth.toLocaleDateString("en-IN",{month:"long",year:"numeric"});
 ["#calendarTitle","#calendarTitleLarge"].forEach(id=>{if($(id))$(id).textContent=title});
 const first=new Date(y,m,1).getDay(), days=new Date(y,m+1,0).getDate(), prev=new Date(y,m,0).getDate();
 let cells=[];
 for(let i=0;i<42;i++){
  const day=i-first+1;
  let n=day,other=false;
  if(day<1){n=prev+day;other=true}else if(day>days){n=day-days;other=true}
  const isToday=!other&&n===new Date().getDate()&&m===new Date().getMonth()&&y===new Date().getFullYear();
  const has=!other&&data.tasks.some(t=>t.time&&n===new Date().getDate());
  cells.push(`<button class="${other?"other ":""}${isToday?"today ":""}${has?"has-event":""}">${n}</button>`);
 }
 $("#calendarDays").innerHTML=cells.join("");$("#calendarDaysLarge").innerHTML=cells.join("");
}
$("#prevMonth").onclick=()=>{currentMonth.setMonth(currentMonth.getMonth()-1);renderCalendar()};
$("#nextMonth").onclick=()=>{currentMonth.setMonth(currentMonth.getMonth()+1);renderCalendar()};

function updateStats(){
 const done=data.tasks.filter(t=>t.done).length,total=data.tasks.length;
 const score=Math.min(100,Math.round((total?done/total:0)*70+(data.habits.filter(h=>h.done).length/Math.max(1,data.habits.length))*30));
 $("#scoreValue").textContent=score+" / 100";
 $("#scoreMessage").textContent=score>=80?"Great progress today!":score>=50?"Keep going!":"Start your day!";
 $("#focusTotal").textContent=formatMinutes(data.focus.minutes);$("#focusSessions").textContent=data.focus.sessions+" sessions";
 $("#streakValue").textContent=Math.max(0,...data.habits.map(h=>h.streak))+" days";
 $("#statCompleted").textContent=done;$("#statFocus").textContent=data.focus.minutes;$("#statHabits").textContent=data.habits.length;$("#statGoals").textContent=data.goals.length;
 const vals=[25,45,35,70,55,85,score||15],days=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
 $("#barChart").innerHTML=vals.map((v,i)=>`<div class="bar" style="height:${Math.max(8,v*1.7)}px"><span>${days[i]}</span></div>`).join("");
}
function formatMinutes(m){return m>=60?`${Math.floor(m/60)}h ${m%60}m`:m+"m"}

function renderJournal(){
 $("#journalText").value=data.journal[0]?.text||"";
 $("#journalHistory").innerHTML=data.journal.slice(0,8).map(j=>`<div class="journal-entry"><strong>${escapeHTML(j.date)}</strong><p>${escapeHTML(j.text)}</p></div>`).join("")||empty("No previous entries.");
}
$("#saveJournal").onclick=()=>{const text=$("#journalText").value.trim();if(!text)return toast("Write something first.");data.journal.unshift({id:uid(),date:formatDate(),text});save();toast("Journal saved ✓");renderJournal();};

function setupTheme(){
 const theme=localStorage.getItem("lifeos-theme")||"dark",accent=localStorage.getItem("lifeos-accent")||"purple";
 applyTheme(theme);applyAccent(accent);
 $$("#themeOptions button").forEach(b=>b.onclick=()=>applyTheme(b.dataset.themeChoice));
 $$("#accentOptions button").forEach(b=>b.onclick=()=>applyAccent(b.dataset.accentChoice));
}
function applyTheme(t){document.body.dataset.theme=t;localStorage.setItem("lifeos-theme",t);$$("#themeOptions button").forEach(b=>b.classList.toggle("active",b.dataset.themeChoice===t));}
function applyAccent(a){document.body.dataset.accent=a;localStorage.setItem("lifeos-accent",a);}

function setTimer(min){
 clearInterval(timerInterval);timerRunning=false;timerMode=min;timerSeconds=min*60;updateTimerUI();$("#timerStart").textContent="▶ Start";$("#timerStartLarge").textContent="▶ Start";
 $$(".timer-mode").forEach(b=>b.classList.toggle("active",Number(b.dataset.minutes)===min));
}
function updateTimerUI(){const m=Math.floor(timerSeconds/60).toString().padStart(2,"0"),s=(timerSeconds%60).toString().padStart(2,"0");$("#timerDisplay").textContent=`${m}:${s}`;$("#timerDisplayLarge").textContent=`${m}:${s}`;}
function toggleTimer(){if(timerRunning){clearInterval(timerInterval);timerRunning=false;$("#timerStart").textContent="▶ Start";$("#timerStartLarge").textContent="▶ Start";return}timerRunning=true;$("#timerStart").textContent="❚❚ Pause";$("#timerStartLarge").textContent="❚❚ Pause";timerInterval=setInterval(()=>{timerSeconds--;if(timerSeconds<=0){clearInterval(timerInterval);timerRunning=false;data.focus.minutes+=timerMode;data.focus.sessions++;data.focus.history.unshift({date:formatDate(),minutes:timerMode});save();toast("Focus session complete 🎉");setTimer(25);renderAll();}updateTimerUI()},1000);}
function resetTimer(){setTimer(timerMode)}
$("#timerStart").onclick=toggleTimer;$("#timerStartLarge").onclick=toggleTimer;$("#timerReset").onclick=resetTimer;$("#timerResetLarge").onclick=resetTimer;
$$(".timer-mode").forEach(b=>b.onclick=()=>setTimer(Number(b.dataset.minutes)));

function renderFocusHistory(){if(!$("#focusHistory"))return;$("#focusHistory").innerHTML=data.focus.history.slice(0,8).map(x=>`<div class="history-item">◷ ${x.minutes} minute session — ${escapeHTML(x.date)}</div>`).join("")||'<div class="history-item">No completed sessions yet.</div>'}

function openModal(type){
 const form=$("#modalForm"),back=$("#modalBackdrop");let title="";
 if(type==="task"){title="Add Task";form.innerHTML=formHTML(`<label>Task name<input name="title" required placeholder="e.g. Study DBMS"></label><label>Time<input name="time" placeholder="e.g. 9:00 AM"></label><label>Category<select name="category"><option>Study</option><option>Health</option><option>Personal</option><option>College</option></select></label><label>Priority<select name="priority"><option>High</option><option>Medium</option><option>Low</option></select></label>`,"Save Task")}
 if(type==="habit"){title="Add Habit";form.innerHTML=formHTML(`<label>Habit name<input name="name" required placeholder="e.g. Read 20 pages"></label><label>Emoji<input name="icon" value="✨" maxlength="2"></label>`,"Save Habit")}
 if(type==="goal"){title="Add Goal";form.innerHTML=formHTML(`<label>Goal<input name="title" required placeholder="e.g. Finish portfolio"></label><label>Deadline<input name="deadline" placeholder="e.g. December 2027"></label><label>Starting progress<input name="progress" type="number" min="0" max="100" value="0"></label>`,"Save Goal")}
 if(type==="note"){title="Add Note";form.innerHTML=formHTML(`<label>Title<input name="title" required placeholder="Note title"></label><label>Note<textarea name="body" required placeholder="Write your note..."></textarea></label>`,"Save Note")}
 if(type==="routine"){title="Add Routine";form.innerHTML=formHTML(`<label>Time<input name="time" required placeholder="e.g. 7:30 AM"></label><label>Activity<input name="title" required placeholder="e.g. Breakfast"></label><label>Details<input name="meta" placeholder="Personal • 30 min"></label>`,"Save Routine")}
 $("#modalTitle").textContent=title;back.classList.add("show");form.onsubmit=e=>{e.preventDefault();const f=new FormData(form);if(type==="task")data.tasks.push({id:uid(),title:f.get("title"),time:f.get("time"),category:f.get("category"),priority:f.get("priority"),done:false});if(type==="habit")data.habits.push({id:uid(),name:f.get("name"),icon:f.get("icon")||"✨",streak:0,done:false});if(type==="goal")data.goals.push({id:uid(),title:f.get("title"),deadline:f.get("deadline")||"Ongoing",progress:Number(f.get("progress")||0)});if(type==="note")data.notes.unshift({id:uid(),title:f.get("title"),body:f.get("body"),date:"Today"});if(type==="routine")data.routines.push({id:uid(),time:f.get("time"),title:f.get("title"),meta:f.get("meta")||"Personal"});save();back.classList.remove("show");toast(title.replace("Add ","")+" ✓");renderAll();};}
function formHTML(fields,button){return `<div class="form-grid">${fields}</div><div class="form-actions"><button type="button" class="secondary-btn" onclick="closeModal()">Cancel</button><button class="primary-btn">${button}</button></div>`}
function closeModal(){$("#modalBackdrop").classList.remove("show")}$("#modalClose").onclick=closeModal;$("#modalBackdrop").onclick=e=>{if(e.target.id==="modalBackdrop")closeModal()};

$$("[data-action]").forEach(b=>b.onclick=()=>{const a=b.dataset.action;if(a==="add-task"||a==="add-habit"||a==="add-goal"||a==="add-note"||a==="add-routine")openModal(a.replace("add-",""));if(a==="focus")showPage("focus");if(a==="journal")showPage("journal");});

$$("[data-filter]").forEach(b=>b.onclick=()=>{taskFilter=b.dataset.filter;$$("[data-filter]").forEach(x=>x.classList.toggle("active",x===b));renderTasks()});
$("#taskCategoryFilter").onchange=renderTasks;

$("#globalSearch").addEventListener("input",e=>{
 const q=e.target.value.toLowerCase().trim();if(!q)return;
 const found=[...data.tasks.map(x=>x.title),...data.goals.map(x=>x.title),...data.notes.map(x=>x.title)].filter(x=>x.toLowerCase().includes(q));
 toast(found.length?`Found ${found.length} matching item(s)`:"No matching item");
});
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#globalSearch").focus()}});
$("#quickTheme").onclick=()=>showPage("settings");

$("#notificationBtn").onclick=()=>toast("You have no urgent notifications.");
$("#exportData").onclick=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="lifeos-backup.json";a.click();URL.revokeObjectURL(a.href);toast("Backup exported ✓")};
$("#resetData").onclick=()=>{if(confirm("Reset all LifeOS demo data?")){data=structuredClone(defaultData);save();renderAll();toast("Demo data restored");}};

function empty(text){return `<div style="padding:25px;text-align:center;color:var(--muted);font-size:11px">${text}</div>`}
function renderAll(){
 $("#heroDate").textContent=formatDate();
 const h=new Date().getHours();$("#greeting").textContent=(h<12?"Good morning":h<18?"Good afternoon":"Good evening")+", Subhajit 👋";
 renderTasks();renderHabits();renderGoals();renderNotes();renderRoutine();renderCalendar();renderJournal();renderFocusHistory();updateStats();
}
setupTheme();setTimer(25);renderAll();
