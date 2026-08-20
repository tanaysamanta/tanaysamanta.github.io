(function(){
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------- loader (fixed 5s solar-system intro) ---------- */
  (function(){
    var loaderEl = document.getElementById("loader");
    var pctEl = document.getElementById("loaderPct");
    var DURATION = 5000;
    var starsRunning = true;

    function paint(p){ if (pctEl) pctEl.textContent = Math.round(p); }

    function finish(){
      loaderEl.classList.add("done");
      starsRunning = false;
    }

    /* twinkling starfield background */
    var starsCanvas = document.getElementById("loaderStars");
    if (starsCanvas) {
      var sctx = starsCanvas.getContext("2d");
      var stars = [], sW, sH;
      function sizeStars(){
        sW = starsCanvas.width = innerWidth;
        sH = starsCanvas.height = innerHeight;
      }
      function seedStars(){
        stars = [];
        var count = sW < 640 ? 80 : 170;
        for (var i = 0; i < count; i++){
          stars.push({
            x: Math.random() * sW, y: Math.random() * sH,
            r: Math.random() * 1.3 + 0.3,
            baseA: Math.random() * 0.55 + 0.25,
            tw: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.02 + 0.01
          });
        }
      }
      sizeStars(); seedStars();
      window.addEventListener("resize", function(){ sizeStars(); seedStars(); }, {passive:true});

      if (reduced) {
        sctx.clearRect(0, 0, sW, sH);
        stars.forEach(function(s){
          sctx.beginPath();
          sctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          sctx.fillStyle = "rgba(237,245,240," + s.baseA.toFixed(3) + ")";
          sctx.fill();
        });
      } else {
        (function drawStars(){
          if (!starsRunning) return;
          sctx.clearRect(0, 0, sW, sH);
          for (var i = 0; i < stars.length; i++){
            var s = stars[i];
            s.tw += s.speed;
            var a = s.baseA * (0.5 + 0.5 * Math.sin(s.tw));
            sctx.beginPath();
            sctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            sctx.fillStyle = "rgba(237,245,240," + a.toFixed(3) + ")";
            sctx.fill();
          }
          requestAnimationFrame(drawStars);
        })();

        /* the occasional shooting star, for extra flair */
        (function spawnShootingStar(){
          if (!starsRunning) return;
          var s = document.createElement("span");
          s.className = "shooting-star";
          var x = Math.random() * innerWidth * 0.7;
          var y = Math.random() * innerHeight * 0.4;
          var angle = Math.PI / 5 + Math.random() * (Math.PI / 8);
          var dist = 260 + Math.random() * 200;
          s.style.left = x + "px";
          s.style.top = y + "px";
          s.style.setProperty("--sx", Math.cos(angle) * dist + "px");
          s.style.setProperty("--sy", Math.sin(angle) * dist + "px");
          loaderEl.appendChild(s);
          s.addEventListener("animationend", function(){ s.remove(); });
          setTimeout(spawnShootingStar, 900 + Math.random() * 1100);
        })();
      }
    }

    if (reduced) { paint(100); finish(); return; }

    var start = null;
    function tick(ts){
      if (start === null) start = ts;
      var p = Math.min(100, ((ts - start) / DURATION) * 100);
      paint(p);
      if (p < 100) requestAnimationFrame(tick);
      else setTimeout(finish, 300);
    }
    requestAnimationFrame(tick);
  })();

  /* ---------- custom cursor + mouse glow ---------- */
  if (finePointer && !reduced) {
    document.documentElement.classList.add("cursor-on");
    var dot = document.getElementById("cursorDot"),
        ring = document.getElementById("cursorRing"),
        glow = document.getElementById("glowFollow");
    var mx = innerWidth/2, my = innerHeight/2, rx = mx, ry = my, gx = mx, gy = my;
    var shown = false;
    document.addEventListener("mousemove", function(e){
      mx = e.clientX; my = e.clientY;
      if(!shown){ dot.style.opacity = ring.style.opacity = "1"; shown = true; }
    }, {passive:true});
    (function loop(){
      rx += (mx-rx)*0.18; ry += (my-ry)*0.18;
      gx += (mx-gx)*0.06; gy += (my-gy)*0.06;
      dot.style.transform  = "translate(" + (mx-3.5) + "px," + (my-3.5) + "px)";
      ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
      glow.style.transform = "translate(" + gx + "px," + gy + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll("[data-hover], a, button, input, textarea").forEach(function(el){
      el.addEventListener("mouseenter", function(){ ring.classList.add("is-active"); });
      el.addEventListener("mouseleave", function(){ ring.classList.remove("is-active"); });
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (finePointer && !reduced) {
    document.querySelectorAll(".magnetic").forEach(function(btn){
      btn.addEventListener("mousemove", function(e){
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width/2;
        var y = e.clientY - r.top - r.height/2;
        btn.style.transform = "translate(" + x*0.22 + "px," + y*0.22 + "px)";
      });
      btn.addEventListener("mouseleave", function(){ btn.style.transform = ""; });
    });
  }

  /* ---------- hero name character animation ---------- */
  if (!reduced) {
    var delay = 0;
    document.querySelectorAll(".hero-name .row").forEach(function(row){
      var text = row.textContent;
      row.textContent = "";
      text.split("").forEach(function(ch){
        var s = document.createElement("span");
        s.textContent = ch === " " ? " " : ch;
        s.style.setProperty("--d", (0.15 + delay*0.045) + "s");
        row.appendChild(s);
        delay++;
      });
    });
  }

  /* ---------- orb (WebGL, ported from reactbits.dev Orb shader) ---------- */
  var orbCanvas = document.getElementById("orb");
  if (orbCanvas && !reduced) (function(){
    var gl = orbCanvas.getContext("webgl", { alpha: true, premultipliedAlpha: false }) ||
             orbCanvas.getContext("experimental-webgl", { alpha: true, premultipliedAlpha: false });
    if (!gl) return;
    var hero = orbCanvas.parentElement;

    // matches <Orb hoverIntensity={2} rotateOnHover hue={0} forceHoverState={false} backgroundColor="#000000" />
    var hue = 0, hoverIntensity = 2, rotateOnHover = true, forceHoverState = false;
    var bgColor = [0, 0, 0];

    var vertSrc =
      "precision highp float;" +
      "attribute vec2 position;" +
      "attribute vec2 uv;" +
      "varying vec2 vUv;" +
      "void main(){ vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }";

    var fragSrc = [
      "precision highp float;",
      "uniform float iTime;",
      "uniform vec3 iResolution;",
      "uniform float hue;",
      "uniform float hover;",
      "uniform float rot;",
      "uniform float hoverIntensity;",
      "uniform vec3 backgroundColor;",
      "uniform float orbScale;",
      "varying vec2 vUv;",
      "vec3 rgb2yiq(vec3 c){float y=dot(c,vec3(0.299,0.587,0.114));float i=dot(c,vec3(0.596,-0.274,-0.322));float q=dot(c,vec3(0.211,-0.523,0.312));return vec3(y,i,q);}",
      "vec3 yiq2rgb(vec3 c){float r=c.x+0.956*c.y+0.621*c.z;float g=c.x-0.272*c.y-0.647*c.z;float b=c.x-1.106*c.y+1.703*c.z;return vec3(r,g,b);}",
      "vec3 adjustHue(vec3 color,float hueDeg){float hueRad=hueDeg*3.14159265/180.0;vec3 yiq=rgb2yiq(color);float cosA=cos(hueRad);float sinA=sin(hueRad);float i=yiq.y*cosA-yiq.z*sinA;float q=yiq.y*sinA+yiq.z*cosA;yiq.y=i;yiq.z=q;return yiq2rgb(yiq);}",
      "vec3 hash33(vec3 p3){p3=fract(p3*vec3(0.1031,0.11369,0.13787));p3+=dot(p3,p3.yxz+19.19);return -1.0+2.0*fract(vec3(p3.x+p3.y,p3.x+p3.z,p3.y+p3.z)*p3.zyx);}",
      "float snoise3(vec3 p){const float K1=0.333333333;const float K2=0.166666667;vec3 i=floor(p+(p.x+p.y+p.z)*K1);vec3 d0=p-(i-(i.x+i.y+i.z)*K2);vec3 e=step(vec3(0.0),d0-d0.yzx);vec3 i1=e*(1.0-e.zxy);vec3 i2=1.0-e.zxy*(1.0-e);vec3 d1=d0-(i1-K2);vec3 d2=d0-(i2-K1);vec3 d3=d0-0.5;vec4 h=max(0.6-vec4(dot(d0,d0),dot(d1,d1),dot(d2,d2),dot(d3,d3)),0.0);vec4 n=h*h*h*h*vec4(dot(d0,hash33(i)),dot(d1,hash33(i+i1)),dot(d2,hash33(i+i2)),dot(d3,hash33(i+1.0)));return dot(vec4(31.316),n);}",
      "vec4 extractAlpha(vec3 colorIn){float a=max(max(colorIn.r,colorIn.g),colorIn.b);return vec4(colorIn.rgb/(a+1e-5),a);}",
      "const vec3 baseColor1=vec3(0.611765,0.262745,0.996078);",
      "const vec3 baseColor2=vec3(0.298039,0.760784,0.913725);",
      "const vec3 baseColor3=vec3(0.062745,0.078431,0.600000);",
      "const float innerRadius=0.6;",
      "const float noiseScale=0.65;",
      "float light1(float intensity,float attenuation,float dist){return intensity/(1.0+dist*attenuation);}",
      "float light2(float intensity,float attenuation,float dist){return intensity/(1.0+dist*dist*attenuation);}",
      "vec4 draw(vec2 uv){",
      "  vec3 color1=adjustHue(baseColor1,hue);",
      "  vec3 color2=adjustHue(baseColor2,hue);",
      "  vec3 color3=adjustHue(baseColor3,hue);",
      "  float ang=atan(uv.y,uv.x);",
      "  float len=length(uv);",
      "  float invLen=len>0.0?1.0/len:0.0;",
      "  float bgLuminance=dot(backgroundColor,vec3(0.299,0.587,0.114));",
      "  float n0=snoise3(vec3(uv*noiseScale,iTime*0.5))*0.5+0.5;",
      "  float r0=mix(mix(innerRadius,1.0,0.4),mix(innerRadius,1.0,0.6),n0);",
      "  float d0=distance(uv,(r0*invLen)*uv);",
      "  float v0=light1(1.0,10.0,d0);",
      "  v0*=smoothstep(r0*1.05,r0,len);",
      "  float innerFade=smoothstep(r0*0.8,r0*0.95,len);",
      "  v0*=mix(innerFade,1.0,bgLuminance*0.7);",
      "  float cl=cos(ang+iTime*2.0)*0.5+0.5;",
      "  float a=iTime*-1.0;",
      "  vec2 pos=vec2(cos(a),sin(a))*r0;",
      "  float d=distance(uv,pos);",
      "  float v1=light2(1.5,5.0,d);",
      "  v1*=light1(1.0,50.0,d0);",
      "  float v2=smoothstep(1.0,mix(innerRadius,1.0,n0*0.5),len);",
      "  float v3=smoothstep(innerRadius,mix(innerRadius,1.0,0.5),len);",
      "  vec3 colBase=mix(color1,color2,cl);",
      "  float fadeAmount=mix(1.0,0.1,bgLuminance);",
      "  vec3 darkCol=mix(color3,colBase,v0);",
      "  darkCol=(darkCol+v1)*v2*v3;",
      "  darkCol=clamp(darkCol,0.0,1.0);",
      "  vec3 lightCol=(colBase+v1)*mix(1.0,v2*v3,fadeAmount);",
      "  lightCol=mix(backgroundColor,lightCol,v0);",
      "  lightCol=clamp(lightCol,0.0,1.0);",
      "  vec3 finalCol=mix(darkCol,lightCol,bgLuminance);",
      "  return extractAlpha(finalCol);",
      "}",
      "vec4 mainImage(vec2 fragCoord){",
      "  vec2 center=iResolution.xy*0.5;",
      "  float size=min(iResolution.x,iResolution.y);",
      "  vec2 uv=(fragCoord-center)/size*2.0*orbScale;",
      "  float angle=rot;",
      "  float s=sin(angle);",
      "  float c=cos(angle);",
      "  uv=vec2(c*uv.x-s*uv.y,s*uv.x+c*uv.y);",
      "  uv.x+=hover*hoverIntensity*0.1*sin(uv.y*10.0+iTime);",
      "  uv.y+=hover*hoverIntensity*0.1*sin(uv.x*10.0+iTime);",
      "  return draw(uv);",
      "}",
      "void main(){",
      "  vec2 fragCoord=vUv*iResolution.xy;",
      "  vec4 col=mainImage(fragCoord);",
      "  gl_FragColor=vec4(col.rgb*col.a,col.a);",
      "}"
    ].join("\n");

    function compileShader(type, src){
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)){
        gl.deleteShader(s);
        return null;
      }
      return s;
    }

    var vs = compileShader(gl.VERTEX_SHADER, vertSrc);
    var fs = compileShader(gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) return;

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    // full-screen triangle (same trick ogl's Triangle geometry uses)
    var posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    var posLoc = gl.getAttribLocation(prog, "position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    var uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0, 2,0, 0,2]), gl.STATIC_DRAW);
    var uvLoc = gl.getAttribLocation(prog, "uv");
    gl.enableVertexAttribArray(uvLoc);
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

    var uITime = gl.getUniformLocation(prog, "iTime");
    var uIRes = gl.getUniformLocation(prog, "iResolution");
    var uHue = gl.getUniformLocation(prog, "hue");
    var uHover = gl.getUniformLocation(prog, "hover");
    var uRot = gl.getUniformLocation(prog, "rot");
    var uHoverIntensity = gl.getUniformLocation(prog, "hoverIntensity");
    var uBgColor = gl.getUniformLocation(prog, "backgroundColor");
    var uOrbScale = gl.getUniformLocation(prog, "orbScale");

    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1f(uHue, hue);
    gl.uniform1f(uHoverIntensity, hoverIntensity);
    gl.uniform3f(uBgColor, bgColor[0], bgColor[1], bgColor[2]);

    function resize(){
      var dpr = window.devicePixelRatio || 1;
      var width = hero.offsetWidth, height = hero.offsetHeight;
      orbCanvas.width = width * dpr;
      orbCanvas.height = height * dpr;
      orbCanvas.style.width = width + "px";
      orbCanvas.style.height = height + "px";
      gl.viewport(0, 0, orbCanvas.width, orbCanvas.height);
      gl.uniform3f(uIRes, orbCanvas.width, orbCanvas.height, orbCanvas.width / orbCanvas.height);
      // >1 shrinks the orb within the canvas; smaller viewports get a bigger orb
      gl.uniform1f(uOrbScale, width < 640 ? 0.95 : width < 880 ? 1.2 : 1.55);
    }
    window.addEventListener("resize", resize, {passive:true});
    resize();

    var targetHover = 0, hoverVal = 0, currentRot = 0, lastT = 0;
    var rotationSpeed = 0.3;

    function updateHoverFromPoint(clientX, clientY){
      var r = hero.getBoundingClientRect();
      var x = clientX - r.left, y = clientY - r.top;
      var size = Math.min(r.width, r.height);
      var uvX = ((x - r.width/2) / size) * 2.0;
      var uvY = ((y - r.height/2) / size) * 2.0;
      targetHover = Math.sqrt(uvX*uvX + uvY*uvY) < 0.8 ? 1 : 0;
    }

    if (finePointer) {
      hero.addEventListener("mousemove", function(e){
        updateHoverFromPoint(e.clientX, e.clientY);
      }, {passive:true});
      hero.addEventListener("mouseleave", function(){ targetHover = 0; }, {passive:true});
    }

    hero.addEventListener("touchstart", function(e){
      if (e.touches[0]) updateHoverFromPoint(e.touches[0].clientX, e.touches[0].clientY);
    }, {passive:true});
    hero.addEventListener("touchmove", function(e){
      if (e.touches[0]) updateHoverFromPoint(e.touches[0].clientX, e.touches[0].clientY);
    }, {passive:true});
    hero.addEventListener("touchend", function(){ targetHover = 0; }, {passive:true});
    hero.addEventListener("touchcancel", function(){ targetHover = 0; }, {passive:true});

    (function update(t){
      requestAnimationFrame(update);
      var dt = (t - lastT) * 0.001;
      lastT = t;
      gl.uniform1f(uITime, t * 0.001);

      var effectiveHover = forceHoverState ? 1 : targetHover;
      hoverVal += (effectiveHover - hoverVal) * 0.1;
      gl.uniform1f(uHover, hoverVal);

      if (rotateOnHover && effectiveHover > 0.5) currentRot += dt * rotationSpeed;
      gl.uniform1f(uRot, currentRot);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    })(0);
  })();

  /* ---------- reveal on scroll ---------- */
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if (en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, {threshold:0.12, rootMargin:"0px 0px -40px 0px"});
  document.querySelectorAll(".reveal").forEach(function(el){ io.observe(el); });

  /* ---------- scroll-linked text reveal (gray -> light) ---------- */
  var fadeEls = document.querySelectorAll(".scroll-fade-text");
  if (fadeEls.length) {
    if (reduced) {
      fadeEls.forEach(function(el){ el.style.setProperty("--progress", "100%"); });
    } else {
      var fadeTicking = false;
      var updateFade = function(){
        var vh = innerHeight;
        var start = vh * 0.88, end = vh * 0.4;
        fadeEls.forEach(function(el){
          var r = el.getBoundingClientRect();
          var span = (start - end) + r.height;
          var p = span > 0 ? (start - r.top) / span : 1;
          p = Math.max(0, Math.min(1, p));
          el.style.setProperty("--progress", (p * 100) + "%");
        });
        fadeTicking = false;
      };
      window.addEventListener("scroll", function(){
        if (!fadeTicking) { requestAnimationFrame(updateFade); fadeTicking = true; }
      }, {passive:true});
      window.addEventListener("resize", updateFade, {passive:true});
      updateFade();
    }
  }

  /* ---------- service card spotlight follows cursor ---------- */
  if (finePointer) {
    document.querySelectorAll(".svc-card").forEach(function(card){
      card.addEventListener("mousemove", function(e){
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - r.left)/r.width*100) + "%");
        card.style.setProperty("--my", ((e.clientY - r.top)/r.height*100) + "%");
      });
    });
  }

  /* ---------- marquee: duplicate track for seamless loop ---------- */
  var track = document.getElementById("marqueeTrack");
  if (track) track.innerHTML += track.innerHTML;

  /* ---------- nav state + scroll progress ---------- */
  var nav = document.getElementById("nav"), bar = document.getElementById("scrollProgress");
  function onScroll(){
    var y = window.scrollY;
    nav.classList.toggle("scrolled", y > 40);
    var max = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (max > 0 ? (y/max*100) : 0) + "%";
  }
  window.addEventListener("scroll", onScroll, {passive:true});
  onScroll();

  /* ---------- mobile menu ---------- */
  var burger = document.getElementById("burger"), menu = document.getElementById("mobileMenu");
  burger.addEventListener("click", function(){
    var open = menu.classList.toggle("open");
    burger.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open);
    document.body.style.overflow = open ? "hidden" : "";
  });
  menu.querySelectorAll("a").forEach(function(a){
    a.addEventListener("click", function(){
      menu.classList.remove("open");
      burger.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  });

  /* ---------- contact form (demo handler — wire to your backend) ---------- */
  var form = document.getElementById("contactForm");
  form.addEventListener("submit", function(e){
    e.preventDefault();
    if (!form.checkValidity()){ form.reportValidity(); return; }
    document.getElementById("formNote").classList.add("show");
    form.reset();
  });

  /* ---------- "leaving this site" confirmation for external links ---------- */
  var leaveModal = document.getElementById("leaveModal");
  if (leaveModal) {
    var leaveUrlEl = document.getElementById("leaveModalUrl");
    var leaveConfirm = document.getElementById("leaveModalConfirm");
    var leaveCancel = document.getElementById("leaveModalCancel");

    function openLeaveModal(url){
      leaveUrlEl.textContent = url;
      leaveConfirm.href = url;
      leaveModal.classList.add("open");
      leaveModal.setAttribute("aria-hidden", "false");
    }
    function closeLeaveModal(){
      leaveModal.classList.remove("open");
      leaveModal.setAttribute("aria-hidden", "true");
    }

    document.addEventListener("click", function(e){
      var a = e.target.closest && e.target.closest("a[href^='http']");
      if (!a || a.hostname === location.hostname) return;
      e.preventDefault();
      openLeaveModal(a.href);
    });
    leaveCancel.addEventListener("click", closeLeaveModal);
    leaveConfirm.addEventListener("click", closeLeaveModal);
    leaveModal.addEventListener("click", function(e){
      if (e.target === leaveModal) closeLeaveModal();
    });
    document.addEventListener("keydown", function(e){
      if (e.key === "Escape") closeLeaveModal();
    });
  }
})();
