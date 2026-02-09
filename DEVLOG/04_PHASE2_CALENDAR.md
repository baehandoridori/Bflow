# Phase 2: 캘린더

> 팀 캘린더, 개인 캘린더, 캘린더 그룹, 이벤트 CRUD

---

## 목표

Phase 2가 완료되면:
- 팀 캘린더와 개인 캘린더가 분리되어 표시
- 캘린더 그룹(레이어)을 생성/관리 가능
- 멀티데이 이벤트가 연속 바로 표시
- 주간/월간 뷰 전환 가능
- 이벤트 생성/수정/삭제 가능
- 개인 이벤트를 선택한 팀원과 공유 가능

---

## Step 2.1: Calendar Store

### src/stores/useCalendarStore.ts

```typescript
import { create } from 'zustand';
import { CalendarEvent, CalendarGroup } from '../types';

interface CalendarState {
  events: CalendarEvent[];
  groups: CalendarGroup[];
  selectedDate: Date;
  viewMode: 'weekly' | 'monthly';
  isLoading: boolean;

  setEvents: (events: CalendarEvent[]) => void;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  removeEvent: (id: string) => void;

  setGroups: (groups: CalendarGroup[]) => void;
  addGroup: (group: CalendarGroup) => void;
  updateGroup: (id: string, updates: Partial<CalendarGroup>) => void;
  removeGroup: (id: string) => void;
  toggleGroupVisibility: (id: string) => void;

  setSelectedDate: (date: Date) => void;
  setViewMode: (mode: 'weekly' | 'monthly') => void;
  setLoading: (loading: boolean) => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  events: [],
  groups: [],
  selectedDate: new Date(),
  viewMode: 'weekly',
  isLoading: true,

  setEvents: (events) => set({ events }),
  addEvent: (event) => set((s) => ({ events: [...s.events, event] })),
  updateEvent: (id, updates) =>
    set((s) => ({
      events: s.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),
  removeEvent: (id) =>
    set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

  setGroups: (groups) => set({ groups }),
  addGroup: (group) => set((s) => ({ groups: [...s.groups, group] })),
  updateGroup: (id, updates) =>
    set((s) => ({
      groups: s.groups.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    })),
  removeGroup: (id) =>
    set((s) => ({ groups: s.groups.filter((g) => g.id !== id) })),
  toggleGroupVisibility: (id) =>
    set((s) => ({
      groups: s.groups.map((g) =>
        g.id === id ? { ...g, visible: !g.visible } : g
      ),
    })),

  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setViewMode: (viewMode) => set({ viewMode }),
  setLoading: (isLoading) => set({ isLoading }),
}));
```

---

## Step 2.2: Calendar 서비스

### src/services/calendar.ts

