# Phase 3: 개인 생산성

> 할 일 관리, 메모, D-day

---

## 목표

Phase 3이 완료되면:
- 개인 할 일 목록 관리 (추가/수정/삭제/완료)
- 간단한 메모 저장
- D-day 목표 설정 및 카운트다운
- 대시보드에 오늘의 할 일 위젯

---

## Step 3.1: Todo Store

### src/stores/useTodoStore.ts

```typescript
import { create } from 'zustand';
import { PersonalTodo, PersonalMemo, DDay } from '../types';

interface TodoState {
  todos: PersonalTodo[];
  memos: PersonalMemo[];
  ddays: DDay[];
  isLoading: boolean;

  setTodos: (todos: PersonalTodo[]) => void;
  addTodo: (todo: PersonalTodo) => void;
  updateTodo: (id: string, updates: Partial<PersonalTodo>) => void;
  removeTodo: (id: string) => void;
  toggleTodo: (id: string) => void;

  setMemos: (memos: PersonalMemo[]) => void;
  addMemo: (memo: PersonalMemo) => void;
  updateMemo: (id: string, updates: Partial<PersonalMemo>) => void;
  removeMemo: (id: string) => void;

  setDDays: (ddays: DDay[]) => void;
  addDDay: (dday: DDay) => void;
  removeDDay: (id: string) => void;

  setLoading: (loading: boolean) => void;
}

export const useTodoStore = create<TodoState>((set) => ({
  todos: [],
  memos: [],
  ddays: [],
  isLoading: true,

  setTodos: (todos) => set({ todos }),
  addTodo: (todo) => set((s) => ({ todos: [...s.todos, todo] })),
  updateTodo: (id, updates) =>
    set((s) => ({
      todos: s.todos.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  removeTodo: (id) => set((s) => ({ todos: s.todos.filter((t) => t.id !== id) })),
  toggleTodo: (id) =>
    set((s) => ({
      todos: s.todos.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
    })),

  setMemos: (memos) => set({ memos }),
  addMemo: (memo) => set((s) => ({ memos: [...s.memos, memo] })),
  updateMemo: (id, updates) =>
    set((s) => ({
      memos: s.memos.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),
  removeMemo: (id) => set((s) => ({ memos: s.memos.filter((m) => m.id !== id) })),

  setDDays: (ddays) => set({ ddays }),
  addDDay: (dday) => set((s) => ({ ddays: [...s.ddays, dday] })),
  removeDDay: (id) => set((s) => ({ ddays: s.ddays.filter((d) => d.id !== id) })),

  setLoading: (isLoading) => set({ isLoading }),
}));
```

---

## Step 3.2: Todo 서비스

### src/services/todos.ts

```typescript
import {
  collection,
  doc,
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
import { PersonalTodo, PersonalMemo, DDay } from '../types';

// ============ 할 일 ============

export function subscribeToTodos(
  userId: string,
  callback: (todos: PersonalTodo[]) => void
) {
  const q = query(
    collection(db, 'personalTodos'),
    where('userId', '==', userId),
    orderBy('order', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const todos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PersonalTodo[];
    callback(todos);
  });
}

export async function createTodo(
  todo: Omit<PersonalTodo, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, 'personalTodos'), {
    ...todo,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateTodo(
  id: string,
  updates: Partial<PersonalTodo>
): Promise<void> {
  await updateDoc(doc(db, 'personalTodos', id), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTodo(id: string): Promise<void> {
  await deleteDoc(doc(db, 'personalTodos', id));
}

export async function toggleTodoComplete(
  id: string,
  completed: boolean
): Promise<void> {
  await updateDoc(doc(db, 'personalTodos', id), {
    completed,
    completedAt: completed ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  });
}

// ============ 메모 ============

export function subscribeToMemos(
  userId: string,
  callback: (memos: PersonalMemo[]) => void
) {
  const q = query(
    collection(db, 'personalMemos'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const memos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PersonalMemo[];

    // 고정된 메모를 맨 앞으로
    memos.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return 0;
    });

    callback(memos);
  });
}

export async function createMemo(
  memo: Omit<PersonalMemo, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, 'personalMemos'), {
    ...memo,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateMemo(
  id: string,
  updates: Partial<PersonalMemo>
): Promise<void> {
  await updateDoc(doc(db, 'personalMemos', id), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMemo(id: string): Promise<void> {
  await deleteDoc(doc(db, 'personalMemos', id));
}

// ============ D-Day ============

export function subscribeToDDays(
  userId: string,
  callback: (ddays: DDay[]) => void
) {
  const q = query(
    collection(db, 'ddays'),
    where('userId', '==', userId),
    orderBy('targetDate', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const ddays = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as DDay[];
    callback(ddays);
  });
}

export async function createDDay(
  dday: Omit<DDay, 'id' | 'createdAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, 'ddays'), {
    ...dday,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function deleteDDay(id: string): Promise<void> {
  await deleteDoc(doc(db, 'ddays', id));
}
```

