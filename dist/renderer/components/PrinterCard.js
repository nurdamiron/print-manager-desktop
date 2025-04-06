"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
/**
 * Компонент PrinterCard - отображает информацию о принтере в виде карточки
 * @param printer Объект с данными о принтере
 * @param onDelete Функция-обработчик удаления принтера
 * @param onCheck Функция-обработчик проверки соединения с принтером
 * @param onSelect Функция-обработчик выбора принтера для печати
 */
const PrinterCard = ({ printer, onDelete, onCheck, onSelect, }) => {
    // Состояние для индикатора загрузки при проверке соединения
    const [isChecking, setIsChecking] = (0, react_1.useState)(false);
    // Состояние для диалога подтверждения удаления
    const [deleteDialogOpen, setDeleteDialogOpen] = (0, react_1.useState)(false);
    /**
     * Обработчик проверки соединения с принтером
     */
    const handleCheck = async () => {
        setIsChecking(true);
        try {
            await onCheck(printer);
        }
        catch (error) {
            console.error('Ошибка при проверке принтера:', error);
        }
        finally {
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
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(material_1.Card, { variant: "outlined", sx: { mb: 2 }, children: [(0, jsx_runtime_1.jsxs)(material_1.CardContent, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", component: "div", gutterBottom: true, children: printer.name }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "body2", color: "text.secondary", gutterBottom: true, children: ["IP: ", printer.ipAddress, ", \u041F\u043E\u0440\u0442: ", printer.port] }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { mt: 1, display: 'flex', alignItems: 'center' }, children: [printer.isOnline === undefined ? ((0, jsx_runtime_1.jsx)(material_1.Chip, { label: "\u0421\u0442\u0430\u0442\u0443\u0441 \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u0435\u043D", variant: "outlined", size: "small", color: "default" })) : printer.isOnline ? ((0, jsx_runtime_1.jsx)(material_1.Chip, { icon: (0, jsx_runtime_1.jsx)(icons_material_1.CheckCircle, {}), label: "\u0412 \u0441\u0435\u0442\u0438", variant: "outlined", size: "small", color: "success" })) : ((0, jsx_runtime_1.jsx)(material_1.Chip, { icon: (0, jsx_runtime_1.jsx)(icons_material_1.Error, {}), label: "\u041D\u0435 \u0432 \u0441\u0435\u0442\u0438", variant: "outlined", size: "small", color: "error" })), printer.lastChecked && ((0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "caption", sx: { ml: 1 }, children: ["\u041F\u0440\u043E\u0432\u0435\u0440\u0435\u043D\u043E: ", new Date(printer.lastChecked).toLocaleString()] }))] })] }), (0, jsx_runtime_1.jsxs)(material_1.CardActions, { children: [(0, jsx_runtime_1.jsx)(material_1.Button, { size: "small", startIcon: (0, jsx_runtime_1.jsx)(icons_material_1.Print, {}), onClick: () => onSelect(printer), disabled: printer.isOnline === false, children: "\u041F\u0435\u0447\u0430\u0442\u044C" }), (0, jsx_runtime_1.jsxs)(material_1.Button, { size: "small", onClick: handleCheck, disabled: isChecking, children: [isChecking ? ((0, jsx_runtime_1.jsx)(material_1.CircularProgress, { size: 16, sx: { mr: 1 } })) : null, "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C"] }), (0, jsx_runtime_1.jsx)(material_1.Button, { size: "small", color: "error", startIcon: (0, jsx_runtime_1.jsx)(icons_material_1.Delete, {}), onClick: handleOpenDeleteDialog, children: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C" })] })] }), (0, jsx_runtime_1.jsxs)(material_1.Dialog, { open: deleteDialogOpen, onClose: handleCloseDeleteDialog, "aria-labelledby": "alert-dialog-title", "aria-describedby": "alert-dialog-description", children: [(0, jsx_runtime_1.jsx)(material_1.DialogTitle, { id: "alert-dialog-title", children: "\u0423\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u043F\u0440\u0438\u043D\u0442\u0435\u0440\u0430" }), (0, jsx_runtime_1.jsx)(material_1.DialogContent, { children: (0, jsx_runtime_1.jsxs)(material_1.DialogContentText, { id: "alert-dialog-description", children: ["\u0412\u044B \u0443\u0432\u0435\u0440\u0435\u043D\u044B, \u0447\u0442\u043E \u0445\u043E\u0442\u0438\u0442\u0435 \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u043F\u0440\u0438\u043D\u0442\u0435\u0440 \"", printer.name, "\"? \u042D\u0442\u043E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u043D\u0435\u043B\u044C\u0437\u044F \u0431\u0443\u0434\u0435\u0442 \u043E\u0442\u043C\u0435\u043D\u0438\u0442\u044C."] }) }), (0, jsx_runtime_1.jsxs)(material_1.DialogActions, { children: [(0, jsx_runtime_1.jsx)(material_1.Button, { onClick: handleCloseDeleteDialog, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), (0, jsx_runtime_1.jsx)(material_1.Button, { onClick: handleConfirmDelete, color: "error", autoFocus: true, children: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C" })] })] })] }));
};
exports.default = PrinterCard;
//# sourceMappingURL=PrinterCard.js.map