```typescript
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { CalendarEvent, CalendarGroup } from '../types';

const EVENTS_COLLECTION = 'calendarEvents';
const GROUPS_COLLECTION = 'calendarGroups';

// ============ 이벤트 ============

// 내가 볼 수 있는 이벤트 조회 (실시간)
export function subscribeToEvents(
  userId: string,
  callback: (events: CalendarEvent[]) => void
) {
  const eventsRef = collection(db, EVENTS_COLLECTION);

  // 팀 이벤트 + 내 이벤트 + 나에게 공유된 이벤트
  // Firestore는 복잡한 OR 쿼리 제한이 있어서 클라이언트에서 필터링
  const q = query(eventsRef, orderBy('startDate', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CalendarEvent[];

    // 필터: 팀 공개 OR 내가 생성 OR 나에게 공유
    const filtered = events.filter(
      (e) =>
        e.visibility === 'team' ||
        e.ownerId === userId ||
        e.sharedWith?.includes(userId)
    );

    callback(filtered);
  });
}

// 이벤트 생성
export async function createEvent(
  event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, EVENTS_COLLECTION), {
    ...event,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

// 이벤트 수정
export async function updateEvent(
  id: string,
  updates: Partial<CalendarEvent>
): Promise<void> {
  const docRef = doc(db, EVENTS_COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// 이벤트 삭제
export async function deleteEvent(id: string): Promise<void> {
  await deleteDoc(doc(db, EVENTS_COLLECTION, id));
}

// ============ 캘린더 그룹 ============

// 내 캘린더 그룹 조회 (실시간)
export function subscribeToGroups(
  userId: string,
  callback: (groups: CalendarGroup[]) => void
) {
  const groupsRef = collection(db, GROUPS_COLLECTION);

  return onSnapshot(groupsRef, (snapshot) => {
    const groups = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CalendarGroup[];

    // 팀 그룹 OR 내 그룹
    const filtered = groups.filter(
      (g) => g.isTeam || g.ownerId === userId
    );

    // 정렬: 팀 먼저, 그 다음 order 순
    filtered.sort((a, b) => {
      if (a.isTeam !== b.isTeam) return a.isTeam ? -1 : 1;
      return a.order - b.order;
    });

    callback(filtered);
  });
}

// 캘린더 그룹 생성
export async function createGroup(
  group: Omit<CalendarGroup, 'id' | 'createdAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, GROUPS_COLLECTION), {
    ...group,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// 캘린더 그룹 수정
export async function updateGroup(
  id: string,
  updates: Partial<CalendarGroup>
): Promise<void> {
  await updateDoc(doc(db, GROUPS_COLLECTION, id), updates);
}

// 캘린더 그룹 삭제
export async function deleteGroup(id: string): Promise<void> {
  await deleteDoc(doc(db, GROUPS_COLLECTION, id));
}

// 기본 그룹 초기화 (신규 사용자)
export async function initializeDefaultGroups(userId: string): Promise<void> {
  const groupsRef = collection(db, GROUPS_COLLECTION);
  const q = query(groupsRef, where('ownerId', '==', userId));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    // 개인 기본 캘린더 생성
    await createGroup({
      name: '내 일정',
      color: '#F0E68C',
      ownerId: userId,
      isTeam: false,
      isDefault: true,
      visible: true,
      order: 0,
    });
  }
}
```

---

## Step 2.3: 날짜 유틸리티

### src/utils/date.ts

```typescript
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  addDays,
  addWeeks,
  addMonths,
  subWeeks,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
  differenceInDays,
  parseISO,
} from 'date-fns';
import { ko } from 'date-fns/locale';

// 주간 날짜 배열 (일~토)
export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 0 }); // 일요일 시작
  return eachDayOfInterval({
    start,
    end: endOfWeek(date, { weekStartsOn: 0 }),
  });
}

// 월간 날짜 배열 (6주 고정)
export function getMonthDays(date: Date): Date[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(addDays(monthEnd, 7), { weekStartsOn: 0 });

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd }).slice(
    0,
    42
  ); // 6주 = 42일
}

// 포맷팅
export function formatDate(date: Date, formatStr: string): string {
  return format(date, formatStr, { locale: ko });
}

// D-day 계산
export function getDDay(targetDate: Date): number {
  return differenceInDays(targetDate, new Date());
}

// D-day 문자열
export function getDDayString(targetDate: Date): string {
  const diff = getDDay(targetDate);
  if (diff === 0) return 'D-Day';
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

// 이벤트가 해당 날짜 범위에 포함되는지
export function isEventInRange(
  eventStart: Date,
  eventEnd: Date,
  rangeStart: Date,
  rangeEnd: Date
): boolean {
  return eventStart <= rangeEnd && eventEnd >= rangeStart;
}

// 이벤트가 해당 날짜에 포함되는지
export function isEventOnDay(
  eventStart: Date,
  eventEnd: Date,
  day: Date
): boolean {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);

  return eventStart <= dayEnd && eventEnd >= dayStart;
}

export {
  addDays,
  addWeeks,
  addMonths,
  subWeeks,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
};
```

---

## Step 2.4: 캘린더 뷰

### src/views/CalendarView.tsx

```typescript
import { useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useCalendarStore } from '../stores/useCalendarStore';
import { subscribeToEvents, subscribeToGroups, initializeDefaultGroups } from '../services/calendar';
import { Calendar } from '../components/calendar/Calendar';
import { CalendarSidebar } from '../components/calendar/CalendarSidebar';

export function CalendarView() {
  const { user } = useAuthStore();
  const { setEvents, setGroups, setLoading } = useCalendarStore();

  useEffect(() => {
    if (!user) return;

    // 기본 그룹 초기화
    initializeDefaultGroups(user.uid);

    // 이벤트 구독
    const unsubEvents = subscribeToEvents(user.uid, (events) => {
      setEvents(events);
      setLoading(false);
    });

    // 그룹 구독
    const unsubGroups = subscribeToGroups(user.uid, setGroups);

    return () => {
      unsubEvents();
      unsubGroups();
    };
  }, [user, setEvents, setGroups, setLoading]);

  return (
    <div className="h-full flex gap-6">
      {/* 좌측: 캘린더 그룹 사이드바 */}
      <CalendarSidebar />

      {/* 우측: 캘린더 본체 */}
      <div className="flex-1">
        <Calendar />
      </div>
    </div>
  );
}
```

