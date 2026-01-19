import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ============================================
// BFLOW - JBBJ Animation Studio Scheduler
// Final Prototype v3.0
// Widget Grid + Multi-day Calendar + Node Map
// ============================================

const BRAND = {
  primary: '#F0E68C',
  primaryDark: '#D4CA6A',
  primaryLight: '#F5EDA8',
};

// ============================================
// Mock Data
// ============================================

const TEAM_MEMBERS = [
  { id: 1, name: '홍길동', role: '애니메이터', avatar: '🎨', task: 'ep.15 SC_001', status: 'working' },
  { id: 2, name: '김길동', role: '배경', avatar: '🖼️', task: 'ep.15 배경 - 주인공 집', status: 'working' },
  { id: 3, name: '이길동', role: '릴', avatar: '🎬', task: 'ep.16 릴 제작', status: 'review' },
  { id: 4, name: '박길동', role: '보정', avatar: '✨', task: 'ep.14 컬러 보정', status: 'done' },
  { id: 5, name: '최길동', role: '사운드', avatar: '🔊', task: 'ep.15 사운드 믹싱', status: 'waiting' },
  { id: 6, name: '정길동', role: '애니메이터', avatar: '🎨', task: 'ep.15 SC_003', status: 'working' },
];

const PIPELINE_STAGES = [
  '원정', '대본', '가녹음', '피칭', '에셋', '아트보드', '릴', '애니메이션', '보정', '가편', '피드백', '업로드'
];

const EPISODES = [
  { 
    id: 'ep15', 
    name: 'ep.15 - 대환장 파티', 
    progress: 75, 
    stage: '애니메이션', 
    dueDate: '01/25',
    milestones: [
      { stage: '원정', date: '12/01', note: '제주도 원정 완료, 기획안 확정' },
      { stage: '대본', date: '12/10', note: '대본 3차 수정 완료' },
      { stage: '가녹음', date: '12/15', note: '메인 성우 녹음 완료' },
      { stage: '피칭', date: '12/18', note: '연기 디렉션 확정' },
      { stage: '에셋', date: '12/28', note: '주요 캐릭터 에셋 완료' },
      { stage: '아트보드', date: '01/05', note: '룩뎁 확정, 컬러스크립트 완료' },
      { stage: '릴', date: '01/12', note: '전체 릴 1차 완성' },
      { stage: '애니메이션', date: null, note: '현재 진행중 - 45/60 컷 완료', current: true },
    ]
  },
  { 
    id: 'ep16', 
    name: 'ep.16 - 비밀의 방', 
    progress: 35, 
    stage: '릴 제작', 
    dueDate: '02/08',
    milestones: [
      { stage: '원정', date: '12/15', note: '강릉 원정, 미스터리 컨셉 확정' },
      { stage: '대본', date: '12/28', note: '대본 1차 완료' },
      { stage: '가녹음', date: '01/05', note: '가녹음 진행중' },
      { stage: '릴', date: null, note: '릴 작업 시작 예정', current: true },
    ]
  },
  { 
    id: 'ep17', 
    name: 'ep.17 - 최후의 만찬', 
    progress: 10, 
    stage: '대본 집필', 
    dueDate: '02/22',
    milestones: [
      { stage: '원정', date: '01/10', note: '서울 스튜디오 내부 기획' },
      { stage: '대본', date: null, note: '대본 집필 중 - 30% 완료', current: true },
    ]
  },
];

const TODAY_TASKS = [
  { id: 1, title: 'ep.15 SC_001 마감', type: 'deadline', priority: 'high', time: '18:00' },
  { id: 2, title: 'ep.16 릴 리뷰 회의', type: 'meeting', priority: 'medium', time: '14:00' },
  { id: 3, title: 'ep.15 배경 피드백 반영', type: 'task', priority: 'high', time: '12:00' },
  { id: 4, title: 'ep.17 대본 초안 검토', type: 'task', priority: 'low', time: '16:00' },
];

// Multi-day calendar events
const generateCalendarEvents = () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();
  
  return [
    // Single day events
    { id: 1, title: 'ep.15 SC_001 마감', type: 'deadline', start: new Date(y, m, d), end: new Date(y, m, d) },
    { id: 2, title: 'ep.16 릴 리뷰', type: 'meeting', start: new Date(y, m, d + 2), end: new Date(y, m, d + 2) },
    
    // Multi-day events
    { id: 3, title: 'ep.15 애니메이션 집중 작업', type: 'task', start: new Date(y, m, d + 1), end: new Date(y, m, d + 5), color: '#F0E68C' },
    { id: 4, title: 'ep.17 원정 (속초)', type: 'event', start: new Date(y, m, d + 7), end: new Date(y, m, d + 9), color: '#22C55E' },
    { id: 5, title: 'ep.16 배경 제작 기간', type: 'task', start: new Date(y, m, d + 3), end: new Date(y, m, d + 10), color: '#3B82F6' },
    { id: 6, title: '설 연휴', type: 'holiday', start: new Date(y, m, d + 12), end: new Date(y, m, d + 14), color: '#EF4444' },
    { id: 7, title: 'ep.15 최종 마감', type: 'milestone', start: new Date(y, m, d + 6), end: new Date(y, m, d + 6) },
  ];
};

const CALENDAR_EVENTS = generateCalendarEvents();

