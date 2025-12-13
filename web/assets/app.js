const versionsUrl = '../docs/versioning.json'
const btnPlay = document.getElementById('play')
const btnPause = document.getElementById('pause')
const btnRewind = document.getElementById('rewind')
function createSim(containerId){
  const el = document.getElementById(containerId)
  el.innerHTML = ''
  const nodes = [
    {id:'n1',label:'Leitor Facial',x:12,y:20},
    {id:'n2',label:'Controladora',x:160,y:20},
    {id:'n3',label:'Elevador',x:308,y:20},
    {id:'n4',label:'HikCentral',x:160,y:120}
  ]
  nodes.forEach(n=>{
    const d=document.createElement('div')
    d.className='node'
    d.style.left=n.x+'px'
    d.style.top=n.y+'px'
    d.textContent=n.label
    el.appendChild(d)
  })
  const links=[
    {x:80,y:32,w:60,deg:0},{x:220,y:32,w:60,deg:0},{x:220,y:60,w:80,deg:90}
  ]
  links.forEach(l=>{
    const line=document.createElement('div')
    line.className='link'
    line.style.left=l.x+'px'
    line.style.top=l.y+'px'
    line.style.width=l.w+'px'
    line.style.transform='rotate('+l.deg+'deg)'
    el.appendChild(line)
    const f=document.createElement('div')
    f.className='flow'
    f.style.left=l.x+'px'
    f.style.top=l.y-2+'px'
    f.style.width='6px'
    el.appendChild(f)
  })
}
function playAll(){
  document.querySelectorAll('.flow').forEach(f=>f.classList.add('play'))
}
function pauseAll(){
  document.querySelectorAll('.flow').forEach(f=>{f.style.animationPlayState='paused'})
}
function rewindAll(){
  document.querySelectorAll('.flow').forEach(f=>{f.classList.remove('play');void f.offsetWidth;f.classList.add('play')})
}
btnPlay.addEventListener('click',playAll)
btnPause.addEventListener('click',pauseAll)
btnRewind.addEventListener('click',rewindAll)
document.querySelectorAll('.sim-actions button').forEach(b=>{
  b.addEventListener('click',()=>{
    const id=b.dataset.sim
    const action=b.dataset.action
    if(action==='start'){createSim(id);playAll()}
    if(action==='pause'){pauseAll()}
    if(action==='rewind'){rewindAll()}
  })
})
fetch(versionsUrl).then(r=>r.json()).then(d=>{
  const v=document.getElementById('version-info')
  v.innerHTML=`Versão atual: ${d.current.version} · Data: ${d.current.date}`
})
