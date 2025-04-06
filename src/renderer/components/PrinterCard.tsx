import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Avatar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip,
  Fade,
} from '@mui/material';
import { 
  Print, 
  Delete, 
  Usb as UsbIcon,
  Error as ErrorIcon,
  Info as InfoIcon 
} from '@mui/icons-material';

/**
 * Интерфейс для типа принтера
 * Включает свойства как для USB, так и для сетевых принтеров
 * для сохранения совместимости с существующим кодом
 */
export interface Printer {
  id: string;           // Уникальный идентификатор принтера
  name: string;         // Название принтера
  vendorId?: string;    // ID производителя устройства (для USB)
  productId?: string;   // ID продукта (для USB)
  isConnected?: boolean; // Состояние подключения принтера
  lastUsed?: string;    // Время последнего использования
  isDefault?: boolean;   // Является ли принтером по умолчанию
  isUsb?: boolean;      // Флаг для определения типа принтера
  
  // Поля для обратной совместимости
  ipAddress?: string;   // IP-адрес для сетевых принтеров (для обратной совместимости)
  port?: number;        // Порт для сетевых принтеров (для обратной совместимости)
  isOnline?: boolean;   // Онлайн-статус для сетевых принтеров (для обратной совместимости)
  lastChecked?: string; // Время последней проверки (для обратной совместимости)
}

/**
 * Интерфейс для props компонента PrinterCard
 */
interface PrinterCardProps {
  printer: Printer;                             // Объект с данными о принтере
  onDelete: (id: string) => void;               // Функция для удаления принтера
  onSelect: (printer: Printer) => void;         // Функция для выбора принтера для печати
  onSetDefault?: (id: string) => void;          // Функция для установки принтера по умолчанию
  onCheck?: (printer: Printer) => Promise<void>; // Функция для проверки подключения (для обратной совместимости)
}

/**
 * Компонент PrinterCard - отображает информацию об USB-принтере в виде карточки
 * 
 * @param printer Объект с данными о принтере
 * @param onDelete Функция-обработчик удаления принтера
 * @param onSelect Функция-обработчик выбора принтера для печати
 * @param onSetDefault Функция для установки принтера по умолчанию (опционально)
 * @param onCheck Функция для проверки соединения (для обратной совместимости)
 */
const PrinterCard: React.FC<PrinterCardProps> = ({
  printer,
  onDelete,
  onSelect,
  onSetDefault,
  onCheck,
}) => {
  // Состояние для диалога подтверждения удаления
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Определяем, подключен ли принтер
  const isConnected = printer.isUsb ? printer.isConnected : printer.isOnline;
  
  // Формируем дополнительную информацию для отображения
  const vendorInfo = printer.vendorId ? `ID производителя: ${printer.vendorId}` : '';
  const productInfo = printer.productId ? `ID продукта: ${printer.productId}` : '';
  const deviceInfo = [vendorInfo, productInfo].filter(Boolean).join(', ');

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

  /**
   * Обработчик установки принтера по умолчанию
   */
  const handleSetDefault = () => {
    if (onSetDefault) {
      onSetDefault(printer.id);
    }
  };

  /**
   * Обработчик проверки соединения с принтером
   * (для обратной совместимости)
   */
  const handleCheck = async () => {
    if (onCheck) {
      await onCheck(printer);
    }
  };

  // Получаем первую букву названия принтера для аватара
  const printerInitial = printer.name.charAt(0).toUpperCase();

  // Определяем, какое время показывать (последняя проверка или использование)
  const lastActionTime = printer.isUsb 
    ? printer.lastUsed 
    : printer.lastChecked;

  // Определяем текст для отображения времени
  const timeLabel = printer.isUsb
    ? "Последняя печать:"
    : "Проверено:";

  return (
    <>
      {/* Карточка принтера с улучшенным дизайном */}
      <Card 
        variant="outlined" 
        sx={{ 
          mb: 2,
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(-2px)'
          },
          borderLeft: printer.isDefault ? '4px solid #4361ee' : undefined 
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            {/* Аватар принтера */}
            <Avatar 
              sx={{ 
                bgcolor: 'primary.main', 
                mr: 2,
                width: 48,
                height: 48,
              }}
            >
              {printerInitial}
            </Avatar>
            
            <Box>
              {/* Название принтера и чипы статуса */}
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="h6" component="div" sx={{ mr: 1 }}>
                  {printer.name}
                </Typography>
                
                {printer.isUsb && (
                  <Chip 
                    icon={<UsbIcon />}
                    label="USB"
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ mr: 1 }}
                  />
                )}
                
                {printer.isDefault && (
                  <Chip 
                    label="По умолчанию"
                    size="small"
                    color="secondary"
                    sx={{ mr: 1 }}
                  />
                )}
              </Box>
              
              {/* Информация о подключении */}
              {printer.isUsb ? (
                // Для USB-принтеров показываем информацию об устройстве
                deviceInfo && (
                  <Tooltip 
                    title={deviceInfo} 
                    arrow 
                    TransitionComponent={Fade} 
                    placement="top"
                  >
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'help'
                      }}
                    >
                      <InfoIcon fontSize="small" sx={{ mr: 0.5, fontSize: '1rem' }} />
                      Информация об устройстве
                    </Typography>
                  </Tooltip>
                )
              ) : (
                // Для сетевых принтеров показываем IP и порт
                printer.ipAddress && (
                  <Typography variant="body2" color="text.secondary">
                    IP: {printer.ipAddress}{printer.port ? `, Порт: ${printer.port}` : ''}
                  </Typography>
                )
              )}
            </Box>
          </Box>
            
          {/* Статус подключения */}
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
            <Chip 
              icon={isConnected ? <UsbIcon /> : <ErrorIcon />}
              label={isConnected ? "Подключен" : "Не найден"}
              variant="outlined"
              size="small"
              color={isConnected ? "success" : "error"}
            />
            
            {/* Время последнего использования или проверки */}
            {lastActionTime && (
              <Typography variant="caption" sx={{ ml: 1 }}>
                {timeLabel} {new Date(lastActionTime).toLocaleString()}
              </Typography>
            )}
          </Box>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'space-between', padding: '8px 16px' }}>
          <Box>
            {/* Кнопка выбора принтера для печати */}
            <Button 
              size="medium" 
              variant="contained"
              startIcon={<Print />} 
              onClick={() => onSelect(printer)}
              disabled={!isConnected}
              sx={{ mr: 1 }}
            >
              Печать
            </Button>
            
            {/* Кнопка проверки соединения (для сетевых принтеров) */}
            {!printer.isUsb && onCheck && (
              <Button 
                size="medium" 
                variant="outlined"
                onClick={handleCheck}
              >
                Проверить
              </Button>
            )}
            
            {/* Кнопка установки принтера по умолчанию */}
            {onSetDefault && !printer.isDefault && (
              <Button 
                size="medium" 
                variant="outlined"
                onClick={handleSetDefault}
              >
                Сделать по умолчанию
              </Button>
            )}
          </Box>
          
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
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            autoFocus
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PrinterCard;