// Node Map Data
const NODE_MAP_DATA = {
  nodes: [
    { id: 'ep15', label: 'ep.15', type: 'episode', x: 400, y: 300, status: 'active' },
    { id: 'ep16', label: 'ep.16', type: 'episode', x: 700, y: 200, status: 'progress' },
    { id: 'ep17', label: 'ep.17', type: 'episode', x: 700, y: 400, status: 'waiting' },
    
    { id: 'ep15-ani', label: '애니메이션', type: 'task', x: 200, y: 200, status: 'active', parent: 'ep15' },
    { id: 'ep15-bg', label: '배경', type: 'task', x: 200, y: 400, status: 'progress', parent: 'ep15' },
    { id: 'ep15-sound', label: '사운드', type: 'task', x: 100, y: 300, status: 'waiting', parent: 'ep15' },
    
    { id: 'ep16-reel', label: '릴 제작', type: 'task', x: 850, y: 150, status: 'active', parent: 'ep16' },
    { id: 'ep16-asset', label: '에셋', type: 'task', x: 900, y: 250, status: 'progress', parent: 'ep16' },
    
    { id: 'ep17-script', label: '대본', type: 'task', x: 850, y: 400, status: 'active', parent: 'ep17' },
    
    { id: 'hongkd', label: '홍길동', type: 'person', x: 300, y: 100, avatar: '🎨' },
    { id: 'kimkd', label: '김길동', type: 'person', x: 100, y: 450, avatar: '🖼️' },
    { id: 'leekd', label: '이길동', type: 'person', x: 950, y: 100, avatar: '🎬' },
  ],
  edges: [
    { from: 'ep15', to: 'ep15-ani' },
    { from: 'ep15', to: 'ep15-bg' },
    { from: 'ep15', to: 'ep15-sound' },
    { from: 'ep15-ani', to: 'ep15-sound', type: 'dependency' },
    { from: 'ep15-bg', to: 'ep15-sound', type: 'dependency' },
    
    { from: 'ep16', to: 'ep16-reel' },
    { from: 'ep16', to: 'ep16-asset' },
    { from: 'ep16-asset', to: 'ep16-reel', type: 'dependency' },
    
    { from: 'ep17', to: 'ep17-script' },
    
    { from: 'hongkd', to: 'ep15-ani', type: 'assigned' },
    { from: 'kimkd', to: 'ep15-bg', type: 'assigned' },
    { from: 'leekd', to: 'ep16-reel', type: 'assigned' },
    
    { from: 'ep15', to: 'ep16', type: 'sequence' },
    { from: 'ep16', to: 'ep17', type: 'sequence' },
  ],
};

// ============================================
// Utility Components
// ============================================

const Confetti = ({ active }) => {
  const [particles, setParticles] = useState([]);
  
  useEffect(() => {
    if (active) {
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1 + Math.random() * 1,
        color: ['#F0E68C', '#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#A855F7'][Math.floor(Math.random() * 6)],
        size: 4 + Math.random() * 8,
      }));
      setParticles(newParticles);
      setTimeout(() => setParticles([]), 2000);
    }
  }, [active]);

  if (!active && particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: `${p.x}%`,
            top: '-20px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
};

const Tooltip = ({ children, content, position = 'top' }) => {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef(null);

  const handleMouseEnter = () => {
    setShow(true);
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        x: rect.left + rect.width / 2,
        y: position === 'top' ? rect.top - 8 : rect.bottom + 8,
      });
    }
  };

  return (
    <div 
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && content && (
        <div
          className="fixed z-[100] px-3 py-2 text-sm bg-gray-900 text-white rounded-lg shadow-xl
                     border border-gray-700 max-w-xs animate-fade-in pointer-events-none"
          style={{
            left: coords.x,
            top: coords.y,
            transform: position === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
          }}
        >
          <div className={`absolute w-2 h-2 bg-gray-900 border-gray-700 rotate-45
                         ${position === 'top' ? 'bottom-[-5px] border-r border-b' : 'top-[-5px] border-l border-t'}`}
               style={{ left: '50%', transform: 'translateX(-50%) rotate(45deg)' }} />
          {content}
        </div>
      )}
    </div>
  );
};

