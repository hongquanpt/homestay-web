"use client";

import { useState, useEffect } from "react";
import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

export function useToast() {
  return {
    toast: (props: any) => {
      Toast.fire({
        icon: props.variant === 'destructive' ? 'error' : 'success',
        title: props.title || '',
        text: props.description || ''
      });
    },
    dismiss: () => {},
  };
}