---

## Step 3.3: Todo View

### src/views/TodoView.tsx

```typescript
import { useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useTodoStore } from '../stores/useTodoStore';
import { subscribeToTodos, subscribeToMemos, subscribeToDDays } from '../services/todos';
import { TodoList } from '../components/todo/TodoList';
import { MemoList } from '../components/todo/MemoList';
import { DDayList } from '../components/todo/DDayList';

export function TodoView() {
  const { user } = useAuthStore();
  const { setTodos, setMemos, setDDays, setLoading } = useTodoStore();

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    const unsubTodos = subscribeToTodos(user.uid, (todos) => {
      setTodos(todos);
      setLoading(false);
    });

    const unsubMemos = subscribeToMemos(user.uid, setMemos);
    const unsubDDays = subscribeToDDays(user.uid, setDDays);

    return () => {
      unsubTodos();
      unsubMemos();
      unsubDDays();
    };
  }, [user, setTodos, setMemos, setDDays, setLoading]);

  return (
    <div className="grid grid-cols-3 gap-6 h-full">
      {/* 할 일 목록 */}
      <div className="col-span-2">
        <TodoList />
      </div>

      {/* 우측 사이드 */}
      <div className="space-y-6">
        {/* D-Day */}
        <DDayList />

        {/* 메모 */}
        <MemoList />
      </div>
    </div>
  );
}
```

---

## Step 3.4: TodoList 컴포넌트

### src/components/todo/TodoList.tsx

```typescript
import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useTodoStore } from '../../stores/useTodoStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { createTodo, updateTodo, deleteTodo, toggleTodoComplete } from '../../services/todos';
import { TodoItem } from './TodoItem';
import { cn } from '../../utils/cn';

export function TodoList() {
  const { user } = useAuthStore();
  const { todos, isLoading } = useTodoStore();
  const [newTodoText, setNewTodoText] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTodoText.trim()) return;

    await createTodo({
      userId: user.uid,
      content: newTodoText.trim(),
      completed: false,
      priority: 'medium',
      order: todos.length,
    });

    setNewTodoText('');
  };

  const handleToggle = async (id: string, completed: boolean) => {
    await toggleTodoComplete(id, !completed);
  };

  const handleDelete = async (id: string) => {
    await deleteTodo(id);
  };

  const filteredTodos = todos.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const activeTodos = todos.filter((t) => !t.completed);
  const completedTodos = todos.filter((t) => t.completed);

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 h-full flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">할 일</h2>
          <p className="text-sm text-gray-400">
            {activeTodos.length}개 남음 · {completedTodos.length}개 완료
          </p>
        </div>

        {/* 필터 */}
        <div className="flex bg-gray-700 rounded-lg p-1">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors',
                filter === f
                  ? 'bg-brand text-gray-900'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              {f === 'all' && '전체'}
              {f === 'active' && '진행'}
              {f === 'completed' && '완료'}
            </button>
          ))}
        </div>
      </div>

      {/* 새 할 일 입력 */}
      <form onSubmit={handleAddTodo} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          placeholder="새 할 일 추가..."
          className="flex-1 bg-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <button
          type="submit"
          disabled={!newTodoText.trim()}
          className="px-4 py-3 bg-brand text-gray-900 rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50"
        >
          <Plus className="w-5 h-5" />
        </button>
      </form>

      {/* 할 일 목록 */}
      <div className="flex-1 overflow-y-auto space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredTodos.map((todo) => (
            <motion.div
              key={todo.id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
            >
              <TodoItem
                todo={todo}
                onToggle={() => handleToggle(todo.id, todo.completed)}
                onDelete={() => handleDelete(todo.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredTodos.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {filter === 'all' && '할 일이 없습니다'}
            {filter === 'active' && '진행 중인 할 일이 없습니다'}
            {filter === 'completed' && '완료한 할 일이 없습니다'}
          </div>
        )}
      </div>
    </div>
  );
}
```

### src/components/todo/TodoItem.tsx