const TiltCard = ({ children, className = '', intensity = 15 }) => {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState('');
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -intensity;
    const rotateY = ((x - centerX) / centerX) * intensity;
    
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
    setGlare({ x: (x / rect.width) * 100, y: (y / rect.height) * 100, opacity: 0.15 });
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setGlare({ x: 50, y: 50, opacity: 0 });
  };

  return (
    <div
      ref={cardRef}
      className={`relative transition-transform duration-200 ease-out ${className}`}
      style={{ transform, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <div
        className="absolute inset-0 pointer-events-none rounded-lg"
        style={{
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}), transparent 60%)`,
        }}
      />
    </div>
  );
};

// ============================================
// Widget System
// ============================================

const Widget = ({ 
  title, 
  icon, 
  children, 
  size = { w: 2, h: 2 }, 
  onResize,
  minSize = { w: 1, h: 1 },
  maxSize = { w: 4, h: 4 },
  accentColor,
  noPadding = false,
}) => {
  const [showSizeMenu, setShowSizeMenu] = useState(false);

  const sizeOptions = [];
  for (let w = minSize.w; w <= maxSize.w; w++) {
    for (let h = minSize.h; h <= maxSize.h; h++) {
      sizeOptions.push({ w, h, label: `${w}×${h}` });
    }
  }

  return (
    <div
      className="relative bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/30
                 transition-all duration-300 overflow-hidden group
                 hover:border-gray-600/50 hover:bg-gray-800/50"
      style={{
        gridColumn: `span ${size.w}`,
        gridRow: `span ${size.h}`,
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/30">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">{icon}</span>
          <h3 className="font-semibold text-gray-200 text-sm">{title}</h3>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowSizeMenu(!showSizeMenu)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-700/50
                      opacity-0 group-hover:opacity-100 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
          
          {showSizeMenu && (
            <div className="absolute right-0 top-full mt-1 p-2 bg-gray-800 rounded-lg border border-gray-700 shadow-xl z-50 animate-fade-in">
              <div className="text-xs text-gray-500 mb-2 px-1">위젯 크기</div>
              <div className="grid grid-cols-4 gap-1">
                {sizeOptions.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => {
                      onResize?.({ w: opt.w, h: opt.h });
                      setShowSizeMenu(false);
                    }}
                    className={`px-2 py-1 text-xs rounded transition-colors
                              ${size.w === opt.w && size.h === opt.h
                                ? 'text-gray-900 font-medium'
                                : 'text-gray-400 hover:bg-gray-700'}`}
                    style={size.w === opt.w && size.h === opt.h ? { backgroundColor: accentColor } : {}}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className={`h-[calc(100%-52px)] overflow-auto custom-scrollbar ${noPadding ? '' : 'p-4'}`}>
        {children}
      </div>
    </div>
  );
};

// ============================================
// Dashboard Components
// ============================================

const SummaryCard = ({ icon, label, value, color, compact = false }) => (
  <TiltCard intensity={10} className="h-full">
    <div
      className={`h-full bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/30
                 hover:border-opacity-60 transition-all duration-300 group
                 ${compact ? 'p-3' : 'p-4'}`}
      style={{ borderColor: `${color}40` }}
    >
      <div className={`flex items-center ${compact ? 'gap-2' : 'justify-between'}`}>
        <div
          className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl flex items-center justify-center
                    group-hover:scale-110 transition-all duration-300`}
          style={{ backgroundColor: `${color}20` }}
        >
          <span className={compact ? 'text-base' : 'text-xl'}>{icon}</span>
        </div>
        <div className={compact ? 'flex-1' : ''}>
          <p className={`text-gray-500 ${compact ? 'text-xs' : 'text-xs uppercase tracking-wider'}`}>{label}</p>
          <p className={`font-bold ${compact ? 'text-xl' : 'text-2xl'}`} style={{ color }}>{value}</p>
        </div>
      </div>
    </div>
  </TiltCard>
);

