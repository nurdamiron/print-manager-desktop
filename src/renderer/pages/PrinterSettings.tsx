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
  Paper,
  Container,
  Grid,
  Fade,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Refresh as RefreshIcon,
  UsbOff as UsbOffIcon,
  Usb as UsbIcon,
} from '@mui/icons-material';
import PrinterCard, { Printer } from '../components/PrinterCard';

/**
 * Компонент PrinterSettings - страница настройки USB-принтеров
 * Отображает список принтеров и позволяет управлять ими
 */
const PrinterSettings: React.FC = () => {
  const navigate = useNavigate();
  
  // Состояние для хранения списка принтеров
  const [printers, setPrinters] = useState<Printer[]>([]);
  
  // Состояние для индикации загрузки данных
  const [loading, setLoading] = useState(true);
  
  // Состояние для отслеживания обновления списка принтеров
  const [refreshing, setRefreshing] = useState(false);
  
  // Состояние для отслеживания ошибок загрузки
  const [error, setError] = useState<string | null>(null);
  
  // Состояние для управления уведомлениями
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' as 'error' | 'info' | 'success' | 'warning',
  });

  /**
   * Загружает список USB-принтеров
   * Функция обращается к Electron API для получения списка всех подключенных USB-принтеров
   */
  const loadPrinters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Получаем список сохраненных принтеров
      const savedPrinters = await window.electronAPI.getPrinters();
      
      // Получаем список подключенных USB-принтеров
      const usbPrinters = await window.electronAPI.getUsbPrinters();
      
      // Обновляем статус подключения сохраненных принтеров
      const updatedPrinters = savedPrinters.map(printer => {
        // Проверяем, есть ли принтер в списке подключенных
        const connectedPrinter = usbPrinters.find(
          usbPrinter => usbPrinter.id === printer.id
        );
        
        return {
          ...printer,
          isConnected: !!connectedPrinter,
        };
      });
      
      // Добавляем новые подключенные принтеры, которых нет в сохраненных
      const newPrinters = usbPrinters.filter(
        usbPrinter => !savedPrinters.some(p => p.id === usbPrinter.id)
      ).map(usbPrinter => ({
        ...usbPrinter,
        isConnected: true,
      }));
      
      // Объединяем обновленные и новые принтеры
      setPrinters([...updatedPrinters, ...newPrinters]);
      
      // Сохраняем все принтеры в хранилище
      for (const printer of [...updatedPrinters, ...newPrinters]) {
        await window.electronAPI.savePrinter(printer);
      }
    } catch (err) {
      console.error('Ошибка загрузки принтеров:', err);
      setError('Не удалось загрузить список USB-принтеров. Проверьте подключение устройств.');
    } finally {
      setLoading(false);
    }
  };

  // Загружаем данные о принтерах при монтировании компонента
  useEffect(() => {
    loadPrinters();
  }, []);

  /**
   * Обработчик удаления принтера
   * Удаляет принтер из списка и из хранилища
   * 
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
        message: 'Принтер успешно удален из списка',
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
   * Перенаправляет на страницу печати с выбранным принтером
   * 
   * @param printer Выбранный принтер
   */
  const handleSelectPrinter = (printer: Printer) => {
    // Переходим на страницу печати и передаем идентификатор принтера
    navigate(`/print?printer=${printer.id}`);
  };

  /**
   * Устанавливает принтер по умолчанию
   * Обновляет статус принтера и сохраняет изменения
   * 
   * @param id Идентификатор принтера для установки по умолчанию
   */
  const handleSetDefaultPrinter = async (id: string) => {
    try {
      // Обновляем список принтеров, устанавливая один как принтер по умолчанию
      const updatedPrinters = printers.map(p => ({
        ...p,
        isDefault: p.id === id
      }));
      
      setPrinters(updatedPrinters);
      
      // Сохраняем обновленный список принтеров
      for (const printer of updatedPrinters) {
        await window.electronAPI.savePrinter(printer);
      }
      
      setSnackbar({
        open: true,
        message: 'Принтер по умолчанию установлен',
        severity: 'success',
      });
    } catch (err) {
      console.error('Ошибка при установке принтера по умолчанию:', err);
      setSnackbar({
        open: true,
        message: 'Не удалось установить принтер по умолчанию',
        severity: 'error',
      });
    }
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
   * Обновляет список USB-принтеров
   * Сканирует подключенные устройства и обновляет их статус
   */
  const handleRefreshPrinters = async () => {
    try {
      setRefreshing(true);
      setSnackbar({
        open: true,
        message: 'Обновление списка USB-принтеров...',
        severity: 'info',
      });
      
      await loadPrinters();
      
      setSnackbar({
        open: true,
        message: 'Список USB-принтеров обновлен',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Ошибка при обновлении списка принтеров',
        severity: 'error',
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Статистика по принтерам
  const connectedPrinters = printers.filter(p => p.isConnected).length;
  const totalPrinters = printers.length;
  const hasPrinters = totalPrinters > 0;
  const hasConnectedPrinters = connectedPrinters > 0;

  return (
    <Container maxWidth="lg">
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2, 
          bgcolor: 'background.default' 
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Управление USB-принтерами
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Управляйте USB-принтерами и отправляйте на них задания печати
            </Typography>
          </Box>
          
          <Box>
            {/* Кнопка обновления статуса всех принтеров */}
            <Button
              variant="outlined"
              startIcon={refreshing ? <CircularProgress size={18} /> : <RefreshIcon />}
              onClick={handleRefreshPrinters}
              disabled={loading || refreshing}
              sx={{ mr: 1 }}
            >
              Обновить список
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
        
        {/* Статистика по USB-принтерам */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                bgcolor: 'primary.main', 
                color: 'primary.contrastText',
                borderRadius: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <UsbIcon sx={{ fontSize: 40, mr: 1 }} />
                <Box>
                  <Typography variant="body2">
                    Всего USB-принтеров
                  </Typography>
                  <Typography variant="h4">
                    {totalPrinters}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                bgcolor: hasConnectedPrinters ? 'success.main' : 'error.main', 
                color: 'white',
                borderRadius: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {hasConnectedPrinters ? (
                  <UsbIcon sx={{ fontSize: 40, mr: 1 }} />
                ) : (
                  <UsbOffIcon sx={{ fontSize: 40, mr: 1 }} />
                )}
                <Box>
                  <Typography variant="body2">
                    Подключено сейчас
                  </Typography>
                  <Typography variant="h4">
                    {connectedPrinters} / {totalPrinters}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* Индикатор загрузки */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        // Список принтеров или сообщение об их отсутствии
        <Fade in={!loading}>
          <Box>
            {printers.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <UsbOffIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  USB-принтеры не найдены
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Подключите USB-принтер к компьютеру и нажмите "Обновить список"
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={handleRefreshPrinters}
                  disabled={refreshing}
                >
                  Обновить список
                </Button>
              </Paper>
            ) : (
              <>
                {/* Сортируем принтеры: сначала подключенные, затем по умолчанию */}
                {printers
                  .sort((a, b) => {
                    // Сначала принтеры по умолчанию
                    if (a.isDefault && !b.isDefault) return -1;
                    if (!a.isDefault && b.isDefault) return 1;
                    
                    // Затем подключенные принтеры
                    if (a.isConnected && !b.isConnected) return -1;
                    if (!a.isConnected && b.isConnected) return 1;
                    
                    // По алфавиту
                    return a.name.localeCompare(b.name);
                  })
                  .map(printer => (
                    <PrinterCard
                      key={printer.id}
                      printer={printer}
                      onDelete={handleDeletePrinter}
                      onSelect={handleSelectPrinter}
                      onSetDefault={handleSetDefaultPrinter}
                    />
                  ))
                }
              </>
            )}
          </Box>
        </Fade>
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
    </Container>
  );
};

export default PrinterSettings;