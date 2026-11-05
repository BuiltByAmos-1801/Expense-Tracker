(() => {
  "use strict";
  const STORAGE_KEY = "expense-tracker-v1";
  const $ = id => document.getElementById(id);
  const categories = {
    "Food & Snacks":"🍛","Room Rent":"🏠","Ration & Grocery":"🛒","Travel":"🚌",
    "Electricity & Bills":"💡","Mobile Recharge":"📱","Shopping":"🛍️","Medical":"🏥","Personal":"👤","Other":"📦"
  };
  let data = { version: 1, transactions: [] };
  let linkedFileHandle = null;
  let toastTimer;

  const money = n => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(n)||0);
  const localDate = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const localTime = (d=new Date()) => `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  const monthKey = date => date.slice(0,7);
  const niceDate = value => new Date(value+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
  const escapeHtml = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function notify(message){const t=$("toast");t.textContent=message;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2600);}
  function saveLocal(){localStorage.setItem(STORAGE_KEY,JSON.stringify(data));}
  function load(){
    try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){const parsed=JSON.parse(raw);if(parsed&&Array.isArray(parsed.transactions))data={version:1,transactions:parsed.transactions};}}
    catch(e){notify("Could not read saved browser data.");}
  }
  function currentMonth(){return localDate().slice(0,7);}
  function monthTransactions(){return data.transactions.filter(t=>monthKey(t.date)===currentMonth());}
  function total(list){return list.reduce((sum,t)=>sum+Number(t.amount||0),0);}
  function initFormDefaults(){ $("date").value=localDate();$("time").value=localTime(); }
  function render(){
    const now= new Date();
    $("todayLabel").textContent=now.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"}).toUpperCase();
    $("monthLabel").textContent=now.toLocaleDateString("en-IN",{month:"long",year:"numeric"});
    const month=monthTransactions(), today=data.transactions.filter(t=>t.date===localDate());
    const spent=total(month), days=now.getDate();
    $("monthTotal").textContent=money(spent);$("monthCount").textContent=month.length;
    $("dailyAverage").textContent=money(spent/Math.max(days,1));$("todayTotal").textContent=money(total(today));
    renderCategories(month);renderHistory();renderWeekly();
    $("historyCount").textContent=`${data.transactions.length} record${data.transactions.length===1?"":"s"}`;
    populateFilters();
  }
  function renderCategories(list){
    const sums={};list.forEach(t=>sums[t.category]=(sums[t.category]||0)+Number(t.amount));
    const entries=Object.entries(sums).sort((a,b)=>b[1]-a[1]);
    if(!entries.length){$("categoryBreakdown").innerHTML='<div class="empty-state">No expenses this month yet.</div>';return;}
    const max=entries[0][1];
    $("categoryBreakdown").innerHTML=entries.map(([name,value])=>`<div class="category-row"><div class="cat-icon">${categories[name]||"📌"}</div><div><div class="cat-name">${escapeHtml(name)}</div><div class="cat-track"><div class="cat-fill" style="width:${value/max*100}%"></div></div></div><div class="cat-value">${money(value)}</div></div>`).join("");
  }
  function populateFilters(){
    const monthSelect=$("filterMonth"),old=monthSelect.value;
    const months=[...new Set(data.transactions.map(t=>monthKey(t.date)))].sort().reverse();
    monthSelect.innerHTML='<option value="all">All months</option>'+months.map(m=>`<option value="${m}">${new Date(m+"-01T00:00:00").toLocaleDateString("en-IN",{month:"long",year:"numeric"})}</option>`).join("");
    if(months.includes(old)||old==="all")monthSelect.value=old;
    const cat=$("filterCategory"),oldCat=cat.value;
    const cats=[...new Set(data.transactions.map(t=>t.category))].sort();
    cat.innerHTML='<option value="all">All categories</option>'+cats.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
    if(cats.includes(oldCat)||oldCat==="all")cat.value=oldCat;
  }
  function renderHistory(){
    const q=$("searchInput").value.trim().toLowerCase(),m=$("filterMonth").value,c=$("filterCategory").value;
    const list=data.transactions.filter(t=>(m==="all"||monthKey(t.date)===m)&&(c==="all"||t.category===c)&&(!q||[t.description,t.category,t.payment].join(" ").toLowerCase().includes(q)))
      .sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
    if(!list.length){$("historyList").innerHTML='<div class="empty-state">No matching expenses found.</div>';return;}
    $("historyList").innerHTML=list.map(t=>`<article class="history-item"><div class="history-icon">${categories[t.category]||"📌"}</div><div class="history-main"><div class="history-title">${escapeHtml(t.description||t.category)}</div><div class="history-meta">${escapeHtml(t.category)} · ${niceDate(t.date)} · ${escapeHtml(t.time)} · ${escapeHtml(t.payment||"")}</div></div><div class="history-right"><div class="history-amount">${money(t.amount)}</div><div class="item-actions"><button class="text-action" data-edit="${escapeHtml(t.id)}">Edit</button><button class="text-action delete" data-delete="${escapeHtml(t.id)}">Delete</button></div></div></article>`).join("");
  }
  function renderWeekly(){
    const days=[];const today=new Date();
    for(let i=6;i>=0;i--){const d=new Date(today);d.setDate(today.getDate()-i);const key=localDate(d);days.push({key,label:d.toLocaleDateString("en-IN",{weekday:"short"}),value:total(data.transactions.filter(t=>t.date===key))});}
    const max=Math.max(...days.map(d=>d.value),1);
    $("weeklyChart").innerHTML=days.map(d=>`<div class="bar-col" title="${escapeHtml(d.key)}: ${money(d.value)}"><div class="bar" style="height:${Math.max(d.value/max*86,d.value?5:2)}px;opacity:${d.value?1:.25}"></div><span class="bar-day">${d.label}</span></div>`).join("");
  }
  function resetForm(){ $("expenseForm").reset();$("editId").value="";$("saveBtn").textContent="＋ Save expense";$("cancelEdit").classList.add("hidden");initFormDefaults();}
  $("expenseForm").addEventListener("submit",async e=>{
    e.preventDefault();
    const amount=Number($("amount").value);
    if(!Number.isFinite(amount)||amount<=0){notify("Enter an amount greater than zero.");return;}
    const id=$("editId").value;
    const record={id:id||((crypto.randomUUID&&crypto.randomUUID())||String(Date.now())),amount,category:$("category").value,payment:$("payment").value,date:$("date").value,time:$("time").value,description:$("description").value.trim()};
    if(!record.date||!record.time){notify("Please select date and time.");return;}
    if(id){data.transactions=data.transactions.map(t=>t.id===id?record:t);notify("Expense updated.");}
    else{data.transactions.push(record);notify("Expense saved.");}
    saveLocal();resetForm();render();await syncLinkedFile();
  });
  $("cancelEdit").addEventListener("click",resetForm);
  $("historyList").addEventListener("click",e=>{
    const edit=e.target.dataset.edit,del=e.target.dataset.delete;
    if(edit){const t=data.transactions.find(x=>x.id===edit);if(!t)return;$("editId").value=t.id;$("amount").value=t.amount;$("category").value=t.category;$("payment").value=t.payment||"UPI";$("date").value=t.date;$("time").value=t.time;$("description").value=t.description||"";$("saveBtn").textContent="✓ Update expense";$("cancelEdit").classList.remove("hidden");$("amount").focus();window.scrollTo({top:0,behavior:"smooth"});}
    if(del){if(confirm("Delete this expense permanently from this device?")){data.transactions=data.transactions.filter(x=>x.id!==del);saveLocal();render();syncLinkedFile();notify("Expense deleted.");}}
  });
  ["searchInput","filterMonth","filterCategory"].forEach(id=>$(id).addEventListener(id==="searchInput"?"input":"change",renderHistory));
  function downloadJSON(){
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`expenses-${localDate()}.json`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);notify("JSON backup downloaded.");
  }
  $("exportBtn").addEventListener("click",downloadJSON);
  $("backupBtn").addEventListener("click",()=>$("backupStatus").scrollIntoView({behavior:"smooth",block:"center"}));
  $("importBtn").addEventListener("click",()=>$("importFile").click());
  $("importFile").addEventListener("change",async e=>{
    const file=e.target.files[0];if(!file)return;
    try{const parsed=JSON.parse(await file.text());if(!parsed||!Array.isArray(parsed.transactions))throw new Error("Invalid format");
      if(!confirm(`Import ${parsed.transactions.length} transactions? This will replace current data on this browser.`))return;
      data={version:1,transactions:parsed.transactions.map(t=>({...t,id:String(t.id||((crypto.randomUUID&&crypto.randomUUID())||Date.now()))}))};saveLocal();render();await syncLinkedFile();notify("JSON history imported successfully.");
    }catch(err){notify("Invalid JSON file. No data was changed.");}
    e.target.value="";
  });
  async function writeLinkedFile(){
    if(!linkedFileHandle)return;
    const writable=await linkedFileHandle.createWritable();await writable.write(JSON.stringify(data,null,2));await writable.close();
    $("backupStatus").textContent="Linked JSON file updated successfully.";
  }
  async function syncLinkedFile(){if(linkedFileHandle){try{await writeLinkedFile();}catch(e){$("backupStatus").textContent="Could not update linked file. Use Export JSON to back up.";}}}
  $("saveFileBtn").addEventListener("click",async()=>{
    if(!("showSaveFilePicker" in window)){notify("Direct file saving is not supported in this browser. Use Export JSON.");return;}
    try{
      linkedFileHandle=await window.showSaveFilePicker({suggestedName:"expenses.json",types:[{description:"JSON file",accept:{"application/json":[".json"]}}]});
      await writeLinkedFile();notify("JSON file linked. New changes will update it while this page stays open.");
    }catch(e){if(e.name!=="AbortError")notify("Could not link JSON file.");}
  });
  // On browsers supporting file open handles, allow choosing an existing JSON file as the live save target.
  if("showOpenFilePicker" in window){
    const liveBtn=$("saveFileBtn");liveBtn.title="Choose or create a JSON file for live saving";
  }
  initFormDefaults();load();render();
})();