const GanttChart = ({ episodes, accentColor, compact = false }) => {
  return (
    <div className="space-y-3">
      {episodes.map((ep) => (
        <div key={ep.id} className="group">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
              <span className={`font-medium text-gray-200 ${compact ? 'text-sm' : ''}`}>{ep.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-400">
                {ep.stage}
              </span>
              <span className="text-xs text-gray-500">마감 {ep.dueDate}</span>
            </div>
          </div>
          
          <div className="relative h-8 bg-gray-900/50 rounded-lg overflow-visible">
            {PIPELINE_STAGES.map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-gray-700/30"
                style={{ left: `${((i + 1) / PIPELINE_STAGES.length) * 100}%` }}
              />
            ))}
            
            <div
              className="absolute top-1 bottom-1 left-1 rounded transition-all duration-700"
              style={{
                width: `calc(${ep.progress}% - 8px)`,
                background: `linear-gradient(90deg, ${accentColor}dd, ${accentColor}88)`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
            
            {ep.milestones?.map((milestone, i) => {
              const stageIndex = PIPELINE_STAGES.indexOf(milestone.stage);
              if (stageIndex === -1) return null;
              const position = ((stageIndex + 0.5) / PIPELINE_STAGES.length) * 100;
              
              return (
                <Tooltip
                  key={i}
                  position="top"
                  content={
                    <div className="min-w-[200px]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold" style={{ color: milestone.current ? accentColor : 'white' }}>
                          {milestone.stage}
                        </span>
                        {milestone.current && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                            진행중
                          </span>
                        )}
                      </div>
                      {milestone.date && <div className="text-xs text-gray-400 mb-1">{milestone.date}</div>}
                      <div className="text-gray-300">{milestone.note}</div>
                    </div>
                  }
                >
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200
                              hover:scale-150 hover:z-10
                              ${milestone.current ? 'w-4 h-4 -ml-2' : 'w-3 h-3 -ml-1.5'}`}
                    style={{ left: `${position}%` }}
                  >
                    <div
                      className={`w-full h-full rounded-full border-2 ${milestone.current ? 'animate-pulse' : ''}`}
                      style={{
                        backgroundColor: milestone.current ? accentColor : milestone.date ? '#22C55E' : '#6B7280',
                        borderColor: 'white',
                        boxShadow: milestone.current ? `0 0 10px ${accentColor}` : 'none',
                      }}
                    />
                  </div>
                </Tooltip>
              );
            })}
          </div>
          
          {!compact && (
            <div className="flex mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {PIPELINE_STAGES.map((stage) => (
                <div key={stage} className="flex-1 text-center text-[10px] text-gray-600">{stage}</div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ============================================
// Enhanced Calendar with Multi-day Events
// ============================================

const Calendar = ({ view = 'weekly', onViewChange, accentColor, compact = false }) => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  
  const eventTypeColors = {
    deadline: '#EF4444',
    meeting: '#3B82F6',
    milestone: '#F0E68C',
    event: '#22C55E',
    task: '#A855F7',
    holiday: '#EF4444',
  };

  const isSameDay = (d1, d2) => {
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  };

  const isToday = (date) => isSameDay(date, today);

  const getMonthDates = () => {
    const dates = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    
    for (let i = startPadding - 1; i >= 0; i--) {
      dates.push({ date: new Date(year, month, -i), isCurrentMonth: false });
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      dates.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    const remaining = 42 - dates.length;
    for (let i = 1; i <= remaining; i++) {
      dates.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    return dates;
  };

  const getWeekDates = () => {
    const dates = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Get multi-day events that span across the given date
  const getEventsForDate = (date) => {
    return CALENDAR_EVENTS.filter(e => {
      const startDate = new Date(e.start);
      const endDate = new Date(e.end);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      const checkDate = new Date(date);
      checkDate.setHours(12, 0, 0, 0);
      return checkDate >= startDate && checkDate <= endDate;
    });
  };

  // Check if date is the start of an event
  const isEventStart = (event, date) => isSameDay(event.start, date);
  
  // Check if date is the end of an event
  const isEventEnd = (event, date) => isSameDay(event.end, date);

  // Calculate event span within the visible week (for weekly view)
  const getEventSpan = (event, weekDates) => {
    const startIdx = weekDates.findIndex(d => isSameDay(d, event.start) || d > event.start);
    const endIdx = weekDates.findIndex(d => isSameDay(d, event.end));
    
    const actualStart = Math.max(0, startIdx === -1 ? 0 : startIdx);
    const actualEnd = endIdx === -1 ? 6 : endIdx;
    
    return { start: actualStart, end: actualEnd, span: actualEnd - actualStart + 1 };
  };

  const navigate = (direction) => {
    const newDate = new Date(currentDate);
    if (view === 'weekly') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setCurrentDate(newDate);
  };

  // Weekly View with multi-day event bars
  const renderWeeklyView = () => {
    const weekDates = getWeekDates();
    
    // Group events by their row position to avoid overlapping
    const eventRows = [];
    CALENDAR_EVENTS.forEach(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      const weekStart = weekDates[0];
      const weekEnd = weekDates[6];
      
      // Check if event overlaps with this week
      if (eventEnd >= weekStart && eventStart <= weekEnd) {
        const { start, end, span } = getEventSpan(event, weekDates);
        
        // Find available row
        let rowIndex = 0;
        while (eventRows[rowIndex]?.some(e => 
          (start >= e.start && start <= e.end) || (end >= e.start && end <= e.end) ||
          (start <= e.start && end >= e.end)
        )) {
          rowIndex++;
        }
        
        if (!eventRows[rowIndex]) eventRows[rowIndex] = [];
        eventRows[rowIndex].push({ ...event, start, end, span });
      }
    });

    return (
      <div className="flex flex-col h-full">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDates.map((date, i) => (
            <div key={i} className="text-center">
              <div className={`text-xs mb-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'}`}>
                {days[i]}
              </div>
              <div
                className={`text-lg font-medium mx-auto w-8 h-8 rounded-lg flex items-center justify-center
                          ${isToday(date) ? 'text-gray-900' : 'text-gray-300'}`}
                style={isToday(date) ? { backgroundColor: accentColor } : {}}
              >
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>
        
        {/* Event Rows */}
        <div className="flex-1 relative">
          {eventRows.slice(0, 4).map((row, rowIdx) => (
            <div key={rowIdx} className="grid grid-cols-7 gap-1 mb-1">
              {Array(7).fill(null).map((_, dayIdx) => {
                const event = row.find(e => e.start === dayIdx);
                if (event) {
                  return (
                    <Tooltip
                      key={dayIdx}
                      content={
                        <div>
                          <div className="font-semibold">{event.title}</div>
                          <div className="text-xs text-gray-400">
                            {event.start !== event.end 
                              ? `${weekDates[event.start].getMonth()+1}/${weekDates[event.start].getDate()} - ${weekDates[event.end].getMonth()+1}/${weekDates[event.end].getDate()}`
                              : `${weekDates[event.start].getMonth()+1}/${weekDates[event.start].getDate()}`
                            }
                          </div>
                        </div>
                      }
                    >
                      <div
                        className="h-6 rounded-md px-2 text-xs flex items-center truncate cursor-pointer
                                  hover:brightness-125 transition-all font-medium"
                        style={{
                          gridColumn: `span ${event.span}`,
                          backgroundColor: event.color || eventTypeColors[event.type] || '#6B7280',
                          color: event.type === 'milestone' ? '#1F2937' : 'white',
                        }}
                      >
                        {event.title}
                      </div>
                    </Tooltip>
                  );
                }
                // Check if this cell is part of a spanning event
                const spanningEvent = row.find(e => dayIdx > e.start && dayIdx <= e.end);
                if (spanningEvent) return null; // Skip, already rendered
                return <div key={dayIdx} className="h-6" />;
              })}
            </div>
          ))}
          
          {eventRows.length > 4 && (
            <div className="text-xs text-gray-500 text-center mt-1">
              +{eventRows.length - 4}개 더보기
            </div>
          )}
        </div>
      </div>
    );
  };

  // Monthly View with multi-day event bars
  const renderMonthlyView = () => {
    const monthDates = getMonthDates();
    const weeks = [];
    for (let i = 0; i < monthDates.length; i += 7) {
      weeks.push(monthDates.slice(i, i + 7));
    }

    return (
      <div className="flex flex-col h-full">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {days.map((day, i) => (
            <div key={day} className={`text-center text-xs py-1
                                      ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'}`}>
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="flex-1 grid grid-rows-6 gap-1">
          {weeks.map((week, weekIdx) => {
            // Get events for this week
            const weekStart = week[0].date;
            const weekEnd = week[6].date;
            
            const weekEvents = CALENDAR_EVENTS.filter(event => {
              const eventStart = new Date(event.start);
              const eventEnd = new Date(event.end);
              return eventEnd >= weekStart && eventStart <= weekEnd;
            }).map(event => {
              let startCol = week.findIndex(d => isSameDay(d.date, event.start));
              let endCol = week.findIndex(d => isSameDay(d.date, event.end));
              
              if (startCol === -1) startCol = 0;
              if (endCol === -1) endCol = 6;
              
              return { ...event, startCol, endCol, span: endCol - startCol + 1 };
            });

            // Sort by start position and duration
            weekEvents.sort((a, b) => a.startCol - b.startCol || b.span - a.span);

            return (
              <div key={weekIdx} className="relative">
                {/* Date cells */}
                <div className="grid grid-cols-7 gap-1">
                  {week.map(({ date, isCurrentMonth }, dayIdx) => (
                    <div
                      key={dayIdx}
                      className={`rounded p-1 min-h-[50px] transition-colors cursor-pointer relative
                                ${!isCurrentMonth ? 'opacity-30' : ''}
                                ${isToday(date) ? 'ring-1' : 'hover:bg-gray-700/30'}
                                ${date.getDay() === 0 ? 'text-red-400' : date.getDay() === 6 ? 'text-blue-400' : ''}`}
                      style={isToday(date) ? { 
                        backgroundColor: `${accentColor}20`,
                        ringColor: accentColor,
                      } : {}}
                    >
                      <div className={`text-xs ${isToday(date) ? 'font-bold' : 'text-gray-400'}`}
                           style={isToday(date) ? { color: accentColor } : {}}>
                        {date.getDate()}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Event bars overlay */}
                <div className="absolute inset-0 pt-5 pointer-events-none">
                  {weekEvents.slice(0, 2).map((event, i) => (
                    <div
                      key={event.id}
                      className="absolute h-4 pointer-events-auto"
                      style={{
                        left: `calc(${(event.startCol / 7) * 100}% + 2px)`,
                        width: `calc(${(event.span / 7) * 100}% - 4px)`,
                        top: `${20 + i * 18}px`,
                      }}
                    >
                      <Tooltip content={event.title}>
                        <div
                          className="h-full rounded text-[10px] px-1 flex items-center truncate cursor-pointer
                                    hover:brightness-125 transition-all"
                          style={{
                            backgroundColor: event.color || eventTypeColors[event.type] || '#6B7280',
                            color: event.type === 'milestone' ? '#1F2937' : 'white',
                          }}
                        >
                          {event.span > 1 ? event.title : ''}
                        </div>
                      </Tooltip>
                    </div>
                  ))}
                  {weekEvents.length > 2 && (
                    <div 
                      className="absolute text-[10px] text-gray-500 pointer-events-auto cursor-pointer hover:text-gray-300"
                      style={{ top: '56px', left: '4px' }}
                    >
                      +{weekEvents.length - 2}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-1 rounded hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-200">
            {currentDate.getFullYear()}년 {months[currentDate.getMonth()]}
          </span>
          <button
            onClick={() => navigate(1)}
            className="p-1 rounded hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div className="flex bg-gray-800 rounded-lg p-0.5">
          <button
            onClick={() => onViewChange?.('weekly')}
            className={`px-2 py-1 text-xs rounded-md transition-colors
                      ${view === 'weekly' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-200'}`}
            style={view === 'weekly' ? { backgroundColor: accentColor } : {}}
          >
            주간
          </button>
          <button
            onClick={() => onViewChange?.('monthly')}
            className={`px-2 py-1 text-xs rounded-md transition-colors
                      ${view === 'monthly' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-200'}`}
            style={view === 'monthly' ? { backgroundColor: accentColor } : {}}
          >
            월간
          </button>
        </div>
      </div>
      
      {/* Calendar Content */}
      <div className="flex-1 min-h-0">
        {view === 'weekly' ? renderWeeklyView() : renderMonthlyView()}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-700/30">
        {Object.entries({ deadline: '마감', meeting: '회의', task: '작업', event: '이벤트' }).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: eventTypeColors[type] }} />
            <span className="text-[10px] text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// Node Map View (Obsidian-style)
// ============================================

const NodeMap = ({ accentColor }) => {
  const containerRef = useRef(null);
  const [nodes, setNodes] = useState(NODE_MAP_DATA.nodes);
  const [edges] = useState(NODE_MAP_DATA.edges);
  const [dragging, setDragging] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null);

  const statusColors = {
    active: accentColor,
    progress: '#3B82F6',
    waiting: '#6B7280',
    done: '#22C55E',
  };

  const nodeTypeStyles = {
    episode: { size: 60, borderWidth: 3 },
    task: { size: 45, borderWidth: 2 },
    person: { size: 50, borderWidth: 2 },
  };

  const handleMouseDown = (e, node) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const rect = containerRef.current.getBoundingClientRect();
    setDragging(node.id);
    setOffset({
      x: (e.clientX - rect.left - pan.x) / zoom - node.x,
      y: (e.clientY - rect.top - pan.y) / zoom - node.y,
    });
  };

  const handleMouseMove = (e) => {
    if (dragging) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom - offset.x;
      const y = (e.clientY - rect.top - pan.y) / zoom - offset.y;
      
      setNodes(prev => prev.map(n => 
        n.id === dragging ? { ...n, x, y } : n
      ));
    } else if (isPanning) {
      setPan(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY,
      }));
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    setIsPanning(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.min(2, Math.max(0.5, prev * delta)));
  };

  const handleContainerMouseDown = (e) => {
    if (e.button === 0 && e.target === containerRef.current) {
      setIsPanning(true);
    }
  };

  const getNodeById = (id) => nodes.find(n => n.id === id);

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(prev => Math.min(2, prev * 1.2))}
            className="p-1.5 rounded-lg bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <span className="text-xs text-gray-500">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(prev => Math.max(0.5, prev / 1.2))}
            className="p-1.5 rounded-lg bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="px-2 py-1 text-xs rounded-lg bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
          >
            리셋
          </button>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: accentColor }} />
            <span className="text-gray-500">진행중</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-gray-500">작업</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-500" />
            <span className="text-gray-500">대기</span>
          </div>
        </div>
      </div>
      
      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 bg-gray-900/50 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing relative"
        onMouseDown={handleContainerMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Background Grid */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#374151" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        
        {/* Edges & Nodes Container */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {/* Edges */}
          {edges.map((edge, i) => {
            const from = getNodeById(edge.from);
            const to = getNodeById(edge.to);
            if (!from || !to) return null;
            
            const isHighlighted = hoveredNode === edge.from || hoveredNode === edge.to;
            
            // Curved path
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const cx = from.x + dx / 2;
            const cy = from.y + dy / 2 - Math.abs(dx) * 0.1;
            
            return (
              <g key={i}>
                <path
                  d={`M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`}
                  fill="none"
                  stroke={isHighlighted ? accentColor : 
                         edge.type === 'dependency' ? '#EF4444' :
                         edge.type === 'assigned' ? '#22C55E' :
                         edge.type === 'sequence' ? '#6366F1' : '#4B5563'}
                  strokeWidth={isHighlighted ? 2 : 1}
                  strokeDasharray={edge.type === 'dependency' ? '5,5' : 'none'}
                  opacity={isHighlighted ? 1 : 0.5}
                  className="transition-all duration-200"
                />
                {/* Arrow */}
                <circle
                  cx={to.x}
                  cy={to.y}
                  r={3}
                  fill={isHighlighted ? accentColor : '#4B5563'}
                  className="transition-all duration-200"
                />
              </g>
            );
          })}
        </svg>
        
        {/* Nodes */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {nodes.map((node) => {
            const style = nodeTypeStyles[node.type];
            const isHovered = hoveredNode === node.id;
            
            return (
              <div
                key={node.id}
                className={`absolute cursor-pointer transition-all duration-200
                          ${dragging === node.id ? 'z-20' : 'z-10'}
                          ${isHovered ? 'scale-110' : ''}`}
                style={{
                  left: node.x - style.size / 2,
                  top: node.y - style.size / 2,
                  width: style.size,
                  height: style.size,
                }}
                onMouseDown={(e) => handleMouseDown(e, node)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <div
                  className={`w-full h-full rounded-full flex items-center justify-center
                            border-2 transition-all duration-200
                            ${isHovered ? 'shadow-lg' : ''}`}
                  style={{
                    backgroundColor: `${statusColors[node.status]}20`,
                    borderColor: statusColors[node.status],
                    borderWidth: style.borderWidth,
                    boxShadow: isHovered ? `0 0 20px ${statusColors[node.status]}40` : 'none',
                  }}
                >
                  {node.avatar ? (
                    <span className="text-xl">{node.avatar}</span>
                  ) : (
                    <span 
                      className="text-xs font-bold"
                      style={{ color: statusColors[node.status] }}
                    >
                      {node.label}
                    </span>
                  )}
                </div>
                
                {/* Label */}
                <div
                  className={`absolute left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 rounded
                            bg-gray-800/90 text-xs whitespace-nowrap transition-opacity duration-200
                            ${isHovered ? 'opacity-100' : 'opacity-70'}`}
                  style={{ top: style.size }}
                >
                  <span className="text-gray-300">{node.label}</span>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Instructions */}
        <div className="absolute bottom-3 left-3 text-xs text-gray-600">
          드래그: 노드 이동 | 스크롤: 줌 | 배경 드래그: 팬
        </div>
      </div>
    </div>
  );
};

// ============================================
// Other Components
// ============================================

const TeamCard = ({ member, compact = false }) => {
  const statusColors = {
    working: '#22C55E',
    review: '#F59E0B',
    done: '#6366F1',
    waiting: '#6B7280',
  };
  
  const statusLabels = {
    working: '작업중',
    review: '리뷰',
    done: '완료',
    waiting: '대기',
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700/30 transition-colors cursor-pointer">
        <div className="relative">
          <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-sm">
            {member.avatar}
          </div>
          <div
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-gray-800"
            style={{ backgroundColor: statusColors[member.status] }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm text-gray-200 truncate block">{member.name}</span>
          <span className="text-xs text-gray-500 truncate block">{member.task}</span>
        </div>
      </div>
    );
  }

  return (
    <TiltCard intensity={10}>
      <div className="bg-gray-800/60 rounded-lg p-3 border border-gray-700/30 cursor-pointer
                     hover:bg-gray-800/80 transition-all duration-300 group">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-xl
                          group-hover:scale-110 transition-transform duration-300">
              {member.avatar}
            </div>
            <div
              className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800"
              style={{ backgroundColor: statusColors[member.status] }}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-200">{member.name}</span>
              <span className="text-xs px-1.5 py-0.5 rounded text-gray-400 bg-gray-700/50">
                {member.role}
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate mt-0.5">{member.task}</p>
          </div>
          
          <span
            className="text-xs px-2 py-1 rounded-full font-medium"
            style={{
              backgroundColor: `${statusColors[member.status]}20`,
              color: statusColors[member.status],
            }}
          >
            {statusLabels[member.status]}
          </span>
        </div>
      </div>
    </TiltCard>
  );
};

const TasksWidget = ({ tasks, compact = false }) => {
  const typeIcons = { deadline: '⏰', meeting: '👥', task: '📋' };
  const priorityColors = { high: '#EF4444', medium: '#F59E0B', low: '#6B7280' };

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/30 
                     transition-colors cursor-pointer group ${compact ? 'py-1.5' : ''}`}
        >
          <div
            className={`${compact ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'} rounded-lg flex items-center justify-center`}
            style={{ backgroundColor: `${priorityColors[task.priority]}20` }}
          >
            {typeIcons[task.type]}
          </div>
          <div className="flex-1 min-w-0">
            <span className={`text-gray-300 group-hover:text-gray-100 transition-colors truncate block
                            ${compact ? 'text-xs' : 'text-sm'}`}>
              {task.title}
            </span>
            {!compact && task.time && <span className="text-xs text-gray-500">{task.time}</span>}
          </div>
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: priorityColors[task.priority] }}
          />
        </div>
      ))}
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
               ${active ? 'bg-gray-700/80 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'}`}
  >
    <span className="w-5 h-5">{icon}</span>
    <span className="flex-1 text-left text-sm font-medium">{label}</span>
    {badge && <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400">{badge}</span>}
  </button>
);

// ============================================
// Main App
// ============================================

export default function BflowApp() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [showConfetti, setShowConfetti] = useState(false);
  const [accentColor, setAccentColor] = useState(BRAND.primary);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [calendarView, setCalendarView] = useState('weekly');
  
  const [widgetSizes, setWidgetSizes] = useState({
    gantt: { w: 3, h: 2 },
    calendar: { w: 2, h: 2 },
    tasks: { w: 1, h: 2 },
    team: { w: 2, h: 2 },
    stats: { w: 2, h: 1 },
  });

  const updateWidgetSize = (widgetId, newSize) => {
    setWidgetSizes(prev => ({ ...prev, [widgetId]: newSize }));
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 100);
  };

  const navItems = [
    {
      id: 'dashboard',
      label: '대시보드',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>,
    },
    {
      id: 'timeline',
      label: '타임라인',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>,
    },
    {
      id: 'calendar',
      label: '캘린더',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
      badge: '3',
    },
    {
      id: 'team',
      label: '팀',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    },
    {
      id: 'nodemap',
      label: '노드맵',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
    },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} transition-colors duration-500`}>
      <Confetti active={showConfetti} />
      
      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes confetti { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }
        @keyframes fade-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px ${accentColor}40; } 50% { box-shadow: 0 0 40px ${accentColor}60; } }
        .animate-shimmer { animation: shimmer 2s infinite; }
        .animate-confetti { animation: confetti 2s forwards; }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4B5563; }
      `}</style>

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-56' : 'w-16'} flex-shrink-0 transition-all duration-300
                         ${darkMode ? 'bg-gray-800/50' : 'bg-white'} backdrop-blur-xl
                         border-r ${darkMode ? 'border-gray-700/50' : 'border-gray-200'}`}>
          <div className="flex flex-col h-full p-3">
            <div className="flex items-center gap-3 px-2 py-4 mb-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-gray-900
                          animate-pulse-glow transition-all duration-300 hover:scale-110 cursor-pointer"
                style={{ backgroundColor: accentColor }}
                onClick={triggerConfetti}
              >
                B
              </div>
              {sidebarOpen && (
                <div>
                  <h1 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Bflow</h1>
                  <p className="text-xs text-gray-500">JBBJ Studio</p>
                </div>
              )}
            </div>

            <nav className="flex-1 space-y-1">
              {navItems.map((item) => (
                <NavItem
                  key={item.id}
                  icon={item.icon}
                  label={sidebarOpen ? item.label : ''}
                  active={activeView === item.id}
                  onClick={() => setActiveView(item.id)}
                  badge={sidebarOpen ? item.badge : null}
                />
              ))}
            </nav>

            {sidebarOpen && (
              <div className="mt-4 pt-4 border-t border-gray-700/50">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">프로젝트</h3>
                <div className="space-y-1">
                  {['사코팍 시즌1', '장삐쭈 단편'].map((project, i) => (
                    <button
                      key={project}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                                 ${i === 0 ? 'bg-gray-700/50 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'}
                                 transition-all duration-200`}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: i === 0 ? accentColor : '#6B7280' }} />
                      {project}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <div className="flex items-center justify-between px-2">
                {sidebarOpen && <span className="text-xs text-gray-500">테마</span>}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-2 rounded-lg transition-all duration-300
                             ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-200 text-gray-600'}
                             hover:scale-110`}
                >
                  {darkMode ? '☀️' : '🌙'}
                </button>
              </div>
              
              {sidebarOpen && (
                <div className="mt-3 px-2">
                  <span className="text-xs text-gray-500 block mb-2">액센트 컬러</span>
                  <div className="flex gap-2">
                    {[BRAND.primary, '#22C55E', '#3B82F6', '#A855F7', '#EF4444'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setAccentColor(color)}
                        className={`w-6 h-6 rounded-full transition-all duration-200 hover:scale-125
                                  ${accentColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800' : ''}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto custom-scrollbar">
          {/* Header */}
          <header className={`sticky top-0 z-40 px-6 py-4 backdrop-blur-xl
                             ${darkMode ? 'bg-gray-900/80' : 'bg-gray-100/80'}
                             border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div>
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {navItems.find(n => n.id === activeView)?.label || '대시보드'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {new Date().toLocaleDateString('ko-KR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg
                               ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="검색..."
                    className={`bg-transparent text-sm outline-none w-40
                               ${darkMode ? 'text-gray-200 placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'}`}
                  />
                  <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs rounded bg-gray-700 text-gray-400">⌘K</kbd>
                </div>

                <button className={`relative p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
                </button>

                <button className={`flex items-center gap-2 p-1.5 pr-3 rounded-lg transition-colors
                                  ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-900 font-bold"
                    style={{ backgroundColor: accentColor }}
                  >
                    한
                  </div>
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>한솔</span>
                </button>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="p-6">
            {activeView === 'dashboard' && (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs text-gray-500">위젯을 커스터마이즈하려면 각 위젯 우측 상단의 리사이즈 버튼을 클릭하세요</p>
                  <button
                    onClick={() => setWidgetSizes({
                      gantt: { w: 3, h: 2 },
                      calendar: { w: 2, h: 2 },
                      tasks: { w: 1, h: 2 },
                      team: { w: 2, h: 2 },
                      stats: { w: 2, h: 1 },
                    })}
                    className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
                  >
                    레이아웃 초기화
                  </button>
                </div>

                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: '180px' }}>
                  <Widget
                    title="요약"
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                    size={widgetSizes.stats}
                    onResize={(size) => updateWidgetSize('stats', size)}
                    minSize={{ w: 1, h: 1 }}
                    maxSize={{ w: 4, h: 2 }}
                    accentColor={accentColor}
                  >
                    <div className={`grid gap-3 h-full ${widgetSizes.stats.w >= 2 ? 'grid-cols-4' : 'grid-cols-2'}`}>
                      <SummaryCard icon="⏰" label="마감 임박" value="3" color="#EF4444" compact />
                      <SummaryCard icon="⚡" label="진행중" value="12" color={accentColor} compact />
                      <SummaryCard icon="✅" label="완료" value="8" color="#22C55E" compact />
                      <SummaryCard icon="👥" label="팀원" value="20" color="#6366F1" compact />
                    </div>
                  </Widget>

                  <Widget
                    title="에피소드 진행률"
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" /></svg>}
                    size={widgetSizes.gantt}
                    onResize={(size) => updateWidgetSize('gantt', size)}
                    minSize={{ w: 2, h: 1 }}
                    maxSize={{ w: 4, h: 3 }}
                    accentColor={accentColor}
                  >
                    <GanttChart episodes={EPISODES} accentColor={accentColor} compact={widgetSizes.gantt.h === 1} />
                  </Widget>

                  <Widget
                    title="오늘의 할 일"
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
                    size={widgetSizes.tasks}
                    onResize={(size) => updateWidgetSize('tasks', size)}
                    minSize={{ w: 1, h: 1 }}
                    maxSize={{ w: 2, h: 3 }}
                    accentColor={accentColor}
                  >
                    <TasksWidget tasks={TODAY_TASKS} compact={widgetSizes.tasks.w === 1} />
                  </Widget>

                  <Widget
                    title="캘린더"
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                    size={widgetSizes.calendar}
                    onResize={(size) => updateWidgetSize('calendar', size)}
                    minSize={{ w: 2, h: 2 }}
                    maxSize={{ w: 4, h: 3 }}
                    accentColor={accentColor}
                  >
                    <Calendar view={calendarView} onViewChange={setCalendarView} accentColor={accentColor} />
                  </Widget>

                  <Widget
                    title="팀 현황"
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                    size={widgetSizes.team}
                    onResize={(size) => updateWidgetSize('team', size)}
                    minSize={{ w: 1, h: 1 }}
                    maxSize={{ w: 4, h: 3 }}
                    accentColor={accentColor}
                  >
                    <div className="space-y-2">
                      {TEAM_MEMBERS.slice(0, widgetSizes.team.h >= 2 ? 6 : 3).map((member) => (
                        <TeamCard key={member.id} member={member} compact={widgetSizes.team.w < 2} />
                      ))}
                    </div>
                  </Widget>
                </div>
              </>
            )}

            {activeView === 'nodemap' && (
              <div className="h-[calc(100vh-140px)]">
                <NodeMap accentColor={accentColor} />
              </div>
            )}

            {activeView === 'calendar' && (
              <div className="h-[calc(100vh-140px)] bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/30 p-6">
                <Calendar view={calendarView} onViewChange={setCalendarView} accentColor={accentColor} />
              </div>
            )}

            {activeView === 'timeline' && (
              <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/30 p-6">
                <GanttChart episodes={EPISODES} accentColor={accentColor} />
              </div>
            )}

            {activeView === 'team' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {TEAM_MEMBERS.map((member) => (
                  <TeamCard key={member.id} member={member} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
