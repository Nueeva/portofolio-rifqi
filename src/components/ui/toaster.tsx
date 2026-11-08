import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { usePublicDesign } from "@/components/public/PublicDesignContext";

export function Toaster() {
  const { isPublic } = usePublicDesign();
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose aria-label={isPublic ? "Tutup notifikasi" : "Close notification"} />
          </Toast>
        );
      })}
      <ToastViewport label={isPublic ? "Notifikasi ({hotkey})" : undefined} />
    </ToastProvider>
  );
}
