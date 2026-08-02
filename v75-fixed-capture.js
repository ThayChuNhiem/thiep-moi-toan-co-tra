(function(){
  const FIXED_W=1080;
  const FIXED_H=1350;
  const DPR=2;

  const raf2=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  const delay=ms=>new Promise(r=>setTimeout(r,ms));

  function hardenClone(root){
    root.classList.add('capture-mode','capture-snapshot','exporting','active');
    const fixed={
      width:FIXED_W+'px',height:FIXED_H+'px',minWidth:FIXED_W+'px',minHeight:FIXED_H+'px',
      maxWidth:'none',maxHeight:'none',margin:'0',padding:'0',transform:'none',scale:'none',
      overflow:'hidden',display:'flex',visibility:'visible',opacity:'1',boxShadow:'none',
      textShadow:'none',filter:'none',backdropFilter:'none',webkitBackdropFilter:'none'
    };
    Object.assign(root.style,fixed);
    root.style.setProperty('--card-width',FIXED_W+'px');
    root.querySelectorAll('*').forEach(el=>{
      el.style.setProperty('box-shadow','none','important');
      el.style.setProperty('text-shadow','none','important');
      el.style.setProperty('backdrop-filter','none','important');
      el.style.setProperty('-webkit-backdrop-filter','none','important');
      el.style.setProperty('filter','none','important');
      el.style.setProperty('transform','none','important');
      el.style.setProperty('scale','none','important');
      el.style.setProperty('mix-blend-mode','normal','important');
    });
    /* Chỉ đặc cách tiêu đề: khôi phục đúng glow đang dùng trên UI web. */
    const titleGlow=root.querySelector('.program-title-text');
    if(titleGlow){
      titleGlow.style.setProperty('text-shadow','0 0 4px rgba(255,255,255,.98), 0 0 13px rgba(244,201,109,.96), 0 0 28px rgba(128,102,163,.84), 0 6px 14px rgba(85,61,116,.30)','important');
    }
  }

  function makeFixedCapture(page){
    const mount=document.createElement('div');
    mount.className='capture-render-host v75-fixed-capture-host';
    Object.assign(mount.style,{
      position:'fixed',left:'0',top:'0',width:FIXED_W+'px',height:FIXED_H+'px',
      overflow:'hidden',pointerEvents:'none',zIndex:'90',margin:'0',padding:'0',
      background:'#fff9ea',transform:'none'
    });
    const area=document.createElement('div');
    area.id='capture-area';
    Object.assign(area.style,{
      position:'relative',display:'block',width:FIXED_W+'px',height:FIXED_H+'px',
      minWidth:FIXED_W+'px',minHeight:FIXED_H+'px',maxWidth:'none',maxHeight:'none',
      overflow:'hidden',margin:'0',padding:'0',background:'#fff9ea',transform:'none'
    });
    const clone=page.cloneNode(true);
    const walker=document.createTreeWalker(clone,NodeFilter.SHOW_TEXT);
    let n; while((n=walker.nextNode())) n.nodeValue=(n.nodeValue||'').normalize('NFC');
    hardenClone(clone);
    area.appendChild(clone); mount.appendChild(area); document.body.appendChild(mount);
    return {mount,area,clone};
  }

  async function waitAssets(root){
    if(document.fonts&&document.fonts.ready){try{await document.fonts.ready}catch(e){}}
    const imgs=[...root.querySelectorAll('img')];
    await Promise.all(imgs.map(async img=>{
      img.loading='eager'; img.decoding='sync';
      if(!(img.complete&&img.naturalWidth>0)) await new Promise(res=>{img.addEventListener('load',res,{once:true});img.addEventListener('error',res,{once:true});setTimeout(res,8000)});
      if(img.decode){try{await img.decode()}catch(e){}}
    }));
    await raf2(); await delay(120); await raf2();
  }

  async function fixedRender(page){
    if(!page) throw new Error('Không tìm thấy khung thiệp để tạo ảnh');
    let cap;
    try{
      cap=makeFixedCapture(page);
      await waitAssets(cap.clone);
      const common={
        width:FIXED_W,height:FIXED_H,pixelRatio:DPR,
        backgroundColor:'#fff9ea',cacheBust:false,includeQueryParams:true,
        skipAutoScale:true,skipFonts:false
      };
      let dataUrl;
      if(window.htmlToImage&&typeof window.htmlToImage.toPng==='function'){
        dataUrl=await window.htmlToImage.toPng(cap.area,common);
      }else if(typeof window.html2canvas==='function'){
        const canvas=await window.html2canvas(cap.area,{
          width:FIXED_W,height:FIXED_H,windowWidth:FIXED_W,windowHeight:FIXED_H,
          scale:DPR,backgroundColor:'#fff9ea',useCORS:true,allowTaint:true,
          logging:false,imageTimeout:15000,removeContainer:true,
          scrollX:0,scrollY:0
        });
        dataUrl=canvas.toDataURL('image/png',1);
      }else throw new Error('Không tải được công cụ tạo ảnh');
      if(!dataUrl||!dataUrl.startsWith('data:image/png')) throw new Error('Ảnh PNG không hợp lệ');
      if(typeof window.dataUrlToBlob==='function') return window.dataUrlToBlob(dataUrl);
      const parts=dataUrl.split(','); const bin=atob(parts[1]); const bytes=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
      return new Blob([bytes],{type:'image/png'});
    }finally{
      if(cap&&cap.mount&&cap.mount.parentNode)cap.mount.remove();
    }
  }

  window.render=fixedRender;
  try{render=fixedRender}catch(e){}
  window.__TCT_FIXED_CAPTURE__={width:FIXED_W,height:FIXED_H,pixelRatio:DPR};
})();
