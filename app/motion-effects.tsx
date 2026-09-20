"use client";
import { useEffect } from "react";
import Lenis from "lenis";

export default function MotionEffects() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | undefined;
    let raf = 0, lastY = -1;
    const setup = () => {
      lenis?.destroy();
      lenis = reduced.matches ? undefined : new Lenis({lerp:.085,smoothWheel:true,wheelMultiplier:.85,anchors:{offset:-96}});
    };
    setup();reduced.addEventListener("change",setup);
    const header = document.querySelector<HTMLElement>(".site-header");
    const hero = document.querySelector<HTMLElement>(".hero-image-wrap");
    const bar = document.querySelector<HTMLElement>(".reading-progress");
    const tick=(time:number)=>{
      lenis?.raf(time);
      const y=window.scrollY;
      if(y!==lastY){
        header?.classList.toggle("has-scrolled",y>25);
        if(bar)bar.style.transform=`scaleX(${y/Math.max(1,document.documentElement.scrollHeight-window.innerHeight)})`;
        if(hero&&!reduced.matches)hero.style.setProperty("--parallax",`${Math.min(y*.14,115)}px`);
        lastY=y;
      }
      raf=requestAnimationFrame(tick);
    };
    raf=requestAnimationFrame(tick);
    const reveals=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("is-visible");reveals.unobserve(entry.target);}}),{threshold:.09});
    document.querySelectorAll(".reveal").forEach(el=>{if(!reduced.matches)el.classList.add("will-reveal");reveals.observe(el);});
    const sections=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){document.querySelectorAll(".site-header nav a").forEach(link=>{const active=link.getAttribute("href")==="#"+entry.target.id;link.classList.toggle("current",active);if(active)link.setAttribute("aria-current","location");else link.removeAttribute("aria-current");});}}),{rootMargin:"-20% 0px -55% 0px"});
    document.querySelectorAll("main section[id]").forEach(el=>sections.observe(el));
    return()=>{cancelAnimationFrame(raf);lenis?.destroy();reveals.disconnect();sections.disconnect();reduced.removeEventListener("change",setup);};
  },[]);
  return null;
}
