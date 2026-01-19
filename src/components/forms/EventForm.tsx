import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useDataStore } from '@/stores/useDataStore';
import type { CalendarEvent } from '@/types';
import { cn } from '@/utils/cn';

interface EventFormProps {
  event?: CalendarEvent;
  initialDate?: string;
  onSubmit: () => void;
  onCancel: () => void;
}

type EventType = CalendarEvent['type'];

export function EventForm({ event, initialDate, onSubmit, onCancel }: EventFormProps) {
  const { episodes, addCalendarEvent, updateCalendarEvent } = useDataStore();

  const [formData, setFormData] = useState({
    title: '',
    type: 'event' as EventType,
    startDate: initialDate || '',
    endDate: initialDate || '',
    color: '#3B82F6',
    relatedEpisodeId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        type: event.type,
        startDate: event.startDate,
        endDate: event.endDate,
        color: event.color || '#3B82F6',
        relatedEpisodeId: event.relatedEpisodeId || '',
      });
    }
  }, [event]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '이벤트 제목을 입력해주세요';
    }

    if (!formData.startDate) {
      newErrors.startDate = '시작일을 선택해주세요';
    }

    if (!formData.endDate) {
      newErrors.endDate = '종료일을 선택해주세요';
    }

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = '종료일은 시작일 이후여야 합니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const eventData = {
      title: formData.title,
      type: formData.type,
      startDate: formData.startDate,
      endDate: formData.endDate,
      color: formData.color,
      relatedEpisodeId: formData.relatedEpisodeId || undefined,
    };

    if (event) {
      updateCalendarEvent(event.id, eventData);
    } else {
      addCalendarEvent(eventData);
    }

    onSubmit();
  };

  const inputClassName = cn(
    'w-full px-3 py-2 rounded-lg text-sm',
    'bg-light-bg dark:bg-dark-bg',
    'border border-light-border dark:border-dark-border',
    'text-light-text dark:text-dark-text',
    'placeholder:text-light-text-secondary dark:placeholder:text-dark-text-secondary',
    'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent',
    'transition-colors'
  );

  const labelClassName = 'block text-sm font-medium text-light-text dark:text-dark-text mb-1.5';

  const typeOptions: { value: EventType; label: string; color: string }[] = [
    { value: 'event', label: '일반', color: '#3B82F6' },
    { value: 'meeting', label: '미팅', color: '#8B5CF6' },
    { value: 'deadline', label: '마감', color: '#EF4444' },
    { value: 'milestone', label: '마일스톤', color: '#F59E0B' },
    { value: 'holiday', label: '휴일', color: '#10B981' },
  ];

  const colorOptions = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280',
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className={labelClassName}>
          이벤트 제목 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="예: 팀 미팅"
          className={cn(inputClassName, errors.title && 'border-red-500')}
        />
        {errors.title && (
          <p className="mt-1 text-xs text-red-500">{errors.title}</p>
        )}
      </div>

      {/* Type */}
      <div>
        <label className={labelClassName}>유형</label>
        <div className="flex flex-wrap gap-2">
          {typeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFormData({ ...formData, type: option.value, color: option.color })}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all',
                formData.type === option.value
                  ? 'bg-brand-primary/20 text-brand-primary border border-brand-primary'
                  : 'bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-secondary dark:text-dark-text-secondary hover:border-light-text/30 dark:hover:border-dark-text/30'
              )}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: option.color }}
              />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClassName}>
            시작일 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className={cn(inputClassName, errors.startDate && 'border-red-500')}
          />
          {errors.startDate && (
            <p className="mt-1 text-xs text-red-500">{errors.startDate}</p>
          )}
        </div>
        <div>
          <label className={labelClassName}>
            종료일 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className={cn(inputClassName, errors.endDate && 'border-red-500')}
          />
          {errors.endDate && (
            <p className="mt-1 text-xs text-red-500">{errors.endDate}</p>
          )}
        </div>
      </div>

      {/* Color */}
      <div>
        <label className={labelClassName}>색상</label>
        <div className="flex gap-2">
          {colorOptions.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData({ ...formData, color })}
              className={cn(
                'w-8 h-8 rounded-lg transition-all',
                formData.color === color && 'ring-2 ring-offset-2 ring-brand-primary dark:ring-offset-dark-bg'
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Related Episode */}
      {(formData.type === 'deadline' || formData.type === 'milestone') && (
        <div>
          <label className={labelClassName}>관련 에피소드</label>
          <select
            value={formData.relatedEpisodeId}
            onChange={(e) => setFormData({ ...formData, relatedEpisodeId: e.target.value })}
            className={inputClassName}
          >
            <option value="">선택 안 함</option>
            {episodes.map((ep) => (
              <option key={ep.id} value={ep.id}>
                {ep.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" variant="primary">
          {event ? '수정' : '생성'}
        </Button>
      </div>
    </form>
  );
}
