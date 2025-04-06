import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { Print, Delete, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';

/**
 * Интерфейс для типа принтера
 */
export interface Printer {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  isOnline?: boolean;
  lastChecked?: string;
}

/**
 * Интерфейс для props компонента PrinterCard
 */
interface PrinterCardProps {
  printer: Printer;
  onDelete: (id: string) => void;
  onCheck: (printer: Printer) => Promise<void>;
  onSelect: (printer: Printer) => void;
}

/**
 * Компонент PrinterCard - отображает информацию о принтере в виде карточки
 * @param printer Объект с данными о принтере
 * @param onDelete Функция-обработчик удаления принтера
 * @param onCheck Функция-обработчик проверки соединения с принтером
 * @param onSelect Функция-обработчик выбора принтера для печати
 */
const PrinterCard: React.FC<PrinterCardProps> = ({
  printer,
  onDelete,
  onCheck,
  onSelect,
}) => {
  // Состояние для индикатора загрузки при проверке соединения
  const [isChecking, setIsChecking] = useState(false);
  
  // Состояние для диалога подтверждения удаления
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  /**
   * Обработчик проверки соединения с принтером
   */
  const handleCheck = async () => {
    setIsChecking(true);
    try {
      await onCheck(printer);
    } catch (error) {
      console.error('Ошибка при проверке принтера:', error);
    } finally {
      setIsChecking(false);
    }
  };

  /**
   * Обработчик открытия диалога подтверждения удаления
   */
  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  /**
   * Обработчик закрытия диалога подтверждения удаления
   */
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  /**
   * Обработчик подтверждения удаления принтера
   */
  const handleConfirmDelete = () => {
    onDelete(printer.id);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          {/* Название принтера */}
          <Typography variant="h6" component="div" gutterBottom>
            {printer.name}
          </Typography>
          
          {/* Информация о подключении */}
          <Typography variant="body2" color="text.secondary" gutterBottom>
            IP: {printer.ipAddress}, Порт: {printer.port}
          </Typography>
          
          {/* Статус подключения */}
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
            {printer.isOnline === undefined ? (
              <Chip 
                label="Статус неизвестен" 
                variant="outlined" 
                size="small" 
                color="default" 
              />
            ) : printer.isOnline ? (
              <Chip 
                icon={<CheckCircle />} 
                label="В сети" 
                variant="outlined" 
                size="small" 
                color="success" 
              />
            ) : (
              <Chip 
                icon={<ErrorIcon />} 
                label="Не в сети" 
                variant="outlined" 
                size="small" 
                color="error" 
              />
            )}
            
            {/* Время последней проверки */}
            {printer.lastChecked && (
              <Typography variant="caption" sx={{ ml: 1 }}>
                Проверено: {new Date(printer.lastChecked).toLocaleString()}
              </Typography>
            )}
          </Box>
        </CardContent>
        
        <CardActions>
          {/* Кнопка выбора принтера для печати */}
          <Button 
            size="small" 
            startIcon={<Print />} 
            onClick={() => onSelect(printer)}
            disabled={printer.isOnline === false}
          >
            Печать
          </Button>
          
          {/* Кнопка проверки соединения */}
          <Button 
            size="small" 
            onClick={handleCheck}
            disabled={isChecking}
          >
            {isChecking ? (
              <CircularProgress size={16} sx={{ mr: 1 }} />
            ) : null}
            Проверить
          </Button>
          
          {/* Кнопка удаления */}
          <Button 
            size="small" 
            color="error" 
            startIcon={<Delete />} 
            onClick={handleOpenDeleteDialog}
          >
            Удалить
          </Button>
        </CardActions>
      </Card>

      {/* Диалог подтверждения удаления */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Удаление принтера
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Вы уверены, что хотите удалить принтер "{printer.name}"?
            Это действие нельзя будет отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Отмена</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PrinterCard;