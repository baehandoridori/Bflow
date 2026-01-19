import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui';

export function NodeMapView() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="min-h-[600px]">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-dark-surface-hover flex items-center justify-center">
              <svg
                className="w-8 h-8 text-light-text-secondary dark:text-dark-text-secondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-2">
              노드맵 뷰
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary max-w-md">
              Phase 3에서 구현 예정입니다.
              <br />
              옵시디언 스타일의 노드 그래프로 작업 의존성을 시각화합니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
