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
} from '@mui/material';
import {
  Print as PrintIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
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
 * Позволяет выбрать файл и принтер для печати
 */
const PrintPage: React.FC = () => {
  const navigate = useNavigate();
  const query = useQuery();
  
  // Получаем ID принтера из URL-параметров (если есть)
  const printerIdFromUrl = query.get('printer');
  
  // Состояния для выбора принтера и файла
  const [selectedPrinterId, setSelectedPrinterId] = useState(printerIdFromUrl || '');
  const [selectedFile, setSelectedFile] = useState<{ path: string; name: string } | null>(null);
  
  // Состояния для настроек печати
  const [copies, setCopies] = useState(1);
  
  // Состояние для списка принтеров
  const [printers, setPrinters] = useState<Printer[]>([]);
  
  // Состояния для обработки ошибок и загрузки
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Состояния для диалогов
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printingStatus, setPrintingStatus] = useState<{
    isPrinting: boolean;
    success: boolean | null;
    message: string;
  }>({
    isPrinting: false,
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
        
        // Используем API из preload для получения списка сетевых принтеров
        const networkPrinterList = await window.electronAPI.getPrinters();
        
        // Получаем список USB-принтеров
        const usbPrinterList = await window.electronAPI.getUsbPrinters();
        
        // Объединяем списки принтеров
        const allPrinters = [
          ...networkPrinterList,
          ...usbPrinterList
        ];
        
        setPrinters([...networkPrinterList, ...usbPrinterList]);
        
        // Если принтер передан в URL, но его нет в списке, сбрасываем выбор
        if (printerIdFromUrl && !allPrinters.some((p) => p.id === printerIdFromUrl)) {
          setSelectedPrinterId('');
        }
      } catch (err) {
        console.error('Ошибка загрузки принтеров:', err);
        setError('Не удалось загрузить список принтеров');
      } finally {
        setLoading(false);
      }
    };

    loadPrinters();
  }, [printerIdFromUrl]);

  /**
   * Обработчик выбора файла для печати
   */
  const handleFileSelect = async () => {
    try {
      const filePath = await window.electronAPI.selectFile();
      
      if (filePath) {
        // Получаем имя файла из полного пути
        const fileName = filePath.split(/[\\/]/).pop() || 'file';
        
        setSelectedFile({
          path: filePath,
          name: fileName,
        });
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
      success: null,
      message: 'Отправка документа на печать...',
    });
    
    try {
      let result; // Объявляем переменную до использования
      
      // Проверяем, является ли принтер USB-принтером
      if (printer.isUsb) {
        // Отправляем на USB-принтер
        result = await window.electronAPI.printToUsb(
          selectedPrinterId,
          selectedFile.path,
          copies
        );
      } else {
        // Отправляем на сетевой принтер
        result = await window.electronAPI.sendToPrinter(
          selectedFile.path,
          printer.ipAddress ?? '', // добавляем проверку на undefined
          printer.port ?? 0 // добавляем проверку на undefined
        );
      }
      
      // Обновляем статус печати
      setPrintingStatus({
        isPrinting: false,
        success: true,
        message: 'Документ успешно отправлен на печать',
      });
      
      // Сбрасываем выбранный файл после успешной печати
      setSelectedFile(null);
    } catch (err: any) { // Указываем тип для ошибки
      console.error('Ошибка печати:', err);
      
      // Обновляем статус печати с ошибкой
      setPrintingStatus({
        isPrinting: false,
        success: false,
        message: `Ошибка при печати: ${err.message}`,
      });
    }
  };

  /**
   * Обработчик закрытия уведомления о статусе печати
   */
  const handleCloseStatus = () => {
    setPrintingStatus({
      isPrinting: false,
      success: null,
      message: '',
    });
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Печать документа
      </Typography>

      <Divider sx={{ mb: 3 }} />

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          {/* Выбор принтера */}
          <Grid item xs={12}>
            <FormControl fullWidth error={!selectedPrinterId && !loading}>
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
  >
    {printer.isUsb 
      ? `${printer.name} (USB)` 
      : `${printer.name} ${printer.isOnline === false ? '(Не в сети)' : ''}`
    }
  </MenuItem>
))}
              </Select>
              {!loading && printers.length === 0 && (
                <FormHelperText error>
                  Нет доступных принтеров. Пожалуйста, добавьте принтер в настройках.
                </FormHelperText>
              )}
            </FormControl>
          </Grid>
          
          {/* Выбор файла */}
          <Grid item xs={12}>
            {selectedFile ? (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1">
                      {selectedFile.name}
                    </Typography>
                  </Box>
                  <IconButton onClick={handleClearFile} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Paper>
            ) : (
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={handleFileSelect}
                fullWidth
                sx={{ py: 1.5 }}
                disabled={loading}
              >
                Выбрать файл для печати
              </Button>
            )}
          </Grid>
          
          {/* Настройки печати */}
          {selectedFile && (
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
          )}
          
          {/* Кнопка печати */}
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PrintIcon />}
              onClick={handleOpenPrintDialog}
              disabled={!isPrintReady() || printingStatus.isPrinting}
              fullWidth
              size="large"
              sx={{ py: 1.5 }}
            >
              Печать
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Отображение ошибки (если есть) */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Отображение статуса печати */}
      {printingStatus.message && (
        <Alert 
          severity={printingStatus.isPrinting ? 'info' : (printingStatus.success ? 'success' : 'error')}
          action={
            !printingStatus.isPrinting && (
              <Button color="inherit" size="small" onClick={handleCloseStatus}>
                ОК
              </Button>
            )
          }
          icon={printingStatus.isPrinting ? <CircularProgress size={20} /> : undefined}
          sx={{ mt: 2 }}
        >
          {printingStatus.message}
        </Alert>
      )}

      {/* Диалог подтверждения печати */}
      <Dialog
        open={printDialogOpen}
        onClose={handleClosePrintDialog}
      >
        <DialogTitle>Подтверждение печати</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы собираетесь отправить файл "{selectedFile?.name}" на принтер "{getSelectedPrinter()?.name}" в количестве {copies} копий.
            Продолжить?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePrintDialog} color="inherit">
            Отмена
          </Button>
          <Button onClick={handlePrint} color="primary" variant="contained" startIcon={<CheckIcon />}>
            Печатать
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PrintPage;