```typescript
import { Check, Trash2, Calendar } from 'lucide-react';
import { PersonalTodo } from '../../types';
import { formatDate, getDDayString } from '../../utils/date';
import { cn } from '../../utils/cn';
import { Timestamp } from 'firebase/firestore';

interface TodoItemProps {
  todo: PersonalTodo;
  onToggle: () => void;
  onDelete: () => void;
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  const hasDueDate = todo.dueDate;
  const dueDate = hasDueDate ? (todo.dueDate as Timestamp).toDate() : null;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg group hover:bg-gray-700 transition-colors',
        todo.completed && 'opacity-60'
      )}
    >
      {/* 체크박스 */}
      <button
        onClick={onToggle}
        className={cn(
          'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
          todo.completed
            ? 'bg-green-500 border-green-500'
            : 'border-gray-500 hover:border-brand'
        )}
      >
        {todo.completed && <Check className="w-3 h-3 text-white" />}
      </button>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm truncate',
            todo.completed && 'line-through text-gray-500'
          )}
        >
          {todo.content}
        </p>
        {dueDate && (
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
            <Calendar className="w-3 h-3" />
            {formatDate(dueDate, 'M월 d일')} ({getDDayString(dueDate)})
          </p>
        )}
      </div>

      {/* 우선순위 표시 */}
      {todo.priority === 'high' && (
        <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">
          높음
        </span>
      )}

      {/* 삭제 버튼 */}
      <button
        onClick={onDelete}
        className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
```

---

## Step 3.5: MemoList 컴포넌트

### src/components/todo/MemoList.tsx

```typescript
import { useState } from 'react';
import { Plus, Pin, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTodoStore } from '../../stores/useTodoStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { createMemo, updateMemo, deleteMemo } from '../../services/todos';
import { cn } from '../../utils/cn';

export function MemoList() {
  const { user } = useAuthStore();
  const { memos } = useTodoStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newMemoContent, setNewMemoContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleCreate = async () => {
    if (!user || !newMemoContent.trim()) return;

    await createMemo({
      userId: user.uid,
      content: newMemoContent.trim(),
      isPinned: false,
    });

    setNewMemoContent('');
    setIsCreating(false);
  };

  const handleTogglePin = async (id: string, isPinned: boolean) => {
    await updateMemo(id, { isPinned: !isPinned });
  };

  const handleStartEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditContent(content);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editContent.trim()) return;
    await updateMemo(editingId, { content: editContent.trim() });
    setEditingId(null);
    setEditContent('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('이 메모를 삭제하시겠습니까?')) {
      await deleteMemo(id);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">메모</h3>
        <button
          onClick={() => setIsCreating(true)}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* 새 메모 입력 */}
      {isCreating && (
        <div className="mb-4">
          <textarea
            value={newMemoContent}
            onChange={(e) => setNewMemoContent(e.target.value)}
            placeholder="메모 내용..."
            className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleCreate}
              className="px-3 py-1 text-sm bg-brand text-gray-900 rounded hover:bg-brand-dark"
            >
              저장
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewMemoContent('');
              }}
              className="px-3 py-1 text-sm text-gray-400 hover:text-white"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 메모 목록 */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        <AnimatePresence>
          {memos.map((memo) => (
            <motion.div
              key={memo.id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className={cn(
                'p-3 bg-gray-700/50 rounded-lg group',
                memo.isPinned && 'border-l-2 border-brand'
              )}
            >
              {editingId === memo.id ? (
                <div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-gray-600 rounded px-2 py-1 text-sm focus:outline-none resize-none"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleSaveEdit}
                      className="text-xs text-brand hover:underline"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm whitespace-pre-wrap">{memo.content}</p>
                  <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleTogglePin(memo.id, memo.isPinned)}
                      className={cn(
                        'p-1 rounded hover:bg-gray-600',
                        memo.isPinned ? 'text-brand' : 'text-gray-400'
                      )}
                    >
                      <Pin className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleStartEdit(memo.id, memo.content)}
                      className="p-1 rounded hover:bg-gray-600 text-gray-400"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(memo.id)}
                      className="p-1 rounded hover:bg-gray-600 text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {memos.length === 0 && !isCreating && (
          <p className="text-center text-gray-500 text-sm py-4">메모가 없습니다</p>
        )}
      </div>
    </div>
  );
}
```

---

## Step 3.6: DDayList 컴포넌트

### src/components/todo/DDayList.tsx

