"use client";
import { ArrowUpRight, ArrowDown, MoveUpRight, Box } from "lucide-react";
import MotionEffects from "./motion-effects";
import Studio from "./studio";

export default function Home() {
  return <div id="home">
    <MotionEffects/>
    <a className="skip-link" href="#studio">Перейти к 3D-плану</a>
    <header className="site-header"><div className="reading-progress" aria-hidden="true"/>
      <a className="wordmark" href="#home" aria-label="gasgarick, главная">gasgarick<span className="brand-dot">.</span></a>
      <nav aria-label="Основная навигация"><a href="#studio">Квартиры</a><a href="#inspiration">Вдохновение</a><a href="#process">Этапы ремонта</a></nav>
      <a className="header-cta" href="#studio">Ваше пространство <ArrowUpRight size={17}/></a>
    </header>
    <main>
      <Studio/>
      <section className="hero inspiration-hero" id="inspiration">
        <div className="hero-copy">
          <div className="eyebrow"><span className="tiny-line"/> СТУДИЯ ДИЗАЙНА И РЕМОНТА</div>
          <h2><span className="title-line"><span>Место,</span></span><span className="title-line"><span>где хочется</span></span><span className="title-line"><em>быть собой.</em></span></h2>
          <p className="hero-description">Продуманный дизайн. Бережный ремонт.<br/>Интерьер, в котором начинается ваша жизнь.</p>
          <a className="primary-button" href="#studio">Создать своё пространство <ArrowUpRight size={20}/></a>
          <div className="hero-bottom"><span className="swatch-stack" aria-hidden="true"><i/><i/><i/></span><span>Мягкие оттенки.<br/>Настоящие ощущения.</span><a href="#approach" aria-label="Узнать о подходе"><ArrowDown size={19}/></a></div>
        </div>
        <div className="hero-image-wrap"><span className="hero-vertical">GASGARICK / INTERIOR DESIGN</span>
          <img className="hero-image" src="/images/interior.webp" alt="Светлая гостиная с мягким диваном, шалфейным креслом и натуральными материалами" width="1536" height="1024" fetchPriority="high"/>
          <div className="image-topline"><span>ИСКУССТВО БЫТЬ ДОМА</span><span>G / 01</span></div>
          <a className="image-badge" href="#studio"><span className="badge-icon"><Box size={23} strokeWidth={1.4}/></span><span><strong>Почувствуйте пространство</strong><small>Исследовать 3D-план</small></span><ArrowUpRight size={21}/></a>
          <span className="image-caption">Концепция гостиной · тёплый минимализм</span>
        </div>
      </section>
      <section className="approach section-shell reveal" id="approach">
        <div className="section-kicker"><span>01 / НАШ ПОДХОД</span><span className="asterisk" aria-hidden="true">✳</span></div>
        <div className="approach-main"><h2>Хороший интерьер<br/>начинается <em>с вас.</em></h2><p>С утреннего кофе, любимой книги и привычки собираться вместе. Мы продумываем пространство вокруг вашей жизни — от первого наброска до последнего штриха.</p></div>
        <div className="material-notes"><span>Естественный свет</span><span>Тактильные материалы</span><span>Ничего лишнего</span></div>
      </section>
      <section className="process-section section-shell reveal" id="process">
        <div className="section-heading"><div><div className="section-kicker">03 / ОТ ИДЕИ ДО ДОМА</div><h2>Каждая деталь.<br/><em>В своё время.</em></h2></div><p>Цельная история, в которой<br/>каждый этап продолжает предыдущий.</p></div>
        <div className="process-grid">{[
          ["01", "Знакомимся", "Говорим о привычках, пожеланиях и бюджете. Собираем образ вашего будущего дома."],
          ["02", "Проектируем", "Планировка, материалы и 3D-визуализация. Видим целую картину до начала ремонта."],
          ["03", "Воплощаем", "Последовательно переходим от черновых работ к отделке, свету и мебели."],
          ["04", "Добавляем жизнь", "Текстиль, любимые предметы, финальные детали. Остаётся сделать первый шаг домой."],
        ].map(([n,t,d])=><article key={n}><div className="process-index"><span>{n}</span><MoveUpRight size={19} strokeWidth={1.3}/></div><h3>{t}</h3><p>{d}</p></article>)}</div>
      </section>
      <section className="closing section-shell reveal"><span className="closing-label">ПРОСТРАНСТВО ДЛЯ ВАШЕЙ ЖИЗНИ</span><p>Не просто новый интерьер.<br/><em>Новое ощущение дома.</em></p><a href="#studio" className="closing-link">Вернуться в пространство <ArrowUpRight size={19}/></a></section>
    </main>
    <footer className="site-footer"><a className="wordmark" href="#home">gasgarick<span className="brand-dot">.</span></a><span>Дизайн и ремонт с вниманием к вам.</span><span>© {new Date().getFullYear()} gasgarick</span></footer>
  </div>;
}
