"use client";

import { motion } from "framer-motion";

interface ActionModalProps {
    title: string;
    onConfirmText: string;
    onCancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
}

export function ActionModal({ title, onConfirmText, onCancelText, onConfirm, onCancel }: ActionModalProps) {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-sm bg-white dark:bg-[#1A1A1A] rounded-[24px] p-6 shadow-2xl overflow-hidden"
                style={{ border: "1.5px solid #86E3E3" }}
            >
                <h3 className="text-lg font-black text-center text-[#1A1A1A] dark:text-[#F0F0F0] leading-snug mb-6 whitespace-pre-line">
                    {title}
                </h3>

                <div className={`grid gap-3 ${onCancelText ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {onCancelText && (
                        <button
                            onClick={onCancel}
                            className="py-3.5 rounded-2xl font-bold text-sm"
                            style={{
                                backgroundColor: "transparent",
                                color: "#86E3E3",
                                border: "2px solid #86E3E3",
                            }}
                        >
                            {onCancelText}
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        className="py-3.5 rounded-2xl font-black text-sm"
                        style={{ backgroundColor: "#86E3E3", color: "#0A4040" }}
                    >
                        {onConfirmText}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
