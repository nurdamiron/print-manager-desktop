import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Container,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Tooltip,
  Fade,
  Avatar,
} from '@mui/material';
import {
  Print as PrintIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Description as DescriptionIcon,
  Error as ErrorIcon,
  Usb as UsbIcon,
  FileCopy as FileCopyIcon,
  InsertDriveFile as FileIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { Printer } from '../components/PrinterCard';

/**
 * Вспомогательная функция для получения параметров из строки запроса
 */
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

/**
 * Компонент PrintPage - страница печати документов
 * Позволяет выбрать файл и USB-принтер для печати
 */
const PrintPage: React.FC = () => {
  const navigate = useNavigate();
  const query = useQuery();
  
  // Получаем ID принтера из URL-параметров (если есть)
  const printerIdFromUrl = query.get('printer');
  
  // Состояния для выбора принтера и файла
  const [selectedPrinterId, setSelectedPrinterId] = useState(printerIdFromUrl || '');
  const [selectedFile, setSelectedFile] = useState<{ path: string; name: string; size?: number } | null>(null);
  
  // Состояния для настроек печати
  const [copies, setCopies] = useState(1);
  const [autoPreview, setAutoPreview] = useState(true);
  
  // Состояние для списка принтеров
  const [printers, setPrinters] = useState<Printer[]>([]);
  
  // Состояния для обработки ошибок и загрузки
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Состояния для диалогов и печати
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [printingStatus, setPrintingStatus] = useState<{
    isPrinting: boolean;
    progress: number;
    success: boolean | null;
    message: string;
  }>({
    isPrinting: false,
    progress: 0,
    success: null,
    message: '',
  });

  /**
   * Загружает список принтеров при монтировании компонента
   */
  useEffect(() => {
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
        
        // Сортируем принтеры: сначала принтер по умолчанию, затем подключенные
        const sortedPrinters = updatedPrinters.sort((a, b) => {
          // Сначала принтер по умолчанию
          if (a.isDefault && !b.isDefault) return -1;
          if (!a.isDefault && b.isDefault) return 1;
          
          // Затем подключенные
          if (a.isConnected && !b.isConnected) return -1;
          if (!a.isConnected && b.isConnected) return 1;
          
          // По алфавиту
          return a.name.localeCompare(b.name);
        });
        
        setPrinters(sortedPrinters);
        
        // Если принтер передан в URL, но его нет в списке, сбрасываем выбор
        if (printerIdFromUrl && !updatedPrinters.some((p) => p.id === printerIdFromUrl)) {
          setSelectedPrinterId('');
        }
        
        // Если принтер не выбран, но есть принтер по умолчанию, выбираем его
        if (!selectedPrinterId) {
          const defaultPrinter = updatedPrinters.find(p => p.isDefault);
          if (defaultPrinter) {
            setSelectedPrinterId(defaultPrinter.id);
          }
        }
      } catch (err) {
        console.error('Ошибка загрузки принтеров:', err);
        setError('Не удалось загрузить список USB-принтеров');
      } finally {
        setLoading(false);
      }
    };

    loadPrinters();
  }, [printerIdFromUrl, selectedPrinterId]);

  /**
   * Обработчик выбора файла для печати
   */
  const handleFileSelect = async () => {
    try {
      const filePath = await window.electronAPI.selectFile();
      
      if (filePath) {
        // Получаем имя файла из полного пути
        const fileName = filePath.split(/[\\/]/).pop() || 'file';
        
        // Имитация получения размера файла (в реальном приложении можно получить через fs)
        const fileSize = Math.random() * 10000000; // Случайный размер до 10 МБ
        
        setSelectedFile({
          path: filePath,
          name: fileName,
          size: fileSize,
        });
        
        // Открываем предварительный просмотр, если включен автопросмотр
        if (autoPreview) {
          // Здесь можно добавить вызов предварительного просмотра
          // в реальном приложении
        }
        
        // Переходим к следующему шагу мастера
        setActiveStep(1);
      }
    } catch (err) {
      console.error('Ошибка при выборе файла:', err);
      setError('Не удалось выбрать файл');
    }
  };

  /**
   * Обработчик очистки выбранного файла
   */
  const handleClearFile = () => {
    setSelectedFile(null);
    // Возвращаемся к первому шагу мастера
    setActiveStep(0);
  };

  /**
   * Обработчик открытия диалога подтверждения печати
   */
  const handleOpenPrintDialog = () => {
    setPrintDialogOpen(true);
  };

  /**
   * Обработчик закрытия диалога подтверждения печати
   */
  const handleClosePrintDialog = () => {
    setPrintDialogOpen(false);
  };

  /**
   * Имитация прогресса печати
   * @param duration Продолжительность имитации в миллисекундах
   */
  const simulatePrintingProgress = (duration: number = 3000) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      
      setPrintingStatus(prev => ({
        ...prev,
        progress,
      }));
      
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 100);
    
    return interval;
  };

  /**
   * Обработчик отправки файла на печать
   */
  const handlePrint = async () => {
    if (!selectedFile || !selectedPrinterId) {
      return;
    }
    
    // Находим выбранный принтер
    const printer = printers.find(p => p.id === selectedPrinterId);
    if (!printer) {
      setError('Принтер не найден');
      return;
    }
    
    // Закрываем диалог подтверждения
    setPrintDialogOpen(false);
    
    // Устанавливаем статус печати
    setPrintingStatus({
      isPrinting: true,
      progress: 0,
      success: null,
      message: 'Подготовка к печати...',
    });
    
    // Имитируем прогресс печати
    const progressInterval = simulatePrintingProgress();
    
    try {
      // Обновляем сообщение
      setPrintingStatus(prev => ({
        ...prev,
        message: 'Отправка документа на печать...',
      }));
      
      // Отправляем файл на USB-принтер через API Electron
      const result = await window.electronAPI.printToUsb(
        selectedPrinterId,
        selectedFile.path,
        copies
      );
      
      // Останавливаем имитацию прогресса
      clearInterval(progressInterval);
      
      // Обновляем статус печати
      setPrintingStatus({
        isPrinting: false,
        progress: 100,
        success: result.success,
        message: result.success 
          ? 'Документ успешно отправлен на печать' 
          : `Ошибка при печати: ${result.message}`,
      });
      
      // Если печать успешна, обновляем время последнего использования принтера
      if (result.success) {
        const updatedPrinter = {
          ...printer,
          lastUsed: new Date().toISOString(),
        };
        
        await window.electronAPI.savePrinter(updatedPrinter);
      }
      
    } catch (err: any) {
      // Останавливаем имитацию прогресса
      clearInterval(progressInterval);
      
      console.error('Ошибка печати:', err);
      
      // Обновляем статус печати с ошибкой
      setPrintingStatus({
        isPrinting: false,
        progress: 0,
        success: false,
        message: `Ошибка при печати: ${err.message || 'Неизвестная ошибка'}`,
      });
    }
  };

  /**
   * Обработчик закрытия уведомления о статусе печати
   */
  const handleCloseStatus = () => {
    setPrintingStatus({
      isPrinting: false,
      progress: 0,
      success: null,
      message: '',
    });
    
    // Если печать была успешной, очищаем выбранный файл
    if (printingStatus.success) {
      setSelectedFile(null);
      setActiveStep(0);
    }
  };

  /**
   * Получает выбранный принтер из списка
   */
  const getSelectedPrinter = () => {
    return printers.find(p => p.id === selectedPrinterId);
  };

  /**
   * Проверяет, готова ли форма для печати
   */
  const isPrintReady = () => {
    return selectedFile !== null && selectedPrinterId !== '' && copies > 0;
  };

  /**
   * Переход к следующему шагу мастера
   */
  const handleNextStep = () => {
    setActiveStep(prevStep => prevStep + 1);
  };

  /**
   * Переход к предыдущему шагу мастера
   */
  const handleBackStep = () => {
    setActiveStep(prevStep => prevStep - 1);
  };

  /**
   * Форматирует размер файла в человекочитаемом виде
   * @param bytes Размер в байтах
   */
  const formatFileSize = (bytes?: number): string => {
    if (bytes === undefined) return '';
    
    const units = ['Б', 'КБ', 'МБ', 'ГБ'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  // Определяем шаги мастера печати
  const steps = [
    {
      label: 'Выбор файла',
      content: (
        <Box sx={{ py: 2 }}>
          <Typography variant="body1" gutterBottom>
            Выберите файл, который хотите распечатать:
          </Typography>
          
          {selectedFile ? (
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <FileIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {selectedFile.name}
                      </Typography>
                      {selectedFile.size && (
                        <Typography variant="body2" color="text.secondary">
                          {formatFileSize(selectedFile.size)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box>
                    <Tooltip title="Выбрать другой файл">
                      <IconButton onClick={handleFileSelect} color="primary">
                        <UploadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Удалить файл">
                      <IconButton onClick={handleClearFile} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={handleFileSelect}
              fullWidth
              sx={{ py: 2, mb: 2 }}
              disabled={loading}
            >
              Выбрать файл для печати
            </Button>
          )}
          
          {selectedFile && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                onClick={handleNextStep}
                endIcon={<CheckIcon />}
              >
                Продолжить
              </Button>
            </Box>
          )}
        </Box>
      )
    },
    {
      label: 'Выбор принтера',
      content: (
        <Box sx={{ py: 2 }}>
          <Typography variant="body1" gutterBottom>
            Выберите USB-принтер для печати:
          </Typography>
          
          <FormControl 
            fullWidth 
            error={!selectedPrinterId && !loading}
            sx={{ mb: 2 }}
          >
            <InputLabel id="printer-select-label">Выберите принтер</InputLabel>
            <Select
              labelId="printer-select-label"
              value={selectedPrinterId}
              onChange={(e) => setSelectedPrinterId(e.target.value)}
              label="Выберите принтер"
              disabled={loading || printers.length === 0}
            >
              {printers.map((printer) => (
                <MenuItem 
                  key={printer.id} 
                  value={printer.id}
                  disabled={!printer.isConnected}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <UsbIcon sx={{ mr: 1, color: printer.isConnected ? 'success.main' : 'error.main' }} />
                    <Typography>
                      {printer.name}
                    </Typography>
                  </Box>
                  <Box>
                    {printer.isDefault && (
                      <Chip 
                        label="По умолчанию" 
                        size="small" 
                        color="primary"
                        sx={{ ml: 1 }}
                      />
                    )}
                    {!printer.isConnected && (
                      <Chip 
                        label="Не подключен" 
                        size="small" 
                        color="error"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {!loading && printers.length === 0 && (
              <FormHelperText error>
                Нет доступных принтеров. Пожалуйста, добавьте принтер в настройках.
              </FormHelperText>
            )}
          </FormControl>
          
          <Box sx={{ my: 2 }}>
            <Typography variant="body1" gutterBottom>
              Настройки печати:
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Количество копий"
                  type="number"
                  fullWidth
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                  InputProps={{ inputProps: { min: 1, max: 100 } }}
                />
              </Grid>
            </Grid>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button onClick={handleBackStep}>
              Назад
            </Button>
            <Button 
              variant="contained" 
              onClick={handleNextStep}
              disabled={!selectedPrinterId || !getSelectedPrinter()?.isConnected}
              endIcon={<CheckIcon />}
            >
              Продолжить
            </Button>
          </Box>
        </Box>
      )
    },
    {
      label: 'Предварительный просмотр',
      content: (
        <Box sx={{ py: 2 }}>
          <Typography variant="body1" gutterBottom>
            Предварительный просмотр и печать:
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  flexDirection: 'column',
                  height: '100%'
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Документ
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <DescriptionIcon sx={{ mr: 1 }} />
                  <Typography>
                    {selectedFile?.name}
                  </Typography>
                </Box>
                {selectedFile?.size && (
                  <Typography variant="body2" color="text.secondary">
                    Размер: {formatFileSize(selectedFile.size)}
                  </Typography>
                )}
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  flexDirection: 'column',
                  height: '100%'
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Принтер
                </Typography>
                {getSelectedPrinter() && (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <UsbIcon sx={{ mr: 1 }} />
                      <Typography>
                        {getSelectedPrinter()?.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Копий: {copies}
                    </Typography>
                  </>
                )}
              </Paper>
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={handleBackStep}>
              Назад
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<PrintIcon />}
              onClick={handleOpenPrintDialog}
              disabled={!isPrintReady()}
            >
              Печать
            </Button>
          </Box>
        </Box>
      )
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Box>
        {/* Заголовок */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography 
            variant="h3" 
            gutterBottom
            sx={{ 
              fontWeight: 700,
              color: 'white',
              textShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
              mb: 2,
            }}
          >
            Печать документа 🖨️
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: 400,
              maxWidth: 600,
              mx: 'auto',
            }}
          >
            Следуйте простым шагам для печати ваших документов на USB-принтере
          </Typography>
        </Box>

        {/* Основной контент */}
        <Box sx={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 4,
          p: 4,
          mb: 3,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0px 20px 40px rgba(0, 0, 0, 0.1)',
        }}>
          {/* Индикатор загрузки */}
          {loading ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              py: 8,
            }}>
              <CircularProgress size={48} sx={{ mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Загрузка принтеров...
              </Typography>
            </Box>
          ) : (
            <Box sx={{ position: 'relative' }}>
              {/* Прогресс-бар */}
              <Box sx={{ mb: 4 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={(activeStep / (steps.length - 1)) * 100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    },
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  {steps.map((step, index) => (
                    <Typography 
                      key={index}
                      variant="caption" 
                      color={index <= activeStep ? 'primary' : 'text.secondary'}
                      fontWeight={index <= activeStep ? 600 : 400}
                    >
                      {step.label}
                    </Typography>
                  ))}
                </Box>
              </Box>

              {/* Степпер */}
              <Stepper 
                activeStep={activeStep} 
                orientation="vertical"
                sx={{
                  '& .MuiStepLabel-root': {
                    py: 2,
                  },
                  '& .MuiStepIcon-root': {
                    fontSize: '2rem',
                    '&.Mui-active': {
                      color: 'primary.main',
                    },
                    '&.Mui-completed': {
                      color: 'success.main',
                    },
                  },
                  '& .MuiStepContent-root': {
                    borderLeft: 'none',
                    ml: 4,
                    pl: 3,
                  },
                }}
              >
                {steps.map((step, index) => (
                  <Step key={index}>
                    <StepLabel>
                      <Typography variant="h5" fontWeight={600}>
                        {step.label}
                      </Typography>
                    </StepLabel>
                    <StepContent>
                      <Box sx={{ 
                        background: 'rgba(102, 126, 234, 0.02)',
                        borderRadius: 3,
                        p: 3,
                        border: '1px solid rgba(102, 126, 234, 0.1)',
                      }}>
                        {step.content}
                      </Box>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </Box>
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

        {/* Отображение статуса печати */}
        {printingStatus.message && (
          <Fade in>
            <Box sx={{ 
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: 4,
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.1)',
            }}>
              <Alert 
                severity={
                  printingStatus.isPrinting 
                    ? 'info' 
                    : (printingStatus.success ? 'success' : 'error')
                }
                icon={
                  printingStatus.isPrinting 
                    ? <CircularProgress size={20} /> 
                    : undefined
                }
                action={
                  !printingStatus.isPrinting && (
                    <Button 
                      color="inherit" 
                      size="large"
                      onClick={handleCloseStatus}
                      sx={{ 
                        borderRadius: 2,
                        fontWeight: 600,
                      }}
                    >
                      {printingStatus.success ? 'Готово ✓' : 'Закрыть'}
                    </Button>
                  )
                }
                sx={{
                  fontSize: '1rem',
                  alignItems: 'center',
                  '& .MuiAlert-message': {
                    fontSize: '1rem',
                    fontWeight: 500,
                  },
                }}
              >
                {printingStatus.message}
              </Alert>
              
              {printingStatus.isPrinting && (
                <LinearProgress 
                  variant="determinate" 
                  value={printingStatus.progress} 
                  sx={{ 
                    height: 12,
                    background: 'rgba(102, 126, 234, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    },
                  }}
                />
              )}
            </Box>
          </Fade>
        )}

        {/* Диалог подтверждения печати */}
        <Dialog
          open={printDialogOpen}
          onClose={handleClosePrintDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
            }
          }}
        >
          <DialogTitle sx={{ 
            textAlign: 'center',
            pt: 4,
            pb: 2,
          }}>
            <Box sx={{ 
              width: 80, 
              height: 80, 
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              boxShadow: '0px 8px 32px rgba(102, 126, 234, 0.3)',
            }}>
              <PrintIcon sx={{ fontSize: 36, color: 'white' }} />
            </Box>
            <Typography variant="h5" fontWeight={600}>
              Подтверждение печати
            </Typography>
          </DialogTitle>
          
          <DialogContent sx={{ px: 4, pb: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
                Вы собираетесь отправить файл на печать
              </Typography>
              
              <Box sx={{ 
                background: 'rgba(102, 126, 234, 0.05)',
                borderRadius: 3,
                p: 3,
                mb: 2,
                border: '1px solid rgba(102, 126, 234, 0.1)',
              }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <FileIcon color="primary" />
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {selectedFile?.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedFile?.size && formatFileSize(selectedFile.size)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <UsbIcon color="primary" />
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {getSelectedPrinter()?.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {copies} {copies === 1 ? 'копия' : 'копий'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
              
              <Typography variant="body2" color="text.secondary">
                Убедитесь, что принтер подключен и готов к работе
              </Typography>
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ px: 4, pb: 4, gap: 2 }}>
            <Button 
              onClick={handleClosePrintDialog} 
              variant="outlined"
              size="large"
              sx={{ 
                flex: 1,
                py: 1.5,
                borderRadius: 3,
                borderWidth: 2,
                '&:hover': { borderWidth: 2 }
              }}
            >
              Отмена
            </Button>
            <Button 
              onClick={handlePrint} 
              variant="contained" 
              size="large"
              startIcon={<PrintIcon />}
              sx={{ 
                flex: 1,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 600,
              }}
            >
              Печатать
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default PrintPage;