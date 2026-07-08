"use client";

import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
 isOpen: boolean;
 onClose: () => void;
 onConfirm: () => void;
 title: string;
 description?: string;
 confirmText?: string;
 cancelText?: string;
}

export function ConfirmModal({
 isOpen,
 onClose,
 onConfirm,
 title,
 description,
 confirmText = "Xác nhận",
 cancelText = "Hủy",
}: ConfirmModalProps) {
 return (
 <Dialog open={isOpen} onOpenChange={onClose}>
 <DialogContent className="sm:max-w-[425px]">
 <DialogHeader>
 <DialogTitle>{title}</DialogTitle>
 {description && (
 <DialogDescription className="mt-2">
 {description}
 </DialogDescription>
 )}
 </DialogHeader>
 <DialogFooter className="mt-4 flex sm:justify-end gap-2">
 <Button variant="outline" onClick={onClose}>
 {cancelText}
 </Button>
 <Button
 variant="destructive"
 onClick={() => {
 onConfirm();
 onClose();
 }}
 >
 {confirmText}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 );
}
