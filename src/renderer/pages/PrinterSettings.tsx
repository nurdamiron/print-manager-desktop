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
  Card,
  CardContent,
  Avatar,
  IconButton,
  Chip,
  Stack,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Refresh as RefreshIcon,
  UsbOff as UsbOffIcon,
  Usb as UsbIcon,
  Dashboard as DashboardIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
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
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Заголовок страницы */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        mb: 4,
        flexWrap: 'wrap',
        gap: 3,
      }}>
        <Box>
          <Typography 
            variant="h3" 
            gutterBottom
            sx={{ 
              fontWeight: 700,
              color: 'white',
              textShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
              mb: 1,
            }}
          >
            Управление принтерами 🖨️
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: 400,
              mb: 2,
            }}
          >
            Настройте и управляйте USB-принтерами для печати документов
          </Typography>
          
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Chip 
              label={`${totalPrinters} принтеров`}
              sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontWeight: 600,
              }}
            />
            <Chip 
              label={`${connectedPrinters} активных`}
              sx={{ 
                bgcolor: hasConnectedPrinters ? 'rgba(0, 212, 170, 0.8)' : 'rgba(255, 107, 107, 0.8)',
                color: 'white',
                fontWeight: 600,
              }}
            />
          </Stack>
        </Box>
        
        <Stack direction="row" spacing={2}>
          <IconButton
            onClick={handleRefreshPrinters}
            disabled={loading || refreshing}
            sx={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              backdropFilter: 'blur(10px)',
              width: 48,
              height: 48,
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.2)',
              },
              '&:disabled': {
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'rgba(255, 255, 255, 0.3)',
              },
            }}
          >
            {refreshing ? <CircularProgress size={24} color="inherit" /> : <RefreshIcon />}
          </IconButton>
          
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => navigate('/printers/new')}
            sx={{ 
              py: 1.5,
              px: 3,
              borderRadius: 3,
              fontWeight: 600,
              background: 'rgba(255, 255, 255, 0.9)',
              color: 'primary.main',
              '&:hover': {
                background: 'white',
                transform: 'translateY(-2px)',
              },
            }}
          >
            Добавить принтер
          </Button>
        </Stack>
      </Box>
        
      {/* Статистика по USB-принтерам */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Fade in timeout={500}>
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    mr: 2,
                    width: 56,
                    height: 56,
                  }}>
                    <UsbIcon sx={{ color: 'white', fontSize: 28 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Всего принтеров
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {totalPrinters}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Управляемых устройств
                </Typography>
              </CardContent>
            </Card>
          </Fade>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Fade in timeout={700}>
            <Card sx={{ 
              height: '100%',
              background: hasConnectedPrinters 
                ? 'linear-gradient(135deg, #00d4aa 0%, #4ade80 100%)'
                : 'linear-gradient(135deg, #ff6b6b 0%, #f5576c 100%)',
              color: 'white',
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    mr: 2,
                    width: 56,
                    height: 56,
                  }}>
                    {hasConnectedPrinters ? (
                      <CheckCircleIcon sx={{ color: 'white', fontSize: 28 }} />
                    ) : (
                      <UsbOffIcon sx={{ color: 'white', fontSize: 28 }} />
                    )}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Подключено
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {connectedPrinters}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {hasConnectedPrinters ? 'Готовы к работе' : 'Нет подключений'}
                </Typography>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Fade in timeout={900}>
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    mr: 2,
                    width: 56,
                    height: 56,
                  }}>
                    <TrendingUpIcon sx={{ color: 'white', fontSize: 28 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Готовность
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {totalPrinters > 0 ? Math.round((connectedPrinters / totalPrinters) * 100) : 0}%
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Системы активны
                </Typography>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Fade in timeout={1100}>
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
              color: '#2d3748',
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(45, 55, 72, 0.1)',
                    mr: 2,
                    width: 56,
                    height: 56,
                  }}>
                    <DashboardIcon sx={{ color: '#2d3748', fontSize: 28 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Статус системы
                    </Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {loading ? 'Загрузка...' : 'Активна'}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Все сервисы работают
                </Typography>
              </CardContent>
            </Card>
          </Fade>
        </Grid>
      </Grid>

      {/* Основное содержимое */}
      <Box sx={{ 
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: 4,
        p: 4,
        mb: 3,
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0px 20px 40px rgba(0, 0, 0, 0.1)',
      }}>
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            py: 8,
          }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Поиск USB-принтеров...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Сканируем подключенные устройства
            </Typography>
          </Box>
        ) : (
          // Список принтеров или сообщение об их отсутствии
          <Fade in={!loading}>
            <Box>
              {printers.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Box sx={{ 
                    width: 120, 
                    height: 120, 
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                    boxShadow: '0px 20px 40px rgba(240, 147, 251, 0.3)',
                  }}>
                    <UsbOffIcon sx={{ fontSize: 48, color: 'white' }} />
                  </Box>
                  
                  <Typography variant="h4" fontWeight={600} gutterBottom>
                    USB-принтеры не найдены
                  </Typography>
                  
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
                    Подключите USB-принтер к компьютеру и нажмите кнопку обновления. 
                    Убедитесь, что принтер включен и правильно подключен.
                  </Typography>
                  
                  <Stack direction="row" spacing={2} justifyContent="center">
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<RefreshIcon />}
                      onClick={handleRefreshPrinters}
                      disabled={refreshing}
                      sx={{ 
                        py: 1.5,
                        px: 3,
                        borderRadius: 3,
                        fontWeight: 600,
                      }}
                    >
                      {refreshing ? 'Обновление...' : 'Обновить список'}
                    </Button>
                    
                    <Button
                      variant="outlined"
                      size="large"
                      startIcon={<AddIcon />}
                      onClick={() => navigate('/printers/new')}
                      sx={{ 
                        py: 1.5,
                        px: 3,
                        borderRadius: 3,
                        borderWidth: 2,
                        '&:hover': { borderWidth: 2 },
                      }}
                    >
                      Добавить вручную
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <Box>
                  <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
                    Найденные принтеры ({printers.length})
                  </Typography>
                  
                  <Grid container spacing={3}>
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
                      .map((printer, index) => (
                        <Grid item xs={12} key={printer.id}>
                          <Fade in timeout={300 + index * 100}>
                            <Box>
                              <PrinterCard
                                printer={printer}
                                onDelete={handleDeletePrinter}
                                onSelect={handleSelectPrinter}
                                onSetDefault={handleSetDefaultPrinter}
                              />
                            </Box>
                          </Fade>
                        </Grid>
                      ))
                    }
                  </Grid>
                </Box>
              )}
            </Box>
          </Fade>
        )}
      </Box>

      {/* Отображение ошибки (если есть) */}
      {error && (
        <Fade in>
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: 3,
              background: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid rgba(255, 107, 107, 0.2)',
              backdropFilter: 'blur(10px)',
            }}
          >
            {error}
          </Alert>
        </Fade>
      )}

      {/* Всплывающее уведомление */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            borderRadius: 3,
            boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PrinterSettings;