import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import PrinterCard, { Printer } from '../components/PrinterCard';

/**
 * Компонент PrinterSettings - страница настройки принтеров
 * Отображает список принтеров и позволяет управлять ими
 */
const PrinterSettings: React.FC = () => {
  const navigate = useNavigate();
  
  // Состояние для хранения списка принтеров
  const [printers, setPrinters] = useState<Printer[]>([]);
  
  // Состояние для индикации загрузки данных
  const [loading, setLoading] = useState(true);
  
  // Состояние для отслеживания ошибок загрузки
  const [error, setError] = useState<string | null>(null);
  
  // Состояние для уведомлений
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' as 'error' | 'info' | 'success' | 'warning',
  });

  /**
   * Загружает список принтеров из локального хранилища
   */
  const loadPrinters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Используем API из preload для получения списка принтеров
      const printerList = await window.electronAPI.getPrinters();
      setPrinters(printerList);
    } catch (err) {
      console.error('Ошибка загрузки принтеров:', err);
      setError('Не удалось загрузить список принтеров');
    } finally {
      setLoading(false);
    }
  };

  // Загружаем данные о принтерах при монтировании компонента
  useEffect(() => {
    loadPrinters();
  }, []);

  /**
   * Обработчик проверки соединения с принтером
   * @param printer Принтер для проверки
   */
  const handleCheckPrinter = async (printer: Printer) => {
    try {
      // Проверяем соединение через API Electron
      const result = await window.electronAPI.checkPrinterConnection(
        printer.ipAddress ?? '',  // добавляем проверку на undefined
        printer.port ?? 0         // добавляем проверку на undefined
      );
      
      // Обновляем статус принтера в списке
      const updatedPrinters = printers.map(p => {
        if (p.id === printer.id) {
          return {
            ...p,
            isOnline: result.status === 'online',
            lastChecked: new Date().toISOString(),
          };
        }
        return p;
      });
      
      setPrinters(updatedPrinters);
      
      // Сохраняем обновленный список принтеров
      for (const p of updatedPrinters) {
        await window.electronAPI.savePrinter(p);
      }
      
      // Показываем уведомление о результате проверки
      setSnackbar({
        open: true,
        message: result.status === 'online' 
          ? `Принтер "${printer.name}" в сети` 
          : `Принтер "${printer.name}" не отвечает`,
        severity: result.status === 'online' ? 'success' : 'warning',
      });
    } catch (err) {
      console.error('Ошибка при проверке принтера:', err);
      setSnackbar({
        open: true,
        message: `Ошибка при проверке принтера "${printer.name}"`,
        severity: 'error',
      });
    }
  };

  /**
   * Обработчик удаления принтера
   * @param id Идентификатор принтера для удаления
   */
  const handleDeletePrinter = async (id: string) => {
    try {
      // Используем API из preload для удаления принтера
      await window.electronAPI.deletePrinter(id);
      
      // Обновляем список принтеров
      setPrinters(printers.filter(p => p.id !== id));
      
      // Показываем уведомление об успешном удалении
      setSnackbar({
        open: true,
        message: 'Принтер успешно удален',
        severity: 'success',
      });
    } catch (err) {
      console.error('Ошибка при удалении принтера:', err);
      setSnackbar({
        open: true,
        message: 'Ошибка при удалении принтера',
        severity: 'error',
      });
    }
  };

  /**
   * Обработчик выбора принтера для печати
   * @param printer Выбранный принтер
   */
  const handleSelectPrinter = (printer: Printer) => {
    // Переходим на страницу печати и передаем идентификатор принтера
    navigate(`/print?printer=${printer.id}`);
  };

  /**
   * Обработчик закрытия уведомления
   */
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  /**
   * Обновляет статус всех принтеров
   */
  const handleRefreshAll = async () => {
    setSnackbar({
      open: true,
      message: 'Обновление статуса всех принтеров...',
      severity: 'info',
    });
    
    // Проверяем каждый принтер
    for (const printer of printers) {
      await handleCheckPrinter(printer);
    }
    
    setSnackbar({
      open: true,
      message: 'Обновление завершено',
      severity: 'success',
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Настройки принтеров
        </Typography>
        
        <Box>
          {/* Кнопка обновления статуса всех принтеров */}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefreshAll}
            disabled={loading || printers.length === 0}
            sx={{ mr: 1 }}
          >
            Обновить все
          </Button>
          
          {/* Кнопка добавления нового принтера */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/printers/new')}
          >
            Добавить принтер
          </Button>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Индикатор загрузки */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        // Список принтеров или сообщение об их отсутствии
        <>
          {printers.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Пока нет добавленных принтеров. Нажмите "Добавить принтер", чтобы начать.
            </Alert>
          ) : (
            printers.map(printer => (
              <PrinterCard
                key={printer.id}
                printer={printer}
                onDelete={handleDeletePrinter}
                onCheck={handleCheckPrinter}
                onSelect={handleSelectPrinter}
              />
            ))
          )}
        </>
      )}

      {/* Отображение ошибки (если есть) */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Всплывающее уведомление */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PrinterSettings;