---

## Step 2.5: 캘린더 사이드바 (그룹 관리)

### src/components/calendar/CalendarSidebar.tsx

```typescript
import { useState } from 'react';
import { Plus, Eye, EyeOff, Trash2, Edit2 } from 'lucide-react';
import { useCalendarStore } from '../../stores/useCalendarStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { createGroup, deleteGroup, updateGroup } from '../../services/calendar';
import { cn } from '../../utils/cn';

export function CalendarSidebar() {
  const { user } = useAuthStore();
  const { groups, toggleGroupVisibility } = useCalendarStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const handleCreateGroup = async () => {
    if (!user || !newGroupName.trim()) return;

    await createGroup({
      name: newGroupName.trim(),
      color: '#' + Math.floor(Math.random() * 16777215).toString(16),
      ownerId: user.uid,
      isTeam: false,
      isDefault: false,
      visible: true,
      order: groups.length,
    });

    setNewGroupName('');
    setIsCreating(false);
  };

  const handleDeleteGroup = async (id: string) => {
    if (confirm('이 캘린더를 삭제하시겠습니까?')) {
      await deleteGroup(id);
    }
  };

  const teamGroups = groups.filter((g) => g.isTeam);
  const personalGroups = groups.filter((g) => !g.isTeam);

  return (
    <div className="w-64 bg-gray-800 rounded-xl p-4 flex flex-col">
      <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">
        캘린더
      </h3>

      {/* 팀 캘린더 */}
      {teamGroups.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">팀</p>
          {teamGroups.map((group) => (
            <GroupItem
              key={group.id}
              group={group}
              onToggle={() => toggleGroupVisibility(group.id)}
              canDelete={false}
            />
          ))}
        </div>
      )}

      {/* 개인 캘린더 */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-500">개인</p>
          <button
            onClick={() => setIsCreating(true)}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <Plus className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {personalGroups.map((group) => (
          <GroupItem
            key={group.id}
            group={group}
            onToggle={() => toggleGroupVisibility(group.id)}
            onDelete={() => handleDeleteGroup(group.id)}
            canDelete={!group.isDefault}
          />
        ))}

        {/* 새 그룹 입력 */}
        {isCreating && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
              placeholder="캘린더 이름"
              className="flex-1 bg-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
              autoFocus
            />
            <button
              onClick={handleCreateGroup}
              className="text-brand text-sm hover:underline"
            >
              추가
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface GroupItemProps {
  group: CalendarGroup;
  onToggle: () => void;
  onDelete?: () => void;
  canDelete: boolean;
}

function GroupItem({ group, onToggle, onDelete, canDelete }: GroupItemProps) {
  return (
    <div className="flex items-center gap-2 py-2 px-2 rounded hover:bg-gray-700 group">
      <button onClick={onToggle} className="flex-shrink-0">
        {group.visible ? (
          <Eye className="w-4 h-4 text-gray-400" />
        ) : (
          <EyeOff className="w-4 h-4 text-gray-600" />
        )}
      </button>

      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: group.color }}
      />

      <span
        className={cn(
          'flex-1 text-sm truncate',
          group.visible ? 'text-gray-200' : 'text-gray-500'
        )}
      >
        {group.name}
      </span>

      {canDelete && (
        <button
          onClick={onDelete}
          className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
```

---

## Step 2.6: 메인 캘린더 컴포넌트

### src/components/calendar/Calendar.tsx

