import { PipelineStage } from '@/types';

export const PIPELINE_STAGES: PipelineStage[] = [
  '원정',
  '대본',
  '가녹음',
  '피칭',
  '에셋',
  '아트보드',
  '릴',
  '애니메이션',
  '보정',
  '가편',
  '피드백',
  '업로드',
];

export const PIPELINE_STAGE_INFO: Record<
  PipelineStage,
  { label: string; description: string; color: string }
> = {
  원정: {
    label: '원정',
    description: '작가팀 타지 원정, 기획 회의',
    color: '#818CF8',
  },
  대본: {
    label: '대본',
    description: '원고 작성',
    color: '#A78BFA',
  },
  가녹음: {
    label: '가녹음',
    description: '대본 기반 임시 녹음',
    color: '#C084FC',
  },
  피칭: {
    label: '피칭',
    description: '가녹음+릴로 전체 영상 피칭 & 연기 지도',
    color: '#E879F9',
  },
  에셋: {
    label: '에셋',
    description: '필요 에셋 미리 제작',
    color: '#F472B6',
  },
  아트보드: {
    label: '아트보드',
    description: '룩뎁, 분위기, 비주얼 디렉션 확정',
    color: '#FB7185',
  },
  릴: {
    label: '릴',
    description: '타이밍/구성 확인용 러프 영상',
    color: '#F97316',
  },
  애니메이션: {
    label: '애니메이션',
    description: '본 애니메이션 작업',
    color: '#FBBF24',
  },
  보정: {
    label: '보정',
    description: '컬러, 효과, 오디오',
    color: '#A3E635',
  },
  가편: {
    label: '가편',
    description: '초안 편집본',
    color: '#4ADE80',
  },
  피드백: {
    label: '피드백',
    description: '리뷰 및 수정',
    color: '#2DD4BF',
  },
  업로드: {
    label: '업로드',
    description: '최종 퍼블리시',
    color: '#22D3EE',
  },
};

export const STATUS_COLORS = {
  working: '#22C55E',
  review: '#F59E0B',
  done: '#6366F1',
  waiting: '#6B7280',
  absent: '#EF4444',
} as const;

export const PRIORITY_COLORS = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#6B7280',
} as const;

export const ACCENT_COLORS = [
  { name: 'Gold', value: '#F0E68C' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Orange', value: '#F97316' },
] as const;
