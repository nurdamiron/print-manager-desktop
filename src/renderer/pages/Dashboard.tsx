import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Button,
  Container,
  Avatar,
  Chip,
  LinearProgress,
  Alert,
  Fade,
  IconButton,
} from '@mui/material';
import { 
  Print as PrintIcon, 
  Settings as SettingsIcon,
  Usb as UsbIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { Printer } from '../components/PrinterCard';

/**
 * Компонент Dashboard - главная страница приложения
 * Отображает обзорную информацию и быстрые ссылки на основные функции
 */
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Состояние для хранения списка принтеров
  const [printers, setPrinters] = useState<Printer[]>([]);
  
  // Состояние для индикации загрузки данных
  const [loading, setLoading] = useState(true);
  
  // Состояние для отслеживания ошибок загрузки
  const [error, setError] = useState<string | null>(null);

  // Загружаем данные о принтерах при монтировании компонента
  useEffect(() => {
    /**
     * Функция для загрузки списка принтеров из локального хранилища
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
            // Используем isConnected для USB-принтеров, isOnline для сетевых
            isConnected: !!connectedPrinter,
          };
        });
        
        setPrinters(updatedPrinters);
      } catch (err) {
        console.error('Ошибка загрузки принтеров:', err);
        setError('Не удалось загрузить список принтеров');
      } finally {
        setLoading(false);
      }
    };

    loadPrinters();
  }, []);

  // Расчет статистики по принтерам
  // Считаем принтер подключенным, если либо isConnected, либо isOnline равно true
  const connectedPrinters = printers.filter(printer => printer.isConnected === true || printer.isOnline === true).length;
  const totalPrinters = printers.length;

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Заголовок с действиями */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        flexWrap: 'wrap',
        gap: 2,
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
            Добро пожаловать! 👋
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: 400,
            }}
          >
            Управляйте принтерами и печатайте документы
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={() => window.location.reload()}
            sx={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.2)',
              },
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Карточки статистики */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Карточка со статистикой по принтерам */}
        <Grid item xs={12} sm={6} md={4}>
          <Fade in timeout={500}>
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #00d4aa 0%, #4ade80 100%)',
              color: 'white',
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    mr: 2,
                    width: 48,
                    height: 48,
                  }}>
                    <UsbIcon sx={{ color: 'white' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      USB Принтеры
                    </Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {loading ? '...' : `${connectedPrinters}/${totalPrinters}`}
                    </Typography>
                  </Box>
                </Box>
                {!loading && (
                  <Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={totalPrinters > 0 ? (connectedPrinters / totalPrinters) * 100 : 0}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 3,
                          backgroundColor: 'white',
                        },
                      }}
                    />
                    <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                      {connectedPrinters} активных
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        {/* Карточка производительности */}
        <Grid item xs={12} sm={6} md={4}>
          <Fade in timeout={700}>
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
                    width: 48,
                    height: 48,
                  }}>
                    <SpeedIcon sx={{ color: 'white' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Производительность
                    </Typography>
                    <Typography variant="h5" fontWeight={700}>
                      Отлично
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon sx={{ fontSize: 16 }} />
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Все системы работают
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        {/* Карточка статуса */}
        <Grid item xs={12} sm={6} md={4}>
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
                    width: 48,
                    height: 48,
                  }}>
                    <TrendingUpIcon sx={{ color: 'white' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Готовность
                    </Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {totalPrinters > 0 ? '100%' : '0%'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {totalPrinters > 0 ? (
                    <CheckCircleIcon sx={{ fontSize: 16 }} />
                  ) : (
                    <WarningIcon sx={{ fontSize: 16 }} />
                  )}
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    {totalPrinters > 0 ? 'Готов к печати' : 'Нет принтеров'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>
      </Grid>

      {/* Быстрые действия */}
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            color: 'white',
            fontWeight: 600,
            mb: 2,
            textShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
          }}
        >
          Быстрые действия
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            mb: 3,
          }}
        >
          Выберите действие для начала работы
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* Карточка печати документа */}
        <Grid item xs={12} sm={6} lg={6}>
          <Fade in timeout={1100}>
            <Card sx={{ 
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-8px) scale(1.02)',
              },
            }}>
              <CardContent sx={{ p: 4, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ 
                    width: 80, 
                    height: 80, 
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                    boxShadow: '0px 8px 32px rgba(102, 126, 234, 0.3)',
                  }}>
                    <PrintIcon sx={{ fontSize: 36, color: 'white' }} />
                  </Box>
                  
                  <Typography variant="h5" fontWeight={600} gutterBottom>
                    Печать документа
                  </Typography>
                  
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                    Быстро отправьте документы на USB-принтер. Поддерживаются PDF, DOC, TXT и другие форматы.
                  </Typography>
                  
                  {totalPrinters === 0 && (
                    <Alert severity="warning" sx={{ mb: 2, textAlign: 'left' }}>
                      Сначала добавьте принтер в настройках
                    </Alert>
                  )}
                </Box>
                
                <Button 
                  variant="contained" 
                  size="large"
                  onClick={() => navigate('/print')}
                  disabled={totalPrinters === 0}
                  startIcon={<PrintIcon />}
                  sx={{ 
                    py: 1.5,
                    px: 4,
                    borderRadius: 3,
                    fontWeight: 600,
                  }}
                >
                  Начать печать
                </Button>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        {/* Карточка настройки принтеров */}
        <Grid item xs={12} sm={6} lg={6}>
          <Fade in timeout={1300}>
            <Card sx={{ 
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-8px) scale(1.02)',
              },
            }}>
              <CardContent sx={{ p: 4, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ 
                    width: 80, 
                    height: 80, 
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00d4aa 0%, #4ade80 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                    boxShadow: '0px 8px 32px rgba(0, 212, 170, 0.3)',
                  }}>
                    <SettingsIcon sx={{ fontSize: 36, color: 'white' }} />
                  </Box>
                  
                  <Typography variant="h5" fontWeight={600} gutterBottom>
                    Управление принтерами
                  </Typography>
                  
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                    Добавляйте, настраивайте и управляйте USB-принтерами. Просматривайте статус подключения.
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2 }}>
                    <Chip 
                      label={`${totalPrinters} принтеров`}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                    <Chip 
                      label={`${connectedPrinters} активных`}
                      color="success"
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    variant="contained" 
                    size="large"
                    onClick={() => navigate('/printers')}
                    startIcon={<SettingsIcon />}
                    sx={{ 
                      flexGrow: 1,
                      py: 1.5,
                      px: 3,
                      borderRadius: 3,
                      fontWeight: 600,
                    }}
                  >
                    Настройки
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="large"
                    onClick={() => navigate('/printers/new')}
                    sx={{ 
                      py: 1.5,
                      px: 2,
                      borderRadius: 3,
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                      }
                    }}
                  >
                    <AddIcon />
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>
      </Grid>

      {/* Отображение ошибки (если есть) */}
      {error && (
        <Box sx={{ mt: 4 }}>
          <Alert severity="error" sx={{ borderRadius: 3 }}>
            {error}
          </Alert>
        </Box>
      )}
    </Container>
  );
};

export default Dashboard;