```typescript
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useCalendarStore } from '../../stores/useCalendarStore';
import { WeeklyView } from './WeeklyView';
import { MonthlyView } from './MonthlyView';
import { EventModal } from './EventModal';
import { formatDate, addWeeks, subWeeks, addMonths, subMonths } from '../../utils/date';
import { cn } from '../../utils/cn';

export function Calendar() {
  const { selectedDate, setSelectedDate, viewMode, setViewMode, isLoading } =
    useCalendarStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEventDate, setSelectedEventDate] = useState<Date | null>(null);

  const handlePrev = () => {
    if (viewMode === 'weekly') {
      setSelectedDate(subWeeks(selectedDate, 1));
    } else {
      setSelectedDate(subMonths(selectedDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'weekly') {
      setSelectedDate(addWeeks(selectedDate, 1));
    } else {
      setSelectedDate(addMonths(selectedDate, 1));
    }
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleCreateEvent = (date?: Date) => {
    setSelectedEventDate(date || new Date());
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-800 rounded-xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-4">
          {/* 네비게이션 */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* 현재 날짜 */}
          <h2 className="text-xl font-semibold">
            {formatDate(selectedDate, viewMode === 'weekly' ? 'yyyy년 M월' : 'yyyy년 M월')}
          </h2>

          {/* 오늘 버튼 */}
          <button
            onClick={handleToday}
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            오늘
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* 뷰 모드 전환 */}
          <div className="flex bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('weekly')}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors',
                viewMode === 'weekly'
                  ? 'bg-brand text-gray-900'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              주간
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors',
                viewMode === 'monthly'
                  ? 'bg-brand text-gray-900'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              월간
            </button>
          </div>

          {/* 이벤트 추가 */}
          <button
            onClick={() => handleCreateEvent()}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-gray-900 rounded-lg hover:bg-brand-dark transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            일정 추가
          </button>
        </div>
      </div>

      {/* 캘린더 본체 */}
      <div className="flex-1 overflow-auto p-4">
        {viewMode === 'weekly' ? (
          <WeeklyView onCreateEvent={handleCreateEvent} />
        ) : (
          <MonthlyView onCreateEvent={handleCreateEvent} />
        )}
      </div>

      {/* 이벤트 모달 */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialDate={selectedEventDate}
      />
    </div>
  );
}
```

---

## Step 2.7: 주간 뷰

### src/components/calendar/WeeklyView.tsx

```typescript
import { useMemo } from 'react';
import { useCalendarStore } from '../../stores/useCalendarStore';
import { EventBar } from './EventBar';
import { getWeekDays, formatDate, isToday, isEventOnDay } from '../../utils/date';
import { cn } from '../../utils/cn';
import { Timestamp } from 'firebase/firestore';

interface WeeklyViewProps {
  onCreateEvent: (date: Date) => void;
}

export function WeeklyView({ onCreateEvent }: WeeklyViewProps) {
  const { selectedDate, events, groups } = useCalendarStore();

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  // 보이는 그룹의 ID 목록
  const visibleGroupIds = groups.filter((g) => g.visible).map((g) => g.id);

  // 필터된 이벤트
  const visibleEvents = events.filter((e) =>
    visibleGroupIds.includes(e.calendarGroupId)
  );

  // 날짜별 이벤트 그룹핑
  const eventsByDay = useMemo(() => {
    const map = new Map<string, typeof visibleEvents>();

    weekDays.forEach((day) => {
      const dayKey = formatDate(day, 'yyyy-MM-dd');
      const dayEvents = visibleEvents.filter((e) => {
        const start = (e.startDate as Timestamp).toDate();
        const end = (e.endDate as Timestamp).toDate();
        return isEventOnDay(start, end, day);
      });
      map.set(dayKey, dayEvents);
    });

    return map;
  }, [weekDays, visibleEvents]);

  return (
    <div className="grid grid-cols-7 gap-1 h-full">
      {weekDays.map((day) => {
        const dayKey = formatDate(day, 'yyyy-MM-dd');
        const dayEvents = eventsByDay.get(dayKey) || [];

        return (
          <div
            key={dayKey}
            className={cn(
              'flex flex-col border border-gray-700 rounded-lg overflow-hidden',
              isToday(day) && 'ring-2 ring-brand'
            )}
          >
            {/* 날짜 헤더 */}
            <div
              className={cn(
                'p-2 text-center border-b border-gray-700',
                isToday(day) ? 'bg-brand/20' : 'bg-gray-700/50'
              )}
            >
              <p className="text-xs text-gray-400">
                {formatDate(day, 'EEE')}
              </p>
              <p
                className={cn(
                  'text-lg font-semibold',
                  isToday(day) ? 'text-brand' : 'text-white'
                )}
              >
                {formatDate(day, 'd')}
              </p>
            </div>

            {/* 이벤트 목록 */}
            <div
              className="flex-1 p-1 space-y-1 overflow-y-auto min-h-[200px] cursor-pointer hover:bg-gray-700/30 transition-colors"
              onClick={() => onCreateEvent(day)}
            >
              {dayEvents.map((event) => (
                <EventBar
                  key={event.id}
                  event={event}
                  group={groups.find((g) => g.id === event.calendarGroupId)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

---

## Step 2.8: 월간 뷰

### src/components/calendar/MonthlyView.tsx

```typescript
import { useMemo } from 'react';
import { useCalendarStore } from '../../stores/useCalendarStore';
import { EventBar } from './EventBar';
import { getMonthDays, formatDate, isToday, isSameMonth, isEventOnDay } from '../../utils/date';
import { cn } from '../../utils/cn';
import { Timestamp } from 'firebase/firestore';

