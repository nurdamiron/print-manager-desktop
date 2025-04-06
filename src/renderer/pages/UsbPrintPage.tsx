import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Select, MenuItem,
  TextField, CircularProgress, Alert, Paper
} from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import { UsbPrinter } from '../../shared/types/usbPrinters';

// Остальной код компонента...

const UsbPrintPage: React.FC = () => {
  const [usbPrinters, setUsbPrinters] = useState<UsbPrinter[]>([]);
  const [selectedPrinterId, setSelectedPrinterId] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ path: string; name: string } | null>(null);
  const [copies, setCopies] = useState(1);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success'|'error'|'info'|null}>({
    text: '', type: null
  });

  // Загружаем USB-принтеры при монтировании
  useEffect(() => {
    const loadUsbPrinters = async () => {
      try {
        setLoading(true);
        // @ts-ignore - Для решения проблемы типизации
        const printers = await window.electronAPI.getUsbPrinters();
        setUsbPrinters(printers);
        
        if (printers.length > 0) {
          setSelectedPrinterId(printers[0].id);
        }
      } catch (error) {
        setMessage({
          text: 'Ошибка при получении списка USB-принтеров',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadUsbPrinters();
  }, []);

  // Обработчик выбора файла
  const handleFileSelect = async () => {
    try {
      // @ts-ignore
      const filePath = await window.electronAPI.selectFile();
      
      if (filePath) {
        const fileName = filePath.split(/[\\/]/).pop() || 'file';
        setSelectedFile({
          path: filePath,
          name: fileName
        });
      }
    } catch (error) {
      setMessage({
        text: 'Ошибка при выборе файла',
        type: 'error'
      });
    }
  };

  // Обработчик печати
  const handlePrint = async () => {
    if (!selectedFile || !selectedPrinterId) return;
    
    try {
      setPrinting(true);
      setMessage({
        text: 'Отправка документа на печать...',
        type: 'info'
      });
      
      // @ts-ignore
      const result = await window.electronAPI.printToUsb(
        selectedPrinterId, 
        selectedFile.path,
        copies
      );
      
      setMessage({
        text: result.success 
          ? 'Документ успешно отправлен на печать' 
          : `Ошибка печати: ${result.message}`,
        type: result.success ? 'success' : 'error'
      });
    } catch (error) {
      setMessage({
        text: `Ошибка при печати: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
        type: 'error'
      });
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Прямая печать на USB-принтер
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {usbPrinters.length === 0 ? (
              <Alert severity="warning">
                USB-принтеры не обнаружены. Подключите принтер к USB-порту.
              </Alert>
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Доступные USB-принтеры:
                </Typography>
                <Select
                  fullWidth
                  value={selectedPrinterId}
                  onChange={(e) => setSelectedPrinterId(e.target.value)}
                  sx={{ mb: 3 }}
                >
                  {usbPrinters.map((printer) => (
                    <MenuItem key={printer.id} value={printer.id}>
                      {printer.name}
                    </MenuItem>
                  ))}
                </Select>
                
                <Button 
                  variant="outlined" 
                  fullWidth 
                  onClick={handleFileSelect}
                  sx={{ mb: 3 }}
                >
                  {selectedFile ? `Выбранный файл: ${selectedFile.name}` : 'Выбрать файл для печати'}
                </Button>
                
                <TextField
                  label="Количество копий"
                  type="number"
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                  fullWidth
                  sx={{ mb: 3 }}
                  InputProps={{ inputProps: { min: 1, max: 100 } }}
                />
                
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={printing ? <CircularProgress size={20} color="inherit" /> : <PrintIcon />}
                  onClick={handlePrint}
                  disabled={printing || !selectedFile || !selectedPrinterId}
                >
                  Печать
                </Button>
              </Box>
            )}
          </>
        )}
      </Paper>
      
      {message.type && (
        <Alert severity={message.type}>{message.text}</Alert>
      )}
    </Box>
  );
};

export default UsbPrintPage;