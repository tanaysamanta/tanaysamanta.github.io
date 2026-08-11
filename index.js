(function(){
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------- loader ---------- */
  window.addEventListener("load", function(){
    setTimeout(function(){ document.getElementById("loader").classList.add("done"); }, 350);
  });
  // Fallback in case load fires late (e.g. blocked fonts)
  setTimeout(function(){ document.getElementById("loader").classList.add("done"); }, 2500);

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

  /* ---------- particles ---------- */
  var canvas = document.getElementById("particles");
  if (canvas && !reduced) {
    var ctx = canvas.getContext("2d"), ps = [], W, H;
    function sizeCanvas(){
      var hero = canvas.parentElement;
      W = canvas.width = hero.offsetWidth;
      H = canvas.height = hero.offsetHeight;
    }
    function seed(){
      ps = [];
      var count = W < 768 ? 26 : 64;
      for (var i = 0; i < count; i++){
        ps.push({
          x: Math.random()*W, y: Math.random()*H,
          r: 0.6 + Math.random()*1.7,
          vy: 0.12 + Math.random()*0.3,
          vx: (Math.random()-0.5)*0.14,
          a: 0.15 + Math.random()*0.5,
          tw: Math.random()*Math.PI*2
        });
      }
    }
    sizeCanvas(); seed();
    window.addEventListener("resize", function(){ sizeCanvas(); seed(); }, {passive:true});
    (function draw(){
      ctx.clearRect(0,0,W,H);
      for (var i = 0; i < ps.length; i++){
        var p = ps[i];
        p.y -= p.vy; p.x += p.vx; p.tw += 0.02;
        if (p.y < -6){ p.y = H + 6; p.x = Math.random()*W; }
        var alpha = p.a * (0.6 + 0.4*Math.sin(p.tw));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = "rgba(61,224,143," + alpha.toFixed(3) + ")";
        ctx.fill();
      }
      requestAnimationFrame(draw);
    })();
  }

  /* ---------- reveal on scroll ---------- */
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if (en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, {threshold:0.12, rootMargin:"0px 0px -40px 0px"});
  document.querySelectorAll(".reveal").forEach(function(el){ io.observe(el); });

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
})();