interface MonthlyViewProps {
  onCreateEvent: (date: Date) => void;
}

export function MonthlyView({ onCreateEvent }: MonthlyViewProps) {
  const { selectedDate, events, groups } = useCalendarStore();

  const monthDays = useMemo(() => getMonthDays(selectedDate), [selectedDate]);
  const weeks = useMemo(() => {
    const result = [];
    for (let i = 0; i < monthDays.length; i += 7) {
      result.push(monthDays.slice(i, i + 7));
    }
    return result;
  }, [monthDays]);

  const visibleGroupIds = groups.filter((g) => g.visible).map((g) => g.id);
  const visibleEvents = events.filter((e) =>
    visibleGroupIds.includes(e.calendarGroupId)
  );

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="h-full flex flex-col">
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayNames.map((name, i) => (
          <div
            key={name}
            className={cn(
              'text-center text-sm font-medium py-2',
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
            )}
          >
            {name}
          </div>
        ))}
      </div>

      {/* 달력 그리드 */}
      <div className="flex-1 grid grid-rows-6 gap-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((day) => {
              const dayKey = formatDate(day, 'yyyy-MM-dd');
              const dayEvents = visibleEvents.filter((e) => {
                const start = (e.startDate as Timestamp).toDate();
                const end = (e.endDate as Timestamp).toDate();
                return isEventOnDay(start, end, day);
              });
              const isCurrentMonth = isSameMonth(day, selectedDate);

              return (
                <div
                  key={dayKey}
                  className={cn(
                    'flex flex-col border border-gray-700 rounded overflow-hidden min-h-[80px]',
                    !isCurrentMonth && 'opacity-40',
                    isToday(day) && 'ring-2 ring-brand'
                  )}
                >
                  {/* 날짜 */}
                  <div
                    className={cn(
                      'text-right px-2 py-1 text-sm',
                      isToday(day) ? 'text-brand font-bold' : 'text-gray-400'
                    )}
                    onClick={() => onCreateEvent(day)}
                  >
                    {formatDate(day, 'd')}
                  </div>

                  {/* 이벤트 (최대 3개) */}
                  <div
                    className="flex-1 px-1 pb-1 space-y-0.5 overflow-hidden cursor-pointer hover:bg-gray-700/30"
                    onClick={() => onCreateEvent(day)}
                  >
                    {dayEvents.slice(0, 3).map((event) => (
                      <EventBar
                        key={event.id}
                        event={event}
                        group={groups.find((g) => g.id === event.calendarGroupId)}
                        compact
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-xs text-gray-500 px-1">
                        +{dayEvents.length - 3}개 더
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Step 2.9: 이벤트 바

### src/components/calendar/EventBar.tsx

```typescript
import { CalendarEvent, CalendarGroup } from '../../types';
import { cn } from '../../utils/cn';

interface EventBarProps {
  event: CalendarEvent;
  group?: CalendarGroup;
  compact?: boolean;
}

export function EventBar({ event, group, compact = false }: EventBarProps) {
  const bgColor = group?.color || '#F0E68C';

  return (
    <div
      className={cn(
        'rounded px-2 py-0.5 truncate cursor-pointer hover:opacity-80 transition-opacity',
        compact ? 'text-xs' : 'text-sm'
      )}
      style={{
        backgroundColor: `${bgColor}20`,
        borderLeft: `3px solid ${bgColor}`,
        color: bgColor,
      }}
      title={event.title}
    >
      {event.title}
    </div>
  );
}
```

---

## Step 2.10: 이벤트 생성/수정 모달

### src/components/calendar/EventModal.tsx

```typescript
import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCalendarStore } from '../../stores/useCalendarStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { createEvent } from '../../services/calendar';
import { formatDate } from '../../utils/date';
import { cn } from '../../utils/cn';
import { Timestamp } from 'firebase/firestore';
import { CalendarEventType, EventVisibility } from '../../types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date | null;
  eventToEdit?: CalendarEvent | null;
}

export function EventModal({
  isOpen,
  onClose,
  initialDate,
  eventToEdit,
}: EventModalProps) {
  const { user } = useAuthStore();
  const { groups } = useCalendarStore();

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [eventType, setEventType] = useState<CalendarEventType>('event');
  const [visibility, setVisibility] = useState<EventVisibility>('private');
  const [groupId, setGroupId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 초기값 설정
  useEffect(() => {
    if (isOpen) {
      if (eventToEdit) {
        // 수정 모드
        setTitle(eventToEdit.title);
        setStartDate(formatDate((eventToEdit.startDate as Timestamp).toDate(), 'yyyy-MM-dd'));
        setEndDate(formatDate((eventToEdit.endDate as Timestamp).toDate(), 'yyyy-MM-dd'));
        setEventType(eventToEdit.type);
        setVisibility(eventToEdit.visibility);
        setGroupId(eventToEdit.calendarGroupId);
      } else if (initialDate) {
        // 생성 모드
        const dateStr = formatDate(initialDate, 'yyyy-MM-dd');
        setStartDate(dateStr);
        setEndDate(dateStr);
        // 기본 개인 캘린더 선택
        const defaultGroup = groups.find((g) => g.isDefault && !g.isTeam);
        if (defaultGroup) setGroupId(defaultGroup.id);
      }
    }
  }, [isOpen, initialDate, eventToEdit, groups]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !startDate || !groupId) return;

    setIsLoading(true);
    try {
      await createEvent({
        title: title.trim(),
        type: eventType,
        startDate: Timestamp.fromDate(new Date(startDate)),
        endDate: Timestamp.fromDate(new Date(endDate || startDate)),
        isAllDay: true,
        ownerId: user.uid,
        visibility,
        sharedWith: [],
        calendarGroupId: groupId,
      });
      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setStartDate('');
    setEndDate('');
    setEventType('event');
    setVisibility('private');
    setGroupId('');
  };

  const personalGroups = groups.filter((g) => !g.isTeam);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 배경 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* 모달 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {eventToEdit ? '일정 수정' : '새 일정'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 제목 */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="일정 제목"
                className="w-full bg-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand"
                autoFocus
              />

              {/* 날짜 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">시작일</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">종료일</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>

              {/* 캘린더 선택 */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">캘린더</label>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value="">선택하세요</option>
                  {personalGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 공개 범위 */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">공개 범위</label>
                <div className="flex gap-2">
                  {(['private', 'team', 'shared'] as EventVisibility[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVisibility(v)}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-sm transition-colors',
                        visibility === v
                          ? 'bg-brand text-gray-900'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      )}
                    >
                      {v === 'private' && '나만'}
                      {v === 'team' && '팀 전체'}
                      {v === 'shared' && '선택 공유'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 제출 버튼 */}
              <button
                type="submit"
                disabled={isLoading || !title.trim() || !groupId}
                className="w-full py-3 bg-brand text-gray-900 rounded-lg font-medium hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '저장 중...' : eventToEdit ? '수정' : '추가'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
```

---

## Phase 2 완료 체크리스트

- [ ] Calendar Store 구현
- [ ] Calendar 서비스 (Firestore CRUD) 구현
- [ ] 날짜 유틸리티 함수 구현
- [ ] CalendarView 페이지 구현
- [ ] CalendarSidebar (그룹 관리) 구현
- [ ] Calendar 메인 컴포넌트 구현
- [ ] WeeklyView 구현
- [ ] MonthlyView 구현
- [ ] EventBar 컴포넌트 구현
- [ ] EventModal (생성/수정) 구현
- [ ] 팀 캘린더 / 개인 캘린더 분리 동작 확인
- [ ] 캘린더 그룹 생성/삭제 동작 확인
- [ ] 이벤트 CRUD 동작 확인
- [ ] 멀티데이 이벤트 표시 확인
- [ ] 주간/월간 뷰 전환 확인
