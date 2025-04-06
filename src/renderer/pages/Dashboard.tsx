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
} from '@mui/material';
import { 
  Print as PrintIcon, 
  Settings as SettingsIcon 
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

    loadPrinters();
  }, []);

  // Расчет статистики по принтерам
  const onlinePrinters = printers.filter(printer => printer.isOnline === true).length;
  const totalPrinters = printers.length;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Панель управления
      </Typography>

      {/* Карточки статистики */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Карточка со статистикой по принтерам */}
        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Принтеры
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <>
                <Typography variant="h4">
                  {onlinePrinters} / {totalPrinters}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  принтеров в сети
                </Typography>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Быстрые действия */}
      <Typography variant="h5" gutterBottom>
        Быстрые действия
      </Typography>
      
      <Grid container spacing={3}>
        {/* Карточка печати документа */}
        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                <PrintIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Печать документа
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
                  Отправьте документ на печать
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => navigate('/print')}
                  disabled={totalPrinters === 0}
                >
                  Начать печать
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Карточка настройки принтеров */}
        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                <SettingsIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Настройка принтеров
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
                  Добавьте и настройте принтеры
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => navigate('/printers')}
                >
                  Настройки
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Отображение ошибки (если есть) */}
      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default Dashboard;