```typescript
import { useState } from 'react';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTodoStore } from '../../stores/useTodoStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { createDDay, deleteDDay } from '../../services/todos';
import { getDDayString, formatDate } from '../../utils/date';
import { cn } from '../../utils/cn';
import { Timestamp } from 'firebase/firestore';

export function DDayList() {
  const { user } = useAuthStore();
  const { ddays } = useTodoStore();
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const handleCreate = async () => {
    if (!user || !title.trim() || !targetDate) return;

    await createDDay({
      userId: user.uid,
      title: title.trim(),
      targetDate: Timestamp.fromDate(new Date(targetDate)),
      isRecurring: false,
      showOnDashboard: true,
    });

    setTitle('');
    setTargetDate('');
    setIsCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('이 D-day를 삭제하시겠습니까?')) {
      await deleteDDay(id);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">D-Day</h3>
        <button
          onClick={() => setIsCreating(true)}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* 새 D-day 입력 */}
      {isCreating && (
        <div className="mb-4 space-y-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
            className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            autoFocus
          />
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="px-3 py-1 text-sm bg-brand text-gray-900 rounded hover:bg-brand-dark"
            >
              추가
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setTitle('');
                setTargetDate('');
              }}
              className="px-3 py-1 text-sm text-gray-400 hover:text-white"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* D-day 목록 */}
      <div className="space-y-2">
        <AnimatePresence>
          {ddays.map((dday) => {
            const date = (dday.targetDate as Timestamp).toDate();
            const ddayStr = getDDayString(date);
            const isPast = date < new Date();
            const isToday = ddayStr === 'D-Day';

            return (
              <motion.div
                key={dday.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className={cn(
                  'flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg group',
                  isToday && 'bg-brand/20 border border-brand/50'
                )}
              >
                {/* D-day 카운트 */}
                <div
                  className={cn(
                    'text-xl font-bold min-w-[60px] text-center',
                    isToday
                      ? 'text-brand'
                      : isPast
                      ? 'text-gray-500'
                      : 'text-white'
                  )}
                >
                  {ddayStr}
                </div>

                {/* 제목 & 날짜 */}
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm truncate', isPast && 'text-gray-500')}>
                    {dday.title}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(date, 'yyyy.MM.dd')}
                  </p>
                </div>

                {/* 삭제 */}
                <button
                  onClick={() => handleDelete(dday.id)}
                  className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {ddays.length === 0 && !isCreating && (
          <p className="text-center text-gray-500 text-sm py-4">D-day가 없습니다</p>
        )}
      </div>
    </div>
  );
}
```

---

## Step 3.7: 대시보드 업데이트

### src/views/Dashboard.tsx

```typescript
import { useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useTodoStore } from '../stores/useTodoStore';
import { subscribeToTodos, subscribeToDDays } from '../services/todos';
import { TodayTodosWidget } from '../components/widgets/TodayTodosWidget';
import { DDayWidget } from '../components/widgets/DDayWidget';
import { SummaryWidget } from '../components/widgets/SummaryWidget';

export function Dashboard() {
  const { user } = useAuthStore();
  const { setTodos, setDDays } = useTodoStore();

  useEffect(() => {
    if (!user) return;

    const unsubTodos = subscribeToTodos(user.uid, setTodos);
    const unsubDDays = subscribeToDDays(user.uid, setDDays);

    return () => {
      unsubTodos();
      unsubDDays();
    };
  }, [user, setTodos, setDDays]);

  return (
    <div className="grid grid-cols-4 gap-6">
      {/* 오늘의 요약 */}
      <div className="col-span-2">
        <SummaryWidget />
      </div>

      {/* D-Day */}
      <div className="col-span-2">
        <DDayWidget />
      </div>

      {/* 오늘의 할 일 */}
      <div className="col-span-2">
        <TodayTodosWidget />
      </div>

      {/* 추가 위젯들은 Phase 4, 5에서 */}
    </div>
  );
}
```

---

## Phase 3 완료 체크리스트

- [ ] Todo Store 구현
- [ ] Todo 서비스 (Firestore CRUD) 구현
- [ ] TodoView 페이지 구현
- [ ] TodoList 컴포넌트 구현
- [ ] TodoItem 컴포넌트 구현
- [ ] MemoList 컴포넌트 구현
- [ ] DDayList 컴포넌트 구현
- [ ] Dashboard에 위젯 추가
- [ ] 할 일 추가/완료/삭제 동작 확인
- [ ] 메모 추가/수정/삭제/고정 동작 확인
- [ ] D-day 추가/삭제/카운트다운 확인
