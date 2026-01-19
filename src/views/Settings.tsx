import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FolderSync,
  RefreshCw,
  Unplug,
  AlertCircle,
  Check,
  HardDrive,
  Trash2,
  Sun,
  Moon,
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useFileSystemStore } from '@/stores/useFileSystemStore';
import { useDataStore } from '@/stores/useDataStore';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/utils/cn';

export function Settings() {
  const {
    isSupported,
    isConnected,
    isSyncing,
    lastSyncTime,
    error,
    checkSupport,
    connect,
    disconnect,
    syncToFile,
    syncFromFile,
    clearError,
  } = useFileSystemStore();

  const { resetData } = useDataStore();
  const { theme, toggleTheme, accentColor, setAccentColor } = useAppStore();

  useEffect(() => {
    checkSupport();
  }, [checkSupport]);

  const handleConnect = async () => {
    await connect();
  };

  const handleSyncToFile = async () => {
    await syncToFile();
  };

  const handleSyncFromFile = async () => {
    await syncFromFile();
  };

  const accentColors = [
    { name: 'Khaki Gold', color: '#F0E68C' },
    { name: 'Blue', color: '#3B82F6' },
    { name: 'Green', color: '#22C55E' },
    { name: 'Purple', color: '#8B5CF6' },
    { name: 'Pink', color: '#EC4899' },
    { name: 'Orange', color: '#F97316' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-3xl"
    >
      <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">설정</h1>

      {/* Google Drive / File Sync */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HardDrive size={20} className="text-brand-primary" />
            <h2 className="text-lg font-semibold text-light-text dark:text-dark-text">
              데이터 저장소 연결
            </h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSupported ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertCircle size={18} />
              <span className="text-sm">
                이 브라우저는 File System Access API를 지원하지 않습니다.
                Chrome 또는 Edge 브라우저를 사용해주세요.
              </span>
            </div>
          ) : (
            <>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                Google Drive 폴더(또는 로컬 폴더)를 선택하여 데이터를 동기화할 수 있습니다.
                선택한 폴더에 데이터 파일이 저장됩니다.
              </p>

              {error && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={18} />
                    <span className="text-sm">{error}</span>
                  </div>
                  <button onClick={clearError} className="text-sm hover:underline">
                    닫기
                  </button>
                </div>
              )}

              {isConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                    <Check size={18} />
                    <span className="text-sm">폴더에 연결됨</span>
                  </div>

                  {lastSyncTime && (
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                      마지막 동기화: {format(new Date(lastSyncTime), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSyncToFile}
                      disabled={isSyncing}
                    >
                      <RefreshCw size={16} className={cn(isSyncing && 'animate-spin')} />
                      폴더에 저장
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSyncFromFile}
                      disabled={isSyncing}
                    >
                      <FolderSync size={16} className={cn(isSyncing && 'animate-spin')} />
                      폴더에서 불러오기
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={disconnect}
                    >
                      <Unplug size={16} />
                      연결 해제
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={handleConnect}>
                  <FolderSync size={18} />
                  폴더 선택
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {theme === 'dark' ? (
              <Moon size={20} className="text-brand-primary" />
            ) : (
              <Sun size={20} className="text-brand-primary" />
            )}
            <h2 className="text-lg font-semibold text-light-text dark:text-dark-text">
              테마 설정
            </h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-light-text dark:text-dark-text">
                다크 모드
              </p>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                어두운 테마로 전환합니다
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className={cn(
                'relative w-12 h-6 rounded-full transition-colors',
                theme === 'dark' ? 'bg-brand-primary' : 'bg-gray-300 dark:bg-gray-600'
              )}
            >
              <div
                className={cn(
                  'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                  theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          {/* Accent Color */}
          <div>
            <p className="text-sm font-medium text-light-text dark:text-dark-text mb-2">
              강조 색상
            </p>
            <div className="flex gap-2">
              {accentColors.map((option) => (
                <button
                  key={option.color}
                  onClick={() => setAccentColor(option.color)}
                  title={option.name}
                  className={cn(
                    'w-8 h-8 rounded-lg transition-all',
                    accentColor === option.color && 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-dark-bg'
                  )}
                  style={{ backgroundColor: option.color }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 size={20} className="text-red-500" />
            <h2 className="text-lg font-semibold text-light-text dark:text-dark-text">
              데이터 관리
            </h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            데이터를 초기 샘플 데이터로 리셋합니다. 이 작업은 되돌릴 수 없습니다.
          </p>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (confirm('정말로 모든 데이터를 초기화하시겠습니까?')) {
                resetData();
              }
            }}
          >
            <Trash2 size={16} />
            데이터 초기화
          </Button>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardContent className="py-4">
          <div className="text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">
            <p className="font-semibold text-light-text dark:text-dark-text">Bflow v0.1.0</p>
            <p>JBBJ 애니메이션 스튜디오를 위한 워크플로우 관리 앱</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
