import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  CircularProgress,
  InputAdornment,
  Alert,
  Divider,
} from '@mui/material';
import { ArrowBack, Check, Close } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';

/**
 * Компонент NewPrinter - страница добавления нового принтера
 * Позволяет ввести данные и протестировать соединение с принтером
 */
const NewPrinter: React.FC = () => {
  const navigate = useNavigate();
  
  // Состояния для полей формы
  const [name, setName] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('9100'); // Порт по умолчанию для RAW
  
  // Состояния для валидации
  const [errors, setErrors] = useState({
    name: '',
    ipAddress: '',
    port: '',
  });
  
  // Состояния для проверки соединения
  const [connectionStatus, setConnectionStatus] = useState<'unchecked' | 'checking' | 'success' | 'error'>('unchecked');
  const [connectionMessage, setConnectionMessage] = useState('');
  
  // Состояние для индикации процесса сохранения
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Обработчик проверки соединения с принтером
   */
  const handleCheckConnection = async () => {
    // Сбрасываем состояние ошибок для IP-адреса и порта
    setErrors({
      ...errors,
      ipAddress: '',
      port: '',
    });
    
    // Проверяем заполнение полей
    if (!ipAddress) {
      setErrors(prev => ({ ...prev, ipAddress: 'IP-адрес не может быть пустым' }));
      return;
    }
    
    const portNumber = parseInt(port, 10);
    if (isNaN(portNumber) || portNumber <= 0 || portNumber > 65535) {
      setErrors(prev => ({ ...prev, port: 'Порт должен быть числом от 1 до 65535' }));
      return;
    }
    
    // Устанавливаем статус "проверка соединения"
    setConnectionStatus('checking');
    
    try {
      // Проверяем соединение через API Electron
      const result = await window.electronAPI.checkPrinterConnection(ipAddress, portNumber);
      
      // Обновляем статус соединения
      if (result.status === 'online') {
        setConnectionStatus('success');
        setConnectionMessage('Соединение с принтером установлено успешно');
      } else {
        setConnectionStatus('error');
        setConnectionMessage(`Не удалось подключиться к принтеру: ${result.message}`);
      }
    } catch (err: any) {
      setConnectionStatus('error');
      setConnectionMessage(`Ошибка при проверке соединения: ${err.message}`);
    }
  };

  /**
   * Обработчик сохранения нового принтера
   */
  const handleSave = async () => {
    // Проверяем заполнение всех полей
    let hasError = false;
    const newErrors = {
      name: '',
      ipAddress: '',
      port: '',
    };
    
    if (!name) {
      newErrors.name = 'Название принтера не может быть пустым';
      hasError = true;
    }
    
    if (!ipAddress) {
      newErrors.ipAddress = 'IP-адрес не может быть пустым';
      hasError = true;
    }
    
    const portNumber = parseInt(port, 10);
    if (isNaN(portNumber) || portNumber <= 0 || portNumber > 65535) {
      newErrors.port = 'Порт должен быть числом от 1 до 65535';
      hasError = true;
    }
    
    // Если есть ошибки в полях, обновляем состояние и прерываем сохранение
    if (hasError) {
      setErrors(newErrors);
      return;
    }
    
    // Устанавливаем индикатор сохранения
    setIsSaving(true);
    
    try {
      // Создаем объект нового принтера
      const newPrinter = {
        id: uuidv4(),
        name,
        ipAddress,
        port: portNumber,
        isOnline: connectionStatus === 'success',
        lastChecked: connectionStatus !== 'unchecked' ? new Date().toISOString() : undefined,
      };
      
      // Сохраняем принтер через API Electron
      await window.electronAPI.savePrinter(newPrinter);
      
      // Переходим на страницу настроек принтеров
      navigate('/printers');
    } catch (err: any) {
      console.error('Ошибка при сохранении принтера:', err);
      // Можно здесь показать уведомление об ошибке
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/printers')}
          sx={{ mr: 2 }}
        >
          Назад
        </Button>
        
        <Typography variant="h4">
          Добавление принтера
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Поле для названия принтера */}
          <Grid item xs={12}>
            <TextField
              label="Название принтера"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              disabled={isSaving}
            />
          </Grid>
          
          {/* Поле для IP-адреса */}
          <Grid item xs={12} sm={8}>
            <TextField
              label="IP-адрес принтера"
              fullWidth
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              error={!!errors.ipAddress}
              helperText={errors.ipAddress}
              disabled={isSaving || connectionStatus === 'checking'}
              placeholder="192.168.0.100"
            />
          </Grid>
          
          {/* Поле для порта */}
          <Grid item xs={12} sm={4}>
            <TextField
              label="Порт"
              fullWidth
              value={port}
              onChange={(e) => setPort(e.target.value)}
              error={!!errors.port}
              helperText={errors.port || "Обычно 9100 (RAW)"}
              disabled={isSaving || connectionStatus === 'checking'}
              type="number"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    TCP
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          {/* Кнопка проверки соединения */}
          <Grid item xs={12}>
            <Button
              variant="outlined"
              onClick={handleCheckConnection}
              disabled={isSaving || connectionStatus === 'checking' || !ipAddress}
              startIcon={connectionStatus === 'checking' ? <CircularProgress size={16} /> : null}
            >
              Проверить соединение
            </Button>
          </Grid>
          
          {/* Отображение результата проверки соединения */}
          {connectionStatus !== 'unchecked' && (
            <Grid item xs={12}>
              <Alert 
                severity={connectionStatus === 'success' ? 'success' : 'error'}
                icon={connectionStatus === 'success' ? <Check /> : <Close />}
              >
                {connectionMessage}
              </Alert>
            </Grid>
          )}
          
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            {/* Кнопка отмены */}
            <Button
              variant="outlined"
              onClick={() => navigate('/printers')}
              disabled={isSaving}
              sx={{ mr: 1 }}
            >
              Отмена
            </Button>
            
            {/* Кнопка сохранения */}
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={isSaving}
              startIcon={isSaving ? <CircularProgress size={16} /> : null}
            >
              {isSaving ? 'Сохранение...' : 'Сохранить принтер'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default NewPrinter;