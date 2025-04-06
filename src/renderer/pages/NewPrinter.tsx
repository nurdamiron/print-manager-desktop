import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Container,
  Card,
  CardContent,
  CardActions,
  TextField,
  Checkbox,
  FormControlLabel,
  Fade,
  Avatar,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  ArrowBack,
  Search as SearchIcon,
  Usb as UsbIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { Printer } from '../components/PrinterCard';

/**
 * Компонент NewPrinter - страница добавления нового USB-принтера
 * Позволяет обнаружить и добавить USB-принтеры в систему
 */
const NewPrinter: React.FC = () => {
  const navigate = useNavigate();
  
  // Состояние для хранения списка обнаруженных USB-принтеров
  const [discoveredPrinters, setDiscoveredPrinters] = useState<any[]>([]);
  
  // Состояние для хранения выбранных принтеров для добавления
  const [selectedPrinters, setSelectedPrinters] = useState<string[]>([]);
  
  // Состояние для отслеживания процесса обнаружения
  const [discovering, setDiscovering] = useState(false);
  
  // Состояние для отслеживания процесса сохранения
  const [saving, setSaving] = useState(false);
  
  // Состояние для хранения настраиваемых имен принтеров
  const [printerNames, setPrinterNames] = useState<Record<string, string>>({});
  
  // Состояние для отслеживания принтера по умолчанию
  const [defaultPrinterId, setDefaultPrinterId] = useState<string | null>(null);
  
  // Состояние для хранения ошибок
  const [error, setError] = useState<string | null>(null);
  
  // Состояние для отслеживания шага мастера добавления
  const [activeStep, setActiveStep] = useState(0);

  /**
   * Обнаружение USB-принтеров
   * Вызывает API Electron для поиска подключенных USB-принтеров
   */
  const discoverPrinters = async () => {
    try {
      setDiscovering(true);
      setError(null);
      
      // Получаем список сохраненных принтеров для исключения уже добавленных
      const savedPrinters = await window.electronAPI.getPrinters();
      
      // Получаем список USB-принтеров
      const usbPrinters = await window.electronAPI.getUsbPrinters();
      
      // Фильтруем, чтобы исключить уже добавленные принтеры
      const newPrinters = usbPrinters.filter(
        usbPrinter => !savedPrinters.some(p => p.id === usbPrinter.id)
      );
      
      // Обновляем список обнаруженных принтеров
      setDiscoveredPrinters(newPrinters);
      
      // Инициализируем имена принтеров
      const initialNames: Record<string, string> = {};
      newPrinters.forEach(printer => {
        initialNames[printer.id] = printer.name;
      });
      setPrinterNames(initialNames);
      
      // Если найден только один новый принтер, выбираем его автоматически
      if (newPrinters.length === 1) {
        setSelectedPrinters([newPrinters[0].id]);
        setDefaultPrinterId(newPrinters[0].id);
      }
      
      // Если обнаружены принтеры, переходим к следующему шагу
      if (newPrinters.length > 0) {
        setActiveStep(1);
      }
      
    } catch (err) {
      console.error('Ошибка обнаружения USB-принтеров:', err);
      setError('Не удалось обнаружить USB-принтеры. Проверьте подключение устройств.');
    } finally {
      setDiscovering(false);
    }
  };

  // Запускаем обнаружение принтеров при монтировании компонента
  useEffect(() => {
    discoverPrinters();
  }, []);

  /**
   * Обработчик выбора/отмены выбора принтера
   * @param printerId ID принтера для выбора/отмены
   */
  const handleTogglePrinter = (printerId: string) => {
    setSelectedPrinters(prevSelected => {
      // Если принтер уже выбран, удаляем его из списка
      if (prevSelected.includes(printerId)) {
        // Если это был принтер по умолчанию, сбрасываем выбор принтера по умолчанию
        if (defaultPrinterId === printerId) {
          setDefaultPrinterId(null);
        }
        return prevSelected.filter(id => id !== printerId);
      }
      // Иначе добавляем в список выбранных
      return [...prevSelected, printerId];
    });
  };

  /**
   * Обработчик изменения имени принтера
   * @param printerId ID принтера
   * @param name Новое имя принтера
   */
  const handleNameChange = (printerId: string, name: string) => {
    setPrinterNames(prev => ({
      ...prev,
      [printerId]: name
    }));
  };

  /**
   * Обработчик выбора принтера по умолчанию
   * @param printerId ID принтера для установки по умолчанию
   */
  const handleSetDefault = (printerId: string) => {
    // Можно установить по умолчанию только выбранный принтер
    if (selectedPrinters.includes(printerId)) {
      setDefaultPrinterId(printerId);
    }
  };

  /**
   * Сохранение выбранных принтеров
   */
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Проверяем, выбран ли хоть один принтер
      if (selectedPrinters.length === 0) {
        setError('Выберите хотя бы один принтер для добавления');
        return;
      }
      
      // Получаем выбранные принтеры из списка обнаруженных
      const printersToSave = selectedPrinters.map(id => {
        const printerInfo = discoveredPrinters.find(p => p.id === id);
        
        // Создаем объект принтера с настроенным именем и флагом по умолчанию
        const printer: Printer = {
          id: printerInfo.id,
          name: printerNames[id] || printerInfo.name,
          vendorId: printerInfo.vendorId,
          productId: printerInfo.productId,
          isConnected: true,
          lastUsed: undefined,
          isDefault: id === defaultPrinterId
        };
        
        return printer;
      });
      
      // Сохраняем принтеры в хранилище
      for (const printer of printersToSave) {
        await window.electronAPI.savePrinter(printer);
      }
      
      // Переходим на страницу управления принтерами
      navigate('/printers');
      
    } catch (err) {
      console.error('Ошибка при сохранении принтеров:', err);
      setError('Не удалось сохранить принтеры');
    } finally {
      setSaving(false);
    }
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

  // Определяем шаги мастера добавления принтеров
  const steps = [
    {
      label: 'Обнаружение USB-принтеров',
      description: 'Подключите USB-принтеры к компьютеру и дождитесь их обнаружения.',
      content: (
        <Box sx={{ py: 2 }}>
          {discovering ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CircularProgress />
              <Typography>
                Поиск USB-принтеров...
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              {discoveredPrinters.length === 0 ? (
                <>
                  <Alert severity="info" sx={{ width: '100%', mb: 2 }}>
                    USB-принтеры не обнаружены. Подключите принтеры и нажмите кнопку "Обновить".
                  </Alert>
                  <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={discoverPrinters}
                  >
                    Обновить
                  </Button>
                </>
              ) : (
                <>
                  <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
                    Обнаружено {discoveredPrinters.length} новых USB-принтеров.
                  </Alert>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<CheckIcon />}
                      onClick={handleNextStep}
                    >
                      Продолжить
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={discoverPrinters}
                    >
                      Обновить
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          )}
        </Box>
      )
    },
    {
      label: 'Выбор принтеров',
      description: 'Выберите принтеры, которые вы хотите добавить.',
      content: (
        <Box sx={{ py: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Выберите принтеры для добавления и при необходимости изменит их имена:
          </Typography>
          
          <Grid container spacing={2}>
            {discoveredPrinters.map(printer => (
              <Grid item xs={12} md={6} key={printer.id}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    borderColor: selectedPrinters.includes(printer.id) ? 'primary.main' : undefined,
                    bgcolor: selectedPrinters.includes(printer.id) ? 'primary.light' : undefined,
                    opacity: selectedPrinters.includes(printer.id) ? 1 : 0.7,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Checkbox 
                        checked={selectedPrinters.includes(printer.id)}
                        onChange={() => handleTogglePrinter(printer.id)}
                      />
                      <Box>
                        <Typography variant="h6">
                          {printer.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID: {printer.id}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {selectedPrinters.includes(printer.id) && (
                      <Fade in={selectedPrinters.includes(printer.id)}>
                        <Box sx={{ mt: 2 }}>
                          <TextField 
                            label="Имя принтера"
                            value={printerNames[printer.id] || ''}
                            onChange={(e) => handleNameChange(printer.id, e.target.value)}
                            fullWidth
                            margin="normal"
                          />
                          <FormControlLabel
                            control={
                              <Checkbox 
                                checked={defaultPrinterId === printer.id}
                                onChange={() => handleSetDefault(printer.id)}
                              />
                            }
                            label="Использовать по умолчанию"
                          />
                        </Box>
                      </Fade>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button onClick={handleBackStep}>
              Назад
            </Button>
            <Button 
              variant="contained" 
              startIcon={<CheckIcon />}
              onClick={handleNextStep}
              disabled={selectedPrinters.length === 0}
            >
              Продолжить
            </Button>
          </Box>
        </Box>
      )
    },
    {
      label: 'Завершение',
      description: 'Подтверждение добавления выбранных принтеров.',
      content: (
        <Box sx={{ py: 2 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Вы собираетесь добавить {selectedPrinters.length} принтер(ов).
            {defaultPrinterId && ' Один из них будет установлен принтером по умолчанию.'}
          </Alert>
          
          <Typography variant="h6" gutterBottom>
            Выбранные принтеры:
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            {selectedPrinters.map(id => {
              const printer = discoveredPrinters.find(p => p.id === id);
              return (
                <Paper key={id} sx={{ p: 2, mb: 1, display: 'flex', alignItems: 'center' }}>
                  <UsbIcon sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    {printerNames[id] || printer.name}
                  </Typography>
                  {id === defaultPrinterId && (
                    <Chip 
                      label="По умолчанию" 
                      size="small" 
                      color="primary"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Paper>
              );
            })}
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={handleBackStep}>
              Назад
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={saving ? <CircularProgress size={20} /> : <AddIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Сохранение...' : 'Добавить принтеры'}
            </Button>
          </Box>
        </Box>
      )
    }
  ];

  return (
    <Container maxWidth="md">
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/printers')}
          sx={{ mr: 2 }}
        >
          Назад
        </Button>
        
        <Typography variant="h4">
          Добавление USB-принтеров
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>
                <Typography variant="h6">{step.label}</Typography>
              </StepLabel>
              <StepContent>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  {step.description}
                </Typography>
                {step.content}
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Отображение ошибки (если есть) */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Container>
  );
};

export default NewPrinter;